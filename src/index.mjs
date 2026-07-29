import { loadConfig } from './config.mjs';
import { loadCatalog } from './valorantData.mjs';
import { createTranslator } from './data/strings.mjs';
import { fetchValorantPresence, resetPuuidCache } from './riot/presence.mjs';
import { DiscordIPC } from './discord/ipc.mjs';
import { buildActivity, buildIdleActivity } from './activity.mjs';
import { nextDemoPresence } from './demoPresence.mjs';
import { log, setDebug, COLORS } from './log.mjs';

const RECONNECT_DELAY_MS = 15000;

function printRanks(catalog, lang) {
  console.log('\nKullanilabilir rank degerleri (config.json -> rank.override):\n');
  for (const r of catalog.listRanks(lang)) {
    const tier = String(r.tier).padStart(2);
    console.log(`  ${COLORS.dim}${tier}${COLORS.reset}  ${r.localized.padEnd(14)} ${COLORS.dim}${r.name}${COLORS.reset}`);
  }
  console.log('\nSayiyi da ismi de yazabilirsin: 27, "Radiant", "Olumsuz 3" hepsi gecerli.\n');
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--debug')) setDebug(true);

  if (args.includes('--list-ranks')) {
    const catalog = await loadCatalog();
    let lang = 'tr';
    try {
      lang = loadConfig().language;
    } catch {
      // config henuz kurulmamis olabilir, listeyi yine de gosterelim
    }
    printRanks(catalog, lang);
    return;
  }

  const demoMode = args.includes('--demo');
  const config = loadConfig();
  const t = createTranslator(config.language);
  const catalog = await loadCatalog();

  const ipc = new DiscordIPC(config.discordClientId);
  let connected = false;
  let nextConnectAttempt = 0;

  ipc.on('disconnect', (err) => {
    connected = false;
    nextConnectAttempt = Date.now() + RECONNECT_DELAY_MS;
    log.warn(`Discord baglantisi koptu (${err.message}). Yeniden denenecek.`);
  });

  async function ensureDiscord() {
    if (connected) return true;
    if (Date.now() < nextConnectAttempt) return false;

    try {
      const user = await ipc.connect();
      connected = true;
      const who = user?.username ? `${user.username}` : 'bilinmeyen kullanici';
      log.discord(`Baglandi: ${who}`);
      return true;
    } catch (err) {
      nextConnectAttempt = Date.now() + RECONNECT_DELAY_MS;
      log.warn(err.message);
      return false;
    }
  }

  let lastPayload;
  let lastSignature;
  let startedAt = Date.now();
  let riotWasUp = true;

  async function tick() {
    if (!(await ensureDiscord())) return;

    let presence = null;
    if (demoMode) {
      presence = nextDemoPresence();
    } else {
      try {
        presence = await fetchValorantPresence();
        if (!riotWasUp) {
          riotWasUp = true;
          log.riot('Riot Client tekrar erisilebilir.');
        }
      } catch (err) {
        if (riotWasUp) {
          riotWasUp = false;
          log.riot(`Presence okunamadi: ${err.message}`);
        }
        // Riot Client yeniden acildiginda PUUID degisebilir, onbellegi dusur.
        resetPuuidCache();
      }
    }

    // Ayni durumda gecirilen sureyi saymak icin durum imzasi tutuyoruz;
    // imza degisince Discord'daki sayac sifirdan baslar.
    const signature = presence
      ? [presence.sessionLoopState, presence.matchMap, presence.queueId, presence.partyState].join('|')
      : 'offline';

    if (signature !== lastSignature) {
      lastSignature = signature;
      startedAt = Date.now();
    }

    let activity = null;
    if (presence) {
      activity = buildActivity({ presence, catalog, config, t, startedAt });
    } else if (config.idle.showWhenGameClosed) {
      activity = buildIdleActivity({ config, t, startedAt });
    }

    const payload = JSON.stringify(activity);
    if (payload === lastPayload) return;
    lastPayload = payload;

    ipc.setActivity(activity);
    if (activity) {
      log.info(`${activity.details ?? ''}${activity.state ? ` | ${activity.state}` : ''}`);
      log.debug(JSON.stringify(activity));
    } else {
      log.info('Durum temizlendi (VALORANT calismiyor).');
    }
  }

  log.ok(`valorant-tracker calisiyor. Cikmak icin Ctrl+C. (${config.pollIntervalMs} ms araliklarla)`);
  if (demoMode) log.warn('DEMO modu: gercek presence yerine sahte veri gonderiliyor.');
  log.info(
    config.rank.mode === 'override'
      ? `Rank modu: override -> "${config.rank.override}"`
      : `Rank modu: ${config.rank.mode}`,
  );

  await tick();
  const timer = setInterval(() => {
    tick().catch((err) => log.error(err.stack ?? err.message));
  }, config.pollIntervalMs);

  let shuttingDown = false;
  const shutdown = () => {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(timer);
    log.info('Kapaniyor, Discord durumu temizleniyor...');
    if (connected) ipc.clearActivity();
    // Temizleme cercevesinin pipe'a yazilmasina firsat ver.
    setTimeout(() => {
      ipc.destroy();
      process.exit(0);
    }, 300);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  log.error(err.message);
  log.debug(err.stack);
  process.exitCode = 1;
});
