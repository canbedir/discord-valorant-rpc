import { getPresences, getSelfPuuid } from './localApi.mjs';

/**
 * presence.private base64'tur. Icerigi urune gore degisir:
 *   - VALORANT: dogrudan bir JSON nesnesi
 *   - LoL/TFT : JSON ile kodlanmis bir string (yani iki kez parse gerekir)
 * Ikisini de tolere ediyoruz, cozulemezse null donuyoruz.
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

/** sessionLoopState yalnizca VALORANT presence'inda bulunur - urun ayirt edicimiz bu. */
function isValorantPayload(payload) {
  return payload !== null && typeof payload.sessionLoopState === 'string';
}

let cachedPuuid = null;

export function resetPuuidCache() {
  cachedPuuid = null;
}

/**
 * VALORANT calisiyorsa ham presence verisini, calismiyorsa null doner.
 * Riot Client kapaliysa localApi RiotClientClosedError firlatir.
 */
export async function fetchValorantPresence() {
  if (cachedPuuid === null) {
    cachedPuuid = await getSelfPuuid();
  }

  const presences = await getPresences();

  // Once kendi puuid'imizle eslesen VALORANT kaydini ara. Riot bazen chat
  // kimligini farkli dondurdugu icin, bulunamazsa tek gecerli VALORANT
  // kaydina geri dusuyoruz.
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
