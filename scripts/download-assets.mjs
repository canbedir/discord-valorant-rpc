import fs from 'node:fs';
import path from 'node:path';
import { loadCatalog } from '../src/valorantData.mjs';
import { ROOT } from '../src/config.mjs';
import { slug } from '../src/activity.mjs';
import { log } from '../src/log.mjs';

/**
 * assets.source = "key" kullanmak isteyenler icin. Rank ikonlarini ve harita
 * gorsellerini, Discord Developer Portal > Rich Presence > Art Assets'e
 * oldugu gibi surukleyip birakabilecegin isimlerle indirir.
 * Dosya adi = asset anahtari (rank_27.png -> "rank_27").
 *
 * Varsayilan "url" modunda buna gerek yok; orada gorseller dogrudan
 * valorant-api baglantisi olarak gonderiliyor.
 */
const OUT_DIR = path.join(ROOT, 'assets', 'downloaded');

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
  return buffer.length;
}

async function main() {
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
    const dest = path.join(OUT_DIR, job.name);
    try {
      const bytes = await download(job.url, dest);
      ok += 1;
      log.debug(`${job.name} (${Math.round(bytes / 1024)} KB)`);
    } catch (err) {
      failed += 1;
      log.warn(`${job.name} indirilemedi: ${err.message}`);
    }
  }

  log.ok(`${ok} dosya indirildi${failed ? `, ${failed} basarisiz` : ''}: ${OUT_DIR}`);
  log.info('Bu klasordeki dosyalari Discord Developer Portal > Rich Presence > Art Assets');
  log.info('bolumune yukleyip config.json icinde assets.source degerini "key" yap.');
}

main().catch((err) => {
  log.error(err.message);
  process.exitCode = 1;
});
