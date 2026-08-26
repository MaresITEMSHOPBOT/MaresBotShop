# 🎯 MARES DROP

Hra ovládaná chatem na [Kicku](https://kick.com/justmares). Divák napíše do chatu
`!hraj`, spadne mu kulička se jménem, proskáče mezi kolíky a podle jamky, do které
dopadne, dostane body. Vede se žebříček, jsou tam bonusová kola a jackpot.

Běží celá v prohlížeči – žádný server, žádný bot, žádné přihlašování.
Chat se čte přímo z Kicku přes WebSocket.

---

## Rychlý start

1. Otevři `game/index.html` v prohlížeči (stačí dvojklik na soubor).
2. Otevře se **Nastavení**. Vyplň **Chatroom ID** svého kanálu:
   - klikni na **Zjistit** – když to Kick z prohlížeče povolí, ID se doplní samo;
   - když ne, otevři v prohlížeči `https://kick.com/api/v2/channels/justmares`,
     najdi `"chatroom"` a zkopíruj jeho `"id"` (několikamístné číslo).
3. Klikni na **Připojit chat**. Vpravo nahoře se rozsvítí zelené „chat připojen“.
4. Hotovo – diváci můžou psát `!hraj`.

Chatroom ID se uloží, takže tohle děláš jen jednou.

> Než jdeš živě, zapni si v nastavení **Simulaci chatu** – hra se sama zaplní
> falešnými diváky a uvidíš, jak to vypadá v plném provozu.

---

## Nastavení v OBS

1. Přidej zdroj **Prohlížeč (Browser)**.
2. Zaškrtni **Místní soubor** a vyber `game/index.html`.
3. Rozlišení nastav na **1920 × 1080** (funguje i 1280 × 720).
4. Chceš-li hru jako overlay přes gameplay, zapni v nastavení hry
   **Průhledné pozadí** – zmizí pozadí stránky a zůstanou jen tmavé panely.

Zvuk hra generuje sama (cinkání o kolíky, fanfára u jackpotu). Vypneš ho
ikonou 🔊 vpravo nahoře.

---

## Příkazy do chatu

| Příkaz | Co dělá |
|---|---|
| `!hraj` | hodí kuličku *(taky `!drop`, `!play`, `!hod`, `!kulicka`)* |
| `!barva zelena` | změní barvu kuličky – jde i `!barva #ff00aa` |
| `!body` | ukáže na obrazovce kartu s tvými statistikami *(taky `!skore`)* |
| `!top` | zvýrazní žebříček |

Barvy: `cervena`, `modra`, `zelena`, `zluta`, `ruzova`, `fialova`, `oranzova`,
`tyrkysova`, `bila`, `cerna`, `zlata` (fungují i anglické názvy a hex kódy).

### Jen pro streamera a moderátory

| Příkaz | Co dělá |
|---|---|
| `!bonus` | spustí bonusové kolo (45 s, dvojnásobné body) |
| `!pauza` | pozastaví hru |
| `!start` | zase ji rozjede |
| `!vynuluj` | vynuluje žebříček – **jen broadcaster** |

### Klávesové zkratky (u počítače)

`D` zkušební hod · `B` bonusové kolo · `P` pauza · `S` nastavení · `Esc` zavřít

---

## Jak se počítají body

Jamek je 15. Uprostřed je jich nejvíc trefených, kraje skoro nikdo netrefí –
proto tam je jackpot.

```
1000  250  120  60  30  16  8  5  8  16  30  60  120  250  1000
```

Naměřeno na 60 000 hodech:

| jamka | 1000 | 250 | 120 | 60 | 30 | 16 | 8 | 5 |
|---|---|---|---|---|---|---|---|---|
| šance | 0,16 % | 2,4 % | 4,9 % | 6,4 % | 8,5 % | 10,0 % | 11,6 % | 12,0 % |

Průměrně tak vyjde **46 bodů na hod** a **jackpot padne zhruba jednou za 300 hodů** –
takže za stream párkrát, ale nikdy ne tak často, aby zevšedněl.

Během **bonusového kola** se všechno počítá dvojnásobně. Spouští se samo
každých 5 minut (interval se dá změnit, `0` ho vypne).

---

## Nastavení

| Volba | K čemu je |
|---|---|
| Kanál na Kicku | jen kvůli popisku a odkazu na API |
| Chatroom ID | povinné, bez něj se hra nepřipojí |
| Cooldown | kolik sekund musí divák počkat mezi hody (výchozí 20) |
| Bonus kolo po | za kolik minut se spustí bonus (`0` = vypnuto) |
| Průhledné pozadí | pro OBS overlay |
| Simulace chatu | test bez připojení – hru hrají falešní diváci |

Žebříček i nastavení se ukládají do prohlížeče (localStorage), takže po
restartu OBS o body nikdo nepřijde. Smažou se jen tlačítkem
**Vynulovat žebříček** nebo příkazem `!vynuluj`.

---

## Když něco nefunguje

**„odpojeno“ nebo „obnovuji za … s“ vpravo nahoře**
Špatné Chatroom ID, nebo výpadek sítě. Hra se sama zkouší připojovat dál,
takže stačí počkat. Zkontroluj ID podle návodu výš.

**Chat je připojen, ale nic se neděje**
Ověř, že diváci píší `!hraj` na *tvém* kanálu a že hra není pozastavená
(přes obrazovku by bylo velké „POZASTAVENO“). Taky si hlídej cooldown –
druhý hod do 20 sekund se ignoruje.

**Tlačítko „Zjistit“ nefunguje**
To je normální, Kick dotazy z prohlížeče často blokuje. Zadej ID ručně.

---

## Jak je to udělané

| Soubor | Co v něm je |
|---|---|
| `index.html` | struktura stránky |
| `style.css` | vzhled |
| `kick-chat.js` | čtení chatu z Kicku (Pusher WebSocket, bez knihoven) |
| `game.js` | fyzika kuliček, vykreslování, body, příkazy |

Chat jede přes veřejný Pusher kanál Kicku (`chatrooms.<ID>.v2`) – ten samý,
co používá web Kicku. Proto nepotřebuje token ani přihlášení; hra jen
poslouchá, sama do chatu nepíše.

Pro ladění je v konzoli prohlížeče k dispozici `MaresDrop`:

```js
MaresDrop.drop('Tester')                          // hodí kuličku
MaresDrop.chat({ text: '!hraj', user: 'Pepa' })    // simuluje zprávu z chatu
MaresDrop.bonus()                                  // spustí bonusové kolo
MaresDrop.simulate(20000)                          // spočítá rozložení výher
MaresDrop.phys                                     // konstanty fyziky, dají se měnit za běhu
```
