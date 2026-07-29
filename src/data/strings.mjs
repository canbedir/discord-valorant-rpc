/**
 * Strings that end up in the Discord presence itself, chosen by config.language.
 * Console output goes through i18n.mjs instead.
 */

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

const STRINGS = {
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
    unranked: 'Derecesiz',
    playing: 'VALORANT',
  },
};

/** Rank tier words; config.rank.override accepts any of these spellings. */
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
 * valorant-api returns names like "IRON 2". Translates the tier word when the
 * language has a mapping, otherwise just normalises it to Title Case.
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

export { QUEUES, RANK_NAMES };
