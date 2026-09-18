# runclub-campaign

Comeback kampaň pro Instagram @runclubvse (18.–21. 9. 2026), vyvrcholení v pondělí 21. 9.

- `PLAN.md` — plán kampaně: timeline, hotové popisky, scénář stories, checklist.
- `assets/` — vygenerované vizuály (`01*`–`04*` posty 4:5, `st-*` stories 9:16) + logo
  s průhledným pozadím (`logo-lockup.png`, `logo-mark.png`).
- `render.py` — generátor vizuálů. Texty jsou v seznamu `SLIDES` na konci souboru.

## Přegenerování

```bash
python3 render.py                 # vše
python3 render.py 04b-misto       # jen jeden slide
```

Potřebuje Pillow a headless Chromium (cesta v konstantě `CHROME` v `render.py`).
Písma: Liberation Sans (≈ Helvetica) a Liberation Serif Italic pro akcenty.
