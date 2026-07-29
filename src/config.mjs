import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from './log.mjs';
import { m, setLanguage } from './i18n.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CONFIG_PATH = path.join(ROOT, 'config.json');
const EXAMPLE_PATH = path.join(ROOT, 'config.example.json');

const DEFAULTS = {
  discordClientId: '',
  language: 'en',
  pollIntervalMs: 3000,
  rank: {
    mode: 'real',
    override: 'Radiant',
    overrideLeaderboardPosition: 0,
    showLeaderboardPosition: false,
  },
  display: {
    showScore: true,
    showParty: true,
    showAccountLevel: false,
    showRankInMenus: true,
    largeImage: 'map',
    buttons: [],
  },
  idle: {
    showWhenGameClosed: false,
    text: 'VALORANT closed',
  },
  assets: {
    source: 'url',
    keyPrefix: '',
  },
};

function deepMerge(base, patch) {
  if (patch === null || patch === undefined) return base;
  if (Array.isArray(base) || typeof base !== 'object') return patch;
  if (typeof patch !== 'object' || Array.isArray(patch)) return patch;

  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    out[key] = key in base ? deepMerge(base[key], value) : value;
  }
  return out;
}

/**
 * Creates config.json from the example on first run, then merges it over the
 * defaults so an older config keeps working when new fields are introduced.
 *
 * The language is applied before anything is logged, otherwise the very first
 * messages a new user sees would ignore their setting.
 */
export function loadConfig() {
  const isFirstRun = !fs.existsSync(CONFIG_PATH);
  if (isFirstRun) {
    fs.copyFileSync(EXAMPLE_PATH, CONFIG_PATH);
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (err) {
    setLanguage(DEFAULTS.language);
    throw new Error(m('config.unreadable', err.message));
  }

  setLanguage(raw.language ?? DEFAULTS.language);

  if (isFirstRun) {
    log.warn(m('config.created'));
    log.warn(m('config.needsClientId', CONFIG_PATH));
  }

  const config = deepMerge(DEFAULTS, raw);

  if (!config.discordClientId || !/^\d{17,20}$/.test(String(config.discordClientId))) {
    throw new Error(m('config.badClientId'));
  }

  config.pollIntervalMs = Math.max(1000, Number(config.pollIntervalMs) || 3000);

  const validModes = ['real', 'override', 'hide'];
  if (!validModes.includes(config.rank.mode)) {
    log.warn(m('config.badRankMode', config.rank.mode));
    config.rank.mode = 'real';
  }

  return config;
}

export { CONFIG_PATH, DEFAULTS };
