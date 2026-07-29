import https from 'node:https';
import { readLockfile } from './lockfile.mjs';
import { m } from '../i18n.mjs';

// The Riot Client serves its local API over a self-signed certificate, so
// verification has to be off. Everything stays on 127.0.0.1 — nothing leaves
// the machine.
const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

class RiotClientClosedError extends Error {
  constructor() {
    super(m('riot.clientClosed'));
    this.name = 'RiotClientClosedError';
  }
}

function request(lock, endpoint) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        host: '127.0.0.1',
        port: lock.port,
        path: endpoint,
        method: 'GET',
        agent,
        headers: { Authorization: lock.auth, Accept: 'application/json' },
        timeout: 5000,
      },
      (res) => {
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            reject(new Error(`${endpoint} -> HTTP ${res.statusCode}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch {
            reject(new Error(`${endpoint} -> invalid JSON`));
          }
        });
      },
    );

    req.on('timeout', () => req.destroy(new Error(`${endpoint} -> timed out`)));
    req.on('error', reject);
    req.end();
  });
}

/** Our own PUUID, used to find ourselves in the presence list. */
export async function getSelfPuuid() {
  const lock = readLockfile();
  if (!lock) throw new RiotClientClosedError();
  const data = await request(lock, '/entitlements/v1/token');
  return data.subject;
}

/** Every presence in the Riot Client chat — VALORANT, LoL and TFT all land here. */
export async function getPresences() {
  const lock = readLockfile();
  if (!lock) throw new RiotClientClosedError();
  const data = await request(lock, '/chat/v4/presences');
  return Array.isArray(data.presences) ? data.presences : [];
}

export { RiotClientClosedError };
