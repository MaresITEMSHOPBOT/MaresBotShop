const topicsData = [
    {
        id: "motivace",
        icon: "🎯",
        title: "Motivace",
        subtitle: "P3 - Motivace pracovníků",
        description: "Teorie motivace v pracovním prostředí",
        theory: `
            <h3>Co je motivace?</h3>
            <p><strong>Motivace</strong> je vnitřní proces, který vyvolává, usměrňuje a udržuje chování člověka směrem k určitému cíli. V pracovním kontextu jde o to, co podněcuje pracovníky k výkonu a setrvání v organizaci.</p>

            <div class="callout">
                <div class="callout-title">📌 Klíčové pojmy</div>
                <p><strong>Motiv</strong> = vnitřní pohnutka, <strong>Stimul</strong> = vnější podnět, <strong>Incentive</strong> = pobídka</p>
            </div>

            <h3>Teorie obsahu (CO motivuje)</h3>

            <h4>1. Maslowova hierarchie potřeb</h4>
            <p>Abraham Maslow definoval pyramidu potřeb od nejnižších po nejvyšší:</p>
            <ol>
                <li><strong>Fyziologické</strong> – jídlo, spánek, voda</li>
                <li><strong>Bezpečí</strong> – jistota, ochrana, stabilita</li>
                <li><strong>Sociální</strong> – sounáležitost, láska, přátelství</li>
                <li><strong>Uznání</strong> – respekt, status, sebeúcta</li>
                <li><strong>Seberealizace</strong> – naplnění potenciálu</li>
            </ol>
            <p>Vyšší potřeba se aktivuje, až když je uspokojena nižší.</p>

            <h4>2. Herzbergova dvoufaktorová teorie</h4>
            <p>Frederick Herzberg rozlišuje dva typy faktorů:</p>
            <ul>
                <li><strong>Hygienické faktory</strong> (extrinsické) – plat, pracovní podmínky, vztahy. Jejich absence způsobuje nespokojenost, ale jejich přítomnost nemotivuje.</li>
                <li><strong>Motivátory</strong> (intrinsické) – uznání, odpovědnost, růst, výkon. Skutečně motivují k vyššímu výkonu.</li>
            </ul>

            <h4>3. McGregor – Teorie X a Y</h4>
            <ul>
                <li><strong>Teorie X</strong> – lidé jsou líní, vyhýbají se práci, je potřeba kontroly a trestů</li>
                <li><strong>Teorie Y</strong> – lidé pracují rádi, jsou kreativní, dokáží se řídit sami</li>
            </ul>

            <h4>4. McClellandova teorie potřeb</h4>
            <p>David McClelland identifikoval tři získané potřeby:</p>
            <ul>
                <li><strong>nAch</strong> (need for Achievement) – potřeba výkonu</li>
                <li><strong>nAff</strong> (need for Affiliation) – potřeba sounáležitosti</li>
                <li><strong>nPow</strong> (need for Power) – potřeba moci</li>
            </ul>

            <h3>Teorie procesu (JAK motivace funguje)</h3>

            <h4>5. Vroomova teorie očekávání</h4>
            <p>Motivace = <strong>Valence × Expektance × Instrumentalita</strong></p>
            <ul>
                <li><strong>Expektance</strong> – víra, že úsilí povede k výkonu</li>
                <li><strong>Instrumentalita</strong> – víra, že výkon povede k odměně</li>
                <li><strong>Valence</strong> – hodnota odměny pro jedince</li>
            </ul>

            <h4>6. Adamsova teorie spravedlnosti (Equity Theory)</h4>
            <p>Lidé porovnávají poměr svých vkladů a výstupů s ostatními. Pokud cítí nespravedlnost, motivace klesá.</p>

            <h4>7. Lockova teorie cílů</h4>
            <p>SMART cíle – Specifické, Měřitelné, Akceptovatelné, Realistické, Termínované – vedou k vyššímu výkonu než vágní cíle.</p>

            <h4>8. Self-determination theory (Deci & Ryan)</h4>
            <p>Tři základní psychické potřeby:</p>
            <ul>
                <li><strong>Autonomie</strong> – mít kontrolu nad svým jednáním</li>
                <li><strong>Kompetence</strong> – cítit se schopným</li>
                <li><strong>Vztahovost</strong> – být v dobrých vztazích s druhými</li>
            </ul>

            <div class="callout tip">
                <div class="callout-title">💡 Praktické důsledky</div>
                <p>Vnitřní motivace (zájem, smysl, autonomie) je dlouhodobě silnější než vnější motivace (peníze, tresty). Příliš silné vnější odměny mohou dokonce snížit vnitřní motivaci (crowding-out efekt).</p>
            </div>

            <h3>📚 Učební tahák — jak si to zapamatovat</h3>

            <div class="callout tip">
                <div class="callout-title">🧠 Mnemoniky</div>
                <ul style="margin-top: 0.5rem;">
                    <li><strong>Maslowova pyramida zdola nahoru:</strong> <em>"Fyzikové Berou Stipendia U Snídaně"</em> → <strong>F</strong>yzio → <strong>B</strong>ezpečí → <strong>S</strong>ociální → <strong>U</strong>znání → <strong>S</strong>eberealizace</li>
                    <li><strong>Vroom (M = V × E × I):</strong> <em>"Mám Velkou Energii pro Inovace"</em> = Valence × Expektance × Instrumentalita. Když je <em>kterákoli</em> složka 0, motivace = 0!</li>
                    <li><strong>Self-Determination Theory:</strong> trio <em>"AKV"</em> = <strong>A</strong>utonomie + <strong>K</strong>ompetence + <strong>V</strong>ztahovost</li>
                    <li><strong>McClelland 3 potřeby:</strong> nAch / nAff / nPow → "<strong>V</strong>ýkon, <strong>V</strong>ztah, <strong>V</strong>láda"</li>
                    <li><strong>SMART cíle:</strong> <strong>S</strong>pecifický · <strong>M</strong>ěřitelný · <strong>A</strong>kceptovaný · <strong>R</strong>ealistický · <strong>T</strong>ermínovaný</li>
                    <li><strong>Herzberg trik:</strong> <em>"Hygiena tě nedělá zdravým, jen tě nedělá nemocným."</em> Hygienické faktory nemotivují — jen brání nespokojenosti.</li>
                    <li><strong>McGregor X vs. Y:</strong> X = bič a kontrola (lidi líní), Y = důvěra a autonomie (lidi tvořiví).</li>
                </ul>
            </div>

            <div class="callout">
                <div class="callout-title">🎨 Příběh, který si zapamatuješ</div>
                <p>Představ si <strong>Petra programátora</strong>: nejdřív se musí najíst (fyzio), pak chce smlouvu na dobu neurčitou (bezpečí), pak dobrý tým (sociální), pak povýšení (uznání) a nakonec chce psát kód, co změní svět (seberealizace). Když mu šéf přihodí 5 000 Kč k platu (<em>hygiena</em>), Petr se jen přestane stěžovat. Ale když ho šéf zavolá na strategickou poradu a řekne <em>"tvůj kód spasil produkt"</em> (<em>motivátor</em>), Petr září. To je <strong>Herzberg</strong>. Když mu pak za skvělou práci dají bonus 100 000 Kč, ale začnou kontrolovat každou hodinu — práce ho přestane bavit. To je <strong>crowding-out efekt</strong> a porušení <strong>autonomie</strong> z SDT.</p>
            </div>

            <div class="callout warning">
                <div class="callout-title">⚡ 60 sekund před zkouškou</div>
                <ul style="margin-top: 0.3rem;">
                    <li><strong>Teorie OBSAHU (CO motivuje):</strong> Maslow (5 úrovní), Alderfer ERG (Existence/Relatedness/Growth), Herzberg (hygiena vs motivátor), McGregor (X/Y), McClelland (nAch/nAff/nPow)</li>
                    <li><strong>Teorie PROCESU (JAK funguje):</strong> Vroom (V×E×I), Adams (spravedlnost = porovnávání vkladů/výstupů), Locke (SMART cíle), Skinner (operantní zpevňování), SDT Deci&amp;Ryan</li>
                    <li><strong>Job Characteristics Model (Hackman &amp; Oldham):</strong> 5 dimenzí (variety, identity, significance, autonomy, feedback) → 3 psychologické stavy → motivace + výkon</li>
                    <li><strong>Klíčové pojmy:</strong> intrinsická vs extrinsická, crowding-out, engagement, valence, equity, expectancy, job crafting</li>
                </ul>
            </div>

            <div class="callout tip">
                <div class="callout-title">🎬 Doporučená YouTube videa</div>
                <ul style="margin-top: 0.5rem;">
                    <li><a href="https://www.youtube.com/results?search_query=Dan+Pink+the+puzzle+of+motivation+TED" target="_blank" rel="noopener">Dan Pink — The puzzle of motivation (TED)</a> — proč peníze nemotivují kreativní práci</li>
                    <li><a href="https://www.youtube.com/results?search_query=Maslow+hierarchy+of+needs+animated" target="_blank" rel="noopener">Maslow's Hierarchy of Needs (animated)</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Herzberg+two+factor+theory+explained" target="_blank" rel="noopener">Herzberg Two-Factor Theory</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Self+Determination+Theory+Deci+Ryan" target="_blank" rel="noopener">Self-Determination Theory (Deci &amp; Ryan)</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Vroom+expectancy+theory" target="_blank" rel="noopener">Vroom Expectancy Theory</a></li>
                </ul>
            </div>
        `,
        abcd: [
            {
                q: "Kdo je autorem hierarchie potřeb?",
                options: ["Herzberg", "Maslow", "McGregor", "Vroom"],
                correct: 1,
                explanation: "Abraham Maslow vytvořil pyramidu pěti úrovní potřeb od fyziologických po seberealizaci."
            },
            {
                q: "Které faktory podle Herzberga skutečně motivují k vyššímu výkonu?",
                options: ["Hygienické faktory (plat, podmínky)", "Motivátory (uznání, odpovědnost)", "Sociální faktory", "Fyziologické potřeby"],
                correct: 1,
                explanation: "Motivátory jako uznání, odpovědnost a růst vedou ke spokojenosti a motivaci. Hygienické faktory pouze zabraňují nespokojenosti."
            },
            {
                q: "Vzorec Vroomovy teorie očekávání je:",
                options: ["Vklad × Výstup", "Valence × Expektance × Instrumentalita", "Potřeba × Cíl", "Stimul - Reakce"],
                correct: 1,
                explanation: "Vroomův vzorec: M = V × E × I. Pokud je kterákoli složka nulová, motivace je nulová."
            },
            {
                q: "Teorie X podle McGregora předpokládá, že:",
                options: ["Lidé jsou líní a potřebují kontrolu", "Lidé jsou kreativní a samostatní", "Lidé jsou motivováni jen penězi", "Lidé jsou ovládáni potřebou výkonu"],
                correct: 0,
                explanation: "Teorie X je negativní pohled - lidé se vyhýbají práci a potřebují přísnou kontrolu. Teorie Y je opakem."
            },
            {
                q: "Které z následujících NENÍ jednou z potřeb v McClellandově teorii?",
                options: ["Potřeba výkonu", "Potřeba moci", "Potřeba sounáležitosti", "Potřeba bezpečí"],
                correct: 3,
                explanation: "McClelland popisuje tři získané potřeby: nAch (výkon), nAff (sounáležitost) a nPow (moc). Bezpečí je z Maslowovy teorie."
            },
            {
                q: "Adamsova teorie spravedlnosti se zabývá především:",
                options: ["Hierarchií potřeb", "Porovnáváním vkladů a výstupů s ostatními", "Stanovením cílů", "Vnitřní motivací"],
                correct: 1,
                explanation: "Adams tvrdí, že lidé porovnávají poměr svých vkladů (úsilí, vzdělání) a výstupů (mzda, uznání) s referenčními osobami."
            },
            {
                q: "SMART cíle jsou součástí které teorie?",
                options: ["Maslowovy", "Lockovy teorie cílů", "Herzbergovy", "Vroomovy"],
                correct: 1,
                explanation: "Edwin Locke ukázal, že specifické a obtížné, ale dosažitelné cíle vedou k vyššímu výkonu."
            },
            {
                q: "Self-determination theory (Deci & Ryan) zdůrazňuje tři potřeby:",
                options: ["Výkon, moc, sounáležitost", "Autonomii, kompetenci, vztahovost", "Plat, uznání, růst", "Bezpečí, lásku, seberealizaci"],
                correct: 1,
                explanation: "SDT považuje autonomii, kompetenci a vztahovost (relatedness) za základní psychické potřeby pro vnitřní motivaci."
            },
            {
                q: "Crowding-out efekt znamená, že:",
                options: ["Peníze vždy motivují více než pochvala", "Příliš silná vnější odměna může snížit vnitřní motivaci", "Vnitřní motivace nikdy nestačí", "Skupinové cíle jsou lepší než individuální"],
                correct: 1,
                explanation: "Když je úkol vnitřně zajímavý a přidáme silnou vnější odměnu, lidé ztrácejí vnitřní zájem ('už to dělám jen kvůli penězům')."
            },
            {
                q: "Hygienické faktory v Herzbergově teorii:",
                options: ["Motivují k vyšším výkonům", "Zabraňují nespokojenosti, ale nemotivují", "Jsou důležitější než motivátory", "Jsou součástí seberealizace"],
                correct: 1,
                explanation: "Hygienické faktory (plat, podmínky, vztahy) musí být v pořádku, jinak vzniká nespokojenost. Samy o sobě ale nemotivují k výkonu."
            }
        ],
        open: [
            {
                q: "Vysvětlete rozdíl mezi vnitřní (intrinsickou) a vnější (extrinsickou) motivací. Uveďte příklad obou ve školním nebo pracovním prostředí.",
                sample: "Vnitřní motivace pochází z činnosti samotné - člověk dělá něco proto, že ho to baví, naplňuje nebo to považuje za smysluplné (např. student se učí, protože ho téma zajímá). Vnější motivace je řízena vnějšími faktory - odměnami nebo tresty (např. student se učí, aby dostal dobrou známku nebo se vyhnul vyhození ze školy). V dlouhodobém horizontu je vnitřní motivace silnější a vede k větší kreativitě a setrvalosti."
            },
            {
                q: "Porovnejte Maslowovu hierarchii potřeb s Herzbergovou dvoufaktorovou teorií. V čem se shodují a v čem liší?",
                sample: "Obě teorie patří mezi teorie obsahu motivace. Shoda: Herzbergovy motivátory zhruba odpovídají Maslowovým vyšším potřebám (uznání, seberealizace) a hygienické faktory nižším potřebám (bezpečí, fyziologické). Rozdíl: Maslow tvrdí hierarchické uspořádání - vyšší potřeba se aktivuje až po uspokojení nižší. Herzberg odděluje faktory na dvě nezávislé osy - opakem spokojenosti není nespokojenost, ale 'žádná spokojenost'. Herzberg také více cílí na pracovní prostředí."
            },
            {
                q: "Manažer chce zvýšit motivaci svého týmu. Navrhněte konkrétní opatření na základě teorie sebedeterminace (SDT).",
                sample: "Podle SDT by manažer měl posilovat tři potřeby: 1) AUTONOMIE - dát zaměstnancům možnost rozhodovat o tom, JAK úkoly splní, nabídnout flexibilní pracovní dobu, omezit mikromanagement. 2) KOMPETENCE - poskytovat školení, dávat výzvy přiměřené schopnostem, oceňovat pokrok, dávat konstruktivní zpětnou vazbu. 3) VZTAHOVOST - budovat týmovou kulturu, organizovat společné aktivity, zajistit podporu nadřízeného, dbát na fair zacházení."
            },
            {
                q: "Jak by mohl vedoucí použít Lockovu teorii cílů ke zlepšení výkonu zaměstnance?",
                sample: "Vedoucí by stanovil cíle podle principu SMART: specifické (ne 'pracuj lépe', ale 'získej 5 nových klientů'), měřitelné (kvantifikovatelné), akceptované zaměstnancem (aby se s nimi ztotožnil), realistické, ale výzvové (těžké, ale dosažitelné) a termínované. Důležitá je pravidelná zpětná vazba o postupu. Ideálně se zaměstnanec účastní stanovování cílů (participativní přístup), což zvyšuje commitment."
            },
            {
                q: "Co se stane, když zaměstnanec vnímá nespravedlnost podle Adamsovy teorie? Uveďte možné reakce.",
                sample: "Pokud zaměstnanec vidí, že kolega dostává za stejnou práci více (vyšší výstupy/vklady), může reagovat: 1) Snížit svůj vklad - méně se snažit, dělat jen nezbytné. 2) Žádat o navýšení odměny (vyšší výstup). 3) Kognitivně přehodnotit situaci - 'on má taky více odpovědnosti, takže to je fér'. 4) Změnit referenční osobu - porovnávat se s jiným kolegou. 5) Opustit organizaci - výpověď. 6) V krajním případě sabotáž. Manažer by měl dbát na transparentnost a procesní spravedlnost."
            }
        ]
    },
    {
        id: "pjfit",
        icon: "🧩",
        title: "P-J Fit",
        subtitle: "P2 - Person-Job Fit",
        description: "Soulad člověka a pracovní pozice",
        theory: `
            <h3>Co je P-J Fit?</h3>
            <p><strong>Person-Job Fit (P-J fit)</strong> označuje míru souladu mezi charakteristikami pracovníka (znalosti, schopnosti, osobnost) a požadavky a charakteristikami pracovní pozice. Vysoký P-J fit vede k vyššímu výkonu, spokojenosti a nižší fluktuaci.</p>

            <h3>Dva typy P-J Fit</h3>
            <ul>
                <li><strong>Demands-Abilities Fit</strong> – soulad mezi požadavky práce a schopnostmi pracovníka. Pracovník má potřebné znalosti, dovednosti pro výkon.</li>
                <li><strong>Needs-Supplies Fit</strong> – soulad mezi potřebami pracovníka a tím, co práce poskytuje (plat, status, smysl, vztahy).</li>
            </ul>

            <h3>KSAO model</h3>
            <p>Klíčový rámec pro popis požadavků pracovních míst:</p>
            <ul>
                <li><strong>K</strong>nowledge – znalosti (faktické a teoretické)</li>
                <li><strong>S</strong>kills – dovednosti (umění něco dělat)</li>
                <li><strong>A</strong>bilities – schopnosti (vrozený potenciál)</li>
                <li><strong>O</strong>ther characteristics – jiné charakteristiky (osobnost, hodnoty, motivace)</li>
            </ul>

            <h3>Person-Organization Fit (P-O Fit)</h3>
            <p>Širší koncept než P-J fit – soulad hodnot, kultury a cílů pracovníka s organizací. Vysoký P-O fit znamená, že pracovník "zapadá" do firemní kultury.</p>

            <h3>Schneiderův ASA framework</h3>
            <p>Benjamin Schneider popisuje cyklus, jak organizace získává podobné typy lidí:</p>
            <ol>
                <li><strong>A</strong>ttraction – organizaci přitahují podobní lidé</li>
                <li><strong>S</strong>election – vybíráni jsou ti, kteří zapadají</li>
                <li><strong>A</strong>ttrition – odcházejí ti, kteří nezapadli</li>
            </ol>
            <p>Důsledek: organizace mají sklon k homogenitě, což může bránit inovaci.</p>

            <h3>Job Analysis (analýza pracovního místa)</h3>
            <p>Systematický proces sběru informací o pracovním místě. Výstupem jsou:</p>
            <ul>
                <li><strong>Popis pracovního místa (Job Description)</strong> – co se dělá</li>
                <li><strong>Specifikace pracovního místa (Job Specification)</strong> – kdo to má dělat (KSAOs)</li>
            </ul>

            <h3>Metody měření P-J Fit</h3>
            <ul>
                <li><strong>Strukturované rozhovory</strong></li>
                <li><strong>Psychodiagnostické testy</strong> (osobnost, kognitivní schopnosti)</li>
                <li><strong>Assessment centra</strong></li>
                <li><strong>Pracovní vzorky (work samples)</strong></li>
                <li><strong>Situational Judgment Tests</strong></li>
            </ul>

            <div class="callout tip">
                <div class="callout-title">💡 Důsledky vysokého P-J fit</div>
                <ul style="margin-top: 0.5rem;">
                    <li>Vyšší pracovní výkon</li>
                    <li>Vyšší spokojenost a engagement</li>
                    <li>Nižší fluktuace</li>
                    <li>Méně stresu a vyhoření</li>
                    <li>Vyšší organizační commitment</li>
                </ul>
            </div>

            <h3>Misfit a jeho důsledky</h3>
            <p>Pokud je P-J fit nízký:</p>
            <ul>
                <li><strong>Overqualified</strong> – pracovník má více schopností než potřebuje → frustrace, nuda</li>
                <li><strong>Underqualified</strong> – pracovník nezvládá → stres, nízký výkon</li>
                <li><strong>Hodnotový nesoulad</strong> → pocit odcizení, demotivace</li>
            </ul>

            <h3>Big Five – osobnostní faktory</h3>
            <p>Často používané v personálním výběru:</p>
            <ul>
                <li><strong>O</strong>penness – otevřenost zkušenosti</li>
                <li><strong>C</strong>onscientiousness – svědomitost (nejlepší prediktor výkonu)</li>
                <li><strong>E</strong>xtraversion – extraverze</li>
                <li><strong>A</strong>greeableness – přívětivost</li>
                <li><strong>N</strong>euroticism – neuroticismus (negativně koreluje s výkonem)</li>
            </ul>

            <h3>📚 Učební tahák — jak si to zapamatovat</h3>

            <div class="callout tip">
                <div class="callout-title">🧠 Mnemoniky</div>
                <ul style="margin-top: 0.5rem;">
                    <li><strong>KSAO:</strong> <em>"Když Si Asi Objednáš"</em> → <strong>K</strong>nowledge · <strong>S</strong>kills · <strong>A</strong>bilities · <strong>O</strong>ther characteristics</li>
                    <li><strong>Big Five = OCEAN 🌊</strong> → <strong>O</strong>penness, <strong>C</strong>onscientiousness, <strong>E</strong>xtraversion, <strong>A</strong>greeableness, <strong>N</strong>euroticism. <em>"Plav v OCEÁNU osobnosti."</em></li>
                    <li><strong>Conscientiousness = král testů.</strong> Pokud si máš pamatovat jen jednu věc: <em>svědomitost je nejlepší univerzální prediktor výkonu</em>.</li>
                    <li><strong>ASA framework (Schneider):</strong> <em>"Approach, Stay, Adios"</em> → <strong>A</strong>ttraction → <strong>S</strong>election → <strong>A</strong>ttrition. Důsledek: organizace se časem stávají homogenní.</li>
                    <li><strong>Demands-Abilities vs Needs-Supplies:</strong> "Co práce <em>chce ode mě</em>" vs. "Co práce <em>dává mně</em>".</li>
                    <li><strong>P-J vs P-O fit:</strong> P-J = <em>"sedneš si na židli"</em> (úkol). P-O = <em>"sedneš si v open space"</em> (kultura). Bez P-O odejdeš do roka i ze skvělé pozice.</li>
                </ul>
            </div>

            <div class="callout">
                <div class="callout-title">🎨 Příběh, který si zapamatuješ</div>
                <p><strong>Anička</strong> nastupuje do startupu. Na pohovoru ukáže, že ovládá Figma a Notion (<em>Demands-Abilities fit ✓</em>), firma jí nabídne flexibilní home-office (<em>Needs-Supplies fit ✓</em>) — to je vysoký <strong>P-J fit</strong>. Po měsíci ale zjistí, že vedení slaví každý úspěch pivem v 17:00 a Anička je vegan-introvertka co preferuje ranní jógu (<em>P-O fit ✗</em>). Za půl roku odchází. <strong>Schneiderovo ASA</strong> v akci: byla "Attracted", "Selected", ale teď "Attrits". A startup si znovu vybere někoho podobného → kultura se zacementuje (riziko: ztráta diverzity a inovace).</p>
            </div>

            <div class="callout warning">
                <div class="callout-title">⚡ 60 sekund před zkouškou</div>
                <ul style="margin-top: 0.3rem;">
                    <li><strong>P-J Fit = 2 typy:</strong> Demands-Abilities (umím to?) + Needs-Supplies (uspokojí mě to?)</li>
                    <li><strong>P-O Fit:</strong> hodnoty/kultura → predikuje setrvání, ne výkon</li>
                    <li><strong>KSAO</strong> = popisuje, co práce vyžaduje · <strong>Job Analysis</strong> → <strong>Job Description</strong> (co) + <strong>Job Specification</strong> (kdo)</li>
                    <li><strong>Big Five (OCEAN):</strong> Conscientiousness = nejlepší prediktor výkonu napříč profesemi; Neuroticism = negativní prediktor</li>
                    <li><strong>Selekční metody dle validity:</strong> work sample &gt; structured interview &gt; cognitive ability test &gt; unstructured interview &gt; reference</li>
                    <li><strong>Misfit:</strong> overqualified (nuda) vs underqualified (stres); hodnotový misfit → odcizení</li>
                    <li><strong>ASA framework:</strong> firma se homogenizuje → riziko skupinového myšlení</li>
                </ul>
            </div>

            <div class="callout tip">
                <div class="callout-title">🎬 Doporučená YouTube videa</div>
                <ul style="margin-top: 0.5rem;">
                    <li><a href="https://www.youtube.com/results?search_query=Big+Five+personality+traits+explained" target="_blank" rel="noopener">Big Five Personality Traits explained</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Person+Job+fit+Person+Organization+fit" target="_blank" rel="noopener">Person-Job Fit vs Person-Organization Fit</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Schneider+ASA+framework+attraction+selection+attrition" target="_blank" rel="noopener">Schneider's ASA framework</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=job+analysis+KSAO+human+resources" target="_blank" rel="noopener">Job Analysis &amp; KSAO model</a></li>
                </ul>
            </div>
        `,
        abcd: [
            {
                q: "Co znamená zkratka KSAO?",
                options: ["Knowledge, Skills, Abilities, Other characteristics", "Key Strategic Action Objectives", "Knowledge, Strategy, Attitudes, Organization", "Kompetence, Schopnosti, Atributy, Osobnost"],
                correct: 0,
                explanation: "KSAO je standardní model pro popis požadavků pracovních míst: znalosti, dovednosti, schopnosti a jiné charakteristiky."
            },
            {
                q: "Demands-Abilities fit znamená:",
                options: ["Soulad mezi potřebami pracovníka a tím, co práce poskytuje", "Soulad mezi požadavky práce a schopnostmi pracovníka", "Soulad mezi hodnotami pracovníka a organizace", "Soulad mezi platem a výkonem"],
                correct: 1,
                explanation: "Demands-Abilities fit je o tom, zda pracovník umí to, co práce požaduje. Needs-Supplies fit je o naplnění potřeb."
            },
            {
                q: "ASA framework (Schneider) popisuje:",
                options: ["Cyklus Attraction-Selection-Attrition vedoucí k homogenitě organizace", "Proces hodnocení výkonu", "Strategii odměňování", "Tři typy adaptace nového zaměstnance"],
                correct: 0,
                explanation: "Schneider tvrdí, že organizace přitahují, vybírají a udržují podobné lidi, což vede k homogenitě (a často k omezení inovace)."
            },
            {
                q: "Která osobnostní vlastnost z Big Five je nejlepším prediktorem pracovního výkonu napříč profesemi?",
                options: ["Extraverze", "Neuroticismus", "Svědomitost", "Otevřenost"],
                correct: 2,
                explanation: "Conscientiousness (svědomitost) - organizovanost, odpovědnost, vytrvalost - je nejsilnějším prediktorem výkonu napříč všemi typy zaměstnání."
            },
            {
                q: "P-O Fit (Person-Organization Fit) se vztahuje k:",
                options: ["Souladu schopností s úkoly", "Souladu hodnot a kultury pracovníka a organizace", "Platovému ohodnocení", "Hierarchické pozici"],
                correct: 1,
                explanation: "P-O fit je o tom, zda pracovník 'zapadá' do firemní kultury, sdílí podobné hodnoty a cíle."
            },
            {
                q: "Job Specification popisuje:",
                options: ["Konkrétní úkoly a odpovědnosti", "KSAOs požadované od pracovníka", "Plat a benefity", "Strukturu organizace"],
                correct: 1,
                explanation: "Job Description popisuje, CO se dělá. Job Specification popisuje, KDO to má dělat - jaké znalosti, dovednosti, schopnosti."
            },
            {
                q: "Overqualified zaměstnanec typicky zažívá:",
                options: ["Stres z nezvládání úkolů", "Frustraci a nudu z nevyužitého potenciálu", "Vysokou motivaci", "Lepší vztahy s kolegy"],
                correct: 1,
                explanation: "Zaměstnanec s vyššími schopnostmi, než jeho pozice vyžaduje, často trpí nudou, frustrací a hledá si jinou práci."
            },
            {
                q: "Která metoda výběru má obecně nejvyšší prediktivní validitu pro budoucí výkon?",
                options: ["Volný (nestrukturovaný) pohovor", "Strukturovaný pohovor a pracovní vzorky", "Životopis", "Reference od bývalých zaměstnavatelů"],
                correct: 1,
                explanation: "Strukturované pohovory a work samples (pracovní vzorky) mají nejvyšší prediktivní validitu. Nestrukturované rozhovory jsou výrazně horší."
            },
            {
                q: "Které z následujících NENÍ součástí Big Five?",
                options: ["Extraverze", "Inteligence", "Neuroticismus", "Přívětivost"],
                correct: 1,
                explanation: "Big Five (OCEAN): Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism. Inteligence je samostatný kognitivní konstrukt."
            },
            {
                q: "Důsledkem dlouhodobě nízkého P-J fit obvykle NENÍ:",
                options: ["Vyšší fluktuace", "Vyšší výkon", "Stres a vyhoření", "Nižší spokojenost"],
                correct: 1,
                explanation: "Nízký P-J fit vede ke všem negativním důsledkům - kromě vyššího výkonu. Naopak výkon klesá."
            }
        ],
        open: [
            {
                q: "Vysvětlete rozdíl mezi P-J Fit a P-O Fit. Proč je důležité posuzovat oba při výběru zaměstnance?",
                sample: "P-J Fit (Person-Job) se zaměřuje na soulad mezi konkrétní prací a jednotlivcem - má potřebné dovednosti a naplní práce jeho potřeby? P-O Fit (Person-Organization) jde nad rámec konkrétní pozice a hodnotí, zda pracovník sdílí hodnoty, kulturu a cíle organizace. Při výběru je důležité hodnotit oba: vysoký P-J fit zajišťuje výkon, vysoký P-O fit zajišťuje setrvání a kulturní soulad. Někdo může být skvělý odborník (P-J), ale v dané kultuře nebude šťastný (nízký P-O) a brzy odejde."
            },
            {
                q: "Popište ASA cyklus a vysvětlete jeho výhody a nevýhody pro organizaci.",
                sample: "ASA = Attraction-Selection-Attrition. Organizace přitahuje (A) určité typy lidí svou kulturou a image, vybírá (S) ty, kteří zapadají, a ti, kteří nezapadnou, časem odejdou (A). VÝHODY: silná kultura, vysoký commitment, rychlejší adaptace, snadnější komunikace, sdílené hodnoty. NEVÝHODY: homogenita brání inovaci ('groupthink'), slepá místa, ztráta diverzity, rezistence vůči změnám, obtížnější přizpůsobení novým výzvám. Schneider doporučuje uvědomovat si tento jev a vědomě podporovat diverzitu."
            },
            {
                q: "Jaké metody byste použili pro posouzení P-J fit u kandidáta na pozici projektového manažera?",
                sample: "Kombinace metod: 1) STRUKTUROVANÝ POHOVOR - připravené otázky o minulých zkušenostech (behavioral interviewing, STAR metoda). 2) PSYCHODIAGNOSTIKA - test osobnosti (Big Five, zejména svědomitost a extraverze), kognitivní test. 3) ASSESSMENT CENTRUM - simulace projektové situace, řešení konfliktu v týmu. 4) PRACOVNÍ VZORKY - prezentace strategie, plánování fiktivního projektu. 5) REFERENČNÍ POHOVORY s bývalými kolegy. 6) SITUATIONAL JUDGMENT TEST - reakce na typické projektové situace. Kombinace má vyšší validitu než jediná metoda."
            },
            {
                q: "Co může organizace dělat, aby zvýšila P-J fit nových zaměstnanců?",
                sample: "1) KVALITNÍ JOB ANALYSIS - přesně definovat KSAOs a požadavky před vypsáním výběru. 2) REALISTIC JOB PREVIEW - kandidátům ukázat realisticky práci včetně nevýhod, aby si sami posoudili fit. 3) STRUKTUROVANÝ VÝBĚR - validní metody (assessment, testy, structured interview). 4) ONBOARDING - důkladné zaškolení a adaptace. 5) MENTORING - přiřazení mentora. 6) PERIODICKÉ HODNOCENÍ a 7) MOŽNOST INTERNÍCH PŘESUNŮ - když fit klesá, najít vhodnější pozici uvnitř firmy."
            }
        ]
    },
    {
        id: "zmena",
        icon: "🔄",
        title: "Organizační změna",
        subtitle: "OB - Organizační změna",
        description: "Řízení změn v organizacích",
        theory: `
            <h3>Co je organizační změna?</h3>
            <p><strong>Organizační změna</strong> je proces, kterým organizace transformuje svou strukturu, procesy, kulturu nebo technologii s cílem zlepšit výkonnost nebo se adaptovat na vnější či vnitřní podmínky.</p>

            <h3>Typy organizačních změn</h3>
            <ul>
                <li><strong>Inkrementální (postupná)</strong> – malé, kontinuální změny (kaizen)</li>
                <li><strong>Transformační (radikální)</strong> – zásadní změna celé organizace</li>
                <li><strong>Plánovaná</strong> – řízená a strategicky navržená</li>
                <li><strong>Neplánovaná</strong> – reakce na nečekané události (krize, pandemie)</li>
            </ul>

            <h3>Lewinův třístupňový model</h3>
            <p>Kurt Lewin (1947) - klasický model změny:</p>
            <ol>
                <li><strong>Unfreezing (rozmrazení)</strong> – uvědomění si potřeby změny, narušení status quo, motivace ke změně. Vytvoření pocitu naléhavosti.</li>
                <li><strong>Changing (změna)</strong> – samotná implementace nových postupů, struktur, chování. Učení se novým způsobům.</li>
                <li><strong>Refreezing (zamrazení)</strong> – stabilizace nového stavu, zakotvení změny do kultury a procesů, aby se nevrátil starý stav.</li>
            </ol>

            <h3>Lewinova analýza silových polí (Force-Field Analysis)</h3>
            <p>Změna nastává, když síly podporující změnu převažují nad silami brzdícími:</p>
            <ul>
                <li><strong>Driving forces</strong> – tlaky pro změnu (konkurence, technologie, nespokojenost)</li>
                <li><strong>Restraining forces</strong> – odpor (strach, zvyk, kultura)</li>
            </ul>

            <h3>Kotterův 8-stupňový model</h3>
            <p>John Kotter (1996) – nejznámější moderní model změny:</p>
            <ol>
                <li><strong>Vytvořit pocit naléhavosti</strong> – ukázat, proč je změna nutná</li>
                <li><strong>Sestavit vedoucí koalici</strong> – tým schopných lídrů</li>
                <li><strong>Vytvořit vizi a strategii</strong> – jasný obraz budoucího stavu</li>
                <li><strong>Komunikovat vizi</strong> – opakovaně a všemi kanály</li>
                <li><strong>Posílit zaměstnance k akci</strong> – odstranit překážky, empowerment</li>
                <li><strong>Vytvořit krátkodobá vítězství</strong> – rychlé výsledky pro důvěru</li>
                <li><strong>Konsolidovat zisky a vyvolat další změny</strong> – nezastavit se</li>
                <li><strong>Ukotvit nové přístupy v kultuře</strong> – aby se změna stala normou</li>
            </ol>

            <h3>Odpor proti změně</h3>
            <p>Důvody, proč lidé odolávají změně:</p>
            <ul>
                <li><strong>Strach z neznámého</strong></li>
                <li><strong>Strach ze ztráty</strong> (pozice, statusu, platu)</li>
                <li><strong>Pohodlí se status quo</strong></li>
                <li><strong>Nedůvěra</strong> v management</li>
                <li><strong>Nedostatek informací</strong></li>
                <li><strong>Skupinová setrvačnost</strong> (normy)</li>
                <li><strong>Hrozba odbornosti</strong> – nové dovednosti znehodnocují stávající</li>
            </ul>

            <h3>Kotter & Schlesinger – strategie pro překonání odporu</h3>
            <ul>
                <li><strong>Edukace a komunikace</strong> – vysvětlit důvody</li>
                <li><strong>Participace a zapojení</strong> – nechat zaměstnance spolurozhodovat</li>
                <li><strong>Podpora a usnadnění</strong> – školení, emoční podpora</li>
                <li><strong>Vyjednávání</strong> – nabídnout kompenzace</li>
                <li><strong>Manipulace a kooptace</strong> – (eticky problematické)</li>
                <li><strong>Donucení</strong> – jen v krajních případech</li>
            </ul>

            <h3>ADKAR model (Prosci)</h3>
            <p>Model individuální změny:</p>
            <ul>
                <li><strong>A</strong>wareness – uvědomění si potřeby změny</li>
                <li><strong>D</strong>esire – chuť se na změně podílet</li>
                <li><strong>K</strong>nowledge – vědět, jak se změnit</li>
                <li><strong>A</strong>bility – schopnost změnu realizovat</li>
                <li><strong>R</strong>einforcement – udržení změny</li>
            </ul>

            <div class="callout warning">
                <div class="callout-title">⚠️ Proč změny selhávají</div>
                <p>Podle Kottera 70 % organizačních změn selže. Hlavní důvody: nedostatečná naléhavost, slabá koalice, špatná komunikace vize, neodstraněné překážky, žádná rychlá vítězství, předčasné vyhlášení úspěchu, neukotvení v kultuře.</p>
            </div>

            <h3>📚 Učební tahák — jak si to zapamatovat</h3>

            <div class="callout tip">
                <div class="callout-title">🧠 Mnemoniky</div>
                <ul style="margin-top: 0.5rem;">
                    <li><strong>Lewin 3 fáze:</strong> <em>"ROZ-MRAZ-ROZ"</em> → <strong>Roz</strong>mrazení (unfreeze) → <strong>změ</strong>na (change) → <strong>za</strong>mrazení (refreeze). Bez refreezingu se lidé vrátí k starému!</li>
                    <li><strong>Kotter 8 kroků:</strong> "<strong>N</strong>aléhavost → <strong>K</strong>oalice → <strong>V</strong>ize → <strong>K</strong>omunikace → <strong>A</strong>kce (empowerment) → <strong>V</strong>ítězství (rychlá) → <strong>K</strong>onsolidace → <strong>U</strong>kotvení". Mnemonika: <em>"Naléhavá Koalice Vidí Krásnou Akci, Vyhrává a Konsoliduje Ukotvení"</em>.</li>
                    <li><strong>ADKAR (Prosci):</strong> <em>"Aďka"</em> → <strong>A</strong>wareness → <strong>D</strong>esire → <strong>K</strong>nowledge → <strong>A</strong>bility → <strong>R</strong>einforcement</li>
                    <li><strong>Bridges transition model:</strong> 3 psychologické fáze — <em>"Konec → Neutrální zóna → Nový začátek"</em>. Pozor: změna je událost, transition je proces v hlavě.</li>
                    <li><strong>5 fází přijetí změny (à la Kübler-Ross):</strong> <em>"Šok → Popření → Zlost → Smlouvání → Akceptace"</em></li>
                    <li><strong>Odpor ke změně</strong> = "<strong>S</strong>trach z neznáma + <strong>Z</strong>tráta jistoty + <strong>E</strong>konomické obavy + <strong>S</strong>ociální vazby". <em>"SZES"</em>.</li>
                </ul>
            </div>

            <div class="callout">
                <div class="callout-title">🎨 Příběh, který si zapamatuješ</div>
                <p>Představ si <strong>kostku ledu</strong>. Chceš ji přetvořit z krychle na kouli. Co uděláš? Nemůžeš ji tlačit — praskne. Musíš ji nejprve <strong>rozmrazit na vodu</strong> (vytvořit pocit, že "takhle to dál nejde" — krize, data, sdílení obav). Pak ji <strong>přelít do nové formy</strong> (school, podpora, paralelní běh starého a nového). A nakonec <strong>znovu zmrazit</strong> (nové KPI, odměny za nové chování, vypnutí starého systému). Kdo zapomene na refreezing, dostane kaluž — ne kouli. To je celý <strong>Lewin</strong>. <em>Kotter</em> je jen Lewin v 8 podrobnějších krocích.</p>
            </div>

            <div class="callout warning">
                <div class="callout-title">⚡ 60 sekund před zkouškou</div>
                <ul style="margin-top: 0.3rem;">
                    <li><strong>Modely změny:</strong> Lewin (3 fáze), Kotter (8 kroků), ADKAR (5 individuálních kroků), Bridges (3 psychologické fáze)</li>
                    <li><strong>Typy změny:</strong> evoluční (postupná, kaizen) vs revoluční (skoková, BPR — Business Process Reengineering)</li>
                    <li><strong>Driving vs restraining forces (force-field analysis, Lewin):</strong> identifikuj síly podporující a brzdící změnu</li>
                    <li><strong>Příčiny odporu:</strong> 4 osobní (strach, ztráta, návyk, ekon. nejistota) + 4 organizační (kultura, struktura, mocenské vztahy, omezené zdroje)</li>
                    <li><strong>Kotterovy chyby:</strong> 70 % změn selže = malá naléhavost, slabá koalice, slabá vize, špatná komunikace, neodstraněné překážky, žádné rychlé výhry, předčasná oslava, neukotvení v kultuře</li>
                    <li><strong>Role manažera změny:</strong> change sponsor, change agent, change champion, target</li>
                </ul>
            </div>

            <div class="callout tip">
                <div class="callout-title">🎬 Doporučená YouTube videa</div>
                <ul style="margin-top: 0.5rem;">
                    <li><a href="https://www.youtube.com/results?search_query=Kotter+8+step+process+change+management" target="_blank" rel="noopener">Kotter's 8-Step Process for Leading Change</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Lewin+change+model+unfreeze+change+refreeze" target="_blank" rel="noopener">Lewin's Change Management Model</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=ADKAR+model+change+management" target="_blank" rel="noopener">ADKAR Change Model (Prosci)</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=resistance+to+change+organizational+behavior" target="_blank" rel="noopener">Resistance to Change explained</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=William+Bridges+transition+model" target="_blank" rel="noopener">Bridges' Transition Model</a></li>
                </ul>
            </div>
        `,
        abcd: [
            {
                q: "Kdo je autorem třístupňového modelu změny (unfreeze-change-refreeze)?",
                options: ["John Kotter", "Kurt Lewin", "Edgar Schein", "Henry Mintzberg"],
                correct: 1,
                explanation: "Kurt Lewin formuloval klasický model změny v roce 1947: Unfreezing - Changing - Refreezing."
            },
            {
                q: "Kolik kroků má Kotterův model řízení změny?",
                options: ["3", "5", "8", "10"],
                correct: 2,
                explanation: "Kotter definoval 8 kroků - od vytvoření naléhavosti po ukotvení změny v kultuře."
            },
            {
                q: "Co je první krok Kotterova modelu?",
                options: ["Vytvořit vizi", "Vytvořit pocit naléhavosti", "Sestavit koalici", "Komunikovat změnu"],
                correct: 1,
                explanation: "Bez pocitu naléhavosti ('sense of urgency') lidé nevidí důvod ke změně. To je první a klíčový krok."
            },
            {
                q: "Force-field analysis (Lewinova analýza silových polí) zkoumá:",
                options: ["Síly podporující a brzdící změnu", "Hierarchii organizace", "Finanční toky", "Kompetence pracovníků"],
                correct: 0,
                explanation: "Lewin tvrdí, že status quo je dynamická rovnováha mezi driving forces (pro změnu) a restraining forces (proti změně)."
            },
            {
                q: "Co znamená 'refreezing' v Lewinově modelu?",
                options: ["Zrušení změny", "Stabilizace a ukotvení nového stavu", "Příprava na změnu", "Měření výsledků"],
                correct: 1,
                explanation: "Refreezing = zafixování změny tak, aby se nevrátil starý stav. Změna se musí stát novou normou."
            },
            {
                q: "Které z následujících NENÍ typický důvod odporu proti změně?",
                options: ["Strach ze ztráty", "Nedůvěra v management", "Pohodlí se status quo", "Vysoká motivace"],
                correct: 3,
                explanation: "Vysoká motivace naopak podporuje změnu. Strach, nedůvěra a pohodlí jsou typické zdroje odporu."
            },
            {
                q: "ADKAR model je:",
                options: ["Model individuální změny: Awareness, Desire, Knowledge, Ability, Reinforcement", "Model finančního řízení", "Model strategického plánování", "Typ organizační struktury"],
                correct: 0,
                explanation: "ADKAR od Prosci se zaměřuje na to, co potřebuje jednotlivec, aby změnu přijal a realizoval."
            },
            {
                q: "Která Kotter & Schlesingerova strategie překonávání odporu je nejvíce eticky problematická?",
                options: ["Edukace a komunikace", "Participace a zapojení", "Manipulace a kooptace", "Vyjednávání"],
                correct: 2,
                explanation: "Manipulace a kooptace (selektivní informace, formální zapojení odpůrce do procesu) je sporná - používá se v krajních případech."
            },
            {
                q: "Podle Kottera selhává cca:",
                options: ["10 % organizačních změn", "30 % organizačních změn", "70 % organizačních změn", "95 % organizačních změn"],
                correct: 2,
                explanation: "Kotter uvádí, že přibližně 70 % organizačních změn nedosáhne deklarovaných cílů."
            },
            {
                q: "'Quick wins' (rychlá vítězství) v Kotterově modelu slouží k:",
                options: ["Ukončení změny", "Vytvoření důvěry a momenta", "Měření finanční výkonnosti", "Vyjednávání s odbory"],
                correct: 1,
                explanation: "Krátkodobá vítězství dávají lidem důkaz, že změna funguje, a udržují motivaci pokračovat."
            }
        ],
        open: [
            {
                q: "Popište Lewinův třístupňový model změny a uveďte konkrétní příklad jeho použití při zavádění nového IT systému v organizaci.",
                sample: "Lewinův model: 1) UNFREEZING - rozmrazení: management komunikuje, proč starý systém nestačí (pomalý, chybový), ukáže data o problémech, vede workshopy s týmem. Lidé si uvědomí potřebu změny. 2) CHANGING - implementace: zavedení nového systému, intenzivní školení, podpora superuserů, paralelní běh starého a nového. Lidé se učí. 3) REFREEZING - ukotvení: starý systém vypnut, KPIs měřené v novém systému, hodnocení a odměňování navázáno na používání nového, manažeři aktivně chválí použití. Nový systém se stává normou."
            },
            {
                q: "Vyberte si 5 z 8 kroků Kotterova modelu a vysvětlete, proč jsou důležité.",
                sample: "1) NALÉHAVOST - bez ní lidé nevidí důvod opustit pohodlí, změna neproběhne. 2) KOALICE - jeden lídr nezvládne změnu sám, potřebuje tým s pravomocemi a důvěryhodností. 3) VIZE - lidé musí vědět, kam jdou, vize sjednocuje a inspiruje. 4) KOMUNIKACE - vize musí být sdílena opakovaně všemi kanály, jednorázová prezentace nestačí. 5) UKOTVENÍ V KULTUŘE - pokud změna není zakotvena v normách, hodnotách a procesech, lidé se vrátí k původním návykům."
            },
            {
                q: "Jak byste jako manažer řešili odpor zaměstnanců proti nové organizační struktuře?",
                sample: "Přístup podle Kotter & Schlesinger: 1) ANALÝZA - kdo odporuje a proč (strach ze ztráty pozice? nedůvěra? nedostatek informací?). 2) KOMUNIKACE - opakovaně vysvětlit důvody, vizi, dopady, otevřené Q&A sessions. 3) PARTICIPACE - zapojit odpůrce do plánování, dát jim vliv. 4) PODPORA - školení, koučink, emoční podpora, individuální rozhovory. 5) VYJEDNÁVÁNÍ - kde možné, nabídnout kompenzace (převedení, retention bonus). 6) PŘÍKLAD - manažer sám demonstruje novou strukturu. Donucení až v krajním případě, hrozí dlouhodobé poškození vztahů."
            },
            {
                q: "Porovnejte plánovanou a neplánovanou změnu. Jaké jsou výhody a nevýhody každé z nich?",
                sample: "PLÁNOVANÁ změna: strategicky navržená, postupná, řízená. VÝHODY: čas na přípravu, komunikaci, školení, řízení rizik, vyšší šance na úspěch. NEVÝHODY: pomalá, drahá, může minout okno příležitosti, byrokracie. NEPLÁNOVANÁ změna: reakce na nečekanou událost (krize, pandemie, ztráta klíčového klienta). VÝHODY: rychlá adaptace, mobilizace, energie, často odhalí inovace. NEVÝHODY: chaos, stres, chyby, vyhoření, nedostatek participace, často selhává v ukotvení. V praxi často kombinace - organizace plánuje obecnou strategii, ale musí umět reagovat."
            },
            {
                q: "Vysvětlete pojem 'change fatigue' (únava ze změn) a jak ho lze řešit.",
                sample: "Change fatigue je stav vyčerpání zaměstnanců, když organizace prochází mnoha změnami v krátké době nebo dlouho. Projevy: cynismus, pasivní odpor, snížený výkon, vyhoření, fluktuace. PŘÍČINY: příliš mnoho současných iniciativ, špatná komunikace, neukončené předchozí změny, žádné rychlé výsledky. ŘEŠENÍ: 1) Priorita a redukce - méně iniciativ paralelně. 2) Ukončit a oslavit dokončené změny. 3) Zapojit zaměstnance do rozhodování. 4) Komunikace 'proč'. 5) Realistický timeline. 6) Podpora well-beingu. 7) Vyhradit 'klidná období' bez větších změn."
            }
        ]
    },
    {
        id: "struktura",
        icon: "🏢",
        title: "Organizační struktura",
        subtitle: "OB - Organizační struktura",
        description: "Jak je organizace vnitřně uspořádána",
        theory: `
            <h3>Co je organizační struktura?</h3>
            <p><strong>Organizační struktura</strong> je formální systém úkolů, vztahů reportingu a koordinace, který určuje, jak jsou rozdělovány pravomoci, odpovědnosti a komunikace v organizaci.</p>

            <h3>Šest základních prvků struktury</h3>
            <ol>
                <li><strong>Specializace práce (work specialization)</strong> – do jaké míry jsou úkoly rozděleny</li>
                <li><strong>Departmentalizace</strong> – seskupování úkolů do oddělení</li>
                <li><strong>Hierarchie / linie autority</strong> – řetězec velení</li>
                <li><strong>Rozpětí kontroly (span of control)</strong> – počet podřízených na jednoho manažera</li>
                <li><strong>Centralizace / decentralizace</strong> – kde se přijímají rozhodnutí</li>
                <li><strong>Formalizace</strong> – do jaké míry jsou pravidla a procesy psané</li>
            </ol>

            <h3>Typy departmentalizace</h3>
            <ul>
                <li><strong>Funkční</strong> – podle funkcí (marketing, výroba, finance)</li>
                <li><strong>Produktová / divizní</strong> – podle produktů</li>
                <li><strong>Geografická</strong> – podle regionů</li>
                <li><strong>Procesní</strong> – podle procesů (vstup, výroba, výstup)</li>
                <li><strong>Zákaznická</strong> – podle typu zákazníka</li>
                <li><strong>Maticová</strong> – kombinace více os (funkce + projekt)</li>
            </ul>

            <h3>Mechanistická vs. organická struktura</h3>
            <table style="width:100%; border-collapse: collapse; margin: 1rem 0;">
                <tr style="border-bottom: 2px solid var(--border);">
                    <th style="text-align:left; padding: 0.5rem;">Mechanistická</th>
                    <th style="text-align:left; padding: 0.5rem;">Organická</th>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 0.5rem;">Vysoká specializace</td>
                    <td style="padding: 0.5rem;">Cross-funkční týmy</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 0.5rem;">Pevná hierarchie</td>
                    <td style="padding: 0.5rem;">Plochá struktura</td>
                </tr>
                <tr style="border-bottom: 1px solid var(--border);">
                    <td style="padding: 0.5rem;">Vysoká formalizace</td>
                    <td style="padding: 0.5rem;">Nízká formalizace</td>
                </tr>
                <tr>
                    <td style="padding: 0.5rem;">Centralizace</td>
                    <td style="padding: 0.5rem;">Decentralizace</td>
                </tr>
            </table>
            <p>Mechanistická je vhodná pro stabilní prostředí, organická pro dynamické a inovativní.</p>

            <h3>Mintzbergových 5 konfigurací</h3>
            <p>Henry Mintzberg identifikoval 5 základních typů organizací:</p>
            <ol>
                <li><strong>Jednoduchá struktura</strong> – malá firma, vlastník-manažer, vše rozhoduje sám (start-up, malá rodinná firma)</li>
                <li><strong>Strojová byrokracie</strong> – velká, standardizovaná (výrobní podnik, úřad)</li>
                <li><strong>Profesní byrokracie</strong> – odborníci, standardizované dovednosti (univerzita, nemocnice)</li>
                <li><strong>Divizní struktura</strong> – samostatné divize podle produktu/regionu (velké korporace)</li>
                <li><strong>Adhokracie</strong> – inovační, projektová, flexibilní (reklamní agentury, výzkumné týmy)</li>
            </ol>

            <h3>Mintzbergových 5 částí organizace</h3>
            <ul>
                <li><strong>Strategická špička</strong> – vrcholový management</li>
                <li><strong>Střední linie</strong> – střední manažeři</li>
                <li><strong>Operační jádro</strong> – pracovníci provádějící hlavní činnost</li>
                <li><strong>Technostruktura</strong> – analytici, plánovači</li>
                <li><strong>Podpůrný štáb</strong> – HR, IT, právní</li>
            </ul>

            <h3>Moderní formy organizační struktury</h3>
            <ul>
                <li><strong>Síťová organizace</strong> – outsourcing, malé jádro + síť dodavatelů</li>
                <li><strong>Virtuální organizace</strong> – dočasná aliance firem pro projekt</li>
                <li><strong>Boundaryless organization</strong> – minimalizace hranic mezi odděleními, hierarchií, lokalitami</li>
                <li><strong>Holokracie</strong> – samořídící kruhy bez tradiční hierarchie (Zappos)</li>
                <li><strong>Týmová struktura</strong> – základní jednotkou jsou týmy</li>
            </ul>

            <h3>Rozpětí kontroly</h3>
            <ul>
                <li><strong>Úzké rozpětí</strong> (3–5 podřízených) → vysoká hierarchie, kontrola, ale pomalé rozhodování</li>
                <li><strong>Široké rozpětí</strong> (10+ podřízených) → plochá struktura, autonomie, ale méně podpory</li>
            </ul>

            <h3>Centralizace vs. decentralizace</h3>
            <ul>
                <li><strong>Centralizace</strong> – rozhodnutí na vrcholu. Výhody: konzistence, kontrola. Nevýhody: pomalost, demotivace.</li>
                <li><strong>Decentralizace</strong> – rozhodnutí blíže výkonu. Výhody: rychlost, motivace. Nevýhody: nekonzistence, dublování.</li>
            </ul>

            <div class="callout tip">
                <div class="callout-title">💡 Klíčový vhled</div>
                <p>Neexistuje "nejlepší" struktura. Vhodná struktura závisí na strategii (Chandler: "Structure follows strategy"), velikosti, technologii a prostředí organizace (kontingenční přístup).</p>
            </div>

            <h3>📚 Učební tahák — jak si to zapamatovat</h3>

            <div class="callout tip">
                <div class="callout-title">🧠 Mnemoniky</div>
                <ul style="margin-top: 0.5rem;">
                    <li><strong>6 prvků designu struktury:</strong> Specializace · Departmentalizace · Hierarchie · Span of control · Centralizace · Formalizace. Mnemonika: <em>"Slon Drbe Hřbet S Cementem na Fasádě"</em> = SDHSCF.</li>
                    <li><strong>Mechanistic vs Organic:</strong> Mech = <em>stroj</em> (rigidní, pravidla, hierarchie). Org = <em>organismus</em> (flexibilní, týmy, autonomie). Autoři: Burns &amp; Stalker.</li>
                    <li><strong>Mintzberg 5 částí organizace:</strong> <em>"Vrchol-Střed-Jádro-Techno-Podpora"</em> = Strategic apex, Middle line, Operating core, Technostructure, Support staff (+ ideologie = 6. část).</li>
                    <li><strong>Mintzberg 5 konfigurací:</strong> Simple structure · Machine bureaucracy · Professional bureaucracy · Divisionalized · Adhocracy. Pomůcka: každá konfigurace má jednu dominantní část (např. machine = technostructure dominuje).</li>
                    <li><strong>Maticová struktura = 2 šéfové</strong> (funkční + projektový). Hlavní problém: konflikt priorit a kdo má poslední slovo.</li>
                    <li><strong>Chandler:</strong> <em>"Structure follows strategy"</em> — nejdřív strategie, pak struktura. Ne naopak.</li>
                    <li><strong>Span of control:</strong> úzké = vysoká struktura (mnoho úrovní); široké = plochá. Trend = ploché org. + empowerment.</li>
                </ul>
            </div>

            <div class="callout">
                <div class="callout-title">🎨 Příběh, který si zapamatuješ</div>
                <p>Porovnej tři firmy: <strong>(1) Czech Železárny</strong> z 80. let — 12 úrovní hierarchie, úkolovka, vše předepsáno, mistr kontroluje každý šroub = <em>mechanistická / machine bureaucracy</em>. <strong>(2) Klinika nemocnice</strong> — lékaři jsou autonomní profesionálové, hierarchie plochá, znalost &gt; pravidla = <em>professional bureaucracy</em>. <strong>(3) Spotify</strong> — squads (malé týmy), tribes (skupiny squadů), chapters (specialisté napříč), guilds (zájmové komunity) = <em>adhokracie / matrix-light</em>. Žádná není "lepší" — záleží na <strong>strategii a prostředí</strong>. Auto se nevyrobí na Spotify, software se neudělá ve Škodovce.</p>
            </div>

            <div class="callout warning">
                <div class="callout-title">⚡ 60 sekund před zkouškou</div>
                <ul style="margin-top: 0.3rem;">
                    <li><strong>6 prvků designu:</strong> specializace, departmentalizace, hierarchie, span of control, centralizace, formalizace</li>
                    <li><strong>Typy departmentalizace:</strong> funkční / divizní (produkt, geografie, zákazník) / maticová / týmová / síťová</li>
                    <li><strong>Mintzberg 5 částí:</strong> strategic apex, middle line, operating core, technostructure, support staff</li>
                    <li><strong>Mintzberg 5 konfigurací:</strong> simple, machine, professional, divisional, adhocracy</li>
                    <li><strong>Mechanistic vs Organic</strong> (Burns &amp; Stalker): rigidní vs flexibilní</li>
                    <li><strong>Kontingenční faktory:</strong> strategie (Chandler), velikost, technologie (Woodward), prostředí (Lawrence &amp; Lorsch)</li>
                    <li><strong>Trendy:</strong> ploché struktury, empowerment, virtuální organizace, holocracy</li>
                </ul>
            </div>

            <div class="callout tip">
                <div class="callout-title">🎬 Doporučená YouTube videa</div>
                <ul style="margin-top: 0.5rem;">
                    <li><a href="https://www.youtube.com/results?search_query=Mintzberg+organizational+structure+5+configurations" target="_blank" rel="noopener">Mintzberg's 5 Organizational Configurations</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=mechanistic+vs+organic+organizational+structure" target="_blank" rel="noopener">Mechanistic vs Organic Structures</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=matrix+organizational+structure+explained" target="_blank" rel="noopener">Matrix Organization Structure</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Spotify+engineering+culture+squad+tribe" target="_blank" rel="noopener">Spotify Engineering Culture (squads/tribes)</a></li>
                </ul>
            </div>
        `,
        abcd: [
            {
                q: "Span of control (rozpětí kontroly) označuje:",
                options: ["Velikost rozpočtu manažera", "Počet podřízených pod jedním manažerem", "Geografickou působnost firmy", "Hloubku hierarchie"],
                correct: 1,
                explanation: "Span of control je počet osob, které manažer přímo řídí. Úzké rozpětí → vysoká hierarchie, široké → plochá struktura."
            },
            {
                q: "Kdo je autorem 5 organizačních konfigurací?",
                options: ["Max Weber", "Henry Mintzberg", "Peter Drucker", "Frederick Taylor"],
                correct: 1,
                explanation: "Henry Mintzberg popsal 5 typů: jednoduchá struktura, strojová byrokracie, profesní byrokracie, divizní struktura, adhokracie."
            },
            {
                q: "Maticová organizační struktura je kombinací:",
                options: ["Funkční a divizní", "Centralizované a decentralizované", "Mechanistické a organické", "Formální a neformální"],
                correct: 0,
                explanation: "Maticová struktura kombinuje funkční a projektovou/produktovou osu - zaměstnanec má dva nadřízené."
            },
            {
                q: "Která konfigurace podle Mintzberga je typická pro univerzity a nemocnice?",
                options: ["Strojová byrokracie", "Adhokracie", "Profesní byrokracie", "Jednoduchá struktura"],
                correct: 2,
                explanation: "Profesní byrokracie spoléhá na standardizaci dovedností profesionálů (lékaři, profesoři), kteří mají velkou autonomii."
            },
            {
                q: "Mechanistická organizace se vyznačuje:",
                options: ["Plochou strukturou a flexibilitou", "Vysokou specializací, formalizací a centralizací", "Cross-funkčními týmy", "Nízkou hierarchií"],
                correct: 1,
                explanation: "Mechanistická struktura je rigidní, hierarchická, formalizovaná - vhodná pro stabilní prostředí a opakované úkoly."
            },
            {
                q: "Která forma je nejvhodnější pro inovativní a dynamické prostředí?",
                options: ["Strojová byrokracie", "Adhokracie / organická struktura", "Jednoduchá struktura", "Funkční struktura"],
                correct: 1,
                explanation: "Adhokracie (organická forma) je flexibilní, projektová, ideální pro inovace a rychle se měnící prostředí."
            },
            {
                q: "Slavný výrok 'Structure follows strategy' patří:",
                options: ["Mintzbergovi", "Druckerovi", "Chandlerovi", "Weberovi"],
                correct: 2,
                explanation: "Alfred Chandler ukázal, že organizační struktura by měla následovat strategii - nejprve strategie, pak struktura."
            },
            {
                q: "Které z následujících NENÍ z Mintzbergových 5 částí organizace?",
                options: ["Strategická špička", "Operační jádro", "Marketingové oddělení", "Technostruktura"],
                correct: 2,
                explanation: "Mintzbergových 5 částí: strategická špička, střední linie, operační jádro, technostruktura, podpůrný štáb. Marketing je funkce, ne 'část'."
            },
            {
                q: "Holokracie je:",
                options: ["Hierarchická struktura s pevnou autoritou", "Forma bez tradiční hierarchie, samořídící kruhy", "Vojenská struktura", "Funkční struktura"],
                correct: 1,
                explanation: "Holokracie nahrazuje hierarchii systémem samořídících 'kruhů' s definovanými rolemi. Známým příkladem byl Zappos."
            },
            {
                q: "Decentralizace rozhodování typicky vede k:",
                options: ["Vyšší konzistenci napříč organizací", "Rychlejšímu rozhodování a vyšší motivaci", "Vyšší kontrole vrcholu", "Vyšší byrokracii"],
                correct: 1,
                explanation: "Decentralizace přibližuje rozhodování k výkonu - rychlejší reakce, vyšší autonomie a motivace, ale riziko nekonzistence."
            }
        ],
        open: [
            {
                q: "Vysvětlete šest základních prvků organizační struktury a uveďte, jak se jejich nastavení liší v mechanistické a organické organizaci.",
                sample: "1) SPECIALIZACE - mechanistická: vysoká (úzce vymezené role), organická: nízká (cross-funkční). 2) DEPARTMENTALIZACE - mech: rigidní funkční, org: cross-funkční týmy. 3) HIERARCHIE - mech: hluboká, jasná, org: plochá. 4) SPAN OF CONTROL - mech: úzké rozpětí, org: široké. 5) CENTRALIZACE - mech: centralizovaná, org: decentralizovaná. 6) FORMALIZACE - mech: vysoká (mnoho pravidel a postupů), org: nízká (flexibilita). Mechanistická je vhodná pro stabilní, opakované činnosti (výroba), organická pro inovace a dynamiku (R&D, kreativní agentury)."
            },
            {
                q: "Popište Mintzbergových 5 organizačních konfigurací a uveďte u každé příklad organizace.",
                sample: "1) JEDNODUCHÁ STRUKTURA - malá firma, vše rozhoduje vlastník (start-up, rodinná pekárna). 2) STROJOVÁ BYROKRACIE - velká, standardizovaná, mnoho pravidel (úřad, výrobní podnik). 3) PROFESNÍ BYROKRACIE - odborníci s autonomií, standardizovány dovednosti (univerzita, nemocnice, advokátní kancelář). 4) DIVIZNÍ STRUKTURA - samostatné divize podle produktu/regionu (Coca-Cola, Procter&Gamble). 5) ADHOKRACIE - flexibilní, projektová, inovativní (reklamní agentura, NASA, výzkumný institut)."
            },
            {
                q: "Jaké výhody a nevýhody má maticová organizační struktura?",
                sample: "VÝHODY: 1) Efektivní využití zdrojů - sdílení expertů mezi projekty. 2) Flexibilita - rychlá adaptace na změny. 3) Komunikace napříč funkcemi. 4) Rozvoj zaměstnanců - vystavení různým projektům. 5) Vhodná pro komplexní prostředí. NEVÝHODY: 1) Dva nadřízení = konflikty priorit a autority. 2) Pomalé rozhodování (více schvalovatelů). 3) Stres pro zaměstnance. 4) Vyšší náklady na koordinaci. 5) Mocenské boje mezi funkčními a projektovými manažery. 6) Nejasná odpovědnost. Vhodná pro firmy s několika rovnocennými dimenzemi (např. produkt × region)."
            },
            {
                q: "Vysvětlete trade-off mezi úzkým a širokým rozpětím kontroly. Co ovlivňuje, které je vhodnější?",
                sample: "ÚZKÉ ROZPĚTÍ (3-5 podřízených): + těsná kontrola, podrobné koučování, rychlá zpětná vazba; - vysoké náklady (mnoho manažerů), pomalá komunikace přes hluboké patro hierarchie, mikromanagement, snížená autonomie. ŠIROKÉ ROZPĚTÍ (10+ podřízených): + nižší náklady, plochá struktura, rychlá komunikace, vyšší autonomie a empowerment; - manažer nezvládá poskytnout dostatečnou podporu, riziko chyb, méně koučování. CO OVLIVŇUJE VHODNOST: 1) Složitost úkolů - jednoduché = široké. 2) Kompetence pracovníků - vyšší kompetence = širší. 3) Geografická blízkost. 4) Podobnost úkolů. 5) Standardizace procesů. 6) Technologie (digitální nástroje umožňují širší rozpětí)."
            },
            {
                q: "Co znamená 'structure follows strategy' a jaké další faktory ovlivňují volbu organizační struktury?",
                sample: "Princip Alfreda Chandlera: nejprve organizace zvolí strategii (kam směřuje, jak konkuruje), pak teprve navrhne strukturu, která tuto strategii podpoří. Např. strategie diverzifikace vyžaduje divizní strukturu, strategie inovací organickou strukturu, strategie nákladového vůdcovství mechanistickou. DALŠÍ FAKTORY (kontingenční přístup): 1) VELIKOST - větší firmy potřebují formalizaci. 2) TECHNOLOGIE - rutinní výroba → mechanistická, jednorázová výroba → organická. 3) PROSTŘEDÍ - stabilní → mechanistická, dynamické → organická. 4) KULTURA - národní i organizační. 5) ŽIVOTNÍ CYKLUS - start-up vs. zralá firma. 6) LIDÉ - dovednosti a očekávání."
            }
        ]
    },
    {
        id: "kultura",
        icon: "🌍",
        title: "Organizační kultura",
        subtitle: "OB - Organizační kultura",
        description: "Hodnoty, normy a artefakty organizace",
        theory: `
            <h3>Co je organizační kultura?</h3>
            <p><strong>Organizační kultura</strong> je soubor sdílených hodnot, přesvědčení, norem a předpokladů, které ovlivňují, jak členové organizace myslí, cítí a jednají. Je to "způsob, jak se u nás věci dělají" (Deal & Kennedy).</p>

            <h3>Scheinovy 3 úrovně kultury</h3>
            <p>Edgar Schein – nejvlivnější model kultury:</p>
            <ol>
                <li><strong>Artefakty (Artifacts)</strong> – viditelné: oblečení, kanceláře, jazyk, rituály, příběhy, technologie. Snadno pozorovatelné, ale obtížně interpretovatelné.</li>
                <li><strong>Hodnoty a postoje (Espoused Values)</strong> – deklarované zásady, strategie, cíle. To, co organizace tvrdí, že je důležité (mise, vize, code of conduct).</li>
                <li><strong>Základní předpoklady (Basic Assumptions)</strong> – nejhlubší vrstva: nevědomé, samozřejmé pravdy o povaze reality, lidí, vztahů. Nejtěžší ke změně.</li>
            </ol>

            <div class="callout">
                <div class="callout-title">📌 Klíčový vhled</div>
                <p>Mezi deklarovanými hodnotami a základními předpoklady často existuje rozdíl. Firma může deklarovat "spolupráce", ale ve skutečnosti odměňovat individuální výkon.</p>
            </div>

            <h3>Funkce organizační kultury</h3>
            <ul>
                <li><strong>Identita</strong> – odlišuje organizaci od ostatních</li>
                <li><strong>Závazek</strong> – buduje commitment</li>
                <li><strong>Stabilita</strong> – sociální lepidlo</li>
                <li><strong>Smysl</strong> – pomáhá interpretovat události</li>
                <li><strong>Kontrola</strong> – neformální mechanismus regulace chování</li>
            </ul>

            <h3>Hofstedeho kulturní dimenze</h3>
            <p>Geert Hofstede zkoumal kulturní rozdíly v IBM napříč 50+ zeměmi. Identifikoval 6 dimenzí:</p>
            <ul>
                <li><strong>Mocenská vzdálenost (PDI)</strong> – akceptace nerovnoměrného rozdělení moci</li>
                <li><strong>Individualismus vs. kolektivismus (IDV)</strong></li>
                <li><strong>Maskulinita vs. femininita (MAS)</strong> – soutěživost vs. spolupráce</li>
                <li><strong>Vyhýbání se nejistotě (UAI)</strong> – snášenlivost vůči nejasnosti</li>
                <li><strong>Dlouhodobá orientace (LTO)</strong> – plánování vs. krátkodobost</li>
                <li><strong>Pobavení vs. sebekázeň (IVR)</strong> – Indulgence vs. Restraint</li>
            </ul>

            <h3>Competing Values Framework (Cameron & Quinn)</h3>
            <p>OCAI – Organizational Culture Assessment Instrument. Dvě osy:</p>
            <ul>
                <li>Flexibilita vs. stabilita</li>
                <li>Vnitřní vs. vnější zaměření</li>
            </ul>
            <p>Vznikají 4 typy kultur:</p>
            <ol>
                <li><strong>Klanová (Clan)</strong> – rodinná, spolupráce, mentoring (vnitřní + flexibilita)</li>
                <li><strong>Adhokracie</strong> – inovace, riziko, dynamika (vnější + flexibilita)</li>
                <li><strong>Tržní (Market)</strong> – výsledky, soutěž, výkon (vnější + stabilita)</li>
                <li><strong>Hierarchická</strong> – pravidla, kontrola, efektivita (vnitřní + stabilita)</li>
            </ol>

            <h3>Handyho 4 typy kultury</h3>
            <p>Charles Handy přiřadil kulturám řecké bohy:</p>
            <ul>
                <li><strong>Kultura moci (Zeus)</strong> – centralizovaná, malé firmy, charismatický vůdce</li>
                <li><strong>Kultura rolí (Apollón)</strong> – byrokracie, pravidla, jasné role</li>
                <li><strong>Kultura úkolů (Athéna)</strong> – matrixová, projektová, kompetence</li>
                <li><strong>Kultura osob (Dionýsos)</strong> – individualisté, profesní organizace</li>
            </ul>

            <h3>Silná vs. slabá kultura</h3>
            <ul>
                <li><strong>Silná kultura</strong> – hodnoty intenzivně sdíleny napříč organizací. Výhoda: konzistence, identita. Nevýhoda: rezistence ke změně, group-think.</li>
                <li><strong>Slabá kultura</strong> – hodnoty různě interpretovány. Výhoda: flexibilita, diverzita. Nevýhoda: chaos, nejistota.</li>
            </ul>

            <h3>Subkultury</h3>
            <p>Velké organizace mají subkultury – v různých odděleních, regionech, generacích. Mohou být:</p>
            <ul>
                <li><strong>Podpůrné (enhancing)</strong> – posilují dominantní kulturu</li>
                <li><strong>Ortogonální</strong> – nezávislé na dominantní</li>
                <li><strong>Kontrakulturní</strong> – přímo proti dominantní (riziko konfliktu)</li>
            </ul>

            <h3>Změna kultury</h3>
            <p>Kultura se mění obtížně. Klíčové mechanismy podle Scheina:</p>
            <ul>
                <li>Čemu lídři věnují pozornost, co měří, kontrolují</li>
                <li>Jak reagují na krize</li>
                <li>Co odměňují a koho povyšují</li>
                <li>Kritéria náboru a propouštění</li>
                <li>Příběhy a rituály</li>
                <li>Symboly a artefakty</li>
            </ul>

            <h3>📚 Učební tahák — jak si to zapamatovat</h3>

            <div class="callout tip">
                <div class="callout-title">🧠 Mnemoniky</div>
                <ul style="margin-top: 0.5rem;">
                    <li><strong>Schein 3 úrovně kultury:</strong> <em>"AHP"</em> = <strong>A</strong>rtefakty (vidět) → <strong>H</strong>odnoty deklarované (slyšet) → <strong>P</strong>ředpoklady (cítit). Jako <strong>ledovec</strong> — artefakty nad hladinou, předpoklady pod ní.</li>
                    <li><strong>Hofstede 6 dimenzí:</strong> <strong>PDI</strong> (Power Distance) · <strong>IDV</strong> (Individualism) · <strong>MAS</strong> (Masculinity) · <strong>UAI</strong> (Uncertainty Avoidance) · <strong>LTO</strong> (Long-Term Orientation) · <strong>IVR</strong> (Indulgence vs Restraint). Mnemonika: <em>"Pán Iva Má Úžasné Lyžařské Iniciály"</em>.</li>
                    <li><strong>Cameron-Quinn 4 typy (Competing Values Framework):</strong> <em>"CAMH"</em> = <strong>C</strong>lan (rodina) · <strong>A</strong>dhocracy (inovace) · <strong>M</strong>arket (konkurence) · <strong>H</strong>ierarchy (kontrola).</li>
                    <li><strong>Handy 4 typy kultury:</strong> Mocenská (pavouk) · Rolová (řecký chrám) · Úkolová (síť) · Osobnostní (galaxie hvězd).</li>
                    <li><strong>Drucker hláška:</strong> <em>"Culture eats strategy for breakfast."</em> — sebelepší strategie selže, když je proti kultuře.</li>
                    <li><strong>Kulturní gap:</strong> rozdíl mezi <em>deklarovanými hodnotami</em> a <em>reálnými předpoklady</em> = zdroj cynismu zaměstnanců.</li>
                </ul>
            </div>

            <div class="callout">
                <div class="callout-title">🎨 Příběh, který si zapamatuješ</div>
                <p>Přijdeš do nové firmy. Vidíš: open space, mikina + tenisky, foosball, slogany na zdi <em>"Stay hungry, stay foolish"</em> = <strong>artefakty</strong>. Kolega ti řekne: <em>"u nás se neformálně tyká, chyby jsou OK, učíme se rychle"</em> = <strong>deklarované hodnoty</strong>. Po měsíci ale uvidíš, že CEO vyhodil PM za jednu špatnou demo a šeptá se, kdo komu lízne paty = <strong>základní předpoklad: chyby tě stojí kariéru</strong>. Mezera mezi vrstvami 2 a 3 zabíjí důvěru — odtud Druckerovo <em>"culture eats strategy for breakfast"</em>. Pravá kultura je to, co se stane v krizi a kdo dostane povýšení.</p>
            </div>

            <div class="callout warning">
                <div class="callout-title">⚡ 60 sekund před zkouškou</div>
                <ul style="margin-top: 0.3rem;">
                    <li><strong>Definice (Schein):</strong> sdílené předpoklady, které se osvědčily a jsou předávány novým členům jako "správný způsob myšlení"</li>
                    <li><strong>Schein 3 úrovně:</strong> artefakty → deklarované hodnoty → základní předpoklady (=skutečná kultura)</li>
                    <li><strong>Hofstede 6D:</strong> PDI, IDV, MAS, UAI, LTO, IVR — kulturní rozdíly mezi zeměmi</li>
                    <li><strong>Cameron-Quinn 4 kvadranty (CVF):</strong> Clan, Adhocracy, Market, Hierarchy (2 osy: flexibilita vs stabilita; interní vs externí)</li>
                    <li><strong>Handy 4 typy:</strong> mocenská, rolová, úkolová, osobnostní</li>
                    <li><strong>Silná vs slabá kultura:</strong> silná = jasné sdílené hodnoty (+ jednota, − rigidita); slabá = vágní (+ flexibilita, − chaos)</li>
                    <li><strong>Subkultury, kontrakultura, kulturní střet při fúzích</strong></li>
                    <li><strong>Mechanismy přenosu (Schein):</strong> co lídři měří/kontrolují, reakce na krize, odměny, nábor a propouštění, příběhy a rituály</li>
                </ul>
            </div>

            <div class="callout tip">
                <div class="callout-title">🎬 Doporučená YouTube videa</div>
                <ul style="margin-top: 0.5rem;">
                    <li><a href="https://www.youtube.com/results?search_query=Edgar+Schein+three+levels+of+culture" target="_blank" rel="noopener">Edgar Schein — Three Levels of Culture</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Hofstede+cultural+dimensions+explained" target="_blank" rel="noopener">Hofstede's Cultural Dimensions explained</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Cameron+Quinn+Competing+Values+Framework" target="_blank" rel="noopener">Cameron-Quinn Competing Values Framework</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=culture+eats+strategy+for+breakfast+Drucker" target="_blank" rel="noopener">"Culture eats strategy for breakfast" — Drucker</a></li>
                </ul>
            </div>
        `,
        abcd: [
            {
                q: "Kdo je autorem modelu 3 úrovní organizační kultury (artefakty, hodnoty, předpoklady)?",
                options: ["Geert Hofstede", "Edgar Schein", "Cameron & Quinn", "Charles Handy"],
                correct: 1,
                explanation: "Edgar Schein definoval kulturu jako třívrstvý fenomén: viditelné artefakty, deklarované hodnoty a hluboké základní předpoklady."
            },
            {
                q: "Nejhlubší úroveň kultury podle Scheina jsou:",
                options: ["Artefakty", "Deklarované hodnoty", "Základní předpoklady", "Rituály"],
                correct: 2,
                explanation: "Základní předpoklady jsou nevědomé, samozřejmé pravdy. Nejtěžší jsou pozorovatelné, ale řídí chování."
            },
            {
                q: "Která Hofstedeho dimenze měří, jak lidé akceptují nerovnoměrné rozdělení moci?",
                options: ["Individualismus", "Mocenská vzdálenost", "Maskulinita", "Vyhýbání se nejistotě"],
                correct: 1,
                explanation: "Power Distance Index (PDI) - vysoký znamená, že lidé akceptují hierarchii, nízký preferuje rovnost."
            },
            {
                q: "Competing Values Framework (Cameron & Quinn) má kolik typů kultur?",
                options: ["3", "4", "5", "6"],
                correct: 1,
                explanation: "4 typy: klanová, adhokracie, tržní, hierarchická."
            },
            {
                q: "Tržní kultura (Market) v Competing Values Frameworku je:",
                options: ["Vnitřní orientace + flexibilita", "Vnitřní orientace + stabilita", "Vnější orientace + stabilita", "Vnější orientace + flexibilita"],
                correct: 2,
                explanation: "Tržní kultura se zaměřuje na výsledky a soutěž (vnější) s důrazem na řád a kontrolu (stabilita)."
            },
            {
                q: "Které z následujících je příklad ARTEFAKTU organizační kultury?",
                options: ["Sdílené přesvědčení o povaze pracovníků", "Mise firmy", "Dress code a uspořádání kanceláří", "Nevědomé předpoklady"],
                correct: 2,
                explanation: "Artefakty jsou viditelné projevy kultury - oděv, uspořádání prostor, jazyk, rituály, příběhy."
            },
            {
                q: "Handyho kultura rolí (Apollón) je typická pro:",
                options: ["Start-upy", "Byrokratické organizace s jasnými pravidly", "Projektové týmy", "Profesní sítě"],
                correct: 1,
                explanation: "Apollón = kultura rolí - byrokratická, hierarchická, s jasně definovanými rolemi a procedurami."
            },
            {
                q: "Silná organizační kultura má především výhodu:",
                options: ["Vyšší flexibility", "Vyšší konzistence a identity", "Vyšší diverzity", "Vyšší adaptability"],
                correct: 1,
                explanation: "Silná kultura = sdílené hodnoty napříč firmou. Výhoda: konzistence, identita, commitment. Nevýhoda: rigidita."
            },
            {
                q: "Subkultura, která je v přímém rozporu s dominantní kulturou, se nazývá:",
                options: ["Enhancing subkultura", "Ortogonální subkultura", "Kontrakultura", "Mikrokultura"],
                correct: 2,
                explanation: "Kontrakultura aktivně oponuje dominantní kultuře, což může vést k inovaci, ale i konfliktu."
            },
            {
                q: "Která Hofstedeho dimenze NEbyla původně součástí jeho prvního výzkumu (přidána později)?",
                options: ["Mocenská vzdálenost", "Individualismus vs. kolektivismus", "Dlouhodobá orientace", "Maskulinita vs. femininita"],
                correct: 2,
                explanation: "Dlouhodobá orientace (LTO) byla přidána po Hofstedeho výzkumu v Asii (Confucian dynamism). Indulgence vs. Restraint byla šestá dimenze."
            }
        ],
        open: [
            {
                q: "Vysvětlete Scheinův model 3 úrovní kultury. Proč je důležité rozlišovat mezi deklarovanými hodnotami a základními předpoklady?",
                sample: "Scheinovy 3 úrovně: 1) ARTEFAKTY - viditelné (oděv, kanceláře, jazyk, rituály). 2) DEKLAROVANÉ HODNOTY - co organizace tvrdí, že je důležité (mise, code of conduct). 3) ZÁKLADNÍ PŘEDPOKLADY - nevědomé, samozřejmé pravdy. Rozdíl mezi 2) a 3) je klíčový: firma může v marketingu hlásat 'inovace', ale ve skutečnosti trestat každou chybu - skutečným předpokladem je 'chyby jsou špatné'. Mezera mezi deklarovanými hodnotami a praktickou realitou je zdrojem cynismu zaměstnanců a důvod, proč 'culture eats strategy for breakfast' (Drucker)."
            },
            {
                q: "Popište 4 typy kultur v Competing Values Frameworku a uveďte typ organizace, kde bývá každá z nich silná.",
                sample: "1) KLANOVÁ - vnitřní + flexibilita: rodinná atmosféra, spolupráce, mentoring, rozvoj lidí. Příklad: rodinné firmy, malé poradenské firmy. 2) ADHOKRACIE - vnější + flexibilita: inovace, riziko, dynamika. Příklad: tech start-upy (Google, Tesla v ranných fázích). 3) TRŽNÍ - vnější + stabilita: výsledky, konkurence, výkon. Příklad: investiční banky, obchodní organizace, GE pod Welchem. 4) HIERARCHICKÁ - vnitřní + stabilita: pravidla, efektivita, kontrola, předvídatelnost. Příklad: státní správa, McDonald's, výrobní podniky. Většina firem má smíšenou kulturu s dominancí jednoho typu."
            },
            {
                q: "Jak mohou Hofstedeho dimenze pomoci nadnárodní firmě řídit pobočky v různých zemích?",
                sample: "Příklady aplikace: 1) MOCENSKÁ VZDÁLENOST - v zemích s vysokým PDI (Mexiko, Čína) očekávají zaměstnanci autoritu od šéfa, participativní řízení může selhat; v nízkém PDI (Skandinávie) je vhodný plochý styl. 2) INDIVIDUALISMUS - v USA odměňovat individuální výkon, v Japonsku týmový. 3) UAI - v Německu (vysoký) preferují strukturu, pravidla; v Singapuru (nízký) flexibilitu. 4) MASKULINITA - v USA (vysoká) ocenit soutěž; ve Švédsku (nízká) spolupráci a work-life balance. 5) LTO - v Číně dlouhodobé vztahy a plánování; v USA krátkodobé výsledky. Firma by měla přizpůsobit HR praktiky, leadership styl, motivační systém."
            },
            {
                q: "Co je 'silná' organizační kultura a jaké má výhody a rizika?",
                sample: "Silná kultura = hodnoty a normy jsou intenzivně sdíleny napříč organizací, všichni 'vědí, co se sluší a patří'. VÝHODY: 1) Konzistence chování a rozhodování. 2) Vysoký commitment a hrdost. 3) Identita a image. 4) Méně potřeby kontroly (kultura kontroluje sama). 5) Rychlejší adaptace nových (jasné normy). 6) Vyšší výkon - některé studie. RIZIKA: 1) Rezistence ke změnám - 'jsme přece úspěšní'. 2) Groupthink - potlačování odlišných názorů. 3) Nepřátelská k diverzitě - nezapadající odcházejí (ASA). 4) Slepá místa - neviditelnost vlastních předpokladů. 5) V krizi: pomalá reakce. PŘÍKLAD: Kodak měl silnou kulturu fotografie na film a propásl digitální revoluci."
            },
            {
                q: "Jak může nový CEO změnit organizační kulturu? Popište alespoň 4 mechanismy.",
                sample: "Podle Scheina mechanismy změny kultury: 1) ČEMU LÍDŘI VĚNUJÍ POZORNOST - nový CEO začne měřit a sledovat to, co je důležité podle nové kultury (např. spokojenost zákazníků místo jen tržeb). 2) REAKCE NA KRIZE - krize je 'kulturní moment'. Jak se CEO chová v těžké situaci, signalizuje skutečné hodnoty. 3) ODMĚŇOVÁNÍ A POVYŠOVÁNÍ - kdo dostane povýšení a bonusy, ukazuje, co se v kultuře oceňuje. 4) NÁBOR A PROPOUŠTĚNÍ - kdo je přijat a kdo musí odejít. 5) ROLE MODEL - osobní příklad CEO. 6) PŘÍBĚHY A RITUÁLY - nové firemní příběhy, oslavy. 7) SYMBOLY A ARTEFAKTY - kanceláře, dress code, název. POZN: změna kultury je dlouhodobý proces (často 5-10 let). Není možné ji nařídit, ale postupně formovat."
            }
        ]
    },
    {
        id: "skupiny",
        icon: "👥",
        title: "Skupiny a týmy",
        subtitle: "P7 - Skupiny a týmy",
        description: "Práce v týmech, skupinová dynamika",
        theory: `
            <h3>Skupina vs. tým</h3>
            <ul>
                <li><strong>Skupina (group)</strong> – 2+ lidí, kteří interagují, vzájemně se ovlivňují, ale výkon je SUMA individuálních výkonů.</li>
                <li><strong>Tým (team)</strong> – skupina s komplementárními dovednostmi, sdíleným cílem a vzájemnou odpovědností, kde výkon je VYŠŠÍ než suma individuálních (synergie).</li>
            </ul>

            <h3>Tuckmanovy fáze vývoje týmu</h3>
            <p>Bruce Tuckman (1965, doplněno 1977) – nejznámější model týmového vývoje:</p>
            <ol>
                <li><strong>Forming (formování)</strong> – seznamování, zdvořilost, nejistota, závislost na vedoucím</li>
                <li><strong>Storming (bouření)</strong> – konflikty, soutěž o role, kritika, nejtěžší fáze</li>
                <li><strong>Norming (normování)</strong> – ustanovení pravidel a norem, soudržnost roste</li>
                <li><strong>Performing (výkon)</strong> – tým funguje efektivně, autonomně, vysoký výkon</li>
                <li><strong>Adjourning (rozchod)</strong> – ukončení projektu, rozpuštění týmu (přidáno později)</li>
            </ol>

            <div class="callout">
                <div class="callout-title">📌 Klíčové</div>
                <p>Týmy občas regredují (např. když přijde nový člen, vrátí se do formingu). Storming je nutný – týmy, které ho přeskočí, mají skryté konflikty.</p>
            </div>

            <h3>Belbinovy týmové role</h3>
            <p>Meredith Belbin identifikoval 9 týmových rolí (3 kategorie):</p>

            <h4>Akční role:</h4>
            <ul>
                <li><strong>Formovač (Shaper)</strong> – dynamický, výzvy, tlačí tým vpřed</li>
                <li><strong>Realizátor (Implementer)</strong> – disciplinovaný, převede nápady do akce</li>
                <li><strong>Dotahovač (Completer-Finisher)</strong> – pečlivý, dotahuje detaily</li>
            </ul>

            <h4>Sociální role:</h4>
            <ul>
                <li><strong>Koordinátor (Coordinator)</strong> – zralý, deleguje, vede</li>
                <li><strong>Týmový pracovník (Teamworker)</strong> – kooperativní, diplomatický</li>
                <li><strong>Vyhledávač zdrojů (Resource Investigator)</strong> – kontakty, externí informace</li>
            </ul>

            <h4>Myšlenkové role:</h4>
            <ul>
                <li><strong>Inovátor (Plant)</strong> – kreativní, nové nápady</li>
                <li><strong>Vyhodnocovač (Monitor-Evaluator)</strong> – kritický, analytický</li>
                <li><strong>Specialista (Specialist)</strong> – hluboká odbornost</li>
            </ul>

            <p>Ideální tým má pokrytí všech rolí, ne nutně 9 lidí (jeden člověk může mít 2–3 role).</p>

            <h3>Groupthink (skupinové myšlení)</h3>
            <p>Irving Janis – tendence soudržných skupin přijímat shodný názor na úkor kritického myšlení. Symptomy:</p>
            <ul>
                <li>Iluze nezranitelnosti</li>
                <li>Kolektivní racionalizace</li>
                <li>Stereotypizace outsiderů</li>
                <li>Sebecenzura</li>
                <li>Iluze jednomyslnosti</li>
                <li>Tlak na nesouhlasící</li>
                <li>"Mind guards" – ochránci skupiny před nepříjemnými informacemi</li>
            </ul>
            <p><strong>Příklady:</strong> Invaze v Zátoce sviní, Challenger, Pearl Harbor.</p>

            <h3>Social loafing (sociální zahálení)</h3>
            <p>Tendence jednotlivců vynakládat menší úsilí v skupině než sami (Ringelmannův efekt). Příčiny:</p>
            <ul>
                <li>Difuze odpovědnosti</li>
                <li>Nemožnost identifikovat individuální přínos</li>
                <li>Pocit, že ostatní 'unesou'</li>
            </ul>
            <p><strong>Řešení:</strong> menší týmy, jasné individuální odpovědnosti, hodnocení individuálního přínosu.</p>

            <h3>Skupinová polarizace</h3>
            <p>Po skupinové diskusi se postoje členů STÁVAJÍ EXTRÉMNĚJŠÍMI než jejich průměrný individuální postoj před diskusí. Skupina nedělá vyvážená rozhodnutí - posouvá se k extrému (risky shift nebo cautious shift).</p>

            <h3>Charakteristiky efektivního týmu</h3>
            <ul>
                <li><strong>Jasný cíl a smysl</strong></li>
                <li><strong>Vhodná velikost</strong> (5-9 lidí - Amazon's two-pizza rule)</li>
                <li><strong>Komplementární dovednosti</strong></li>
                <li><strong>Sdílená odpovědnost</strong></li>
                <li><strong>Psychologické bezpečí</strong> (Amy Edmondson) - lze říct chybný názor bez strachu</li>
                <li><strong>Důvěra</strong></li>
                <li><strong>Konstruktivní konflikt</strong> (Lencioni - dysfunkce týmů)</li>
                <li><strong>Sdílené normy a procesy</strong></li>
            </ul>

            <h3>Lencioniho 5 dysfunkcí týmu</h3>
            <p>Patrick Lencioni - pyramida dysfunkcí:</p>
            <ol>
                <li><strong>Absence důvěry</strong> – členové se nesvěřují se slabostmi</li>
                <li><strong>Strach z konfliktu</strong> – falešná harmonie</li>
                <li><strong>Nedostatek závazku</strong> – nejasná rozhodnutí</li>
                <li><strong>Vyhýbání se odpovědnosti</strong></li>
                <li><strong>Nepozornost k výsledkům</strong> – jednotlivci nad týmem</li>
            </ol>

            <h3>Virtuální týmy</h3>
            <p>Týmy spolupracující přes technologie, často přes různé časové pásma. Výzvy:</p>
            <ul>
                <li>Komunikace bez non-verbálních signálů</li>
                <li>Budování důvěry</li>
                <li>Kulturní rozdíly</li>
                <li>Časové pásma</li>
                <li>Technické problémy</li>
            </ul>

            <h3>📚 Učební tahák — jak si to zapamatovat</h3>

            <div class="callout tip">
                <div class="callout-title">🧠 Mnemoniky</div>
                <ul style="margin-top: 0.5rem;">
                    <li><strong>Tuckman 5 fází vývoje týmu:</strong> <em>"Filip Si Nakoupí Potraviny A Auta"</em> = <strong>F</strong>orming → <strong>S</strong>torming → <strong>N</strong>orming → <strong>P</strong>erforming → <strong>A</strong>djourning. Bez stormingu se k performing nikdo nedostane!</li>
                    <li><strong>Belbin 9 týmových rolí ve 3 kategoriích:</strong>
                        <ul style="margin-top: 0.3rem;">
                            <li><em>Akční:</em> <strong>S</strong>haper (tlačí), <strong>I</strong>mplementer (realizuje), <strong>C</strong>ompleter-Finisher (dotahuje)</li>
                            <li><em>Sociální:</em> <strong>C</strong>oordinator (vede), <strong>T</strong>eamworker (harmonizuje), <strong>R</strong>esource Investigator (síťuje)</li>
                            <li><em>Mentální:</em> <strong>P</strong>lant (vymýšlí), <strong>M</strong>onitor-Evaluator (analyzuje), <strong>S</strong>pecialist (expert)</li>
                        </ul>
                    </li>
                    <li><strong>Groupthink (Janis) — 8 symptomů ve 3 skupinách:</strong> 1) iluze (neporazitelnosti, morálky), 2) tlak na uniformitu (sebecenzura, "strážci mysli"), 3) zavřené dveře (kolektivní racionalizace, stereotypy o "nepřátelích"). Klasické příklady: Bay of Pigs, Challenger.</li>
                    <li><strong>Ringelmann efekt = sociální lenochodství:</strong> <em>"Víc lidí v lanu, tím méně tahá každý."</em></li>
                    <li><strong>Skupinová polarizace:</strong> rozhodnutí skupiny je <em>extrémnější</em> než průměr členů — pozor v hodnotových debatách.</li>
                    <li><strong>5C efektivního týmu:</strong> <strong>C</strong>lear goals · <strong>C</strong>ommitment · <strong>C</strong>ompetence · <strong>C</strong>ommunication · <strong>C</strong>ollaboration.</li>
                </ul>
            </div>

            <div class="callout">
                <div class="callout-title">🎨 Příběh, který si zapamatuješ</div>
                <p>Představ si tým <strong>5 studentů</strong>, co dostane semestrálku. <strong>Forming:</strong> sejdou se v kavárně, jsou zdvořilí, "kdo co umí?". <strong>Storming:</strong> Petra chce vést, Honza s ní nesouhlasí, dva se hádají o termín. <strong>Norming:</strong> dohodnou se — schůzky čtvrtek 18:00, Petra koordinátor, použijí Notion. <strong>Performing:</strong> každý si udělá svou část, předávají si práci, dotáhnou prezentaci. <strong>Adjourning:</strong> odevzdají, dají si pivo, rozejdou se. Co kdyby přeskočili storming? Skrytá nespokojenost → pasivní agrese → "performing" jen na oko → odevzdají horší práci. Storming je nezbytný — <em>"konflikt se musí <strong>ven</strong>, nebo zničí tým <strong>uvnitř</strong>"</em>.</p>
            </div>

            <div class="callout warning">
                <div class="callout-title">⚡ 60 sekund před zkouškou</div>
                <ul style="margin-top: 0.3rem;">
                    <li><strong>Skupina vs Tým:</strong> tým má společný cíl, doplňující se role, vzájemnou odpovědnost; skupina sdílí jen info</li>
                    <li><strong>Tuckman 5 fází:</strong> Forming → Storming → Norming → Performing → Adjourning</li>
                    <li><strong>Belbin 9 rolí:</strong> 3 akční + 3 sociální + 3 mentální</li>
                    <li><strong>Strukturní prvky skupiny:</strong> role · normy · status · velikost · soudržnost (koheze)</li>
                    <li><strong>Groupthink (Janis):</strong> sklon ke konsenzu na úkor kvality rozhodnutí — 8 symptomů</li>
                    <li><strong>Sociální fenomény:</strong> social loafing (Ringelmann), social facilitation (Zajonc), skupinová polarizace, deindividuace</li>
                    <li><strong>Virtuální týmy:</strong> chybí non-verbální, důvěra, kulturní rozdíly, časové pásma — řešení: pravidelná videa, jasná pravidla, kick-off naživo</li>
                    <li><strong>Konflikt v týmu:</strong> task conflict (užitečný) vs relationship conflict (škodlivý)</li>
                </ul>
            </div>

            <div class="callout tip">
                <div class="callout-title">🎬 Doporučená YouTube videa</div>
                <ul style="margin-top: 0.5rem;">
                    <li><a href="https://www.youtube.com/results?search_query=Tuckman+stages+of+group+development" target="_blank" rel="noopener">Tuckman — Stages of Group Development</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Belbin+team+roles+explained" target="_blank" rel="noopener">Belbin Team Roles explained</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Janis+groupthink+symptoms" target="_blank" rel="noopener">Groupthink (Irving Janis)</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Patrick+Lencioni+five+dysfunctions+of+a+team" target="_blank" rel="noopener">Patrick Lencioni — 5 Dysfunctions of a Team</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Google+Project+Aristotle+psychological+safety" target="_blank" rel="noopener">Google Project Aristotle — psychological safety</a></li>
                </ul>
            </div>
        `,
        abcd: [
            {
                q: "Kolik fází má klasický Tuckmanův model vývoje týmu?",
                options: ["3", "4 (případně 5 s adjourning)", "6", "8"],
                correct: 1,
                explanation: "Tuckman původně popsal 4 fáze (forming, storming, norming, performing), v roce 1977 přidal adjourning."
            },
            {
                q: "Která fáze podle Tuckmana je charakterizována konflikty a soutěží o role?",
                options: ["Forming", "Storming", "Norming", "Performing"],
                correct: 1,
                explanation: "Storming je 'bouřlivá' fáze plná konfliktů a vyjednávání o rolích a normách. Je obtížná, ale nezbytná."
            },
            {
                q: "Belbin identifikoval kolik týmových rolí?",
                options: ["5", "7", "9", "12"],
                correct: 2,
                explanation: "Belbin popsal 9 týmových rolí ve 3 kategoriích: akční, sociální a myšlenkové role."
            },
            {
                q: "Která Belbinova role je 'kreativní, generuje nové nápady'?",
                options: ["Formovač (Shaper)", "Inovátor (Plant)", "Koordinátor (Coordinator)", "Realizátor (Implementer)"],
                correct: 1,
                explanation: "Plant (Inovátor) je kreativní samotář, generuje nekonvenční nápady a originální řešení."
            },
            {
                q: "Groupthink podle Janise je:",
                options: ["Efektivní skupinové rozhodování", "Tendence soudržné skupiny potlačit kritické myšlení ve prospěch konsensu", "Skupinová motivace k vyššímu výkonu", "Postupné formování skupinových norem"],
                correct: 1,
                explanation: "Groupthink je nebezpečný jev, kdy se členové vyhýbají oponování, aby udrželi harmonii - často vede k chybným rozhodnutím."
            },
            {
                q: "Social loafing (sociální zahálení) se nejlépe omezí:",
                options: ["Zvětšením týmu", "Anonymizací přínosů", "Identifikováním individuálních přínosů v menším týmu", "Odstraněním cílů"],
                correct: 2,
                explanation: "Menší tým + měřitelné individuální přínosy = nelze se 'schovat za skupinu'. To minimalizuje zahálení."
            },
            {
                q: "Která dysfunkce je podle Lencioniho ZÁKLADEM pyramidy týmových dysfunkcí?",
                options: ["Strach z konfliktu", "Absence důvěry", "Nepozornost k výsledkům", "Vyhýbání se odpovědnosti"],
                correct: 1,
                explanation: "Bez důvěry se členové bojí ukázat slabost, což vede ke strachu z konfliktu, falešné harmonii atd."
            },
            {
                q: "Co je 'psychologické bezpečí' podle Amy Edmondson?",
                options: ["Pojistka proti pracovním úrazům", "Pocit, že je bezpečné riskovat, ptát se, dělat chyby a nesouhlasit", "Pravidla bezpečnosti práce", "Ochrana před vyhořením"],
                correct: 1,
                explanation: "Psychological safety je klíčový faktor efektivních týmů - Google's Project Aristotle to potvrdil jako #1 prediktor výkonu."
            },
            {
                q: "Skupinová polarizace znamená, že:",
                options: ["Skupina dělá vyvážená rozhodnutí", "Skupina se rozdělí na dvě části", "Postoje členů se po diskusi stávají extrémnějšími", "Konflikt v týmu klesá"],
                correct: 2,
                explanation: "Po diskusi v homogenní skupině se postoje stávají extrémnějšími (riskantnějšími nebo opatrnějšími) než průměr."
            },
            {
                q: "Ringelmannův efekt poukazuje na to, že:",
                options: ["Velké týmy jsou efektivnější", "Individuální úsilí klesá s rostoucí velikostí skupiny", "Týmy se musí trénovat", "Konflikty zvyšují výkon"],
                correct: 1,
                explanation: "Ringelmann experimentálně ukázal (tahání lana), že s rostoucí velikostí týmu klesá individuální úsilí (sociální zahálení)."
            }
        ],
        open: [
            {
                q: "Popište Tuckmanovy fáze vývoje týmu a vysvětlete, proč nelze přeskočit storming.",
                sample: "Tuckmanovy fáze: 1) FORMING - členové se seznamují, jsou zdvořilí, opatrní, závislí na vedoucím. Otázky 'kdo jsem v týmu?'. 2) STORMING - vyplouvají rozdíly, konflikty o role, pravidla, vůdcovství. Intenzivní emoce. 3) NORMING - tým ustanoví normy a role, roste soudržnost, řešení konfliktů. 4) PERFORMING - efektivní spolupráce, autonomie, vysoký výkon. 5) ADJOURNING - rozpuštění týmu, hodnocení. PROČ STORMING NELZE PŘESKOČIT: Konflikty v týmu vznikají vždy - rozdíly v hodnotách, prioritách, stylech. Pokud se neřeší otevřeně ve stormingu, jdou 'pod zem' a vznikají skryté tenze, pasivní agrese, koalice. Tým může pak fungovat povrchně, ale nedosáhne true performingu. Storming je nezbytný k vyjasnění rolí a budování důvěry."
            },
            {
                q: "Vysvětlete Belbinových 9 týmových rolí a uveďte, proč je různorodost rolí důležitá pro úspěch týmu.",
                sample: "AKČNÍ ROLE: 1) Shaper (Formovač) - tlačí tým, hledá výzvy. 2) Implementer (Realizátor) - převádí nápady do plánu. 3) Completer-Finisher (Dotahovač) - pečlivost, detaily. SOCIÁLNÍ ROLE: 4) Coordinator (Koordinátor) - vede, deleguje. 5) Teamworker (Týmový pracovník) - diplomat, harmonie. 6) Resource Investigator (Vyhledávač zdrojů) - kontakty, externí info. MYŠLENKOVÉ ROLE: 7) Plant (Inovátor) - kreativní nápady. 8) Monitor-Evaluator (Vyhodnocovač) - kritická analýza. 9) Specialist (Specialista) - odborná hloubka. PROČ DIVERZITA: Tým samých Plantů má hodně nápadů, ale nikdo nedotahuje. Tým samých Shaperů má hodně konfliktů. Komplementární role = pokrytí celého procesu od nápadu po realizaci. Ne nutně 9 lidí - jeden může mít 2-3 role."
            },
            {
                q: "Co je groupthink, jak ho rozpoznat a jak mu předejít?",
                sample: "GROUPTHINK (Janis) = soudržná skupina potlačuje kritické myšlení ve prospěch konsensu. SYMPTOMY: iluze nezranitelnosti, kolektivní racionalizace špatných rozhodnutí, stereotypizace outsiderů, sebecenzura (mlčím, abych nerušil), iluze jednomyslnosti, tlak na nesouhlasící, 'mind guards' chrání skupinu před nepříjemnými informacemi. PŘÍKLADY: Zátoka sviní, Challenger, Pearl Harbor. PREVENCE: 1) Lídr nevyjadřuje preference před diskusí. 2) 'Devil's advocate' - role oponenta. 3) Anonymní průzkumy. 4) Vnější experti. 5) Druhá diskuse 'second-chance meeting'. 6) Podpora psychologického bezpečí. 7) Strukturované rozhodovací procesy. 8) Heterogenní složení týmu."
            },
            {
                q: "Vysvětlete Lencioniho 5 dysfunkcí týmu a jejich vzájemné souvislosti.",
                sample: "Lencioni vidí dysfunkce jako pyramidu - každá vyšší vyplývá z nižší: 1) ABSENCE DŮVĚRY (základ) - členové neukazují slabosti, nepřiznávají chyby. PROTI: vulnerability-based důvěra, ne predictive trust. 2) STRACH Z KONFLIKTU - kvůli nedůvěře se vyhýbají sporům, vzniká falešná harmonie. PROTI: konstruktivní konflikt nad nápady (ne osobní). 3) NEDOSTATEK ZÁVAZKU - bez otevřené diskuse nejsou rozhodnutí jednoznačná, vágní commitment. PROTI: jasná rozhodnutí, byť ne všichni 100% souhlasí. 4) VYHÝBÁNÍ SE ODPOVĚDNOSTI - nejasný commitment vede k tomu, že nikdo nevolá ostatní k zodpovědnosti. PROTI: peer-to-peer accountability. 5) NEPOZORNOST K VÝSLEDKŮM - bez odpovědnosti lidé staví své zájmy nad tým. PROTI: jasné týmové výsledky a měření. KAŽDÁ NIŽŠÍ JE PŘÍČINOU VYŠŠÍ - nelze řešit jen nahoře."
            },
            {
                q: "Jaké jsou výzvy a doporučení pro úspěšné fungování virtuálních týmů?",
                sample: "VÝZVY VIRTUÁLNÍCH TÝMŮ: 1) Chybí non-verbální komunikace (tón, mimika). 2) Obtížné budování důvěry bez osobních setkání. 3) Kulturní rozdíly (Hofstede). 4) Časové pásma - těžko najít čas pro všechny. 5) Technické problémy. 6) Pocit izolace. 7) Méně neformálních interakcí ('vodního chladiče'). 8) Obtížnější identifikace social loafing. DOPORUČENÍ: 1) Občasná osobní setkání, alespoň kick-off. 2) Jasná pravidla komunikace (kdy chat, kdy call, kdy email). 3) Pravidelné videohovory (vidět tváře). 4) Asynchronní spolupráce (Slack, dokumenty). 5) Sdílené nástroje (Trello, Miro). 6) Investice do vztahů - virtual coffee, ledolamky. 7) Jasné cíle a zodpovědnosti, deliverable based. 8) Respekt k časovým pásmům - rotace meetingů. 9) Lídr aktivně sleduje well-being a engagement."
            }
        ]
    },
    {
        id: "vedeni",
        icon: "👔",
        title: "Vedení lidí",
        subtitle: "Leadership a org. kultura",
        description: "Styly vedení a leadership",
        theory: `
            <h3>Co je leadership?</h3>
            <p><strong>Leadership (vedení)</strong> je proces ovlivňování ostatních k dosažení sdílených cílů. Není to totéž, co management:</p>
            <ul>
                <li><strong>Management</strong> – plánování, organizování, kontrola → "dělat věci správně"</li>
                <li><strong>Leadership</strong> – vize, inspirace, změna → "dělat správné věci"</li>
            </ul>
            <p>Dobrý lídr je často i dobrý manažer, ale ne každý manažer je lídr.</p>

            <h3>Vývoj teorií leadershipu</h3>

            <h4>1. Teorie rysů (Trait Theory) - cca 1900-1940</h4>
            <p>Předpoklad: lídři se rodí, mají určité vrozené vlastnosti. "Great man theory." Hledaly se univerzální rysy. Identifikované vlastnosti: inteligence, dominance, sebevědomí, energie, integrita.</p>
            <p>Kritika: žádná univerzální sada nestačí, kontext je důležitý.</p>

            <h4>2. Behaviorální teorie - 1940-1960</h4>
            <p>Posun od "kdo lídr je" k "co lídr dělá". Klíčové studie:</p>
            <ul>
                <li><strong>Ohio State studies</strong> – dvě dimenze: ohleduplnost (vztahy) a iniciující struktura (úkoly)</li>
                <li><strong>University of Michigan</strong> – orientace na lidi vs. orientace na výkon</li>
                <li><strong>Blake & Mouton's managerial grid</strong> – styly 1.1 až 9.9, optimum 9.9 (vysoké zaměření na lidi i produkci)</li>
            </ul>

            <h4>3. Kontingenční (situační) teorie - 1960+</h4>
            <p>Efektivita vedení závisí na situaci.</p>

            <p><strong>Fiedlerův model:</strong> Efektivita = styl vedení × kontrola situace. Měří se LPC (Least Preferred Coworker) - jak lídr popisuje nejméně preferovaného kolegu.</p>

            <p><strong>Hersey-Blanchardova situační teorie:</strong> 4 styly podle zralosti následovníků:</p>
            <ul>
                <li><strong>Telling (S1)</strong> – vysoké direktivy, nízká podpora (pro M1 - neochota, neschopnost)</li>
                <li><strong>Selling (S2)</strong> – vysoké direktivy, vysoká podpora (pro M2 - ochota, neschopnost)</li>
                <li><strong>Participating (S3)</strong> – nízké direktivy, vysoká podpora (pro M3 - schopnost, neochota)</li>
                <li><strong>Delegating (S4)</strong> – nízké direktivy, nízká podpora (pro M4 - schopnost, ochota)</li>
            </ul>

            <p><strong>Path-Goal teorie (House):</strong> Lídr odstraňuje překážky a vyjasňuje cestu k cíli. 4 styly: direktivní, podporující, participativní, achievement-oriented.</p>

            <h4>4. Moderní teorie</h4>

            <p><strong>Transakční vs. transformační (Burns, Bass):</strong></p>
            <ul>
                <li><strong>Transakční leadership</strong> – výměna: odměny za výkon, kontrola, sankce. Funguje pro rutinu.</li>
                <li><strong>Transformační leadership</strong> – inspiruje, mění hodnoty následovníků, vize. Vyšší výkon, commitment. 4 I's:
                    <ul>
                        <li><strong>Idealizovaný vliv</strong> (charisma, role model)</li>
                        <li><strong>Inspirativní motivace</strong> (vize)</li>
                        <li><strong>Intelektuální stimulace</strong> (výzva myšlení)</li>
                        <li><strong>Individualizovaný přístup</strong> (mentoring)</li>
                    </ul>
                </li>
            </ul>

            <p><strong>Servant leadership (Greenleaf):</strong> Lídr slouží následovníkům - jejich růst a well-being je primární. Lídr je první mezi rovnými.</p>

            <p><strong>Authentic leadership:</strong> Sebevědomí, transparentnost, etické jednání, vyvážené zpracování. Lídr je "sebou samým".</p>

            <p><strong>Ethical leadership:</strong> Důraz na hodnoty, morální chování, fair zacházení, integrity.</p>

            <p><strong>Charismatický leadership:</strong> Charisma, vize, riziko, sebevědomí. Pozor - může být temná stránka (manipulace).</p>

            <h3>Leadership a organizační kultura</h3>
            <p>Lídři kulturu vytvářejí, mění a udržují. Schein říká: "Možná jediná opravdu důležitá věc, kterou lídři dělají, je tvoření a řízení kultury."</p>
            <p>Mechanismy, jak lídři ovlivňují kulturu:</p>
            <ul>
                <li>Čemu věnují pozornost a co měří</li>
                <li>Jak reagují na krize</li>
                <li>Kdo dostává odměny a povýšení</li>
                <li>Role modeling</li>
                <li>Komunikace a příběhy</li>
            </ul>

            <h3>Power & Influence</h3>
            <p>French & Raven - 5 zdrojů moci:</p>
            <ul>
                <li><strong>Legitimní moc</strong> – z pozice</li>
                <li><strong>Donucovací moc</strong> – tresty</li>
                <li><strong>Odměňovací moc</strong> – odměny</li>
                <li><strong>Expertní moc</strong> – znalosti</li>
                <li><strong>Referenční moc</strong> – charisma, identifikace</li>
            </ul>

            <h3>Emocionální inteligence (Goleman)</h3>
            <p>Klíčová pro leadership:</p>
            <ul>
                <li><strong>Sebevědomí</strong> (self-awareness)</li>
                <li><strong>Sebeřízení</strong> (self-regulation)</li>
                <li><strong>Motivace</strong></li>
                <li><strong>Empatie</strong></li>
                <li><strong>Sociální dovednosti</strong></li>
            </ul>

            <div class="callout warning">
                <div class="callout-title">⚠️ Temná strana leadershipu</div>
                <p>Narcistický, machiavelistický nebo toxický leadership může krátkodobě fungovat, ale dlouhodobě poškozuje firmu - vyhoření, fluktuace, neetické chování. "Dark triad": narcismus, machiavelismus, psychopatie.</p>
            </div>

            <h3>📚 Učební tahák — jak si to zapamatovat</h3>

            <div class="callout tip">
                <div class="callout-title">🧠 Mnemoniky</div>
                <ul style="margin-top: 0.5rem;">
                    <li><strong>Management vs Leadership (Kotter):</strong> Manažer <em>"dělá věci správně"</em>, lídr <em>"dělá správné věci"</em>. M = plánuje, organizuje, kontroluje. L = vytváří vizi, inspiruje, mění.</li>
                    <li><strong>Transakční vs Transformační (Bass &amp; Burns):</strong> Trans-A = <em>"výměna"</em> (odměny za výkon). Trans-F = <em>"proměna"</em> (vize mění lidi).</li>
                    <li><strong>Bass — 4I transformačního leadera:</strong>
                        <ul style="margin-top: 0.3rem;">
                            <li><strong>I</strong>dealized influence (osobní vzor — "věřím mu")</li>
                            <li><strong>I</strong>nspirational motivation (vize — "vidím, kam jdeme")</li>
                            <li><strong>I</strong>ntellectual stimulation (výzva myšlení — "jinak")</li>
                            <li><strong>I</strong>ndividualized consideration (osobní přístup — "vidíš mě")</li>
                        </ul>
                    </li>
                    <li><strong>Lewin 3 styly:</strong> Autokrat / Demokrat / Laissez-faire. <em>"AuDeLa"</em>.</li>
                    <li><strong>Path-Goal (House) 4 styly:</strong> Direktivní · Podporující · Participativní · Achievement-oriented. <em>"DPPA"</em>.</li>
                    <li><strong>Hersey-Blanchard Situational Leadership 4 styly</strong> podle zralosti zaměstnance: <strong>S1 Telling</strong> → <strong>S2 Selling</strong> → <strong>S3 Participating</strong> → <strong>S4 Delegating</strong>.</li>
                    <li><strong>Dark Triad:</strong> <em>"NMP"</em> = <strong>N</strong>arcismus + <strong>M</strong>achiavelismus + <strong>P</strong>sychopatie.</li>
                    <li><strong>Servant Leadership (Greenleaf):</strong> <em>"Lídr slouží, ne velí."</em></li>
                </ul>
            </div>

            <div class="callout">
                <div class="callout-title">🎨 Příběh, který si zapamatuješ</div>
                <p>Tři známí CEO: <strong>Steve Jobs</strong> — vizionář, transformační (4I jasné), ale toxický mikromanažer (dark side). <strong>Tim Cook</strong> — operační génius, transakční mistr (KPI, dodávky, čísla), méně charismatu. <strong>Satya Nadella</strong> — kombinace servant + transformační, otočil kulturu Microsoftu z "know-it-all" na "learn-it-all", rostl 10× v hodnotě. Lekce: <em>žádný styl není univerzální</em> — Hersey-Blanchard učí, že styl se má přizpůsobit zralosti zaměstnance a situaci. Steve byl skvělý pro inovace, Tim pro škálování, Satya pro kulturní obrat.</p>
            </div>

            <div class="callout warning">
                <div class="callout-title">⚡ 60 sekund před zkouškou</div>
                <ul style="margin-top: 0.3rem;">
                    <li><strong>Evoluce teorií vedení:</strong> trait theory (vrozené) → behavioral (Ohio/Michigan studies) → situational (Hersey-Blanchard, Fiedler contingency) → transformační (Bass) → servant (Greenleaf) → autentický + ethical leadership</li>
                    <li><strong>Manažer vs Lídr (Kotter):</strong> management = pořádek a kontinuita; leadership = změna a vize</li>
                    <li><strong>3 styly Lewina:</strong> autokratický (rychlost, krize), demokratický (engagement, kvalita), laissez-faire (experti, kreativita)</li>
                    <li><strong>Fiedler contingency:</strong> styl je fixní; success = match mezi stylem (task vs relationship) a situací (kontrola)</li>
                    <li><strong>Hersey-Blanchard:</strong> 4 styly podle developmental level následovníka (D1-D4 → S1-S4)</li>
                    <li><strong>Path-Goal (House):</strong> lídr odstraňuje překážky k cíli; 4 styly</li>
                    <li><strong>Transakční</strong> = contingent reward, management by exception (active/passive)</li>
                    <li><strong>Transformační</strong> = 4I (idealized, inspirational, intellectual, individualized)</li>
                    <li><strong>Augmentation effect:</strong> nejsilnější lídři kombinují transakční (základ) + transformační (vize)</li>
                    <li><strong>Dark side:</strong> Dark Triad (NMP), toxický, narcistický leadership</li>
                </ul>
            </div>

            <div class="callout tip">
                <div class="callout-title">🎬 Doporučená YouTube videa</div>
                <ul style="margin-top: 0.5rem;">
                    <li><a href="https://www.youtube.com/results?search_query=Simon+Sinek+start+with+why+TED" target="_blank" rel="noopener">Simon Sinek — Start With Why (TED)</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=transformational+vs+transactional+leadership" target="_blank" rel="noopener">Transformational vs Transactional Leadership</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Hersey+Blanchard+situational+leadership+model" target="_blank" rel="noopener">Hersey-Blanchard Situational Leadership</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=servant+leadership+Robert+Greenleaf" target="_blank" rel="noopener">Servant Leadership (Greenleaf)</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Daniel+Goleman+6+leadership+styles" target="_blank" rel="noopener">Daniel Goleman — 6 Leadership Styles</a></li>
                </ul>
            </div>
        `,
        abcd: [
            {
                q: "Hlavní rozdíl mezi managementem a leadershipem podle Kottera je:",
                options: ["Management vede k inovaci, leadership ke stabilitě", "Management se zaměřuje na 'dělat věci správně', leadership na 'dělat správné věci'", "Manažer má pravomoc, lídr ne", "Leadership je nadřazený managementu"],
                correct: 1,
                explanation: "Manažer plánuje, organizuje, kontroluje - dělá věci správně. Lídr vytváří vizi, motivuje, vede ke změně - dělá správné věci."
            },
            {
                q: "Teorie rysů (Trait Theory) předpokládá, že:",
                options: ["Lídři se rodí s určitými vrozenými vlastnostmi", "Lídři jsou vychováváni rodinou", "Lídři vznikají v krizích", "Lídři jsou výsledkem situace"],
                correct: 0,
                explanation: "Trait Theory ('great man theory') tvrdila, že velcí lídři mají vrozené vlastnosti. Dnes je tato teorie považována za nedostatečnou."
            },
            {
                q: "Která Blake-Moutonova manažerská mřížka je považována za optimální?",
                options: ["1.1 (Impoverished)", "5.5 (Middle-of-the-road)", "9.9 (Team)", "9.1 (Task)"],
                correct: 2,
                explanation: "9.9 = vysoké zaměření na lidi i na produkci = 'team management', podle autorů ideální."
            },
            {
                q: "Hersey-Blanchardova situační teorie pracuje se 4 styly podle:",
                options: ["Velikosti týmu", "Zralosti/připravenosti následovníků", "Velikosti organizace", "Typu úkolu"],
                correct: 1,
                explanation: "Hersey-Blanchard: telling, selling, participating, delegating - podle 'maturity' následovníků (M1-M4)."
            },
            {
                q: "Která ze 4 I's transformačního leadershipu se týká vize a inspirace?",
                options: ["Idealizovaný vliv", "Inspirativní motivace", "Intelektuální stimulace", "Individualizovaný přístup"],
                correct: 1,
                explanation: "Inspirational Motivation = vize budoucnosti, která inspiruje a sjednocuje. Idealizovaný vliv je charisma jako role model."
            },
            {
                q: "Servant leadership podle Greenleafa znamená, že:",
                options: ["Lídr je sluhou akcionářů", "Lídr slouží růstu a well-beingu následovníků", "Lídr má nejnižší plat v týmu", "Lídr nemá žádnou autoritu"],
                correct: 1,
                explanation: "Servant leader staví potřeby a rozvoj následovníků na první místo. Sám sebe vnímá jako prvního mezi rovnými."
            },
            {
                q: "Transakční leadership funguje na principu:",
                options: ["Vize a inspirace", "Výměna výkonu za odměnu, kontrola", "Empatie a podpory", "Charisma"],
                correct: 1,
                explanation: "Transakční přístup je 'něco za něco' - jasná výměna mezi lídrem a následovníkem. Funguje pro rutinní úkoly."
            },
            {
                q: "Které z následujících NENÍ jedním z French & Raven zdrojů moci?",
                options: ["Legitimní moc", "Charismatická moc", "Expertní moc", "Donucovací moc"],
                correct: 1,
                explanation: "French & Raven: legitimní, donucovací, odměňovací, expertní, referenční. 'Charismatická moc' se podobá referenční, ale není přesný termín z modelu."
            },
            {
                q: "Goleman zdůrazňuje pro leadership především:",
                options: ["Intelektuální schopnosti", "Emocionální inteligenci", "Fyzickou kondici", "Hierarchickou pozici"],
                correct: 1,
                explanation: "Goleman ukázal, že emocionální inteligence (EQ) je pro leadership často důležitější než IQ."
            },
            {
                q: "Charismatický lídr může mít 'temnou stránku', která zahrnuje:",
                options: ["Příliš velkou empatii", "Manipulaci a narcismus", "Nedostatek vize", "Přílišnou demokracii"],
                correct: 1,
                explanation: "Charisma může být zneužito - narcističtí a manipulativní lídři krátkodobě uspějí, ale dlouhodobě poškozují organizaci (toxický leadership)."
            }
        ],
        open: [
            {
                q: "Vysvětlete rozdíl mezi transakčním a transformačním leadershipem. Kdy je vhodný který?",
                sample: "TRANSAKČNÍ - výměna 'něco za něco': odměny za výkon, sankce za neplnění. Zaměřuje se na úkol, kontrolu, korekci. Funguje dobře pro: rutinní práci, stabilní prostředí, krátkodobé cíle, zaměstnance s nižší motivací (potřebují strukturu). TRANSFORMAČNÍ - inspiruje a mění následovníky. 4 I: idealizovaný vliv (role model), inspirativní motivace (vize), intelektuální stimulace (výzva myšlení), individualizovaný přístup (mentoring). Funguje pro: změnu, krize, inovace, dlouhodobé cíle, vysoce motivované zaměstnance. NEJLEPŠÍ KOMBINACE: většina efektivních lídrů kombinuje oba - transakční pro každodenní fungování, transformační pro vizionářské vedení. Tzv. 'augmentation effect' - transformační přidává nad transakční."
            },
            {
                q: "Popište Hersey-Blanchardovu situační teorii. Jak by lídr přizpůsobil styl novému zaměstnanci vs. zkušenému profesionálovi?",
                sample: "Hersey-Blanchard: lídr přizpůsobuje styl podle ZRALOSTI (readiness) následovníka - kombinace SCHOPNOSTI a OCHOTY. 4 styly: 1) TELLING (S1) - vysoké direktivy, nízká podpora: pro M1 (neschopný, neochotný). 2) SELLING (S2) - vysoké direktivy, vysoká podpora: pro M2 (neschopný, ale ochotný). 3) PARTICIPATING (S3) - nízké direktivy, vysoká podpora: pro M3 (schopný, ale neochotný/nejistý). 4) DELEGATING (S4) - nízké direktivy, nízká podpora: pro M4 (schopný a ochotný). NOVÝ ZAMĚSTNANEC: pravděpodobně M1-M2, lídr by měl být direktivní, jasně instruovat, ale také motivovat a vysvětlovat. ZKUŠENÝ PROFESIONÁL: M4, lídr deleguje, dává autonomii, jen občas konzultuje. Pokud by direktivně vedl experta = demotivace; pokud by deleguje novému = chaos."
            },
            {
                q: "Jaké jsou hlavní zdroje moci podle French & Raven? Který je nejudržitelnější?",
                sample: "5 ZDROJŮ MOCI: 1) LEGITIMNÍ - vyplývá z pozice (šéf, ředitel). 2) DONUCOVACÍ - moc trestat (výpověď, sankce, odebrání benefitů). 3) ODMĚŇOVACÍ - moc dávat odměny (bonusy, povýšení, pochvala). 4) EXPERTNÍ - vyplývá ze znalostí a expertízy. 5) REFERENČNÍ - vyplývá z osobních vlastností, charisma, identifikace - lidé chtějí být jako lídr. NEJUDRŽITELNĚJŠÍ: Expertní a referenční moc - protože vychází z osoby lídra, ne z pozice. Pokud lídr ztratí pozici, ztrácí legitimní/donucovací/odměňovací moc. Expertní a referenční mu zůstávají. NAVÍC: donucovací moc vyvolává odpor; referenční vede k vyšší motivaci a commitmentu. Nejlepší lídři kombinují více zdrojů, ale staví na expertní a referenční."
            },
            {
                q: "Vysvětlete, jak lídr ovlivňuje organizační kulturu podle Scheina.",
                sample: "Schein: 'Možná jediná opravdu důležitá věc, kterou lídři dělají, je tvoření a řízení kultury.' MECHANISMY VLIVU: 1) ČEMU LÍDŘI VĚNUJÍ POZORNOST, CO MĚŘÍ A KONTROLUJÍ - signalizuje, co je důležité (jestli CEO sleduje denně tržby vs. spokojenost zákazníků, formuje kulturu). 2) REAKCE NA KRIZE - 'kulturní moment', ukazuje skutečné hodnoty. 3) ODMĚŇOVÁNÍ A POVYŠOVÁNÍ - koho lídr povýší ukazuje, co se cení. 4) NÁBOR A PROPOUŠTĚNÍ - kritéria. 5) ROLE MODELING - lídr osobně demonstruje hodnoty. 6) PŘÍBĚHY, RITUÁLY, SYMBOLY - příběhy o úspěších/selháních, jak se slaví, kanceláře, dress code. 7) FORMÁLNÍ DOKUMENTY - mise, vize, politiky. ZAKLADATELÉ mají největší vliv - jejich hodnoty formují DNA firmy. NOVÍ CEO mohou kulturu měnit, ale je to dlouhodobý proces (5-10 let)."
            },
            {
                q: "Co je 'temná strana leadershipu' (dark side) a jak ji rozpoznat?",
                sample: "DARK SIDE LEADERSHIPU: leadership styl, který krátkodobě dosahuje výsledků, ale dlouhodobě poškozuje organizaci a lidi. DARK TRIAD osobnostních rysů: 1) NARCISMUS - velikášství, potřeba obdivu, nedostatek empatie. 2) MACHIAVELISMUS - manipulace, cynismus, využívání lidí. 3) PSYCHOPATIE - chybějící svědomí, impulzivita. SIGNÁLY: vysoká fluktuace, atmosféra strachu, mikromanagement nebo naopak nezájem o tým, neetické rozhodování, kult osobnosti, lichotníci v okolí, kritici jsou vyháněni, obviňování ostatních, zásluhy si přivlastňuje. KRÁTKODOBÝ DOPAD: někdy vysoký výkon (lidé pracují ze strachu). DLOUHODOBÝ DOPAD: vyhoření, fluktuace nejlepších, etické skandály, ztráta důvěry. PREVENCE: 360° feedback, transparentní hodnocení, etické standardy, succession planning, posuzování kandidátů nejen na výkon, ale i hodnoty."
            }
        ]
    },
    {
        id: "vztahy",
        icon: "💬",
        title: "Vztahy a komunikace",
        subtitle: "P5 - Vztahy a komunikace",
        description: "Interpersonální vztahy a komunikace",
        theory: `
            <h3>Co je komunikace?</h3>
            <p><strong>Komunikace</strong> je proces předávání a sdílení informací, myšlenek, emocí mezi vysílatelem a příjemcem. V organizaci je klíčová pro koordinaci, motivaci, rozhodování a kulturu.</p>

            <h3>Model komunikace (Shannon-Weaver)</h3>
            <p>Klasický lineární model:</p>
            <ol>
                <li><strong>Vysílatel</strong> (sender) - kódování zprávy</li>
                <li><strong>Zpráva</strong> (message)</li>
                <li><strong>Kanál</strong> (channel) - médium přenosu</li>
                <li><strong>Příjemce</strong> (receiver) - dekódování</li>
                <li><strong>Zpětná vazba</strong> (feedback)</li>
                <li><strong>Šum</strong> (noise) - cokoli, co narušuje přenos</li>
            </ol>

            <h3>Verbální vs. neverbální komunikace</h3>
            <p>Albert Mehrabian: v emocionální komunikaci je vliv:</p>
            <ul>
                <li>7 % slova</li>
                <li>38 % tón hlasu (paralingvistika)</li>
                <li>55 % řeč těla (neverbální)</li>
            </ul>

            <p><strong>Neverbální komunikace zahrnuje:</strong></p>
            <ul>
                <li><strong>Mimika</strong> - výrazy obličeje</li>
                <li><strong>Gestika</strong> - pohyby rukou</li>
                <li><strong>Posturika</strong> - postoj těla</li>
                <li><strong>Kinezika</strong> - pohyby těla</li>
                <li><strong>Proxemika</strong> - vzdálenost (intimní, osobní, sociální, veřejná)</li>
                <li><strong>Haptika</strong> - dotek</li>
                <li><strong>Vizika</strong> - oční kontakt</li>
                <li><strong>Paralingvistika</strong> - tón, hlasitost, rychlost</li>
            </ul>

            <h3>Komunikační bariéry</h3>
            <ul>
                <li><strong>Filtrace</strong> - vysílatel manipuluje zprávou (říká, co chce příjemce slyšet)</li>
                <li><strong>Selektivní vnímání</strong> - příjemce slyší jen to, co odpovídá jeho přesvědčení</li>
                <li><strong>Informační přetížení</strong></li>
                <li><strong>Emoce</strong></li>
                <li><strong>Jazyk a sémantika</strong> - různý význam slov</li>
                <li><strong>Strach z komunikace</strong> (communication apprehension)</li>
                <li><strong>Kulturní rozdíly</strong></li>
                <li><strong>Šum prostředí</strong></li>
            </ul>

            <h3>Aktivní naslouchání</h3>
            <p>Klíčová dovednost. Zahrnuje:</p>
            <ul>
                <li>Plnou pozornost (oční kontakt, vypnutý telefon)</li>
                <li>Parafrázování ("Pokud rozumím správně...")</li>
                <li>Kladení otevřených otázek</li>
                <li>Reflektování emocí</li>
                <li>Sumarizaci</li>
                <li>Neskákat do řeči</li>
                <li>Nehodnotit</li>
            </ul>

            <h3>Asertivní komunikace</h3>
            <p>Asertivita = schopnost vyjádřit své potřeby, názory a pocity přímo, čestně a s respektem k druhým.</p>
            <ul>
                <li><strong>Pasivní</strong> - ustupuje, neříká své potřeby</li>
                <li><strong>Agresivní</strong> - prosazuje sebe na úkor druhých</li>
                <li><strong>Pasivně-agresivní</strong> - skrytá agrese</li>
                <li><strong>Asertivní</strong> - prosazuje své, respektuje druhé</li>
            </ul>

            <h3>I-zprávy (Já-výroky)</h3>
            <p>Nástroj nenásilné komunikace (Marshall Rosenberg):</p>
            <ul>
                <li><strong>Já-výrok:</strong> "Cítím se přetížený, když dostanu úkol na poslední chvíli."</li>
                <li><strong>Ty-výrok:</strong> "Vždycky mi dáš úkol na poslední chvíli!"</li>
            </ul>
            <p>I-zprávy: pozorování → pocit → potřeba → prosba.</p>

            <h3>Konflikt</h3>
            <p>Konflikt = vnímaná neslučitelnost mezi dvěma nebo více stranami.</p>

            <h4>Typy konfliktu</h4>
            <ul>
                <li><strong>Funkční</strong> (konstruktivní) - vede k inovaci, lepším rozhodnutím</li>
                <li><strong>Dysfunkční</strong> (destruktivní) - poškozuje vztahy a výkon</li>
            </ul>

            <h4>Úrovně konfliktu</h4>
            <ul>
                <li><strong>Intrapersonální</strong> - v sobě</li>
                <li><strong>Interpersonální</strong> - mezi lidmi</li>
                <li><strong>Skupinový</strong> - v týmu</li>
                <li><strong>Mezi-skupinový</strong> - mezi týmy/odděleními</li>
            </ul>

            <h4>Thomas-Kilmann model řešení konfliktu</h4>
            <p>Dvě dimenze: asertivita (snaha o vlastní cíle) × kooperace (snaha o cíle druhého). 5 stylů:</p>
            <ol>
                <li><strong>Soutěživost (Competing)</strong> - vysoká asertivita, nízká kooperace - 'já vyhraju, ty prohraješ'</li>
                <li><strong>Spolupráce (Collaborating)</strong> - vysoká obojí - 'win-win'</li>
                <li><strong>Kompromis (Compromising)</strong> - střední obojí - 'každý něco'</li>
                <li><strong>Vyhýbání (Avoiding)</strong> - nízká obojí - 'lose-lose'</li>
                <li><strong>Přizpůsobení (Accommodating)</strong> - nízká asertivita, vysoká kooperace - 'já ustoupím'</li>
            </ol>
            <p>Žádný styl není univerzálně nejlepší - závisí na situaci.</p>

            <h3>Komunikační směry v organizaci</h3>
            <ul>
                <li><strong>Vertikální dolů</strong> - od nadřízeného k podřízenému (instrukce, zpětná vazba)</li>
                <li><strong>Vertikální nahoru</strong> - od podřízeného k nadřízenému (reporty, problémy)</li>
                <li><strong>Horizontální</strong> - mezi kolegy na stejné úrovni</li>
                <li><strong>Diagonální</strong> - napříč úrovněmi i odděleními</li>
                <li><strong>Neformální (grapevine)</strong> - drby, neformální sítě</li>
            </ul>

            <h3>Komunikační kanály</h3>
            <p>Bohatost kanálu (channel richness):</p>
            <ol>
                <li>Tváří v tvář (nejbohatší - non-verbální, okamžitá zpětná vazba)</li>
                <li>Videohovor</li>
                <li>Telefon</li>
                <li>Email s osobním tónem</li>
                <li>Email formální</li>
                <li>Bulletin, oběžník (nejméně bohatý)</li>
            </ol>
            <p><strong>Pravidlo:</strong> Komplexní/citlivé zprávy → bohaté kanály. Jednoduché informace → chudé kanály.</p>

            <h3>Zpětná vazba (Feedback)</h3>
            <p>Kvalitní zpětná vazba je:</p>
            <ul>
                <li><strong>Specifická</strong> - konkrétní, ne obecná</li>
                <li><strong>Včasná</strong></li>
                <li><strong>Konstruktivní</strong> - ne útočná</li>
                <li><strong>Na chování, ne na osobu</strong></li>
                <li><strong>Vyvážená</strong> - pozitivní i k zlepšení</li>
                <li><strong>Soukromá</strong> (negativní)</li>
            </ul>

            <p><strong>SBI model:</strong> Situation - Behavior - Impact ("V pondělním meetingu (S) jsi přerušil kolegyni (B), což snížilo kvalitu diskuse (I).")</p>

            <h3>📚 Učební tahák — jak si to zapamatovat</h3>

            <div class="callout tip">
                <div class="callout-title">🧠 Mnemoniky</div>
                <ul style="margin-top: 0.5rem;">
                    <li><strong>Mehrabian 7-38-55:</strong> u <em>emocionálních</em> zpráv váží <strong>7 % slova / 38 % tón / 55 % tělo</strong>. <em>Pozor — neplatí pro faktickou komunikaci!</em></li>
                    <li><strong>Komunikační model Shannon-Weaver:</strong> <em>"OKKDPF + Š"</em> = <strong>O</strong>desílatel → <strong>K</strong>ódování → <strong>K</strong>anál → <strong>D</strong>ekódování → <strong>P</strong>říjemce → <strong>F</strong>eedback (+ <strong>Š</strong>um na každém kroku).</li>
                    <li><strong>Johari Window — 4 okna:</strong> <em>"OBHU"</em> = <strong>O</strong>pen (vím já, ví druzí) · <strong>B</strong>lind (nevím já, vědí druzí) · <strong>H</strong>idden (vím já, nevědí druzí) · <strong>U</strong>nknown (nikdo neví). Cíl: rozšířit Open okno (feedback + sdílení).</li>
                    <li><strong>SBI feedback:</strong> <strong>S</strong>ituace + <strong>B</strong>ehavior (popis chování, ne osobnosti!) + <strong>I</strong>mpact (dopad). Nikdy: <em>"jsi líný"</em>; vždy: <em>"v pondělí jsi nedodal report a klient si stěžoval"</em>.</li>
                    <li><strong>Thomas-Kilmann 5 stylů řešení konfliktu</strong> (osy: asertivita × kooperace):
                        <ul style="margin-top: 0.3rem;">
                            <li><strong>K</strong>onkurence (win-lose) · <strong>S</strong>polupráce (win-win) · <strong>K</strong>ompromis (něco za něco) · <strong>V</strong>yhýbání (lose-lose) · <strong>P</strong>řizpůsobení (lose-win)</li>
                            <li>Mnemo: <em>"KSKVP"</em></li>
                        </ul>
                    </li>
                    <li><strong>4 pravidla asertivity:</strong> popisuj, ne hodnoť · mluv za sebe (Já-zprávy) · pojmenuj emoci · navrhni řešení.</li>
                    <li><strong>Aktivní naslouchání:</strong> parafrázuj → ptej se → zrcadli emoce → shrň. <em>"Nedávej rady dřív, než člověk dokončí příběh."</em></li>
                    <li><strong>Bohatost média (Daft &amp; Lengel):</strong> face-to-face &gt; video &gt; telefon &gt; chat &gt; email. Komplexní/emoční zprávy → bohaté médium.</li>
                </ul>
            </div>

            <div class="callout">
                <div class="callout-title">🎨 Příběh, který si zapamatuješ</div>
                <p>Šéfka napíše ti SMS <em>"musíme si promluvit"</em>. Tečka, žádný kontext. Mozek si dosadí: vyhazov. To je <strong>šum + nesprávný kanál</strong> — komplexní emoční zprávu zvládne jen <em>bohaté médium</em> (face-to-face). Když ses druhý den dozvěděl, že jen chtěla nabídnout povýšení, byl jsi 24 h ve stresu. Pravidlo: <strong>čím těžší zpráva, tím bohatší kanál</strong>. A v konfliktu — než zaútočíš (konkurence) nebo zmizíš (vyhýbání), zkus <strong>spolupráci</strong>: <em>"chci pochopit tvůj pohled, mně jde o ..."</em> = win-win. Kompromis je nouzové řešení, ne ideál.</p>
            </div>

            <div class="callout warning">
                <div class="callout-title">⚡ 60 sekund před zkouškou</div>
                <ul style="margin-top: 0.3rem;">
                    <li><strong>6 prvků komunikace:</strong> odesílatel, kódování, zpráva, kanál, dekódování, příjemce + feedback + šum</li>
                    <li><strong>Verbální (slova) vs neverbální (tón, mimika, gesta, vzdálenost, dotek, vzhled)</strong></li>
                    <li><strong>Mehrabian 7-38-55:</strong> jen u emocionální/postojové komunikace, ne u faktů!</li>
                    <li><strong>Druhy komunikace:</strong> formální (předepsaná) vs neformální (grapevine — pomluvy) · vertikální (top-down, bottom-up) vs horizontální · interní vs externí</li>
                    <li><strong>Bariéry:</strong> jazykové, kulturní, fyzické, psychologické (filtrování, defenzivnost), selektivní vnímání</li>
                    <li><strong>Johari Window:</strong> 4 okna; cíl rozšířit "Open"</li>
                    <li><strong>Asertivita</strong> vs pasivita vs agrese</li>
                    <li><strong>Konflikt 5 stylů (Thomas-Kilmann)</strong> + funkční vs dysfunkční konflikt</li>
                    <li><strong>SBI feedback model</strong></li>
                    <li><strong>Aktivní naslouchání:</strong> parafráze, reflexe emocí, otevřené otázky</li>
                </ul>
            </div>

            <div class="callout tip">
                <div class="callout-title">🎬 Doporučená YouTube videa</div>
                <ul style="margin-top: 0.5rem;">
                    <li><a href="https://www.youtube.com/results?search_query=Mehrabian+7+38+55+rule+explained" target="_blank" rel="noopener">Mehrabian 7-38-55 rule explained</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Johari+Window+model+explained" target="_blank" rel="noopener">Johari Window model</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Thomas+Kilmann+conflict+modes" target="_blank" rel="noopener">Thomas-Kilmann Conflict Modes</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=active+listening+skills+demonstration" target="_blank" rel="noopener">Active Listening skills</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=SBI+feedback+model+situation+behavior+impact" target="_blank" rel="noopener">SBI Feedback Model</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=nonverbal+communication+body+language+Amy+Cuddy" target="_blank" rel="noopener">Body language &amp; nonverbal communication (Amy Cuddy)</a></li>
                </ul>
            </div>
        `,
        abcd: [
            {
                q: "Mehrabianovo pravidlo (7-38-55%) říká, že v emocionální komunikaci je nejvíce vlivná:",
                options: ["Slova (verbální obsah)", "Tón hlasu (paralingvistika)", "Řeč těla (neverbální komunikace)", "Volba kanálu"],
                correct: 2,
                explanation: "55 % vlivu má řeč těla, 38 % tón hlasu, jen 7 % slova. Pozn: platí jen pro emocionální/postojové sdělení."
            },
            {
                q: "Co je 'šum' v komunikačním modelu?",
                options: ["Pouze fyzický zvuk", "Cokoli, co narušuje přenos zprávy", "Negativní zpětná vazba", "Verbální agrese"],
                correct: 1,
                explanation: "Šum (noise) je jakákoli interference - fyzická, psychologická, sémantická - která narušuje komunikaci."
            },
            {
                q: "Filtrace v komunikaci znamená:",
                options: ["Použití filtru proti spamu", "Vysílatel záměrně manipuluje zprávou pro lepší přijetí", "Příjemce ignoruje část zprávy", "Zpráva projde technickým filtrem"],
                correct: 1,
                explanation: "Filtrace = vysílatel upravuje zprávu tak, aby byla pro příjemce přijatelnější (typicky podřízený šéfovi)."
            },
            {
                q: "Které z následujících NENÍ technika aktivního naslouchání?",
                options: ["Parafrázování", "Pokládání otevřených otázek", "Skákat do řeči s vlastními řešeními", "Reflektování emocí"],
                correct: 2,
                explanation: "Aktivní naslouchání vyžaduje pozornost a respekt - skákání do řeči je opak. Také se vyhýbáme předčasným radám."
            },
            {
                q: "Která reakce je asertivní?",
                options: ["'Tohle je směšné, vždycky děláš chyby!'", "'No, asi to nějak zvládnu...' (potichu)", "'Cítím se přetížený, prosím tě o dřívější předání úkolu.'", "Mlčení a pomalé vyřízení"],
                correct: 2,
                explanation: "Asertivní komunikace = vyjádření vlastní potřeby přímo, čestně, s respektem. Já-výrok bez útoku."
            },
            {
                q: "Thomas-Kilmann model rozlišuje konflikt podle dvou dimenzí:",
                options: ["Délky a intenzity", "Asertivity a kooperace", "Formálnosti a obsahu", "Statusu a moci"],
                correct: 1,
                explanation: "Dvě osy: asertivita (jak prosazuji své) × kooperace (jak respektuji druhé). Vznikají 4 rohy + střed (kompromis)."
            },
            {
                q: "Která strategie konfliktu v Thomas-Kilmann modelu vede k 'win-win'?",
                options: ["Soutěživost (Competing)", "Spolupráce (Collaborating)", "Vyhýbání (Avoiding)", "Přizpůsobení (Accommodating)"],
                correct: 1,
                explanation: "Collaborating - vysoká asertivita i kooperace - hledá řešení, ze kterého profitují obě strany. Ideální, ale časově náročné."
            },
            {
                q: "'Channel richness' (bohatost kanálu) je nejvyšší u:",
                options: ["Emailu", "Tváří v tvář", "Bulletin", "SMS"],
                correct: 1,
                explanation: "Tváří v tvář má nejvyšší bohatost - non-verbální komunikace, okamžitá zpětná vazba, osobní tón."
            },
            {
                q: "Která komunikace JE typicky horizontální?",
                options: ["Šéf dává instrukce zaměstnanci", "Zaměstnanec reportuje šéfovi", "Dva kolegové ze stejného oddělení řeší úkol", "CEO mluví k akcionářům"],
                correct: 2,
                explanation: "Horizontální komunikace probíhá mezi kolegy na stejné úrovni hierarchie - typicky koordinace, sdílení informací."
            },
            {
                q: "Kvalitní zpětná vazba by měla být především:",
                options: ["Obecná a globální", "Specifická, na chování, včasná", "Veřejná pro maximální dopad", "Jen pozitivní"],
                correct: 1,
                explanation: "Zpětná vazba: specifická (konkrétní příklady), na chování (ne na osobu), včasná, konstruktivní, soukromá (u negativní)."
            }
        ],
        open: [
            {
                q: "Vysvětlete rozdíl mezi verbální a neverbální komunikací. Co se stane, když si protiřečí?",
                sample: "VERBÁLNÍ - obsah slov, mluvený nebo psaný. NEVERBÁLNÍ - řeč těla, mimika, tón, gesta, proxemika atd. Podle Mehrabiana (v emocionální komunikaci): 7 % slova, 38 % tón, 55 % neverbál. KDYŽ SI PROTIŘEČÍ: příjemce důvěřuje neverbálu více než slovům. Příklad: šéf říká 'Mám čas, mluvte', ale dívá se do mobilu - zpráva přijatá: nemá čas. Lidé jsou citliví na nesoulad. Důsledky: ztráta důvěryhodnosti, zmatek, podezření na neupřímnost. PRO LÍDRA: musí být kongruentní - slova a chování souhlasí. PRO POSLUCHAČE: dobré uvědomovat si neverbální signály, neignorovat je."
            },
            {
                q: "Popište alespoň 4 komunikační bariéry a navrhněte, jak je překonat.",
                sample: "1) FILTRACE - vysílatel upravuje zprávu (např. podřízený zlehčuje problémy šéfovi). ŘEŠENÍ: kultura otevřenosti, anonymní kanály, multiple sources informací. 2) SELEKTIVNÍ VNÍMÁNÍ - příjemce slyší jen, co odpovídá jeho přesvědčení. ŘEŠENÍ: aktivní naslouchání, parafrázování, žádat o zpětnou vazbu. 3) INFORMAČNÍ PŘETÍŽENÍ - příliš mnoho zpráv. ŘEŠENÍ: prioritizace, jasné kanály, méně emailů, asynchronní práce. 4) EMOCE - silné emoce zkreslují vnímání. ŘEŠENÍ: pauzy, deeskalace, vrátit se k tématu, když se emoce zklidní. 5) SÉMANTIKA - různé chápání slov. ŘEŠENÍ: definovat klíčové pojmy, použít konkrétní příklady, ověřit porozumění. 6) KULTURNÍ ROZDÍLY - různé normy (Hofstede). ŘEŠENÍ: cross-cultural training, citlivost, ptát se."
            },
            {
                q: "Popište 5 stylů řešení konfliktu podle Thomas-Kilmann modelu a uveďte, kdy je vhodný každý z nich.",
                sample: "1) SOUTĚŽIVOST (Competing) - vysoká asertivita, nízká kooperace. KDY: rychlé rozhodnutí v krizi, neoblíbená rozhodnutí (propouštění), ochrana proti zneužití. 2) SPOLUPRÁCE (Collaborating) - vysoká obojí, win-win. KDY: důležité dlouhodobé vztahy, komplexní problémy, kreativní řešení potřeba, čas k dispozici. 3) KOMPROMIS (Compromising) - střední obojí, každý něco. KDY: rychlé řešení, dočasné řešení, partneři s rovnou silou, less-important issues. 4) VYHÝBÁNÍ (Avoiding) - nízká obojí. KDY: triviální problém, nemožné vyhrát, potřeba ochladit emoce, jiní lépe vyřeší. POZOR: chronické vyhýbání = problémy se hromadí. 5) PŘIZPŮSOBENÍ (Accommodating) - nízká asertivita, vysoká kooperace. KDY: máte málo zájmu na výsledku, druhý má více informací, budování vztahů, případ 'wrong'. POZOR: chronické = pasivita, ztráta respektu. ŽÁDNÝ STYL NENÍ UNIVERZÁLNĚ NEJLEPŠÍ."
            },
            {
                q: "Co je asertivní komunikace? Jak se liší od pasivní a agresivní?",
                sample: "ASERTIVITA = schopnost vyjádřit své potřeby, názory a pocity přímo, čestně a s respektem k druhým. PASIVNÍ - neříká své potřeby, ustupuje, 'aby byl klid'. Důsledek: nespokojenost, pasivně-agresivní vyústění, ztráta respektu. AGRESIVNÍ - prosazuje sebe na úkor druhých, útočí, ponižuje. Důsledek: krátkodobě vyhrává, dlouhodobě poškozené vztahy, odpor. ASERTIVNÍ - prosazuje vlastní zájmy ALE respektuje druhé. Používá já-výroky, je konkrétní, neutočí osobně. Příklad: PASIVNÍ 'no asi to udělám...'; AGRESIVNÍ 'to je tvůj problém, ne můj!'; ASERTIVNÍ 'rozumím, že potřebuješ pomoc, ale teď mám deadline. Můžu ti pomoct zítra.' VÝHODY: dlouhodobě nejlepší vztahy, nižší stres, vyšší self-esteem. UČÍ SE - trénink asertivity je standardní soft skill program."
            },
            {
                q: "Jak dávat efektivní zpětnou vazbu? Popište model SBI a uveďte příklad.",
                sample: "PRINCIPY EFEKTIVNÍ ZV: 1) Specifická a konkrétní. 2) Včasná - brzy po události. 3) Na chování, ne na osobnost. 4) Konstruktivní. 5) Vyvážená (i pozitivní). 6) Soukromá u negativní. 7) Dialog, ne monolog. SBI MODEL: SITUATION - kdy a kde se to stalo. BEHAVIOR - co konkrétně dotyčný udělal (fakta, ne interpretace). IMPACT - jaký to mělo dopad na tebe/tým/výsledek. PŘÍKLAD POZITIVNÍ ZV: 'Včera na meetingu s klientem (S), když jsi přehledně shrnul naše výhody a aktivně se ptal na jeho potřeby (B), klient výrazně lépe reagoval a domluvili jsme follow-up (I). Skvělá práce!' PŘÍKLAD KONSTRUKTIVNÍ ZV: 'V pondělním stand-upu (S) jsi několikrát přerušil kolegy během jejich updatu (B). Měl jsem pocit, že to brzdilo plynulost meetingu a jiní pak méně mluvili (I). Co kdybychom příště nejdřív poslechli a pak diskutovali?' Po předání ZV: nechat prostor pro reakci, diskusi, dohodu na dalším postupu."
            }
        ]
    },
    {
        id: "odolnost",
        icon: "🛡️",
        title: "Odolnost",
        subtitle: "Psychická odolnost",
        description: "Resilience, stres a copingové strategie",
        theory: `
            <h3>Co je psychická odolnost (resilience)?</h3>
            <p><strong>Psychická odolnost (resilience)</strong> je schopnost úspěšně se adaptovat na stresové situace, krize a změny - "odrazit se" zpět, ne se zhroutit. Není to absence stresu, ale schopnost ho zvládat a růst skrze něj.</p>

            <div class="callout">
                <div class="callout-title">📌 Resilience NENÍ</div>
                <ul style="margin-top: 0.3rem;">
                    <li>Vrozená vlastnost - lze ji rozvíjet</li>
                    <li>Necítit emoce - odolný člověk je cítí, ale zvládá</li>
                    <li>"Tvrdost" nebo necitlivost</li>
                    <li>Absence problémů</li>
                </ul>
            </div>

            <h3>Stres</h3>
            <p><strong>Stres</strong> je fyziologická a psychická reakce na požadavky (stresory), které vnímáme jako přesahující naše zdroje.</p>

            <h4>Hans Selye - obecný adaptační syndrom (GAS)</h4>
            <ol>
                <li><strong>Poplachová reakce</strong> - tělo mobilizuje energii (fight-flight)</li>
                <li><strong>Odpor</strong> - tělo se snaží adaptovat</li>
                <li><strong>Vyčerpání</strong> - pokud stres trvá, dochází k vyčerpání zdrojů</li>
            </ol>

            <h4>Typy stresu</h4>
            <ul>
                <li><strong>Eustres</strong> - pozitivní stres (motivuje, výzva)</li>
                <li><strong>Distres</strong> - negativní stres (poškozuje)</li>
                <li><strong>Akutní stres</strong> - krátkodobý</li>
                <li><strong>Chronický stres</strong> - dlouhodobý, nejnebezpečnější</li>
            </ul>

            <h4>Stresory v práci</h4>
            <ul>
                <li>Pracovní přetížení / nedostatek</li>
                <li>Časový tlak</li>
                <li>Rolové konflikty (role conflict, role ambiguity)</li>
                <li>Mezilidské konflikty</li>
                <li>Nejistota (nejasné očekávání, hrozba propuštění)</li>
                <li>Špatný leadership</li>
                <li>Nedostatek kontroly</li>
                <li>Work-life balance</li>
            </ul>

            <h3>Burnout (vyhoření)</h3>
            <p>Christina Maslach - 3 dimenze vyhoření:</p>
            <ol>
                <li><strong>Emocionální vyčerpání</strong> - "nemám energii"</li>
                <li><strong>Depersonalizace / cynismus</strong> - odstup, lhostejnost k práci a lidem</li>
                <li><strong>Snížený osobní výkon</strong> - pocit neúčinnosti, "nezvládám"</li>
            </ol>

            <p><strong>Fáze vyhoření:</strong></p>
            <ol>
                <li>Nadšení (workaholic, ideály)</li>
                <li>Stagnace (rutina, méně iluzí)</li>
                <li>Frustrace (proč to dělám?)</li>
                <li>Apatie (vyhýbání)</li>
                <li>Vyhoření (krize, nutná pauza/změna)</li>
            </ol>

            <h3>Faktory odolnosti</h3>

            <h4>Osobní faktory</h4>
            <ul>
                <li><strong>Pozitivní myšlení a optimismus</strong> (Seligman - learned optimism)</li>
                <li><strong>Sebevědomí (self-efficacy)</strong> - Bandura</li>
                <li><strong>Smysl pro koherenci</strong> (Antonovsky) - srozumitelnost, zvládnutelnost, smysluplnost</li>
                <li><strong>Hardiness</strong> (Kobasa) - 3 C: commitment, control, challenge</li>
                <li><strong>Growth mindset</strong> (Carol Dweck) - víra ve schopnost růstu</li>
                <li><strong>Emocionální inteligence</strong></li>
                <li><strong>Adaptabilita</strong></li>
                <li><strong>Humor</strong></li>
            </ul>

            <h4>Sociální faktory</h4>
            <ul>
                <li><strong>Sociální podpora</strong> - rodina, přátelé, kolegové</li>
                <li><strong>Mentoři a vzory</strong></li>
                <li><strong>Pocit sounáležitosti</strong></li>
            </ul>

            <h4>Organizační faktory</h4>
            <ul>
                <li><strong>Psychologické bezpečí</strong></li>
                <li><strong>Spravedlnost</strong></li>
                <li><strong>Smysluplnost práce</strong></li>
                <li><strong>Autonomie</strong></li>
                <li><strong>Podpůrný leadership</strong></li>
                <li><strong>Work-life balance</strong></li>
            </ul>

            <h3>Coping strategie (zvládání)</h3>
            <p>Lazarus & Folkman - 2 hlavní typy:</p>
            <ul>
                <li><strong>Problem-focused coping</strong> - zaměřený na problém (řešení, plánování, vyhledání informací). Vhodný, když problém lze ovlivnit.</li>
                <li><strong>Emotion-focused coping</strong> - zaměřený na emoce (přerámování, relaxace, vyjádření emocí). Vhodný, když problém nelze ovlivnit.</li>
            </ul>

            <p>Maladaptivní coping: alkohol, drogy, vyhýbání, popírání, agrese, jídlo.</p>

            <h3>Praktické nástroje k posílení odolnosti</h3>

            <h4>1. Fyzické zdraví</h4>
            <ul>
                <li>Pravidelný pohyb (i 30 min denně významně pomáhá)</li>
                <li>Spánek 7-9 hodin</li>
                <li>Zdravá strava</li>
                <li>Omezení alkoholu a kofeinu</li>
            </ul>

            <h4>2. Psychické techniky</h4>
            <ul>
                <li><strong>Mindfulness a meditace</strong> - vědecky podloženo, snižuje stres</li>
                <li><strong>Kognitivní přerámování</strong> - změna interpretace situace</li>
                <li><strong>Dechová cvičení</strong> (4-7-8 dýchání, box breathing)</li>
                <li><strong>Journaling</strong> - psaní deníku</li>
                <li><strong>Vděčnost</strong> - 3 věci denně</li>
                <li><strong>Pozitivní self-talk</strong></li>
            </ul>

            <h4>3. Sociální podpora</h4>
            <ul>
                <li>Pěstování vztahů</li>
                <li>Otevřená komunikace</li>
                <li>Vyhledání pomoci (mentor, psycholog, koučink)</li>
            </ul>

            <h4>4. Pracovní strategie</h4>
            <ul>
                <li>Stanovování hranic ("ne" je věta)</li>
                <li>Prioritizace (Eisenhowerova matice)</li>
                <li>Pomodoro a strukturovaná práce</li>
                <li>Pauzy a digitální detox</li>
                <li>Smysluplnost (job crafting)</li>
            </ul>

            <h3>Job crafting</h3>
            <p>Wrzesniewski - aktivní formování vlastní práce ve 3 dimenzích:</p>
            <ul>
                <li><strong>Task crafting</strong> - úprava úkolů</li>
                <li><strong>Relational crafting</strong> - úprava vztahů</li>
                <li><strong>Cognitive crafting</strong> - úprava významu práce (jak ji vnímám)</li>
            </ul>

            <h3>Post-traumatický růst</h3>
            <p>Tedeschi & Calhoun - paradoxně, mnozí lidé po těžkých zkušenostech rostou:</p>
            <ul>
                <li>Hlubší ocenění života</li>
                <li>Silnější vztahy</li>
                <li>Nové možnosti a priority</li>
                <li>Vnímání vlastní síly</li>
                <li>Duchovní růst</li>
            </ul>

            <div class="callout tip">
                <div class="callout-title">💡 Klíčový princip</div>
                <p>Resilience není o tom nebýt zraněn. Je to o tom, jak se z toho zotavit a růst. "What doesn't kill you makes you stronger" - ale jen pokud máš zdroje a podporu k zotavení.</p>
            </div>

            <h3>📚 Učební tahák — jak si to zapamatovat</h3>

            <div class="callout tip">
                <div class="callout-title">🧠 Mnemoniky</div>
                <ul style="margin-top: 0.5rem;">
                    <li><strong>Selye GAS — General Adaptation Syndrome:</strong> <em>"ARV"</em> = <strong>A</strong>larm → <strong>R</strong>esistence → <strong>V</strong>yčerpání. <em>"Alarm zazvoní, tělo se brání, nakonec se vyčerpá."</em></li>
                    <li><strong>Lazarus &amp; Folkman — 2 typy copingu:</strong>
                        <ul style="margin-top: 0.3rem;">
                            <li><strong>Problem-focused</strong> = "Měním situaci" (plán, akce, vyjednávání) — když mám kontrolu</li>
                            <li><strong>Emotion-focused</strong> = "Měním sebe" (relaxace, smysl, akceptace) — když nemám kontrolu</li>
                        </ul>
                    </li>
                    <li><strong>Lazarus appraisal:</strong> <em>"Primární hodnocení = ohrožuje mě to? Sekundární = zvládnu to?"</em> Stres vzniká, když je odpověď ANO + NE.</li>
                    <li><strong>Karasek model:</strong> Job Demand × Control → 4 typy: <strong>High strain</strong> (vysoké nároky, žádná kontrola — nejhorší!), <strong>Active</strong> (oboje vysoké — růst), <strong>Low strain</strong> (oboje nízké — pohoda), <strong>Passive</strong> (nízké nároky, žádná kontrola — apatie).</li>
                    <li><strong>Maslach Burnout — 3 komponenty:</strong> <em>"Vyčerpání + Cynismus + Snížená efektivita"</em>. (Exhaustion / Depersonalization / Reduced personal accomplishment).</li>
                    <li><strong>7 C resilience (Ginsburg):</strong> Competence, Confidence, Connection, Character, Contribution, Coping, Control.</li>
                    <li><strong>Flow (Csikszentmihalyi):</strong> = <em>výzva ≈ schopnost</em>. Příliš nízká výzva → nuda. Příliš vysoká → úzkost. Rovnováha → flow.</li>
                    <li><strong>Growth vs Fixed mindset (Dweck):</strong> <em>"Ještě to neumím"</em> vs <em>"Tohle nikdy neuměl"</em>. Klíč k odolnosti.</li>
                </ul>
            </div>

            <div class="callout">
                <div class="callout-title">🎨 Příběh, který si zapamatuješ</div>
                <p><strong>Bambus vs dub.</strong> V bouři se dub postaví větru a zlomí se. Bambus se ohne až k zemi, ale po bouři se zase narovná. <strong>Resilience = bambus, ne dub.</strong> A pak vzpomínka na <strong>Viktora Frankla</strong>, psychiatra co přežil koncentrák a napsal "Hledání smyslu života": <em>"Mezi stimulem a reakcí je prostor. V tom prostoru je naše svoboda a růst."</em> Když ti život vezme všechno, zbude ti svoboda volby vlastního postoje. Praktika? Když přijde stres ze zkoušek: <strong>(1)</strong> co můžu změnit? = plán (problem-focused). <strong>(2)</strong> co změnit nejde? = nadechni se, jdi se proběhnout, zavolej kamarádovi (emotion-focused). <strong>(3)</strong> a pak: spánek 8 h, pohyb, vděčnost 3 věci večer. To jsou stavební kameny odolnosti.</p>
            </div>

            <div class="callout warning">
                <div class="callout-title">⚡ 60 sekund před zkouškou</div>
                <ul style="margin-top: 0.3rem;">
                    <li><strong>Stres:</strong> eustres (motivující) vs distres (škodlivý); akutní vs chronický</li>
                    <li><strong>Selye GAS:</strong> Alarm → Resistence → Vyčerpání</li>
                    <li><strong>Lazarus &amp; Folkman:</strong> kognitivní appraisal (primární/sekundární) + transakční model stresu</li>
                    <li><strong>Coping:</strong> problem-focused vs emotion-focused (+ maladaptivní: alkohol, popírání)</li>
                    <li><strong>Karasek demand-control model</strong> (+ rozšířený o social support: Demand-Control-Support)</li>
                    <li><strong>Burnout (Maslach):</strong> vyčerpání + cynismus + snížená efektivita (3D)</li>
                    <li><strong>Resilience faktory:</strong> vnitřní (osobnost, sebevědomí, mindset) + vnější (rodina, sociální podpora, ekonomické zdroje)</li>
                    <li><strong>7C Ginsburg</strong> · <strong>PERMA model (Seligman):</strong> Positive emotion, Engagement, Relationships, Meaning, Accomplishment</li>
                    <li><strong>Flow</strong> (Csikszentmihalyi): výzva ≈ schopnost</li>
                    <li><strong>Growth mindset</strong> (Dweck) jako protektivní faktor</li>
                    <li><strong>Praktické nástroje:</strong> spánek 7-9h, pohyb 30 min, mindfulness, sociální podpora, hranice, smysl, vděčnost</li>
                </ul>
            </div>

            <div class="callout tip">
                <div class="callout-title">🎬 Doporučená YouTube videa</div>
                <ul style="margin-top: 0.5rem;">
                    <li><a href="https://www.youtube.com/results?search_query=Viktor+Frankl+man+search+for+meaning" target="_blank" rel="noopener">Viktor Frankl — Man's Search for Meaning</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=How+to+make+stress+your+friend+Kelly+McGonigal+TED" target="_blank" rel="noopener">Kelly McGonigal — How to make stress your friend (TED)</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Carol+Dweck+growth+mindset+TED" target="_blank" rel="noopener">Carol Dweck — Growth Mindset (TED)</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Mihaly+Csikszentmihalyi+flow+TED" target="_blank" rel="noopener">Csikszentmihalyi — Flow (TED)</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Maslach+burnout+three+dimensions" target="_blank" rel="noopener">Maslach Burnout — 3 dimensions</a></li>
                    <li><a href="https://www.youtube.com/results?search_query=Lazarus+Folkman+stress+coping+model" target="_blank" rel="noopener">Lazarus &amp; Folkman — coping model</a></li>
                </ul>
            </div>
        `,
        abcd: [
            {
                q: "Resilience (psychická odolnost) je:",
                options: ["Absence stresu a problémů", "Schopnost adaptovat se na stres a zotavit se", "Necitlivost vůči okolí", "Vrozená neměnná vlastnost"],
                correct: 1,
                explanation: "Resilience = schopnost 'odrazit se zpět' z těžkých situací. Není to ne-cítit, ale efektivně se zotavit. Lze ji rozvíjet."
            },
            {
                q: "Hans Selye popsal 3 fáze obecného adaptačního syndromu (GAS):",
                options: ["Stres, distres, eustres", "Poplach, odpor, vyčerpání", "Útok, útěk, zmrazení", "Nadšení, frustrace, vyhoření"],
                correct: 1,
                explanation: "GAS: 1) Poplach (fight-flight), 2) Odpor (adaptace), 3) Vyčerpání (kolaps zdrojů)."
            },
            {
                q: "Eustres je:",
                options: ["Negativní stres, který poškozuje", "Pozitivní stres, který motivuje", "Chronický stres", "Jiný název pro burnout"],
                correct: 1,
                explanation: "Eustres je 'dobrý' stres - výzva, kvůli které se zlepšujeme. Distres je negativní. Hranice je individuální."
            },
            {
                q: "Která dimenze NENÍ součástí Maslachova konceptu burnoutu?",
                options: ["Emocionální vyčerpání", "Depersonalizace/cynismus", "Snížený osobní výkon", "Sociální izolace"],
                correct: 3,
                explanation: "Maslach: 1) emocionální vyčerpání, 2) depersonalizace/cynismus, 3) snížený osobní výkon. Sociální izolace je důsledek, ne dimenze."
            },
            {
                q: "Kobasova 'hardiness' (osobnostní odolnost) zahrnuje 3 C:",
                options: ["Commitment, Control, Challenge", "Compassion, Curiosity, Confidence", "Care, Cooperation, Creativity", "Calm, Clarity, Connection"],
                correct: 0,
                explanation: "Kobasa: Commitment (zapojení), Control (kontrola), Challenge (výzva). Lidé s těmito vlastnostmi zvládají stres lépe."
            },
            {
                q: "Problem-focused coping je vhodný především, když:",
                options: ["Situaci nelze ovlivnit", "Situaci lze ovlivnit a změnit", "Cítíme úzkost", "Jsme vyčerpaní"],
                correct: 1,
                explanation: "Problem-focused = řešíme problém přímo. Vhodné, když máme kontrolu. Pokud nemáme (např. úmrtí blízkého), je vhodnější emotion-focused."
            },
            {
                q: "Která technika je vědecky podložená pro snižování stresu?",
                options: ["Mindfulness/meditace", "Konzumace alkoholu", "Vyhýbání se problémům", "Pasivní sledování TV"],
                correct: 0,
                explanation: "Mindfulness má rozsáhlou vědeckou podporu - snižuje kortizol, zlepšuje regulaci emocí, snižuje úzkost a depresi."
            },
            {
                q: "Job crafting podle Wrzesniewski zahrnuje:",
                options: ["Pouze změnu úkolů", "Úpravu úkolů, vztahů a vnímání významu práce", "Vyhýbání se nepříjemným úkolům", "Žádost o nový job description"],
                correct: 1,
                explanation: "Job crafting má 3 dimenze: task (úkoly), relational (vztahy), cognitive (význam, jak práci vnímám)."
            },
            {
                q: "Post-traumatický růst znamená, že:",
                options: ["Trauma vždy vede k růstu", "Mnozí lidé po těžkých zkušenostech zaznamenají osobní růst", "Trauma nemá psychické dopady", "Trauma se vždy zpracuje rychle"],
                correct: 1,
                explanation: "Tedeschi & Calhoun: paradoxně mnozí lidé po těžkých zkušenostech rostou (vztahy, smysl, síla). Ne automaticky - vyžaduje to zpracování."
            },
            {
                q: "Která strategie je MALADAPTIVNÍM copingem?",
                options: ["Vyhledání sociální podpory", "Plánování řešení", "Konzumace alkoholu/drog k úlevě", "Kognitivní přerámování"],
                correct: 2,
                explanation: "Maladaptivní coping = krátkodobá úleva, dlouhodobé poškození. Patří sem alkohol, drogy, vyhýbání, popírání, jídlo, nadměrné nákupy."
            }
        ],
        open: [
            {
                q: "Vysvětlete rozdíl mezi eustresem a distresem. Uveďte příklady obou.",
                sample: "EUSTRES = pozitivní, motivující stres. Vnímáme ho jako výzvu, energetizuje nás, vede k růstu. PŘÍKLADY: závěrečná zkouška, na kterou jsme připraveni; sportovní soutěž; veřejná prezentace, na kterou se těšíme; nová pracovní příležitost; deadline blízko, ale zvládnutelný. Tělo reaguje aktivací, ale máme kontrolu. DISTRES = negativní, poškozující stres. Vnímáme ho jako hrozbu, paralyzuje nebo přetěžuje. PŘÍKLADY: ztráta blízkého; chronický nedostatek spánku; toxický šéf; finanční problémy; nemoc; přetížení bez možnosti odpočinku. HRANICE JE INDIVIDUÁLNÍ - to, co je pro někoho eustres (skok padákem) je pro jiného distres. KLÍČOVÉ FAKTORY: vnímaná kontrola, dostupné zdroje, trvání. Cíl není odstranit stres, ale udržet ho v zóně eustresu - 'optimum stress level'."
            },
            {
                q: "Popište Maslachův model burnoutu a uveďte, jak ho lze rozpoznat a předejít.",
                sample: "MASLACH 3 DIMENZE: 1) EMOCIONÁLNÍ VYČERPÁNÍ - 'nemám energii', únava, prázdnota, nedostatek motivace. 2) DEPERSONALIZACE/CYNISMUS - odstup od lidí (klientů, kolegů), lhostejnost, sarkasmus, dehumanizace. 3) SNÍŽENÝ OSOBNÍ VÝKON - pocit neúčinnosti, 'nic nedělám pořádně', ztráta sebevědomí. ROZPOZNÁNÍ: chronická únava, ranní hrůza z práce, cynické komentáře, klesající výkon, izolace, fyzické symptomy (bolesti hlavy, žaludku), problémy se spánkem, podrážděnost. PREVENCE: 1) ORGANIZAČNÍ - rozumná pracovní zátěž, autonomie, smysluplnost, spravedlnost, podpora, odměna, hodnoty. 2) INDIVIDUÁLNÍ - hranice (work-life balance), zdraví (spánek, pohyb), zájmy mimo práci, sociální podpora, mindfulness, dovolená. 3) MANAŽERSKÁ - pravidelné 1:1, sledování workloadu, podpůrný styl. JIŽ ROZVINUTÝ BURNOUT: nutná pauza/sabbatical, terapie, případně změna práce."
            },
            {
                q: "Jaké faktory přispívají k vyšší psychické odolnosti? Rozdělte je do kategorií.",
                sample: "OSOBNÍ FAKTORY: 1) Pozitivní myšlení a optimismus (Seligman - learned optimism). 2) Self-efficacy (Bandura) - víra ve vlastní schopnost zvládnout. 3) Smysl pro koherenci (Antonovsky) - svět je srozumitelný, zvládnutelný, smysluplný. 4) Hardiness (Kobasa) - 3 C: commitment, control, challenge. 5) Growth mindset (Dweck) - víra ve schopnost růstu, ne fixní inteligence. 6) Emocionální inteligence - sebevědomí, regulace, empatie. 7) Adaptabilita a flexibilita. 8) Humor a perspektiva. SOCIÁLNÍ FAKTORY: 1) Sociální podpora - rodina, přátelé, kolegové. 2) Mentoři a vzory. 3) Pocit sounáležitosti. 4) Otevřené vztahy. ORGANIZAČNÍ FAKTORY: 1) Psychologické bezpečí. 2) Spravedlivé zacházení. 3) Smysluplnost práce. 4) Autonomie. 5) Podpůrný leadership. 6) Work-life balance. FYZICKÉ FAKTORY: 1) Pohyb. 2) Spánek. 3) Strava. 4) Omezení alkoholu/kofeinu. RESILIENCE JE TRÉNOVATELNÁ - nejde o vrozenou superpower, ale o dovednosti."
            },
            {
                q: "Vysvětlete rozdíl mezi problem-focused a emotion-focused copingem. Uveďte příklady, kdy je vhodný který.",
                sample: "PROBLEM-FOCUSED COPING (Lazarus & Folkman) - zaměřený na problém. Aktivně řešíme situaci: plánujeme, hledáme informace, vyjednáváme, mění situaci. PŘÍKLADY: 1) Příliš mnoho práce → delegace, nová organizace času. 2) Špatný vztah s kolegou → rozhovor, mediace, změna týmu. 3) Nedostatek dovedností → vzdělávání. 4) Studijní stres → vytvoření plánu, vyhledání tutoringu. VHODNÉ, KDYŽ: máme kontrolu, situace je řešitelná, máme zdroje na akci. EMOTION-FOCUSED COPING - zaměřený na emoce. Měníme svou emoční reakci, ne situaci. PŘÍKLADY: 1) Úmrtí blízkého → vyjádření smutku, rituály, sociální podpora, terapie. 2) Diagnóza nemoci → akceptace, smysl, podpora. 3) Nečekaná pohroma → meditace, modlitba. 4) Krátkodobý stres před prezentací → relaxace, dechová cvičení. VHODNÉ, KDYŽ: situaci nelze změnit, je akutní, potřebujeme nejdřív uklidnit emoce. NEJEFEKTIVNĚJŠÍ: kombinace - nejdřív se emočně regulovat, pak řešit. POZOR NA MALADAPTIVNÍ COPING: alkohol, drogy, popírání, vyhýbání - krátkodobá úleva, dlouhodobé zhoršení."
            },
            {
                q: "Navrhněte konkrétní 5 praktických strategií, jak student/zaměstnanec může zvýšit svou psychickou odolnost.",
                sample: "1) FYZICKÉ ZDRAVÍ - základ všeho. 7-9 hodin spánku denně, 30 min pohybu (chůze, sport), zdravá strava, hydratace. Spánková deprivace je nejrychlejší cesta k poklesu odolnosti. 2) MINDFULNESS/MEDITACE - 10 minut denně. Aplikace jako Headspace, Calm, Insight Timer. Vědecky podloženo, že snižuje stres a zlepšuje regulaci emocí. Lze nahradit mindful chůzí, jógou. 3) SOCIÁLNÍ PODPORA - investice do vztahů. Pravidelný kontakt s blízkými, otevřená komunikace o stresu, vyhledání mentora. Při potřebě - psycholog, koučink (není ostuda). Izolace zhoršuje odolnost. 4) HRANICE A PRIORITY - umět říct 'ne'. Eisenhowerova matice (urgentní × důležité), digitální detox večer, ne pracovní emaily o víkendu. Work-life balance. Pomodoro (25 min práce + 5 pauza). 5) SMYSL A VDĚČNOST - každý den večer napsat 3 věci, za které jsem vděčný. Pravidelně se ptát 'proč to dělám?'. Job crafting - upravovat svou práci tak, aby měla větší smysl. Zájmy mimo práci/školu - hobby, dobrovolnictví, kreativita. BONUS: 6) Učení a růst - growth mindset, vidět výzvy jako příležitosti. 7) Profesionální pomoc bez stigmatu - terapie/koučink je investice, ne slabost."
            }
        ]
    }
];
