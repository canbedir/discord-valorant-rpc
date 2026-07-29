import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { log } from './log.mjs';
import { localizeRankName } from './data/strings.mjs';

const CACHE_DIR = path.join(ROOT, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'catalog.json');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const API = 'https://valorant-api.com/v1';

/** Aksan/bosluk/noktalama farklarini yok sayan karsilastirma anahtari. */
function normalizeKey(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  const body = await res.json();
  return body.data;
}

async function downloadCatalog() {
  const [tierSets, maps, cards] = await Promise.all([
    getJson(`${API}/competitivetiers`),
    getJson(`${API}/maps`),
    getJson(`${API}/playercards`),
  ]);

  // competitivetiers birden fazla "episode" tablosu doner; guncel olan sonuncusu.
  const current = tierSets[tierSets.length - 1];

  return {
    fetchedAt: Date.now(),
    ranks: current.tiers
      .filter((t) => t.largeIcon) // Unused1 / Unused2 ikonsuz gelir, atliyoruz
      .map((t) => ({
        tier: t.tier,
        name: t.tierName,
        icon: t.largeIcon,
        color: t.backgroundColor,
      })),
    maps: maps
      .filter((m) => m.mapUrl)
      .map((m) => ({
        url: m.mapUrl,
        name: m.displayName,
        splash: m.splash,
        icon: m.listViewIcon,
      })),
    cards: Object.fromEntries(cards.map((c) => [c.uuid, c.displayIcon])),
  };
}

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeCache(catalog) {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(catalog), 'utf8');
  } catch (err) {
    log.warn(`Katalog onbellege yazilamadi: ${err.message}`);
  }
}

/**
 * Katalogu yukler. Onbellek tazeyse ag istegi yapmaz; ag basarisiz olursa
 * bayat onbellege geri duser, boylece internet olmadan da calisir.
 */
export async function loadCatalog({ force = false } = {}) {
  const cached = readCache();
  const fresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  if (fresh && !force) {
    log.debug('Katalog onbellekten yuklendi.');
    return new Catalog(cached);
  }

  try {
    const catalog = await downloadCatalog();
    writeCache(catalog);
    log.ok(`Katalog guncellendi (${catalog.ranks.length} rank, ${catalog.maps.length} harita).`);
    return new Catalog(catalog);
  } catch (err) {
    if (cached) {
      log.warn(`valorant-api.com'a ulasilamadi (${err.message}), onbellek kullaniliyor.`);
      return new Catalog(cached);
    }
    throw new Error(`Katalog indirilemedi ve onbellek yok: ${err.message}`);
  }
}

class Catalog {
  constructor(data) {
    this.raw = data;
    this.ranksByTier = new Map(data.ranks.map((r) => [r.tier, r]));
    this.mapsByUrl = new Map(data.maps.map((m) => [m.url.toLowerCase(), m]));
    this.cards = data.cards;
  }

  rank(tier) {
    return this.ranksByTier.get(Number(tier)) ?? null;
  }

  map(mapUrl) {
    if (!mapUrl) return null;
    return this.mapsByUrl.get(String(mapUrl).toLowerCase()) ?? null;
  }

  card(uuid) {
    return this.cards[uuid] ?? null;
  }

  /**
   * Kullanicinin config'e yazdigi rank degerini tier numarasina cevirir.
   * Sayi ("27"), Ingilizce ad ("Immortal 3") veya yerellestirilmis ad
   * ("Ölümsüz 3") kabul eder.
   */
  resolveRank(input, lang = 'en') {
    if (input === null || input === undefined || input === '') return null;

    if (typeof input === 'number' || /^\d+$/.test(String(input).trim())) {
      const tier = Number(input);
      return this.ranksByTier.has(tier) ? tier : null;
    }

    const wanted = normalizeKey(input);
    for (const rank of this.raw.ranks) {
      if (normalizeKey(rank.name) === wanted) return rank.tier;
      if (normalizeKey(localizeRankName(rank.name, lang)) === wanted) return rank.tier;
      if (normalizeKey(localizeRankName(rank.name, 'tr')) === wanted) return rank.tier;
    }
    return null;
  }

  /** --list-ranks ciktisi icin. */
  listRanks(lang = 'en') {
    return this.raw.ranks.map((r) => ({
      tier: r.tier,
      name: r.name,
      localized: localizeRankName(r.name, lang),
    }));
  }
}

export { normalizeKey, Catalog };
