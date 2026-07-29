import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from './log.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CONFIG_PATH = path.join(ROOT, 'config.json');
const EXAMPLE_PATH = path.join(ROOT, 'config.example.json');

const DEFAULTS = {
  discordClientId: '',
  language: 'tr',
  pollIntervalMs: 3000,
  rank: {
    mode: 'real',
    override: 'Radiant',
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
    text: 'VALORANT kapali',
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
 * config.json yoksa ornekten olusturur, sonra varsayilanlarla birlestirir.
 * Boylece eski bir config yeni alanlar eklendiginde de calismaya devam eder.
 */
export function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.copyFileSync(EXAMPLE_PATH, CONFIG_PATH);
    log.warn('config.json bulunamadi, config.example.json kopyalandi.');
    log.warn(`Discord Application ID girmen gerekiyor: ${CONFIG_PATH}`);
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (err) {
    throw new Error(`config.json okunamadi (gecersiz JSON olabilir): ${err.message}`);
  }

  const config = deepMerge(DEFAULTS, raw);

  if (!config.discordClientId || !/^\d{17,20}$/.test(String(config.discordClientId))) {
    throw new Error(
      'config.json icindeki "discordClientId" gecersiz. ' +
        'https://discord.com/developers/applications adresinden bir uygulama olustur ve Application ID degerini yapistir.',
    );
  }

  config.pollIntervalMs = Math.max(1000, Number(config.pollIntervalMs) || 3000);

  const validModes = ['real', 'override', 'hide'];
  if (!validModes.includes(config.rank.mode)) {
    log.warn(`rank.mode "${config.rank.mode}" gecersiz, "real" kullaniliyor.`);
    config.rank.mode = 'real';
  }

  return config;
}

export { CONFIG_PATH };
