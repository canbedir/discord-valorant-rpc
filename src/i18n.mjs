/**
 * Every piece of text in the project lives here, in one table per language.
 *
 * Adding a language means adding one entry to each of the four tables below.
 * Missing keys fall back to English, so a partial translation still runs.
 */

/** Console output. */
const MESSAGES = {
  en: {
    'config.unreadable': 'Could not read config.json (invalid JSON?): {0}',
    'config.badRankMode': 'rank.mode "{0}" is not valid, falling back to "real".',

    'catalog.fromCache': 'Catalog loaded from cache.',
    'catalog.updated': 'Catalog updated ({0} ranks, {1} maps).',
    'catalog.writeFailed': 'Could not write the catalog cache: {0}',
    'catalog.offline': 'valorant-api.com is unreachable ({0}), using the cached catalog.',
    'catalog.unavailable': 'Catalog download failed and no cache exists: {0}',

    'riot.clientClosed': 'Riot Client is not running (no lockfile).',
    'riot.presenceFailed': 'Could not read presence: {0}',
    'riot.backOnline': 'Riot Client is reachable again.',

    'discord.noSocket':
      'No Discord IPC socket found. The Discord desktop app has to be running ' +
      '(the browser version has no Rich Presence). Run "npm run doctor" to find out why.',

    'doctor.title': 'Discord connection report',
    'doctor.verdict': 'Verdict',
    'doctor.allGood': 'Everything works — Discord is reachable.',
    'doctor.notRunning':
      'Discord is not running. Start the desktop app; the browser version has no Rich Presence.',
    'doctor.badClientId':
      'Discord rejected the Application ID. The socket is fine — the id in config.json is wrong. ' +
      'Copy it again from General Information, and run "npm run setup" to replace it.',
    'doctor.noClientId': 'No Application ID set yet. Run "npm run setup" first.',
    'doctor.storeBuild':
      'This is the Microsoft Store build of Discord. It runs sandboxed and does not expose the ' +
      'Rich Presence socket. Uninstall it and install Discord from discord.com/download.',
    'doctor.noPipe':
      'Discord is running but has not opened its Rich Presence socket. Give it a moment after ' +
      'launch, or fully quit it from the tray and reopen it.',
    'doctor.elevation':
      'The socket exists but could not be opened. This usually means one side is elevated: ' +
      'run this and Discord both as administrator, or both as a normal user.',
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

    'app.running': 'discord-valorant-rpc is running. Press Ctrl+C to stop. (polling every {0} ms)',
    'app.demo': 'DEMO mode: sending synthetic presence instead of the real one.',
    'app.rankOverride': 'Rank mode: override -> "{0}"',
    'app.rankMode': 'Rank mode: {0}',
    'app.tooltipOnly':
      'rank.leaderboardPosition is set, but the rank only appears in the badge tooltip. ' +
      'Set display.showRankInText to true to put it on the card itself.',
    'app.positionNeedsTopTier':
      'rank.leaderboardPosition is set but ignored: a placing only applies to {0}, ' +
      'and the chosen rank is {1}.',
    'app.cleared': 'Presence cleared (VALORANT is not running).',
    'app.shuttingDown': 'Shutting down, clearing the Discord presence...',

    'ranks.header': 'Available rank values (config.json -> rank.override):',
    'ranks.footer': 'Numbers and names both work: 27, "Radiant", "Immortal 3" are all valid.',

    'setup.title': 'Setup',
    'setup.intro': 'Answer three questions and you are done. Re-run any time with --setup.',
    'setup.step': 'Step {0}/{1}',
    'setup.clientId': 'Discord Application ID',
    'setup.clientIdHelp':
      'Open https://discord.com/developers/applications, click New Application and\n' +
      '     name it VALORANT (that name becomes the title Discord shows). Copy the\n' +
      '     Application ID from General Information.',
    'setup.clientIdInvalid': 'That does not look like an Application ID (17-20 digits). Try again.',
    'setup.language': 'Language',
    'setup.rankTitle': 'Which rank should Discord show?',
    'setup.rankReal': 'My real rank',
    'setup.rankChoose': 'A rank I choose',
    'setup.rankHide': 'No rank badge',
    'setup.rankPrompt': 'Rank name or tier number (e.g. Radiant, Immortal 3, 27)',
    'setup.rankInvalid': 'Unknown rank. Some valid values: Radiant, Immortal 3, Diamond 1, 27.',
    'setup.positionPrompt': '{0} has a leaderboard. Position to show? (Enter to skip)',
    'setup.positionInvalid': 'Enter a positive number, or press Enter to skip.',
    'setup.rankNow': 'Rank is now: {0}',
    'setup.saved': 'Saved to {0}',
    'setup.invalidChoice': 'Pick one of the numbers above.',
    'setup.hotkeys': 'Press [r] to change the rank, [q] to quit.',
  },

  tr: {
    'config.unreadable': 'config.json okunamadi (gecersiz JSON olabilir): {0}',
    'config.badRankMode': 'rank.mode "{0}" gecersiz, "real" kullaniliyor.',

    'catalog.fromCache': 'Katalog onbellekten yuklendi.',
    'catalog.updated': 'Katalog guncellendi ({0} rank, {1} harita).',
    'catalog.writeFailed': 'Katalog onbellege yazilamadi: {0}',
    'catalog.offline': "valorant-api.com'a ulasilamadi ({0}), onbellek kullaniliyor.",
    'catalog.unavailable': 'Katalog indirilemedi ve onbellek yok: {0}',

    'riot.clientClosed': 'Riot Client kapali (lockfile yok).',
    'riot.presenceFailed': 'Presence okunamadi: {0}',
    'riot.backOnline': 'Riot Client tekrar erisilebilir.',

    'discord.noSocket':
      'Discord IPC soketi bulunamadi. Discord masaustu uygulamasi acik olmali ' +
      '(tarayici surumunde Rich Presence yok). Sebebini ogrenmek icin: npm run doctor',

    'doctor.title': 'Discord baglanti raporu',
    'doctor.verdict': 'Sonuc',
    'doctor.allGood': 'Her sey calisiyor - Discord erisilebilir durumda.',
    'doctor.notRunning':
      'Discord calismiyor. Masaustu uygulamasini ac; tarayici surumunde Rich Presence yok.',
    'doctor.badClientId':
      "Discord Application ID'yi reddetti. Soket saglam - config.json'daki id yanlis. " +
      'General Information sekmesinden tekrar kopyala, degistirmek icin: npm run setup',
    'doctor.noClientId': 'Henuz Application ID girilmemis. Once: npm run setup',
    'doctor.storeBuild':
      "Bu Discord'un Microsoft Store surumu. Sandbox icinde calistigi icin Rich Presence " +
      'soketini disariya acmiyor. Kaldirip discord.com/download adresinden kur.',
    'doctor.noPipe':
      'Discord calisiyor ama Rich Presence soketini henuz acmamis. Acilistan sonra biraz bekle, ' +
      'ya da tepsiden tamamen kapatip yeniden ac.',
    'doctor.elevation':
      'Soket var ama acilamadi. Genelde taraflardan birinin yonetici olarak calismasindan olur: ' +
      "ikisini de yonetici olarak ya da ikisini de normal kullanici olarak calistir.",
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

    'app.running': 'discord-valorant-rpc calisiyor. Cikmak icin Ctrl+C. ({0} ms araliklarla)',
    'app.demo': 'DEMO modu: gercek presence yerine sahte veri gonderiliyor.',
    'app.rankOverride': 'Rank modu: override -> "{0}"',
    'app.rankMode': 'Rank modu: {0}',
    'app.tooltipOnly':
      'rank.leaderboardPosition ayarli ama rank yalnizca rozetin tooltipinde gorunuyor. ' +
      'Kartta yazi olarak gorunmesi icin display.showRankInText degerini true yap.',
    'app.positionNeedsTopTier':
      'rank.leaderboardPosition ayarli ama yok sayiliyor: sira yalnizca {0} icin gecerli, ' +
      'secilen rank ise {1}.',
    'app.cleared': 'Durum temizlendi (VALORANT calismiyor).',
    'app.shuttingDown': 'Kapaniyor, Discord durumu temizleniyor...',

    'ranks.header': 'Kullanilabilir rank degerleri (config.json -> rank.override):',
    'ranks.footer': 'Sayiyi da ismi de yazabilirsin: 27, "Radiant", "Olumsuz 3" hepsi gecerli.',

    'setup.title': 'Kurulum',
    'setup.intro': 'Uc soru, hepsi bu. Sonradan --setup ile tekrar acabilirsin.',
    'setup.step': 'Adim {0}/{1}',
    'setup.clientId': 'Discord Application ID',
    'setup.clientIdHelp':
      'https://discord.com/developers/applications adresini ac, New Application de ve\n' +
      '     adini VALORANT yap (bu ad Discord\'da baslik olarak gorunur). General\n' +
      '     Information sekmesindeki Application ID degerini kopyala.',
    'setup.clientIdInvalid': 'Bu bir Application ID gibi gorunmuyor (17-20 hane). Tekrar dene.',
    'setup.language': 'Dil',
    'setup.rankTitle': 'Discord hangi rank\'i gostersin?',
    'setup.rankReal': 'Gercek rank\'im',
    'setup.rankChoose': 'Sectigim bir rank',
    'setup.rankHide': 'Rank gosterme',
    'setup.rankPrompt': 'Rank adi veya tier numarasi (orn. Radiant, Olumsuz 3, 27)',
    'setup.rankInvalid': 'Bilinmeyen rank. Gecerli ornekler: Radiant, Olumsuz 3, Elmas 1, 27.',
    'setup.positionPrompt': '{0} liderlik tablosunda. Kacinci sira yazsin? (Gecmek icin Enter)',
    'setup.positionInvalid': 'Pozitif bir sayi gir, ya da gecmek icin Enter.',
    'setup.rankNow': 'Rank artik: {0}',
    'setup.saved': '{0} dosyasina kaydedildi',
    'setup.invalidChoice': 'Yukaridaki numaralardan birini sec.',
    'setup.hotkeys': 'Rank degistirmek icin [r], cikmak icin [q].',
  },
};

/** Text that ends up in the Discord presence itself. */
const PRESENCE = {
  en: {
    mainMenu: 'Main Menu',
    inQueue: 'In Queue',
    agentSelect: 'Agent Select',
    customSetup: 'Custom Game Setup',
    customGame: 'Custom Game',
    shootingRange: 'The Range',
    away: 'Away',
    party: 'Party',
    level: 'Level',
    unknownMap: 'Unknown Map',
    playing: 'VALORANT',
  },
  tr: {
    mainMenu: 'Ana Menü',
    inQueue: 'Sırada',
    agentSelect: 'Ajan Seçimi',
    customSetup: 'Özel Oyun Kurulumu',
    customGame: 'Özel Oyun',
    shootingRange: 'Atış Poligonu',
    away: 'Boşta',
    party: 'Parti',
    level: 'Seviye',
    unknownMap: 'Bilinmeyen Harita',
    playing: 'VALORANT',
  },
};

/**
 * Queue ids come from presence.queueId. valorant-api.com returns a null
 * queueID on every game mode, so this mapping is maintained by hand.
 */
const QUEUES = {
  en: {
    competitive: 'Competitive',
    unrated: 'Unrated',
    swiftplay: 'Swiftplay',
    spikerush: 'Spike Rush',
    deathmatch: 'Deathmatch',
    hurm: 'Team Deathmatch',
    ggteam: 'Escalation',
    onefa: 'Replication',
    snowball: 'Snowball Fight',
    newmap: 'New Map',
    seeding: 'Seeding',
    premier: 'Premier',
    premiermatch: 'Premier Match',
    premierseedingmatch: 'Premier Seeding',
    aros: 'All Random One Site',
    ascension: 'Skirmish: Ascension',
    skirmish: 'Skirmish',
  },
  tr: {
    competitive: 'Rekabetçi',
    unrated: 'Derecesiz',
    swiftplay: 'Hızlı Oyun',
    spikerush: 'Spike Rush',
    deathmatch: 'Ölüm Maçı',
    hurm: 'Takım Ölüm Maçı',
    ggteam: 'Yükseliş',
    onefa: 'Replikasyon',
    snowball: 'Kartopu Savaşı',
    newmap: 'Yeni Harita',
    seeding: 'Derecelendirme',
    premier: 'Premier',
    premiermatch: 'Premier Maçı',
    premierseedingmatch: 'Premier Eleme',
    aros: 'Tek Bölge Rastgele',
    ascension: 'Yükseliş Çatışması',
    skirmish: 'Çatışma',
  },
};

/**
 * Rank tier words. Only languages that actually rename the tiers need an
 * entry; English uses the names valorant-api already returns.
 */
const RANK_NAMES = {
  tr: {
    UNRANKED: 'Derecesiz',
    IRON: 'Demir',
    BRONZE: 'Bronz',
    SILVER: 'Gümüş',
    GOLD: 'Altın',
    PLATINUM: 'Platin',
    DIAMOND: 'Elmas',
    ASCENDANT: 'Yükselen',
    IMMORTAL: 'Ölümsüz',
    RADIANT: 'Radiant',
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

/** Console message: m('discord.connected', 'hix7') -> "Connected as hix7" */
export function m(key, ...args) {
  const template = MESSAGES[current][key] ?? MESSAGES[FALLBACK][key] ?? key;
  return template.replace(/\{(\d+)\}/g, (match, index) => {
    const value = args[Number(index)];
    return value === undefined ? match : String(value);
  });
}

/** Presence text: t('mainMenu') and t.queue('competitive'). */
export function createTranslator(language) {
  const lang = language in PRESENCE ? language : FALLBACK;
  const t = (key) => PRESENCE[lang][key] ?? PRESENCE[FALLBACK][key] ?? key;
  t.queue = (queueId) => {
    if (!queueId) return null;
    return QUEUES[lang][queueId] ?? QUEUES[FALLBACK][queueId] ?? queueId;
  };
  t.lang = lang;
  return t;
}

/**
 * valorant-api returns names like "IRON 2". Translates the tier word when the
 * language renames it, otherwise normalises it to Title Case.
 */
export function localizeRankName(rawName, lang) {
  if (!rawName) return null;
  const [tierWord, ...rest] = rawName.trim().split(/\s+/);
  const number = rest.join(' ');

  const translated = RANK_NAMES[lang]?.[tierWord.toUpperCase()];
  if (translated) return number ? `${translated} ${number}` : translated;

  const titled = tierWord.charAt(0) + tierWord.slice(1).toLowerCase();
  return number ? `${titled} ${number}` : titled;
}

export { MESSAGES, PRESENCE, QUEUES, RANK_NAMES };
