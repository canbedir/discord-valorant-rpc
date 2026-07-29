/**
 * --demo mode: synthetic presence fed in place of the real one, so the Discord
 * output (and especially the rank override) can be checked without launching
 * the game. The score advances on every call to prove updates get through.
 */
const SCENES = [
  {
    sessionLoopState: 'MENUS',
    partyState: 'DEFAULT',
    queueId: 'competitive',
    matchMap: '',
    partySize: 2,
    maxPartySize: 5,
  },
  {
    sessionLoopState: 'MENUS',
    partyState: 'MATCHMAKING',
    queueId: 'competitive',
    matchMap: '',
    partySize: 2,
    maxPartySize: 5,
  },
  {
    sessionLoopState: 'PREGAME',
    partyState: 'DEFAULT',
    queueId: 'competitive',
    matchMap: '/Game/Maps/Ascent/Ascent',
    partySize: 2,
    maxPartySize: 5,
  },
  {
    sessionLoopState: 'INGAME',
    partyState: 'DEFAULT',
    queueId: 'competitive',
    matchMap: '/Game/Maps/Ascent/Ascent',
    partySize: 2,
    maxPartySize: 5,
  },
];

const BASE = {
  isValid: true,
  provisioningFlow: 'Matchmaking',
  competitiveTier: 12,
  leaderboardPosition: 0,
  accountLevel: 247,
  playerCardId: '9fb348bc-41a0-91ad-8a3e-818035c4e561',
  isIdle: false,
  gameName: 'demo',
  gameTag: '0000',
};

let step = 0;

export function nextDemoPresence({ holdTicks = 4 } = {}) {
  const scene = SCENES[Math.floor(step / holdTicks) % SCENES.length];
  const inGameTicks = scene.sessionLoopState === 'INGAME' ? step % holdTicks : 0;
  step += 1;

  return {
    ...BASE,
    ...scene,
    partyOwnerMatchScoreAllyTeam: inGameTicks * 3,
    partyOwnerMatchScoreEnemyTeam: inGameTicks * 2,
  };
}

export function resetDemo() {
  step = 0;
}
