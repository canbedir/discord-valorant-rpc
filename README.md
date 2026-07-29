# valorant-tracker

Discord Rich Presence for VALORANT. No dependencies, no build step — just Node.js.

The point of it: **you decide which rank Discord shows.** Display the real one the
game reports, pin any rank you like, or drop the badge entirely.

*[Türkçe README](README.tr.md)*

```
VALORANT
Competitive — Ascent          [map splash]
9 - 5                         [rank badge: Radiant]
```

## How it works

While the Riot Client is running it writes its local API credentials to:

```
%LOCALAPPDATA%\Riot Games\Riot Client\Config\lockfile
```

Using the port and password from that file, we read our own session from
`/chat/v4/presences` on `127.0.0.1`. The `private` field it returns is base64'd
JSON containing the map, queue, score, party size and `competitiveTier`. That gets
written to Discord's IPC named pipe (`\\?\pipe\discord-ipc-0`) as Rich Presence.

Nothing is sent anywhere: the only remote request is a weekly call to
[valorant-api.com](https://valorant-api.com) for rank and map images. No Riot login,
no password, no touching game files.

## Setup

### 1. Node.js

Node 18 or newer. Check with `node --version`, install from
[nodejs.org](https://nodejs.org) if missing.

### 2. Create a Discord application

The **title** shown in Rich Presence is your Discord application's name. For it to
read "VALORANT", the application has to be named that.

1. [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application**
2. Name it `VALORANT`
3. Copy the **Application ID** from **General Information**

### 3. Configure

```bash
git clone https://github.com/canbedir/valorant-tracker
cd valorant-tracker
node src/index.mjs
```

The first run creates `config.json`. Paste your Application ID into
`discordClientId`.

### 4. Run

```bash
npm start          # normal
start.bat          # double-click on Windows
npm run demo       # try it without launching VALORANT
npm run ranks      # list valid rank names
```

## Rank settings

The `rank` block in `config.json`:

```json
"rank": {
  "mode": "real",
  "override": "Radiant",
  "overrideLeaderboardPosition": 0,
  "showLeaderboardPosition": false
}
```

| `mode` | Behaviour |
| --- | --- |
| `real` | Shows the rank the game actually reports |
| `override` | Shows whatever you put in `override` |
| `hide` | No rank badge at all |

`override` is forgiving — these are all the same tier:

```json
"override": 27
"override": "Radiant"
"override": "Immortal 3"
"override": "Ölümsüz 3"
```

Run `npm run ranks` for the full list.

When `overrideLeaderboardPosition` is above zero and `showLeaderboardPosition` is
on, the badge reads something like `Radiant #1`.

## Language

`language` controls both the Discord presence text and the console output:

```json
"language": "en"   // or "tr"
```

Adding another language means adding one entry to `MESSAGES` in
[`src/i18n.mjs`](src/i18n.mjs) and one to `STRINGS` / `QUEUES` in
[`src/data/strings.mjs`](src/data/strings.mjs). Missing keys fall back to English,
so a partial translation still runs.

## Other settings

```json
"pollIntervalMs": 3000,        // how often presence is read

"display": {
  "showScore": true,           // match score (9 - 5)
  "showParty": true,           // party size in menus
  "showAccountLevel": false,   // account level
  "showRankInMenus": true,     // rank badge in menus too
  "largeImage": "map",         // "map" | "card" | "rank"
  "buttons": []                // up to 2: [{ "label": "...", "url": "..." }]
},

"idle": {
  "showWhenGameClosed": false, // show something while VALORANT is closed
  "text": "VALORANT closed"
}
```

`largeImage`: `map` uses the map splash during a match and the player card in
menus. `card` always uses the player card, `rank` always uses the large rank icon.

## Images

By default (`assets.source: "url"`) images are sent as valorant-api.com links and
Discord proxies them — you don't upload anything to the Developer Portal.

If images don't render, switch to Discord's own asset system:

```bash
npm run download-assets
```

This fills `assets/downloaded/`. Each filename *is* the asset key
(`rank_27.png` → `rank_27`). Drag them into Developer Portal → **Rich Presence** →
**Art Assets**, then:

```json
"assets": { "source": "key", "keyPrefix": "" }
```

## Troubleshooting

**"No Discord IPC socket found"** — the Discord desktop app must be running. The
browser version does not expose Rich Presence.

**"Invalid Client ID"** — `discordClientId` is wrong. It's the **Application ID**
(17-20 digits), not a bot token.

**Nothing shows up** — Discord → Settings → **Activity Privacy** → "Share your
detected activities" must be on. Also, you can't see your own Rich Presence; check
from another account or look at a server's member list.

**Presence can't be read** — the Riot Client being open is enough to connect, but
`sessionLoopState` only appears while VALORANT is running. With only LoL open the
presence stays empty, which is expected.

**No rank badge** — `rank.mode` may be `hide`, or `display.showRankInMenus` is off
while you're in menus.

To see what's happening: `node src/index.mjs --debug`

## License

MIT
