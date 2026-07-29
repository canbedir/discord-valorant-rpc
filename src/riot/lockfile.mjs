import fs from 'node:fs';
import path from 'node:path';

/**
 * While the Riot Client is running it writes its local API credentials to:
 *   %LOCALAPPDATA%\Riot Games\Riot Client\Config\lockfile
 * Format: name:pid:port:password:protocol
 *
 * The file is deleted on exit, so its presence doubles as "client is running".
 */
export const LOCKFILE_PATH = path.join(
  process.env.LOCALAPPDATA ?? '',
  'Riot Games',
  'Riot Client',
  'Config',
  'lockfile',
);

export function readLockfile() {
  let raw;
  try {
    raw = fs.readFileSync(LOCKFILE_PATH, 'utf8').trim();
  } catch {
    return null;
  }

  const parts = raw.split(':');
  if (parts.length < 5) return null;

  const [name, pid, port, password, protocol] = parts;
  return {
    name,
    pid: Number(pid),
    port: Number(port),
    password,
    protocol,
    auth: 'Basic ' + Buffer.from(`riot:${password}`).toString('base64'),
  };
}
