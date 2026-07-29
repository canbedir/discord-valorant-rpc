import { getPresences, getSelfPuuid } from './localApi.mjs';

/**
 * presence.private is base64, but what is inside depends on the product:
 *   - VALORANT: a JSON object
 *   - LoL/TFT : a JSON-encoded string, so it needs parsing twice
 * Both shapes are tolerated; anything else decodes to null.
 */
function decodePrivate(encoded) {
  if (typeof encoded !== 'string' || encoded.length === 0) return null;

  let text;
  try {
    text = Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return null;
  }

  let value;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }

  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return null;
    }
  }

  return typeof value === 'object' && value !== null ? value : null;
}

/** First value that is neither undefined nor null. */
function pick(...values) {
  return values.find((v) => v !== undefined && v !== null);
}

/**
 * Flattens the VALORANT payload into the single-level shape the rest of the
 * app consumes.
 *
 * Riot regrouped these fields into matchPresenceData / partyPresenceData /
 * playerPresenceData, but older clients still send them flat, so every field
 * is read from the nested location first and the legacy top-level one second.
 * Returns null when there is no sessionLoopState anywhere, which is how a
 * non-VALORANT presence (LoL, TFT, the Riot Client itself) gets rejected.
 */
function normalizeValorantPayload(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const match = raw.matchPresenceData ?? {};
  const party = raw.partyPresenceData ?? {};
  const player = raw.playerPresenceData ?? {};

  const sessionLoopState = pick(match.sessionLoopState, raw.sessionLoopState);
  if (typeof sessionLoopState !== 'string') return null;

  return {
    isValid: pick(raw.isValid, true),
    isIdle: pick(raw.isIdle, false),
    sessionLoopState,

    matchMap: pick(match.matchMap, raw.matchMap, party.partyOwnerMatchMap, ''),
    queueId: pick(match.queueId, raw.queueId, ''),
    provisioningFlow: pick(match.provisioningFlow, raw.provisioningFlow, 'Invalid'),

    partyState: pick(party.partyState, raw.partyState, 'DEFAULT'),
    partySize: pick(raw.partySize, party.partySize, 1),
    maxPartySize: pick(raw.maxPartySize, party.maxPartySize, 5),
    partyOwnerMatchScoreAllyTeam: pick(
      raw.partyOwnerMatchScoreAllyTeam,
      party.partyOwnerMatchScoreAllyTeam,
      0,
    ),
    partyOwnerMatchScoreEnemyTeam: pick(
      raw.partyOwnerMatchScoreEnemyTeam,
      party.partyOwnerMatchScoreEnemyTeam,
      0,
    ),

    competitiveTier: pick(player.competitiveTier, raw.competitiveTier, 0),
    leaderboardPosition: pick(player.leaderboardPosition, raw.leaderboardPosition, 0),
    accountLevel: pick(player.accountLevel, raw.accountLevel, 0),
    playerCardId: pick(player.playerCardId, raw.playerCardId, ''),
  };
}

let cachedPuuid = null;

export function resetPuuidCache() {
  cachedPuuid = null;
}

/**
 * Returns the normalized VALORANT presence, or null when the game is not
 * running. Throws RiotClientClosedError when the Riot Client itself is closed.
 */
export async function fetchValorantPresence() {
  if (cachedPuuid === null) {
    cachedPuuid = await getSelfPuuid();
  }

  const presences = await getPresences();

  const valorant = [];
  for (const entry of presences) {
    const payload = normalizeValorantPayload(decodePrivate(entry.private));
    if (payload) valorant.push({ entry, payload });
  }
  if (valorant.length === 0) return null;

  // Prefer our own record. Riot occasionally reports a different chat identity,
  // so fall back to the only valid VALORANT record.
  const mine = valorant.find(({ entry }) => entry.puuid === cachedPuuid) ?? valorant[0];

  return {
    puuid: mine.entry.puuid,
    gameName: mine.entry.game_name ?? '',
    gameTag: mine.entry.game_tag ?? '',
    platform: mine.entry.platform ?? '',
    ...mine.payload,
  };
}

export { decodePrivate, normalizeValorantPayload };
