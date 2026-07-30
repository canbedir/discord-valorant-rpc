import { log } from './log.mjs';
import { m, localizeRankName } from './i18n.mjs';

const MAX_FIELD = 128;

/** Discord rejects details/state longer than 128 characters, and shorter than 2. */
function clamp(text) {
  if (!text) return undefined;
  const value = String(text).trim();
  if (value.length === 0) return undefined;
  if (value.length === 1) return `${value} `;
  return value.length > MAX_FIELD ? `${value.slice(0, MAX_FIELD - 1)}…` : value;
}

let overrideWarned = false;

/** Called after the rank is reconfigured, so a new bad value warns again. */
export function resetOverrideWarning() {
  overrideWarned = false;
}

/**
 * Decides which rank to display.
 *   real     -> presence.competitiveTier, whatever the game reports
 *   override -> a fixed tier from config, regardless of the real one
 *   hide     -> no rank badge at all
 *
 * The leaderboard number follows the same split, with one asymmetry: in real
 * mode whatever Riot reports is trusted as-is, but a configured number is only
 * applied at the top tier, since a leaderboard placing is meaningless for a
 * made-up Gold 2. Either is shown only when above zero.
 */
export function resolveDisplayRank(presence, config, catalog, lang) {
  if (config.rank.mode === 'hide') return null;

  let tier;
  let leaderboard;

  if (config.rank.mode === 'override') {
    tier = catalog.resolveRank(config.rank.override, lang);
    if (tier === null) {
      if (!overrideWarned) {
        overrideWarned = true;
        log.warn(m('rank.unknownOverride', config.rank.override));
      }
      tier = presence.competitiveTier;
      leaderboard = presence.leaderboardPosition;
    } else {
      leaderboard = catalog.isTopTier(tier) ? config.rank.leaderboardPosition : 0;
    }
  } else {
    tier = presence.competitiveTier;
    leaderboard = presence.leaderboardPosition;
  }

  const rank = catalog.rank(tier ?? 0);
  if (!rank) return null;

  let label = localizeRankName(rank.name, lang);
  const position = Number(leaderboard) || 0;
  if (position > 0) label += ` #${position}`;

  return { icon: rank.icon, label };
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
 * presence + config -> a Discord activity object.
 *
 * Images are plain valorant-api URLs: Discord re-hosts whatever it is given
 * through its own proxy, so nothing has to be uploaded to the application.
 *
 * startedAt is tracked by the main loop so the elapsed timer survives polls.
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

  // The badge only carries its label in a tooltip, which nobody hovers. This
  // puts the rank — and any leaderboard number — on the visible state line.
  if (config.display.showRankInText && rank) {
    state = state ? `${state} • ${rank.label}` : rank.label;
  }

  if (config.display.showAccountLevel && presence.accountLevel) {
    const level = `${t('level')} ${presence.accountLevel}`;
    state = state ? `${state} • ${level}` : level;
  }

  // Large image: the map while in a match, the player card while in menus.
  const cardUrl = catalog.card(presence.playerCardId);
  const showRankLarge = config.display.largeImage === 'rank' && rank;
  const showMapLarge = config.display.largeImage === 'map' && inMatch && mapInfo;

  let largeImage;
  let largeText;
  if (showRankLarge) {
    largeImage = rank.icon;
    largeText = rank.label;
  } else if (showMapLarge) {
    largeImage = mapInfo.splash;
    largeText = mapInfo.name;
  } else if (cardUrl) {
    largeImage = cardUrl;
    largeText = t('playing');
  }

  const assets = {};
  if (largeImage) {
    assets.large_image = largeImage;
    assets.large_text = clamp(largeText);
  }
  // The badge would be redundant when the rank is already the large image.
  if (rank && !showRankLarge && (inMatch || config.display.showRankInMenus)) {
    assets.small_image = rank.icon;
    assets.small_text = clamp(rank.label);
  }

  const activity = {
    type: 0,
    details: clamp(details),
    state: clamp(state),
    timestamps: { start: startedAt },
  };
  if (Object.keys(assets).length > 0) activity.assets = assets;

  const buttons = (config.display.buttons ?? [])
    .filter((b) => b?.label && b?.url)
    .slice(0, 2)
    .map((b) => ({ label: String(b.label).slice(0, 31), url: String(b.url) }));
  if (buttons.length > 0) activity.buttons = buttons;

  return activity;
}

/** Optional presence shown while the game is closed. */
export function buildIdleActivity({ config, t, startedAt }) {
  return {
    type: 0,
    details: clamp(config.idle.text) ?? t('playing'),
    timestamps: { start: startedAt },
  };
}

export { clamp };
