/**
 * Console messages, separate from the presence strings in data/strings.mjs:
 * those are picked per config and passed around as a translator, while these
 * are needed by modules that have no access to the config object (and, in the
 * config loader's case, run before the config is even parsed).
 *
 * Language is global and set once at startup.
 */
const MESSAGES = {
  en: {
    'config.created': 'config.json was missing, copied from config.example.json.',
    'config.needsClientId': 'Add your Discord Application ID here: {0}',
    'config.unreadable': 'Could not read config.json (invalid JSON?): {0}',
    'config.badClientId':
      '"discordClientId" in config.json is not valid. Create an application at ' +
      'https://discord.com/developers/applications and paste its Application ID.',
    'config.badRankMode': 'rank.mode "{0}" is not valid, falling back to "real".',

    'catalog.fromCache': 'Catalog loaded from cache.',
    'catalog.updated': 'Catalog updated ({0} ranks, {1} maps).',
    'catalog.writeFailed': 'Could not write the catalog cache: {0}',
    'catalog.offline': 'valorant-api.com is unreachable ({0}), using the cached catalog.',
    'catalog.unavailable': 'Catalog download failed and no cache exists: {0}',

    'riot.clientClosed': 'Riot Client is not running (no lockfile).',
    'riot.presenceFailed': 'Could not read presence: {0}',
    'riot.backOnline': 'Riot Client is reachable again.',

    'discord.noSocket': 'No Discord IPC socket found. Is the Discord desktop app running?',
    'discord.closed': 'Discord closed the connection',
    'discord.socketClosed': 'socket closed',
    'discord.handshakeTimeout': 'handshake timed out',
    'discord.rejected': 'Discord rejected the request: {0}',
    'discord.badFrame': 'discord: skipped a non-JSON frame',
    'discord.connected': 'Connected as {0}',
    'discord.lost': 'Lost the Discord connection ({0}). Will retry.',
    'discord.unknownUser': 'unknown user',

    'rank.unknownOverride':
      'rank.override value "{0}" was not recognised, showing the real rank instead. ' +
      'Run "npm run ranks" for the accepted names.',

    'app.running': 'valorant-tracker is running. Press Ctrl+C to stop. (polling every {0} ms)',
    'app.demo': 'DEMO mode: sending synthetic presence instead of the real one.',
    'app.rankOverride': 'Rank mode: override -> "{0}"',
    'app.rankMode': 'Rank mode: {0}',
    'app.cleared': 'Presence cleared (VALORANT is not running).',
    'app.shuttingDown': 'Shutting down, clearing the Discord presence...',

    'ranks.header': 'Available rank values (config.json -> rank.override):',
    'ranks.footer': 'Numbers and names both work: 27, "Radiant", "Immortal 3" are all valid.',

    'assets.downloaded': 'Downloaded {0} file(s){1}: {2}',
    'assets.failedSuffix': ', {0} failed',
    'assets.downloadFailed': 'Could not download {0}: {1}',
    'assets.uploadHint1': 'Upload this folder to Discord Developer Portal > Rich Presence > Art Assets',
    'assets.uploadHint2': 'then set assets.source to "key" in config.json.',
  },

  tr: {
    'config.created': 'config.json bulunamadi, config.example.json kopyalandi.',
    'config.needsClientId': 'Discord Application ID girmen gerekiyor: {0}',
    'config.unreadable': 'config.json okunamadi (gecersiz JSON olabilir): {0}',
    'config.badClientId':
      'config.json icindeki "discordClientId" gecersiz. ' +
      'https://discord.com/developers/applications adresinden bir uygulama olustur ve ' +
      'Application ID degerini yapistir.',
    'config.badRankMode': 'rank.mode "{0}" gecersiz, "real" kullaniliyor.',

    'catalog.fromCache': 'Katalog onbellekten yuklendi.',
    'catalog.updated': 'Katalog guncellendi ({0} rank, {1} harita).',
    'catalog.writeFailed': 'Katalog onbellege yazilamadi: {0}',
    'catalog.offline': "valorant-api.com'a ulasilamadi ({0}), onbellek kullaniliyor.",
    'catalog.unavailable': 'Katalog indirilemedi ve onbellek yok: {0}',

    'riot.clientClosed': 'Riot Client kapali (lockfile yok).',
    'riot.presenceFailed': 'Presence okunamadi: {0}',
    'riot.backOnline': 'Riot Client tekrar erisilebilir.',

    'discord.noSocket': 'Discord IPC soketi bulunamadi. Discord masaustu uygulamasi acik mi?',
    'discord.closed': 'Discord baglantiyi kapatti',
    'discord.socketClosed': 'soket kapandi',
    'discord.handshakeTimeout': 'handshake zaman asimi',
    'discord.rejected': 'Discord istegi reddetti: {0}',
    'discord.badFrame': 'discord: JSON olmayan cerceve atlandi',
    'discord.connected': 'Baglandi: {0}',
    'discord.lost': 'Discord baglantisi koptu ({0}). Yeniden denenecek.',
    'discord.unknownUser': 'bilinmeyen kullanici',

    'rank.unknownOverride':
      'rank.override degeri "{0}" taninmadi, gercek rank gosteriliyor. ' +
      'Gecerli isimler icin: npm run ranks',

    'app.running': 'valorant-tracker calisiyor. Cikmak icin Ctrl+C. ({0} ms araliklarla)',
    'app.demo': 'DEMO modu: gercek presence yerine sahte veri gonderiliyor.',
    'app.rankOverride': 'Rank modu: override -> "{0}"',
    'app.rankMode': 'Rank modu: {0}',
    'app.cleared': 'Durum temizlendi (VALORANT calismiyor).',
    'app.shuttingDown': 'Kapaniyor, Discord durumu temizleniyor...',

    'ranks.header': 'Kullanilabilir rank degerleri (config.json -> rank.override):',
    'ranks.footer': 'Sayiyi da ismi de yazabilirsin: 27, "Radiant", "Olumsuz 3" hepsi gecerli.',

    'assets.downloaded': '{0} dosya indirildi{1}: {2}',
    'assets.failedSuffix': ', {0} basarisiz',
    'assets.downloadFailed': '{0} indirilemedi: {1}',
    'assets.uploadHint1':
      'Bu klasordeki dosyalari Discord Developer Portal > Rich Presence > Art Assets bolumune yukle,',
    'assets.uploadHint2': 'sonra config.json icinde assets.source degerini "key" yap.',
  },
};

const FALLBACK = 'en';
let current = FALLBACK;

export function setLanguage(language) {
  current = language in MESSAGES ? language : FALLBACK;
  return current;
}

export function getLanguage() {
  return current;
}

export function availableLanguages() {
  return Object.keys(MESSAGES);
}

/** m('discord.connected', 'hix7') -> "Connected as hix7" */
export function m(key, ...args) {
  const template = MESSAGES[current][key] ?? MESSAGES[FALLBACK][key] ?? key;
  return template.replace(/\{(\d+)\}/g, (match, index) => {
    const value = args[Number(index)];
    return value === undefined ? match : String(value);
  });
}

export { MESSAGES };
