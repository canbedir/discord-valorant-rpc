import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeValorantPayload, decodePrivate } from '../src/riot/presence.mjs';
import { buildActivity, resolveDisplayRank, clamp } from '../src/activity.mjs';
import { Catalog } from '../src/valorantData.mjs';
import { createTranslator, localizeRankName, setLanguage, m } from '../src/i18n.mjs';
import { isValidClientId } from '../src/config.mjs';

/**
 * A hand-built catalog keeps these tests offline and deterministic — the real
 * one is fetched from valorant-api.com.
 */
const catalog = new Catalog({
  fetchedAt: Date.now(),
  ranks: [
    { tier: 0, name: 'UNRANKED', icon: 'u.png', color: '0' },
    { tier: 15, name: 'PLATINUM 1', icon: 'p1.png', color: '0' },
    { tier: 26, name: 'IMMORTAL 3', icon: 'i3.png', color: '0' },
    { tier: 27, name: 'RADIANT', icon: 'r.png', color: '0' },
  ],
  maps: [{ url: '/Game/Maps/Ascent/Ascent', name: 'Ascent', splash: 'ascent.png', icon: 'a.png' }],
  cards: { 'card-uuid': 'card.png' },
});

const baseConfig = () => ({
  discordClientId: '12345678901234567',
  language: 'en',
  pollIntervalMs: 3000,
  rank: { mode: 'real', override: 'Radiant', leaderboardPosition: 0 },
  display: {
    showScore: true,
    showParty: true,
    showAccountLevel: false,
    showRankInMenus: true,
    showRankInText: false,
    largeImage: 'map',
    buttons: [],
  },
  idle: { showWhenGameClosed: false, text: 'closed' },
});

const inGame = {
  sessionLoopState: 'INGAME',
  matchMap: '/Game/Maps/Ascent/Ascent',
  queueId: 'competitive',
  partyState: 'DEFAULT',
  partySize: 2,
  maxPartySize: 5,
  partyOwnerMatchScoreAllyTeam: 9,
  partyOwnerMatchScoreEnemyTeam: 5,
  competitiveTier: 15,
  leaderboardPosition: 0,
  accountLevel: 26,
  playerCardId: 'card-uuid',
  isIdle: false,
};

test('presence: nested payload is flattened', () => {
  const raw = {
    isIdle: false,
    isValid: true,
    matchPresenceData: {
      matchMap: '/Game/Maps/Ascent/Ascent',
      provisioningFlow: 'Matchmaking',
      queueId: 'competitive',
      sessionLoopState: 'INGAME',
    },
    partySize: 2,
    maxPartySize: 5,
    partyOwnerMatchScoreAllyTeam: 9,
    partyOwnerMatchScoreEnemyTeam: 5,
    partyPresenceData: { partyState: 'DEFAULT', partySize: 1 },
    playerPresenceData: { accountLevel: 26, competitiveTier: 15, playerCardId: 'card-uuid' },
  };

  const flat = normalizeValorantPayload(raw);
  assert.equal(flat.sessionLoopState, 'INGAME');
  assert.equal(flat.matchMap, '/Game/Maps/Ascent/Ascent');
  assert.equal(flat.queueId, 'competitive');
  assert.equal(flat.competitiveTier, 15);
  assert.equal(flat.accountLevel, 26);
  assert.equal(flat.playerCardId, 'card-uuid');
  // Top level wins over the party copy for party size.
  assert.equal(flat.partySize, 2);
});

test('presence: legacy flat payload still works', () => {
  const flat = normalizeValorantPayload({
    sessionLoopState: 'MENUS',
    queueId: 'unrated',
    partyState: 'MATCHMAKING',
    competitiveTier: 27,
    partySize: 3,
  });
  assert.equal(flat.sessionLoopState, 'MENUS');
  assert.equal(flat.queueId, 'unrated');
  assert.equal(flat.partyState, 'MATCHMAKING');
  assert.equal(flat.competitiveTier, 27);
  assert.equal(flat.partySize, 3);
});

test('presence: non-VALORANT payloads are rejected', () => {
  assert.equal(normalizeValorantPayload(null), null);
  assert.equal(normalizeValorantPayload({}), null);
  assert.equal(normalizeValorantPayload({ championId: '157' }), null);
});

test('presence: private decodes both single and double encoded JSON', () => {
  const object = Buffer.from(JSON.stringify({ a: 1 })).toString('base64');
  const string = Buffer.from(JSON.stringify(JSON.stringify({ a: 1 }))).toString('base64');
  assert.deepEqual(decodePrivate(object), { a: 1 });
  assert.deepEqual(decodePrivate(string), { a: 1 });
  assert.equal(decodePrivate(''), null);
  assert.equal(decodePrivate('not base64 json'), null);
});

test('catalog: resolveRank accepts numbers, English and Turkish names', () => {
  assert.equal(catalog.resolveRank(27), 27);
  assert.equal(catalog.resolveRank('27'), 27);
  assert.equal(catalog.resolveRank('Radiant'), 27);
  assert.equal(catalog.resolveRank('radiant'), 27);
  assert.equal(catalog.resolveRank('Immortal 3'), 26);
  assert.equal(catalog.resolveRank('Ölümsüz 3', 'tr'), 26);
  assert.equal(catalog.resolveRank('olumsuz 3', 'tr'), 26);
  assert.equal(catalog.resolveRank('nonsense'), null);
  assert.equal(catalog.resolveRank(99), null);
  assert.equal(catalog.resolveRank(''), null);
});

test('rank: override replaces the real tier', () => {
  const config = baseConfig();
  config.rank.mode = 'override';
  config.rank.override = 'Immortal 3';

  const rank = resolveDisplayRank(inGame, config, catalog, 'en');
  assert.equal(rank.label, 'Immortal 3');
  assert.equal(rank.icon, 'i3.png');
});

test('rank: real mode uses the reported tier', () => {
  const rank = resolveDisplayRank(inGame, baseConfig(), catalog, 'en');
  assert.equal(rank.label, 'Platinum 1');
});

test('rank: hide mode returns nothing', () => {
  const config = baseConfig();
  config.rank.mode = 'hide';
  assert.equal(resolveDisplayRank(inGame, config, catalog, 'en'), null);
});

test('rank: leaderboard position is appended only when above zero', () => {
  const config = baseConfig();
  config.rank.mode = 'override';
  config.rank.override = 'Radiant';
  assert.equal(resolveDisplayRank(inGame, config, catalog, 'en').label, 'Radiant');

  config.rank.leaderboardPosition = 3;
  assert.equal(resolveDisplayRank(inGame, config, catalog, 'en').label, 'Radiant #3');
});

test('rank: unknown override falls back to the real tier', () => {
  const config = baseConfig();
  config.rank.mode = 'override';
  config.rank.override = 'Totally Not A Rank';
  assert.equal(resolveDisplayRank(inGame, config, catalog, 'en').label, 'Platinum 1');
});

test('activity: in-game shows queue, map and score', () => {
  const t = createTranslator('en');
  const activity = buildActivity({
    presence: inGame,
    catalog,
    config: baseConfig(),
    t,
    startedAt: 1000,
  });

  assert.equal(activity.details, 'Competitive — Ascent');
  assert.equal(activity.state, '9 - 5');
  assert.equal(activity.assets.large_image, 'ascent.png');
  assert.equal(activity.assets.small_image, 'p1.png');
  assert.equal(activity.timestamps.start, 1000);
});

test('activity: menus show the party and the player card', () => {
  const t = createTranslator('en');
  const activity = buildActivity({
    presence: { ...inGame, sessionLoopState: 'MENUS', matchMap: '' },
    catalog,
    config: baseConfig(),
    t,
    startedAt: 1,
  });

  assert.equal(activity.details, 'Main Menu');
  assert.equal(activity.state, 'Party 2/5');
  assert.equal(activity.assets.large_image, 'card.png');
});

test('activity: queue state is reported while matchmaking', () => {
  const t = createTranslator('en');
  const activity = buildActivity({
    presence: { ...inGame, sessionLoopState: 'MENUS', matchMap: '', partyState: 'MATCHMAKING' },
    catalog,
    config: baseConfig(),
    t,
    startedAt: 1,
  });
  assert.equal(activity.details, 'In Queue — Competitive');
});

test('activity: largeImage "rank" drops the redundant small badge', () => {
  const config = baseConfig();
  config.display.largeImage = 'rank';
  const activity = buildActivity({
    presence: inGame,
    catalog,
    config,
    t: createTranslator('en'),
    startedAt: 1,
  });

  assert.equal(activity.assets.large_image, 'p1.png');
  assert.equal(activity.assets.small_image, undefined);
});

test('activity: rank stays out of the text unless asked for', () => {
  const config = baseConfig();
  config.rank.mode = 'override';
  config.rank.override = 'Radiant';
  config.rank.leaderboardPosition = 121;

  // Off by default: the label is tooltip-only, which is what made a set
  // leaderboardPosition look like it did nothing at all.
  const hidden = buildActivity({
    presence: inGame,
    catalog,
    config,
    t: createTranslator('en'),
    startedAt: 1,
  });
  assert.equal(hidden.state, '9 - 5');
  assert.equal(hidden.assets.small_text, 'Radiant #121');

  config.display.showRankInText = true;
  const shown = buildActivity({
    presence: inGame,
    catalog,
    config,
    t: createTranslator('en'),
    startedAt: 1,
  });
  assert.equal(shown.state, '9 - 5 • Radiant #121');
});

test('activity: rank text stands alone when there is no score', () => {
  const config = baseConfig();
  config.display.showRankInText = true;
  config.display.showParty = false;
  const activity = buildActivity({
    presence: { ...inGame, sessionLoopState: 'MENUS', matchMap: '' },
    catalog,
    config,
    t: createTranslator('en'),
    startedAt: 1,
  });
  assert.equal(activity.state, 'Platinum 1');
});

test('activity: deathmatch hides the score', () => {
  const activity = buildActivity({
    presence: { ...inGame, queueId: 'deathmatch' },
    catalog,
    config: baseConfig(),
    t: createTranslator('en'),
    startedAt: 1,
  });
  assert.equal(activity.state, undefined);
});

test('activity: at most two buttons survive', () => {
  const config = baseConfig();
  config.display.buttons = [
    { label: 'a', url: 'https://a' },
    { label: 'b', url: 'https://b' },
    { label: 'c', url: 'https://c' },
    { label: 'no url' },
  ];
  const activity = buildActivity({
    presence: inGame,
    catalog,
    config,
    t: createTranslator('en'),
    startedAt: 1,
  });
  assert.equal(activity.buttons.length, 2);
});

test('activity: Turkish presence text', () => {
  const config = baseConfig();
  config.language = 'tr';
  const activity = buildActivity({
    presence: { ...inGame, sessionLoopState: 'MENUS', matchMap: '' },
    catalog,
    config,
    t: createTranslator('tr'),
    startedAt: 1,
  });
  assert.equal(activity.details, 'Ana Menü');
  assert.equal(activity.state, 'Parti 2/5');
});

test('clamp: enforces Discord field limits', () => {
  assert.equal(clamp(''), undefined);
  assert.equal(clamp(undefined), undefined);
  assert.equal(clamp('x'), 'x ');
  assert.equal(clamp('  hello  '), 'hello');
  assert.equal(clamp('a'.repeat(200)).length, 128);
});

test('i18n: rank names localize and fall back', () => {
  assert.equal(localizeRankName('IMMORTAL 3', 'en'), 'Immortal 3');
  assert.equal(localizeRankName('IMMORTAL 3', 'tr'), 'Ölümsüz 3');
  assert.equal(localizeRankName('RADIANT', 'tr'), 'Radiant');
  assert.equal(localizeRankName('IRON 1', 'de'), 'Iron 1');
});

test('i18n: messages interpolate and fall back to English', () => {
  setLanguage('en');
  assert.equal(m('discord.connected', 'hix7'), 'Connected as hix7');
  setLanguage('tr');
  assert.equal(m('discord.connected', 'hix7'), 'Baglandi: hix7');
  setLanguage('nope');
  assert.match(m('discord.connected', 'x'), /Connected as x/);
  setLanguage('en');
});

test('config: client id validation', () => {
  assert.ok(isValidClientId('1532060398969294898'));
  assert.ok(!isValidClientId('123'));
  assert.ok(!isValidClientId(''));
  assert.ok(!isValidClientId(undefined));
  assert.ok(!isValidClientId('abcdefghijklmnopqr'));
});
