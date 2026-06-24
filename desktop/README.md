# 🖥️ Français 3D — desktopová verze (Electron)

Spustí hru jako **samostatnou aplikaci v okně** (vlastní ikona, žádná lišta prohlížeče).

> ⚠️ Důležité: Electron používá stejné vykreslovací jádro jako Chrome, takže
> **sám o sobě sekání nevyřeší**. Plynulost řeší **nastavení grafiky v menu**
> (vlevo dole / ⚙️) — nech **Nízkou** kvalitu. Desktop verze je hlavně pro
> pocit „opravdové appky" a vlastní okno.

## Spuštění (vývojový režim — nejjednodušší)

Potřebuješ [Node.js](https://nodejs.org) (LTS). Pak v této složce:

```bash
npm install
npm start
```

Otevře se okno s hrou.

## Sestavení instalovatelné aplikace (.exe / .dmg / .AppImage)

```bash
npm install
npm run dist
```

Hotový instalátor najdeš ve složce `dist/`.
- Windows → `Francais3D Setup *.exe`
- macOS → `Francais3D-*.dmg`
- Linux → `Francais3D-*.AppImage`

## Bez Node.js? Použij spouštěč

V kořenové složce projektu jsou skripty, které otevřou hru jako okno aplikace
přes Chrome/Edge bez instalace čehokoli:
- **Windows:** dvojklik na `Spustit-hru-Windows.bat`
- **macOS:** dvojklik na `Spustit-hru-Mac.command`

(Stačí mít vedle nich soubor `francouzstina.html`.)
