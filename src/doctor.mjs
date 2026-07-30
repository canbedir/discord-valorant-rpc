import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { DiscordIPC } from './discord/ipc.mjs';
import { isValidClientId } from './config.mjs';
import { m } from './i18n.mjs';
import { COLORS } from './log.mjs';

/**
 * "No Discord IPC socket found" is the one failure that cannot be diagnosed
 * from the message alone, because every cause looks identical from inside the
 * process. This gathers the few facts that tell them apart and prints them in
 * a form that can be pasted into an issue.
 *
 * Field labels stay in English on purpose: the report is meant to be shared
 * with whoever is helping, while the verdicts the user acts on are translated.
 */
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `${COLORS.dim}${s}${COLORS.reset}`;
const good = (s) => `${COLORS.green}${s}${COLORS.reset}`;
const bad = (s) => `${COLORS.red}${s}${COLORS.reset}`;
const warn = (s) => `${COLORS.yellow}${s}${COLORS.reset}`;

function section(title) {
  console.log(`\n${bold(title)}`);
}

/** Named pipes are listed like a directory on Windows. */
function discordPipes() {
  try {
    return fs.readdirSync('\\\\.\\pipe\\').filter((n) => /^discord-ipc-\d+$/i.test(n));
  } catch {
    return null;
  }
}

function discordProcesses() {
  // Filtering with Where-Object instead of -Name: asking for a process that
  // does not exist makes PowerShell exit non-zero even with
  // -ErrorAction SilentlyContinue, which would look like "Discord not running"
  // whenever only one of the three builds is installed. The explicit exit 0
  // guards against the same thing from an unreadable Path.
  try {
    const out = execFileSync(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        "Get-Process | Where-Object { $_.Name -like 'Discord*' } | ForEach-Object { $_.Path }; exit 0",
      ],
      { encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'ignore'] },
    );
    return [...new Set(out.split('\n').map((line) => line.trim()).filter(Boolean))];
  } catch {
    return [];
  }
}

/**
 * The Microsoft Store build runs inside an AppContainer and does not expose
 * discord-ipc-N to ordinary processes, so Rich Presence cannot reach it.
 */
function isStoreBuild(paths) {
  return paths.some((p) => /WindowsApps/i.test(p));
}

export async function runDoctor(config) {
  console.log(`\n${bold(m('doctor.title'))}`);
  console.log(dim(`  ${process.platform}  node ${process.version}`));

  section('Discord processes');
  const paths = discordProcesses();
  if (paths.length === 0) {
    console.log(`  ${bad('none')}`);
  } else {
    for (const p of paths) console.log(`  ${p}`);
  }

  section('Named pipes (discord-ipc-*)');
  const pipes = discordPipes();
  if (pipes === null) {
    console.log(`  ${warn('could not enumerate \\\\.\\pipe\\')}`);
  } else if (pipes.length === 0) {
    console.log(`  ${bad('none')}`);
  } else {
    for (const p of pipes) console.log(`  ${good(p)}`);
  }

  section('Handshake');
  let connected = false;
  let rejectedId = false;
  const hasClientId = isValidClientId(config.discordClientId);

  if (!hasClientId) {
    console.log(`  ${warn('skipped: discordClientId is not set')}`);
  } else {
    const ipc = new DiscordIPC(config.discordClientId);
    try {
      const user = await ipc.connect();
      connected = true;
      console.log(`  ${good('ok')} — ${user?.username ?? '?'}`);
    } catch {
      // Discord answering at all means the pipe is fine and the id is the
      // problem, which is a very different fix from an unreachable socket.
      rejectedId = ipc.probe.some(({ error }) => /invalid client id/i.test(error));
      for (const { pipe, error } of ipc.probe) {
        console.log(`  ${dim(`discord-ipc-${pipe}`)} ${error}`);
      }
    }
    ipc.destroy();
  }

  section(m('doctor.verdict'));
  if (connected) {
    console.log(`  ${good(m('doctor.allGood'))}`);
  } else if (rejectedId) {
    console.log(`  ${bad(m('doctor.badClientId'))}`);
  } else if (!hasClientId) {
    console.log(`  ${warn(m('doctor.noClientId'))}`);
  } else if (paths.length === 0) {
    console.log(`  ${bad(m('doctor.notRunning'))}`);
  } else if (isStoreBuild(paths)) {
    console.log(`  ${bad(m('doctor.storeBuild'))}`);
  } else if (pipes && pipes.length === 0) {
    console.log(`  ${warn(m('doctor.noPipe'))}`);
  } else {
    console.log(`  ${warn(m('doctor.elevation'))}`);
  }
  console.log();
}
