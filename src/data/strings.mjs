/**
 * Kuyruk kimlikleri presence.queueId alanindan gelir. valorant-api.com
 * gamemodes ucundaki queueID alanlari bos donduugu icin bu esleme elle tutuluyor.
 */
const QUEUES = {
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
};

const STRINGS = {
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
    unranked: 'Derecesiz',
    playing: 'VALORANT',
    leaderboard: '#',
  },
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
    unranked: 'Unranked',
    playing: 'VALORANT',
    leaderboard: '#',
  },
};

/** Rank isimleri; override ayarinda kullanici bunlari yazabilir. */
const RANK_NAMES_TR = {
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
};

export function createTranslator(language) {
  const lang = language in STRINGS ? language : 'en';
  const t = (key) => STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
  t.queue = (queueId) => {
    if (!queueId) return null;
    return QUEUES[lang][queueId] ?? QUEUES.en[queueId] ?? queueId;
  };
  t.lang = lang;
  return t;
}

/**
 * valorant-api "IRON 2" gibi doner. Turkce icin bunu "Demir 2"ye cevirir,
 * diger dillerde Title Case'e normalize eder.
 */
export function localizeRankName(rawName, lang) {
  if (!rawName) return null;
  const [tierWord, ...rest] = rawName.trim().split(/\s+/);
  const number = rest.join(' ');

  if (lang === 'tr') {
    const translated = RANK_NAMES_TR[tierWord.toUpperCase()];
    if (translated) return number ? `${translated} ${number}` : translated;
  }

  const titled = tierWord.charAt(0) + tierWord.slice(1).toLowerCase();
  return number ? `${titled} ${number}` : titled;
}

export { QUEUES, RANK_NAMES_TR };
