import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from './log.mjs';
import { m, setLanguage } from './i18n.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CONFIG_PATH = path.join(ROOT, 'config.json');

const DEFAULTS = {
  discordClientId: '',
  language: 'en',
  pollIntervalMs: 3000,
  rank: {
    mode: 'real',
    override: 'Radiant',
    leaderboardPosition: 0,
  },
  display: {
    showScore: true,
    showParty: true,
    showAccountLevel: false,
    showRankInMenus: true,
    showRankInText: false,
    largeImage: 'map',
    buttons: [],
  },
  idle: {
    showWhenGameClosed: false,
    text: 'VALORANT closed',
  },
};

/** A Discord Application ID is a snowflake: 17-20 digits. */
export function isValidClientId(value) {
  return /^\d{17,20}$/.test(String(value ?? '').trim());
}

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
 * Reads config.json, merging it over the defaults so an older config keeps
 * working when new fields are introduced.
 *
 * Missing or invalid settings are reported through `needsSetup` rather than
 * thrown, so the caller can run the interactive wizard instead of failing.
 * The language is applied before anything is logged, otherwise the first
 * messages a new user sees would ignore their setting.
 */
export function loadConfig() {
  let raw = {};
  let unreadable = null;

  if (fs.existsSync(CONFIG_PATH)) {
    try {
      raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (err) {
      unreadable = err.message;
    }
  }

  setLanguage(raw.language ?? DEFAULTS.language);

  if (unreadable) {
    log.warn(m('config.unreadable', unreadable));
  }

  const config = deepMerge(DEFAULTS, raw);
  config.pollIntervalMs = Math.max(1000, Number(config.pollIntervalMs) || 3000);

  const validModes = ['real', 'override', 'hide'];
  if (!validModes.includes(config.rank.mode)) {
    log.warn(m('config.badRankMode', config.rank.mode));
    config.rank.mode = 'real';
  }

  return { config, needsSetup: !isValidClientId(config.discordClientId) };
}

/** Writes config.json with the indentation a human would use. */
export function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

/** config.json exactly as it is on disk, without defaults or validation. */
function readRawConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch {
    return {};
  }
}

/**
 * Merges a patch into config.json on disk and returns the result.
 *
 * Re-reading first matters: the config held in memory is whatever was loaded
 * at startup, so writing that back would silently undo any edit made by hand
 * while the app was running. Only the keys in `patch` are touched.
 */
export function updateConfig(patch) {
  const merged = deepMerge(readRawConfig(), patch);
  saveConfig(merged);
  return merged;
}

export { CONFIG_PATH, DEFAULTS };
