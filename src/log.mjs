const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

let debugEnabled = false;

export function setDebug(on) {
  debugEnabled = on;
}

function stamp() {
  return new Date().toTimeString().slice(0, 8);
}

function write(color, tag, args) {
  console.log(`${COLORS.dim}${stamp()}${COLORS.reset} ${color}${tag}${COLORS.reset}`, ...args);
}

export const log = {
  info: (...a) => write(COLORS.cyan, '[info]', a),
  ok: (...a) => write(COLORS.green, '[ok]', a),
  warn: (...a) => write(COLORS.yellow, '[warn]', a),
  error: (...a) => write(COLORS.red, '[error]', a),
  discord: (...a) => write(COLORS.magenta, '[discord]', a),
  riot: (...a) => write(COLORS.blue, '[riot]', a),
  debug: (...a) => {
    if (debugEnabled) write(COLORS.dim, '[debug]', a);
  },
};

export { COLORS };
