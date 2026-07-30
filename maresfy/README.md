# 🎧 MaresFy

Vizualizér hudby, DJ pult, beat sekvencer a přehrávač tvého Spotify — jedna instalovatelná
webová aplikace (PWA). Žádný backend, žádná databáze: všechno běží v prohlížeči a tokeny
zůstávají v tvém `localStorage`.

## Spuštění

**Na webu (GitHub Pages)** — v repu `Settings → Pages → Source: Deploy from a branch`,
vyber větev a `/ (root)`. Appka pak žije na
`https://<uživatel>.github.io/<repo>/maresfy/`.

**Lokálně** — Spotify vyžaduje `https` nebo loopback `127.0.0.1`, takže otevřít soubor
přes `file://` nestačí:

```bash
npx http-server . -p 8080     # z kořene repa
# → http://127.0.0.1:8080/maresfy/
```

## Připojení Spotify (jednou, ~1 minuta)

1. Otevři [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) a přihlas se.
2. **Create app** — název a popis libovolné.
3. **Redirect URIs**: vlož přesnou adresu, na které appku otevíráš — appka ti ji sama
   vypíše v panelu Spotify a umí ji zkopírovat. Např.
   `http://127.0.0.1:8080/maresfy/` nebo `https://tvuj-web/maresfy/`.
4. V **APIs used** zaškrtni **Web Playback SDK**, ulož.
5. Zkopíruj **Client ID** do pole v appce a klikni *Přihlásit se ke Spotify*.

**Přehrávání v prohlížeči vyžaduje Spotify Premium** — to je podmínka Spotify, ne appky.
S free účtem appka ukáže, co ti hraje na telefonu nebo v desktopové aplikaci, ale
nespustí přehrávání sama.

## Jak funguje vizualizace Spotify skladeb

Zvuk ze Spotify je chráněný (DRM) a prohlížeč z něj nepustí vzorky do Web Audio API —
spektrum se z něj tedy přímo číst nedá. MaresFy to řeší dvěma způsoby:

- **Rytmická simulace** (výchozí): spektrum se dopočítá z tempa a pozice ve skladbě.
  Tempo si naklepeš tlačítkem *Tap BPM* a appka si ho k dané skladbě zapamatuje.
- **Živý zvuk**: v záložce *Efekty* dej **Zvuk z karty**, sdílej kartu se Spotify
  a zaškrtni „Sdílet zvuk karty". Vizualizér pak kreslí skutečné spektrum.
  (V Chrome na počítači; jiné prohlížeče sdílení zvuku neumí.)

Vlastní syntezátor, decky a bicí jdou do analyzéru vždycky přímo — ty se vizualizují reálně.

## Ovládání

| Klávesa | Akce |
|---|---|
| `mezerník` | Spotify play/pauza (bez přihlášení syntezátor) |
| `S` | syntezátor start/stop |
| `1`–`5` | režim vizualizéru |
| `Q` / `W` | deck A / deck B |
| `7 8 9 0` | pady (kick, snare, hat, clap) |
| `z s x d c v g b h n j m` | klaviatura |
| `R` | náhodné barvy · `F` fullscreen · `Esc` ticho |

## Soubory

| Soubor | Co dělá |
|---|---|
| `index.html` | rozvržení aplikace |
| `styles.css` | vzhled, animace textu a efektů |
| `engine.js` | Web Audio engine, vizualizér, DJ pult, sekvencer |
| `spotify.js` | přihlášení (PKCE), Web API, Web Playback SDK |
| `sw.js`, `manifest.webmanifest` | PWA — instalace a offline režim |
