# valorant-tracker

VALORANT için Discord Rich Presence. Bağımlılık yok, derleme adımı yok — sadece Node.js.

En belirgin özelliği: **Discord'da görünen rank'i sen seçiyorsun.** Oyunun bildirdiği
gerçek rank'i gösterebilir, sabit bir rank yazdırabilir ya da rozeti tamamen
kaldırabilirsin.

*[English README](README.md)*

```
VALORANT
Rekabetçi — Ascent          [harita görseli]
9 - 5                       [rank rozeti: Radiant]
```

## Nasıl çalışıyor

Riot Client açıkken şu dosyaya yerel API bilgilerini yazıyor:

```
%LOCALAPPDATA%\Riot Games\Riot Client\Config\lockfile
```

Buradaki port ve şifreyle `127.0.0.1` üzerindeki `/chat/v4/presences` ucundan kendi
oturum verimizi okuyoruz. Gelen `private` alanı base64'lü bir JSON: içinde harita,
kuyruk, skor, parti boyutu ve `competitiveTier` var. Bu veri Discord'un IPC named
pipe'ına (`\\?\pipe\discord-ipc-0`) Rich Presence olarak yazılıyor.

Hiçbir şey dışarı gitmiyor: tek uzak istek, rank/harita görsellerini almak için
haftada bir yapılan [valorant-api.com](https://valorant-api.com) çağrısı. Riot
hesabına giriş yapılmıyor, şifre istenmiyor, oyun dosyalarına dokunulmuyor.

## Kurulum

### 1. Node.js

Node 18 veya üstü gerekiyor. `node --version` ile kontrol et, yoksa
[nodejs.org](https://nodejs.org)'dan kur.

### 2. Discord uygulaması oluştur

Rich Presence'ta görünen **başlık**, Discord uygulamanın adıdır. "VALORANT" yazması
için uygulamayı o isimle oluşturman gerekiyor.

1. [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application**
2. İsim: `VALORANT`
3. **General Information** sekmesindeki **Application ID**'yi kopyala

### 3. Yapılandır

```bash
git clone https://github.com/canbedir/valorant-tracker
cd valorant-tracker
node src/index.mjs
```

İlk çalıştırmada `config.json` otomatik oluşur. İçindeki `discordClientId` alanına
kopyaladığın Application ID'yi yapıştır. Türkçe için `language` değerini `"tr"` yap.

### 4. Çalıştır

```bash
npm start          # normal
start.bat          # çift tıkla
npm run demo       # VALORANT açmadan dene
npm run ranks      # geçerli rank isimlerini listele
```

## Rank ayarı

`config.json` içindeki `rank` bloğu:

```json
"rank": {
  "mode": "override",
  "override": "Radiant",
  "overrideLeaderboardPosition": 0,
  "showLeaderboardPosition": false
}
```

| `mode` | Ne yapar |
| --- | --- |
| `real` | Oyunun bildirdiği gerçek rank'i gösterir |
| `override` | `override` alanına yazdığın rank'i gösterir |
| `hide` | Rank rozetini hiç göstermez |

`override` değeri esnek — hepsi aynı sonucu verir:

```json
"override": 27
"override": "Radiant"
"override": "Ölümsüz 3"
"override": "olumsuz 3"
```

Tam liste için `npm run ranks`.

`overrideLeaderboardPosition` sıfırdan büyükse ve `showLeaderboardPosition` açıksa
rozetin yanında `Radiant #1` gibi bir sıralama yazar.

## Dil

`language` hem Discord'da görünen metinleri hem de konsol çıktısını belirler:

```json
"language": "tr"   // veya "en"
```

Yeni bir dil eklemek için [`src/i18n.mjs`](src/i18n.mjs) içindeki `MESSAGES`'a ve
[`src/data/strings.mjs`](src/data/strings.mjs) içindeki `STRINGS` / `QUEUES`'a birer
giriş eklemek yeterli. Eksik anahtarlar İngilizce'ye düşer, yani yarım çeviri de
çalışır.

## Diğer ayarlar

```json
"pollIntervalMs": 3000,        // presence kaç ms'de bir okunsun

"display": {
  "showScore": true,           // maç skoru (9 - 5)
  "showParty": true,           // menüde parti boyutu
  "showAccountLevel": false,   // hesap seviyesi
  "showRankInMenus": true,     // menüdeyken de rank rozeti
  "largeImage": "map",         // "map" | "card" | "rank"
  "buttons": []                // en fazla 2: [{ "label": "...", "url": "..." }]
},

"idle": {
  "showWhenGameClosed": false, // VALORANT kapalıyken de bir şey göster
  "text": "VALORANT kapalı"
}
```

`largeImage` seçenekleri: `map` maç sırasında harita görselini, menüde oyuncu kartını
kullanır. `card` her zaman oyuncu kartı, `rank` her zaman büyük rank ikonu gösterir.

## Görseller

Varsayılan olarak (`assets.source: "url"`) görseller doğrudan valorant-api.com
bağlantısı olarak gönderilir ve Discord bunları kendi proxy'sine alır — Developer
Portal'a hiçbir şey yüklemen gerekmez.

Görseller görünmezse Discord'un kendi asset sistemine geçebilirsin:

```bash
npm run download-assets
```

`assets/downloaded/` klasörüne dosyaları indirir. Dosya adları doğrudan asset
anahtarıdır (`rank_27.png` → `rank_27`). Bunları Developer Portal → **Rich Presence**
→ **Art Assets** bölümüne sürükleyip bırak, sonra:

```json
"assets": { "source": "key", "keyPrefix": "" }
```

## Sorun giderme

**"Discord IPC soketi bulunamadı"** — Discord'un masaüstü uygulaması açık olmalı.
Tarayıcı sürümü Rich Presence sunmuyor.

**"Invalid Client ID"** — `discordClientId` yanlış. Bot token'ı değil, **Application
ID** olacak (17-20 haneli sayı).

**Durum hiç görünmüyor** — Discord → Ayarlar → **Etkinlik Gizliliği** → "Etkinlik
durumunu göster" açık olmalı. Ayrıca kendi profilinde Rich Presence'ı göremezsin;
başka bir hesaptan bak veya sunucudaki üye listesine bak.

**Presence okunamıyor** — Riot Client'ın açık olması bağlanmak için yeterli, ama
`sessionLoopState` yalnızca VALORANT çalışırken gelir. Sadece LoL açıksa durum boş
kalır (beklenen).

**Rank rozeti çıkmıyor** — `rank.mode` `hide` olabilir, ya da menüdeyken
`display.showRankInMenus` kapalıdır.

Ne olup bittiğini görmek için: `node src/index.mjs --debug`

## Lisans

MIT
