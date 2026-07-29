import net from 'node:net';
import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import { log } from '../log.mjs';

/**
 * Discord masaustu istemcisi, Rich Presence icin yerel bir IPC soketi dinler.
 * Windows'ta bu bir named pipe: \\?\pipe\discord-ipc-N (N = 0..9).
 * Birden fazla Discord surumu (stable/PTB/canary) acikken numaralar kayar,
 * o yuzden sirayla hepsini deniyoruz.
 *
 * Cerceve formati: [int32LE opcode][int32LE payloadLength][utf8 JSON]
 */
const OP = {
  HANDSHAKE: 0,
  FRAME: 1,
  CLOSE: 2,
  PING: 3,
  PONG: 4,
};

const PIPE_COUNT = 10;

function pipePath(index) {
  return process.platform === 'win32'
    ? `\\\\?\\pipe\\discord-ipc-${index}`
    : `${process.env.XDG_RUNTIME_DIR ?? process.env.TMPDIR ?? '/tmp'}/discord-ipc-${index}`;
}

function encodeFrame(op, payload) {
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  const frame = Buffer.allocUnsafe(8 + body.length);
  frame.writeInt32LE(op, 0);
  frame.writeInt32LE(body.length, 4);
  body.copy(frame, 8);
  return frame;
}

export class DiscordIPC extends EventEmitter {
  constructor(clientId) {
    super();
    this.clientId = String(clientId);
    this.socket = null;
    this.ready = false;
    this.buffer = Buffer.alloc(0);
    this.pendingActivity = undefined;
    this.user = null;
  }

  /** Tum pipe'lari sirayla dener; ilk basarili baglantida READY bekler. */
  async connect() {
    for (let i = 0; i < PIPE_COUNT; i++) {
      try {
        await this.#tryPipe(i);
        return this.user;
      } catch (err) {
        log.debug(`discord-ipc-${i}: ${err.message}`);
      }
    }
    throw new Error('Discord IPC soketi bulunamadi. Discord masaustu uygulamasi acik mi?');
  }

  #tryPipe(index) {
    return new Promise((resolve, reject) => {
      // Onceki basarisiz denemeden yarim cerceve kalmis olabilir.
      this.buffer = Buffer.alloc(0);

      const socket = net.createConnection(pipePath(index));
      let settled = false;

      const fail = (err) => {
        if (settled) return;
        settled = true;
        socket.removeAllListeners();
        socket.destroy();
        reject(err);
      };

      const timer = setTimeout(() => fail(new Error('handshake zaman asimi')), 5000);

      socket.once('error', fail);
      socket.once('close', () => fail(new Error('soket kapandi')));

      socket.once('connect', () => {
        socket.write(encodeFrame(OP.HANDSHAKE, { v: 1, client_id: this.clientId }));
      });

      socket.on('data', (chunk) => {
        this.buffer = Buffer.concat([this.buffer, chunk]);

        for (const { op, data } of this.#drainFrames()) {
          if (op === OP.CLOSE) {
            fail(new Error(data?.message ?? 'Discord baglantiyi kapatti'));
            return;
          }
          if (op === OP.FRAME && data?.evt === 'READY') {
            if (settled) continue;
            settled = true;
            clearTimeout(timer);
            socket.removeListener('error', fail);
            socket.removeAllListeners('close');
            this.#adopt(socket, data.data?.user ?? null);
            resolve(this.user);
          }
        }
      });
    });
  }

  /** Handshake bitince soketi kalici hale getirir ve kopus dinleyicilerini kurar. */
  #adopt(socket, user) {
    this.socket = socket;
    this.ready = true;
    this.user = user;

    socket.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      for (const { op, data } of this.#drainFrames()) {
        if (op === OP.PING) {
          socket.write(encodeFrame(OP.PONG, data));
        } else if (op === OP.CLOSE) {
          this.#handleDisconnect(new Error(data?.message ?? 'Discord baglantiyi kapatti'));
        } else if (op === OP.FRAME) {
          if (data?.evt === 'ERROR') {
            log.warn(`Discord istegi reddetti: ${data.data?.message ?? 'bilinmeyen hata'}`);
          }
          log.debug('discord frame', JSON.stringify(data));
        }
      }
    });

    socket.on('error', (err) => this.#handleDisconnect(err));
    socket.on('close', () => this.#handleDisconnect(new Error('soket kapandi')));

    if (this.pendingActivity !== undefined) {
      this.setActivity(this.pendingActivity);
    }
  }

  #handleDisconnect(err) {
    if (!this.ready) return;
    this.ready = false;
    this.socket?.removeAllListeners();
    this.socket?.destroy();
    this.socket = null;
    this.buffer = Buffer.alloc(0);
    this.emit('disconnect', err);
  }

  /** Tampondaki tam cerceveleri cikarir; yarim cerceve tamponda kalir. */
  *#drainFrames() {
    while (this.buffer.length >= 8) {
      const op = this.buffer.readInt32LE(0);
      const length = this.buffer.readInt32LE(4);
      if (this.buffer.length < 8 + length) return;

      const body = this.buffer.subarray(8, 8 + length).toString('utf8');
      this.buffer = this.buffer.subarray(8 + length);

      let data = null;
      try {
        data = JSON.parse(body);
      } catch {
        log.debug('discord: JSON olmayan cerceve atlandi');
      }
      yield { op, data };
    }
  }

  /** activity = null gonderirsen Discord'daki durum tamamen silinir. */
  setActivity(activity) {
    this.pendingActivity = activity;
    if (!this.ready || !this.socket) return false;

    this.socket.write(
      encodeFrame(OP.FRAME, {
        cmd: 'SET_ACTIVITY',
        args: { pid: process.pid, activity: activity ?? null },
        nonce: randomUUID(),
      }),
    );
    return true;
  }

  clearActivity() {
    return this.setActivity(null);
  }

  destroy() {
    this.ready = false;
    this.removeAllListeners();
    this.socket?.removeAllListeners();
    this.socket?.destroy();
    this.socket = null;
  }
}

export { OP };
