import fs from 'node:fs';
import path from 'node:path';

/**
 * Riot Client acikken su dosyayi yazar:
 *   %LOCALAPPDATA%\Riot Games\Riot Client\Config\lockfile
 * Icerik: name:pid:port:password:protocol
 * Client kapaninca dosya silinir, yani varligi = "Riot Client acik".
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
