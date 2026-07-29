import { localizeRankName } from './data/strings.mjs';
import { log } from './log.mjs';

const MAX_FIELD = 128;

/** Discord 128 karakteri asan details/state alanlarini reddediyor. */
function clamp(text) {
  if (!text) return undefined;
  const value = String(text).trim();
  if (value.length === 0) return undefined;
  // Discord ayrica en az 2 karakter istiyor.
  if (value.length === 1) return `${value} `;
  return value.length > MAX_FIELD ? `${value.slice(0, MAX_FIELD - 1)}…` : value;
}

function slug(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

let overrideWarned = false;

/**
 * Ekranda gosterilecek rank'i belirler.
 *   real     -> presence.competitiveTier (oyunun gercek degeri)
 *   override -> config.rank.override (istedigin sabit rank)
 *   hide     -> rank hic gosterilmez
 */
export function resolveDisplayRank(presence, config, catalog, lang) {
  if (config.rank.mode === 'hide') return null;

  let tier;
  let leaderboard = 0;

  if (config.rank.mode === 'override') {
    tier = catalog.resolveRank(config.rank.override, lang);
    if (tier === null) {
      if (!overrideWarned) {
        overrideWarned = true;
        log.warn(
          `rank.override degeri "${config.rank.override}" taninmadi, gercek rank gosteriliyor. ` +
            'Gecerli isimler icin: npm run ranks',
        );
      }
      tier = presence.competitiveTier;
    } else {
      leaderboard = Number(config.rank.overrideLeaderboardPosition) || 0;
    }
  } else {
    tier = presence.competitiveTier;
    leaderboard = Number(presence.leaderboardPosition) || 0;
  }

  const rank = catalog.rank(tier ?? 0);
  if (!rank) return null;

  let label = localizeRankName(rank.name, lang);
  if (config.rank.showLeaderboardPosition && leaderboard > 0) {
    label += ` #${leaderboard}`;
  }

  return { tier: rank.tier, icon: rank.icon, label };
}

/**
 * Gorsel referansini uretir. "url" modunda Discord CDN'e gerek kalmadan
 * dogrudan valorant-api baglantisi kullanilir; "key" modunda Discord
 * Developer Portal'a yuklenmis asset anahtarlari beklenir.
 */
function asset(config, { url, key }) {
  if (config.assets.source === 'key') {
    return key ? `${config.assets.keyPrefix}${key}` : undefined;
  }
  return url ?? undefined;
}

function partyText(presence, t) {
  const size = Number(presence.partySize) || 1;
  const max = Number(presence.maxPartySize) || 5;
  return `${t('party')} ${size}/${max}`;
}

function scoreText(presence) {
  const ally = Number(presence.partyOwnerMatchScoreAllyTeam ?? 0);
  const enemy = Number(presence.partyOwnerMatchScoreEnemyTeam ?? 0);
  return `${ally} - ${enemy}`;
}

/**
 * Presence + config -> Discord activity nesnesi.
 * startedAt, ayni durumda gecen sureyi saymak icin ana dongude tutulur.
 */
export function buildActivity({ presence, catalog, config, t, startedAt }) {
  const lang = t.lang;
  const mapInfo = catalog.map(presence.matchMap);
  const mapName = mapInfo?.name ?? (presence.matchMap ? t('unknownMap') : null);
  const isRange =
    presence.provisioningFlow === 'ShootingRange' || /\/Range/i.test(presence.matchMap ?? '');
  const queueName = t.queue(presence.queueId) ?? t('customGame');
  const rank = resolveDisplayRank(presence, config, catalog, lang);

  let details;
  let state;
  let inMatch = false;

  switch (presence.sessionLoopState) {
    case 'INGAME': {
      inMatch = true;
      if (isRange) {
        details = t('shootingRange');
      } else {
        details = mapName ? `${queueName} — ${mapName}` : queueName;
        if (config.display.showScore && presence.queueId !== 'deathmatch') {
          state = scoreText(presence);
        }
      }
      break;
    }

    case 'PREGAME': {
      inMatch = true;
      details = t('agentSelect');
      state = mapName ? `${queueName} — ${mapName}` : queueName;
      break;
    }

    default: {
      // MENUS
      if (presence.isIdle) {
        details = t('away');
      } else if (presence.partyState === 'MATCHMAKING') {
        details = `${t('inQueue')} — ${queueName}`;
      } else if (presence.partyState === 'CUSTOM_GAME_SETUP') {
        details = t('customSetup');
      } else {
        details = t('mainMenu');
      }
      if (config.display.showParty) state = partyText(presence, t);
      break;
    }
  }

  if (config.display.showAccountLevel && presence.accountLevel) {
    const level = `${t('level')} ${presence.accountLevel}`;
    state = state ? `${state} • ${level}` : level;
  }

  // Buyuk gorsel: mac icindeyken harita, menude oyuncu karti.
  const cardUrl = catalog.card(presence.playerCardId);
  const wantsMap = config.display.largeImage === 'map' && inMatch && mapInfo;

  let large;
  let largeText;
  if (config.display.largeImage === 'rank' && rank) {
    large = { url: rank.icon, key: `rank_${rank.tier}` };
    largeText = rank.label;
  } else if (wantsMap) {
    large = { url: mapInfo.splash, key: `map_${slug(mapInfo.name)}` };
    largeText = mapInfo.name;
  } else if (cardUrl) {
    large = { url: cardUrl, key: 'valorant' };
    largeText = t('playing');
  } else {
    large = { url: undefined, key: 'valorant' };
    largeText = t('playing');
  }

  const showRankBadge =
    rank && (inMatch || config.display.showRankInMenus) && config.display.largeImage !== 'rank';

  const assets = {
    large_image: asset(config, large),
    large_text: clamp(largeText),
  };
  if (showRankBadge) {
    assets.small_image = asset(config, { url: rank.icon, key: `rank_${rank.tier}` });
    assets.small_text = clamp(rank.label);
  }

  const activity = {
    type: 0,
    details: clamp(details),
    state: clamp(state),
    timestamps: { start: startedAt },
    assets,
  };

  const buttons = (config.display.buttons ?? [])
    .filter((b) => b?.label && b?.url)
    .slice(0, 2)
    .map((b) => ({ label: String(b.label).slice(0, 31), url: String(b.url) }));
  if (buttons.length > 0) activity.buttons = buttons;

  return activity;
}

/** Oyun kapaliyken gosterilecek opsiyonel "bosta" durumu. */
export function buildIdleActivity({ config, t, startedAt }) {
  return {
    type: 0,
    details: clamp(config.idle.text) ?? t('playing'),
    timestamps: { start: startedAt },
    assets: {
      large_image: asset(config, { url: undefined, key: 'valorant' }),
      large_text: t('playing'),
    },
  };
}

export { clamp, slug };
