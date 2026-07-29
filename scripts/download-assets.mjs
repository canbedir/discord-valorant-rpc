import fs from 'node:fs';
import path from 'node:path';
import { loadCatalog } from '../src/valorantData.mjs';
import { ROOT, DEFAULTS } from '../src/config.mjs';
import { slug } from '../src/activity.mjs';
import { log } from '../src/log.mjs';
import { m, setLanguage } from '../src/i18n.mjs';

/**
 * Only needed for assets.source = "key". Downloads every rank icon and map
 * splash under the exact name Discord expects as an asset key
 * (rank_27.png -> "rank_27"), ready to drag into
 * Developer Portal > Rich Presence > Art Assets.
 *
 * The default "url" mode needs none of this: images are sent as valorant-api
 * links and Discord proxies them.
 */
const OUT_DIR = path.join(ROOT, 'assets', 'downloaded');

function configuredLanguage() {
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'));
    return raw.language ?? DEFAULTS.language;
  } catch {
    return DEFAULTS.language;
  }
}

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
  return buffer.length;
}

async function main() {
  setLanguage(configuredLanguage());

  const catalog = await loadCatalog({ force: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const jobs = [];
  for (const rank of catalog.raw.ranks) {
    jobs.push({ name: `rank_${rank.tier}.png`, url: rank.icon });
  }
  for (const map of catalog.raw.maps) {
    if (map.splash) jobs.push({ name: `map_${slug(map.name)}.png`, url: map.splash });
  }

  let ok = 0;
  let failed = 0;
  for (const job of jobs) {
    try {
      const bytes = await download(job.url, path.join(OUT_DIR, job.name));
      ok += 1;
      log.debug(`${job.name} (${Math.round(bytes / 1024)} KB)`);
    } catch (err) {
      failed += 1;
      log.warn(m('assets.downloadFailed', job.name, err.message));
    }
  }

  log.ok(m('assets.downloaded', ok, failed ? m('assets.failedSuffix', failed) : '', OUT_DIR));
  log.info(m('assets.uploadHint1'));
  log.info(m('assets.uploadHint2'));
}

main().catch((err) => {
  log.error(err.message);
  process.exitCode = 1;
});
