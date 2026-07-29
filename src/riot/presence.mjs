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

/** sessionLoopState only exists on VALORANT presences — that is our product filter. */
function isValorantPayload(payload) {
  return payload !== null && typeof payload.sessionLoopState === 'string';
}

let cachedPuuid = null;

export function resetPuuidCache() {
  cachedPuuid = null;
}

/**
 * Returns the raw VALORANT presence, or null when the game is not running.
 * Throws RiotClientClosedError when the Riot Client itself is closed.
 */
export async function fetchValorantPresence() {
  if (cachedPuuid === null) {
    cachedPuuid = await getSelfPuuid();
  }

  const presences = await getPresences();

  // Prefer the VALORANT record matching our own PUUID. Riot sometimes reports a
  // different chat identity, so fall back to the only valid VALORANT record.
  const valorant = presences.filter((p) => isValorantPayload(decodePrivate(p.private)));
  if (valorant.length === 0) return null;

  const mine = valorant.find((p) => p.puuid === cachedPuuid) ?? valorant[0];
  const payload = decodePrivate(mine.private);

  return {
    puuid: mine.puuid,
    gameName: mine.game_name ?? '',
    gameTag: mine.game_tag ?? '',
    platform: mine.platform ?? '',
    ...payload,
  };
}

export { decodePrivate, isValorantPayload };
