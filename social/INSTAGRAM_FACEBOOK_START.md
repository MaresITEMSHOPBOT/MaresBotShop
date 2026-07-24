# MARES — Instagram & Facebook: založení účtu + první příspěvek

> **Důležité:** Samotný účet si musíš založit ty osobně (vyžaduje tvůj e‑mail /
> telefon a odsouhlasení podmínek sítě). Níže máš přesný postup a **hotový obsah**,
> takže to zvládneš za pár minut — jen zkopíruješ texty a nahraješ obrázky z této složky.

---

## 1) INSTAGRAM

### Založení účtu (mobil, appka Instagram)
1. Instagram → **Vytvořit nový účet** → registrace přes e‑mail (klidně firemní).
2. **Uživatelské jméno (handle):** `mares.wear` nebo `wearmares` / `mares.official`
   *(vyber to, co je volné — drž ho stejné i na Facebooku).*
3. Nastavení → Účet → **Přepnout na profesionální účet** → kategorie **Oblečení (značka)**.
   Získáš statistiky, tlačítka a možnost propojit s Facebookem.
4. **Profilová fotka:** `social-profile.png`
5. **Jméno profilu:** `MARES` &nbsp;|&nbsp; podnadpis: `Sustainable streetwear`

### BIO (zkopíruj)
```
MARES 👁 OPEN YOUR EYES
Udržitelný streetwear, který nutí přemýšlet.
🌍 5 % z každého nákupu jde planetě
♻️ Zero waste · tisk jen na objednávku
Season 1 — už brzy. Otevři oči. 👇
```
Do pole **Web** dej odkaz na e‑shop (nebo Linktree, než web poběží).

### PRVNÍ PŘÍSPĚVEK
- **Obrázek:** `social-post1.png` (teaser oko) — nebo `social-post2.png` (mikina Venuše).
- **Popisek (zkopíruj):**
```
Něco se chystá. 👁

Až otevřeš oči, už je nezavřeš.
MARES · Season 1 — coming soon.

#openyoureyes #MARES #ComingSoon #Streetwear #UdrzitelnaModa #SustainableFashion #CzechBrand
```
- **Tip:** hned po zveřejnění dej do Stories `social-story.png` + sticker **Odpočet**
  s datem dropu a **🔔 „zapni si upozornění“**.

---

## 2) FACEBOOK

### Založení stránky (ne osobní profil — **Stránka**)
1. Facebook → **Stránky** → **Vytvořit novou stránku**.
2. **Název stránky:** `MARES`
3. **Kategorie:** `Značka oblečení` (Clothing brand)
4. **Profilová fotka:** `social-profile.png`
5. **Úvodní (cover) fotka:** `social-banner.png` *(je v poměru na šířku, sedne přesně)*
6. V nastavení propoj s Instagramem (Meta Business Suite) — budeš postovat na obě sítě naráz.

### O nás / Bio (zkopíruj)
```
MARES je český streetwear brand s jednoduchou myšlenkou: to, co nosíme,
vyjadřuje nejen kdo jsme, ale i jak se chováme k naší planetě.

M — Materials: recyklované a organické materiály
A — Adaptability: nadčasový design
R — Recycling: bazar pro nošené kusy
E — Environment: 5 % z každého nákupu jde planetě
S — Sustainability: zero waste, tiskneme jen na objednávku

Season 1 „#openyoureyes" už brzy. Otevři oči.
```

### PRVNÍ PŘÍSPĚVEK
- **Obrázek:** `social-fbpost1.png` (na šířku 1200×630 — ideální pro FB).
- **Popisek (zkopíruj):**
```
Něco se chystá. 👁

MARES — udržitelný streetwear, který nutí přemýšlet.
5 % z každého nákupu jde planetě. Zero waste. Tisk jen na objednávku.

Season 1 „#openyoureyes" startuje už brzy.
Sledujte nás, ať vám drop neuteče. 🔔
```

---

## 3) CO NAHRÁT ODKUD (soubory v této složce)
| Soubor | Kam |
|---|---|
| `social-profile.png` | profilovka IG + FB |
| `social-banner.png` | cover fotka FB stránky |
| `social-post1.png` | 1. IG příspěvek (teaser oko) |
| `social-post2.png` | IG/FB příspěvek s mikinou Venuše |
| `social-post3.png` | příspěvek „co znamená MARES" |
| `social-post4.png` | příspěvek planeta / mise |
| `social-fbpost1.png` | 1. FB příspěvek (na šířku) |
| `social-story.png` | IG/FB Story |

Kompletní plán publikování na celý teaser týden, další popisky a hashtagy
najdeš v `MARES_social_pack.md`.

---

## 4) AŽ POBĚŽÍ WEB
V souboru `mares-shop.html` je dole konstanta `SOCIAL` — doplň do ní odkazy na
svůj IG a FB profil a tlačítka „Follow on Instagram / Facebook" budou fungovat:
```js
const SOCIAL = {
    instagram: 'https://www.instagram.com/mares.wear/',
    facebook:  'https://www.facebook.com/mares'
};
```
