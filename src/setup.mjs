import readline from 'node:readline';
import { stdin, stdout } from 'node:process';
import { CONFIG_PATH, isValidClientId, updateConfig } from './config.mjs';
import { m, setLanguage, availableLanguages, localizeRankName } from './i18n.mjs';
import { COLORS } from './log.mjs';

const LANGUAGE_LABELS = { en: 'English', tr: 'Türkçe' };

const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const dim = (s) => `${COLORS.dim}${s}${COLORS.reset}`;
const accent = (s) => `${COLORS.cyan}${s}${COLORS.reset}`;

function heading(text) {
  const line = '─'.repeat(Math.max(20, text.length + 4));
  console.log(`\n${accent(line)}\n  ${bold(text)}\n${accent(line)}\n`);
}

function step(index, total, title) {
  console.log(`${dim(m('setup.step', index, total))}  ${bold(title)}`);
}

/**
 * Line reader used by every prompt below.
 *
 * Lines are pulled from readline's async iterator rather than through
 * rl.question(): with a non-TTY stdin, question() resolves once and then never
 * again, which would hang the wizard whenever input is piped in. The iterator
 * behaves the same whether stdin is a terminal or a pipe, so the wizard is
 * also scriptable.
 */
function createPrompter() {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
    terminal: Boolean(stdin.isTTY),
  });
  const lines = rl[Symbol.asyncIterator]();

  return {
    async line(prompt = `  ${accent('>')} `) {
      stdout.write(prompt);
      const { value, done } = await lines.next();
      if (done) throw new Error('Setup cancelled: no more input.');
      return String(value).trim();
    },
    close: () => rl.close(),
  };
}

/**
 * Asks until the answer maps to something valid. `parse` returns undefined to
 * reject the input, in which case `invalidMessage` is printed and we ask again.
 */
async function ask(prompter, { parse, invalidMessage }) {
  for (;;) {
    const value = parse(await prompter.line());
    if (value !== undefined) return value;
    console.log(`  ${COLORS.yellow}${invalidMessage}${COLORS.reset}`);
  }
}

async function askChoice(prompter, labels) {
  labels.forEach((label, i) => console.log(`     ${accent(`[${i + 1}]`)} ${label}`));
  console.log();

  return ask(prompter, {
    parse: (answer) => {
      const index = Number(answer);
      return Number.isInteger(index) && index >= 1 && index <= labels.length
        ? index - 1
        : undefined;
    },
    invalidMessage: m('setup.invalidChoice'),
  });
}

/**
 * The rank question, shared by the first-run wizard and the [r] hotkey.
 * Mutates config.rank in place and returns a human-readable summary.
 */
async function askRank(prompter, config, catalog) {
  const modes = ['real', 'override', 'hide'];
  const choice = await askChoice(prompter, [
    m('setup.rankReal'),
    m('setup.rankChoose'),
    m('setup.rankHide'),
  ]);
  config.rank.mode = modes[choice];

  if (config.rank.mode === 'override') {
    console.log(dim(`     ${m('setup.rankPrompt')}`));
    const tier = await ask(prompter, {
      parse: (answer) => {
        const resolved = catalog.resolveRank(answer, config.language);
        return resolved === null ? undefined : resolved;
      },
      invalidMessage: m('setup.rankInvalid'),
    });
    // Store the canonical English name so the file stays readable whatever
    // language it was typed in. valorant-api shouts its tier names, so this
    // goes through the English localizer to get "Immortal 3" over "IMMORTAL 3".
    config.rank.override = localizeRankName(catalog.rank(tier).name, 'en');
  }

  return describeRank(config, catalog);
}

/** Short label for the current rank setting, used in logs and prompts. */
export function describeRank(config, catalog) {
  if (config.rank.mode === 'hide') return m('setup.rankHide');
  if (config.rank.mode === 'real') return m('setup.rankReal');

  const tier = catalog.resolveRank(config.rank.override, config.language);
  const rank = tier === null ? null : catalog.rank(tier);
  return rank ? localizeRankName(rank.name, config.language) : String(config.rank.override);
}

/**
 * First-run wizard. Everything it asks could be typed into config.json by
 * hand, but nobody should have to read the README to get started.
 */
export async function runSetup(config, catalog) {
  const prompter = createPrompter();
  try {
    heading(`discord-valorant-rpc — ${m('setup.title')}`);
    console.log(`${dim(m('setup.intro'))}\n`);

    step(1, 3, m('setup.clientId'));
    console.log(dim(`     ${m('setup.clientIdHelp')}`));
    console.log();
    config.discordClientId = await ask(prompter, {
      parse: (answer) => (isValidClientId(answer) ? answer.trim() : undefined),
      invalidMessage: m('setup.clientIdInvalid'),
    });

    const languages = availableLanguages();
    console.log();
    step(2, 3, m('setup.language'));
    const langIndex = await askChoice(
      prompter,
      languages.map((code) => LANGUAGE_LABELS[code] ?? code),
    );
    config.language = languages[langIndex];
    setLanguage(config.language);

    console.log();
    step(3, 3, m('setup.rankTitle'));
    const summary = await askRank(prompter, config, catalog);

    updateConfig({
      discordClientId: config.discordClientId,
      language: config.language,
      rank: config.rank,
    });
    console.log(`\n  ${COLORS.green}${m('setup.saved', CONFIG_PATH)}${COLORS.reset}`);
    console.log(`  ${m('setup.rankNow', summary)}\n`);
  } finally {
    prompter.close();
  }
  return config;
}

/** Just the rank question, saved immediately. Used by the [r] hotkey. */
export async function changeRank(config, catalog) {
  const prompter = createPrompter();
  try {
    console.log(`\n  ${bold(m('setup.rankTitle'))}`);
    const summary = await askRank(prompter, config, catalog);
    updateConfig({ rank: config.rank });
    console.log(`  ${COLORS.green}${m('setup.rankNow', summary)}${COLORS.reset}\n`);
    return summary;
  } finally {
    prompter.close();
  }
}
