import https from 'node:https';
import { readLockfile } from './lockfile.mjs';

// Riot Client kendi kendine imzali bir sertifika kullaniyor, dogrulamayi kapatmak
// zorundayiz. Baglanti 127.0.0.1'e gittigi icin disariya hicbir sey sizmiyor.
const agent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

class RiotClientClosedError extends Error {
  constructor() {
    super('Riot Client kapali (lockfile yok).');
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
            reject(new Error(`${endpoint} -> gecersiz JSON`));
          }
        });
      },
    );

    req.on('timeout', () => req.destroy(new Error(`${endpoint} -> zaman asimi`)));
    req.on('error', reject);
    req.end();
  });
}

/** Riot hesabinin PUUID'si. Presence listesinde kendimizi bulmak icin gerekli. */
export async function getSelfPuuid() {
  const lock = readLockfile();
  if (!lock) throw new RiotClientClosedError();
  const data = await request(lock, '/entitlements/v1/token');
  return data.subject;
}

/** Riot Client chat'indeki tum presence'lar (VALORANT, LoL, TFT hepsi burada). */
export async function getPresences() {
  const lock = readLockfile();
  if (!lock) throw new RiotClientClosedError();
  const data = await request(lock, '/chat/v4/presences');
  return Array.isArray(data.presences) ? data.presences : [];
}

export { RiotClientClosedError };
