# Vedení směny

Aplikace pro vedoucího směny v prodejně: plán lidí dopředu, kdo co dělá, kolik přijelo palet,
checklisty na otevírání a zavírání a zápisník poznámek z tréninku.

Funguje bez internetu a bez serveru – je to obyčejná webová stránka, data se ukládají
do paměti prohlížeče (localStorage) v telefonu nebo počítači.

## Jak to spustit

**V telefonu (doporučeno):** otevři soubor `smena.html` z kořene repozitáře – je v něm sbalená
celá aplikace do jednoho souboru. Dá se poslat mailem, hodit na disk nebo otevřít z úložiště.
V prohlížeči pak `Přidat na plochu` a chová se to jako aplikace.

**Na počítači:** otevři `lidl/index.html` v prohlížeči.

Po úpravě zdrojáků se jednosouborová verze přegeneruje příkazem:

```
node lidl/build.js
```

## Co kde je

| Sekce | K čemu slouží |
| --- | --- |
| **Přehled** | Dnešní směna na jedné obrazovce – kdo je v práci, palety, checklist, zítřek, připomínky. |
| **Plán** | Týdenní plán směn, kopírování minulého týdne, tisk, přehled hodin proti úvazku. |
| **Den** | Detail dne: rozdělení lidí na úseky, dodávky, checklisty, tržba a předání směny. |
| **Tým** | Lidé, jejich pozice, úvazek, na co jsou zaškolení, poznámky. |
| **Zboží** | Statistika palet podle druhu a dne – z čísel poznáš, na které dny potřebuješ víc lidí. |
| **Checklist** | Šablona úkolů vedoucího směny (otevření / během směny / zavírání). Dá se libovolně upravit. |
| **Poznámky** | Zápisky z tréninku – kategorie, štítky, hledání, hvězdička pro důležité. |

## Dvě věci, které se vyplatí vědět

1. **Z poznámky se dá udělat úkol.** U každé poznámky je tlačítko ✅, které z ní vyrobí položku
   v checklistu. Tak z toho, co ti řeknou na tréninku, postupně vznikne tvůj vlastní systém.
2. **Data jsou jen v tomhle prohlížeči.** Když si smažeš data prohlížeče nebo přejdeš na jiný
   telefon, jsou pryč. V *Nastavení* je proto tlačítko **Stáhnout zálohu (JSON)** a **Načíst zálohu** –
   dělej si zálohu třeba jednou za měsíc.

## Struktura

```
lidl/
  index.html   – kostra stránky
  styles.css   – vzhled (světlý i tmavý režim, tisk)
  store.js     – datový model, číselníky, ukládání, výpočty hodin
  app.js       – vykreslování obrazovek, formuláře, akce
  build.js     – sloučí vše do ../smena.html
```

Do poznámek ani do jiných částí aplikace nepatří citlivé firemní údaje ani osobní data kolegů
nad rámec toho, co potřebuješ k plánování směny.
