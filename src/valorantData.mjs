import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './config.mjs';
import { log } from './log.mjs';
import { m } from './i18n.mjs';
import { localizeRankName } from './data/strings.mjs';

const CACHE_DIR = path.join(ROOT, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'catalog.json');
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const API = 'https://valorant-api.com/v1';

/** Comparison key that ignores accents, spacing and punctuation. */
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

  // competitivetiers returns one table per episode; the current one is last.
  const current = tierSets[tierSets.length - 1];

  return {
    fetchedAt: Date.now(),
    ranks: current.tiers
      .filter((t) => t.largeIcon) // Unused1 / Unused2 have no icon
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
    log.warn(m('catalog.writeFailed', err.message));
  }
}

/**
 * Loads the catalog, skipping the network while the cache is fresh and falling
 * back to a stale cache when the request fails, so it still works offline.
 */
export async function loadCatalog({ force = false } = {}) {
  const cached = readCache();
  const fresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

  if (fresh && !force) {
    log.debug(m('catalog.fromCache'));
    return new Catalog(cached);
  }

  try {
    const catalog = await downloadCatalog();
    writeCache(catalog);
    log.ok(m('catalog.updated', catalog.ranks.length, catalog.maps.length));
    return new Catalog(catalog);
  } catch (err) {
    if (cached) {
      log.warn(m('catalog.offline', err.message));
      return new Catalog(cached);
    }
    throw new Error(m('catalog.unavailable', err.message));
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
   * Turns whatever the user wrote in config into a tier number. Accepts a
   * number ("27"), the English name ("Immortal 3") or a localized one
   * ("Olumsuz 3"), with or without accents.
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

  /** Backing data for --list-ranks. */
  listRanks(lang = 'en') {
    return this.raw.ranks.map((r) => ({
      tier: r.tier,
      name: r.name,
      localized: localizeRankName(r.name, lang),
    }));
  }
}

export { normalizeKey, Catalog };
