# FLX4 voor NauticMixxx, versie 2.6

Versie 2.6: SMART CFX gebruikt nu het adres uit jouw log (`0x96 0x00`), en het telvenster voor de startstanden begint bij de eerste vraag die de controller echt bereikt (Mixxx gooit alles uit `init()` weg en start de mapping-timers pas ruim 4 seconden later).

Versie 2.5: de standen van knoppen en schuiven worden bij het opstarten opgehaald en toegepast, de tempo-schuif volgt de schuif zelf (ook na het laden van een liedje), en SMART FADER zet de crossfader uit en aan. Versie 2.4 (jog, EQ, CFX, SMART CFX, sync) staat hieronder.

Versie 2.3: SHIFT + BROWSE (kort) is nu BACK, en draaien aan BROWSE in het deck-beeld zoomt de golfvormen in plaats van de browser te openen. TRIM blijft op -6 dB bij 12 uur (zoals versie 2.2).

Eigen mapping voor de Pioneer DDJ-FLX4, alleen voor de NauticMixxx-app. Er is niets van NauticMixxx of Mixxx aangepast: het zijn twee losse bestanden.

## Wat is nieuw en wat je test

Voorbereiding: sluit NauticMixxx, vervang de twee bestanden in `%LOCALAPPDATA%\NauticMixxx\controllers` door die uit deze zip, start NauticMixxx weer met zijn eigen snelkoppeling.

**Belangrijk: kies de mapping zelf.** NauticMixxx start standaard met zijn eigen FLX4-preset, niet met deze. Ctrl+P, **Controllers**, **DDJ-FLX4**, bij **Load Mapping** kies je **Pioneer DDJ-FLX4 - NauticMixxx (eigen)**, **Enabled** aan, **Apply**, **OK**. Daarna NauticMixxx één keer sluiten en weer starten en kijken of hij er nog staat.

**Nieuw in 2.5 en 2.6 (test deze eerst):**

| # | Wat je doet | Wat je hoort te zien |
|---|---|---|
| G | Zet **voor** het starten alles op duidelijke standen: TRIM op driekwart, een EQ-knop helemaal rechts, de CFX-knop links, beide tempo-schuiven op ongeveer +3%, een kanaalfader half. Start dan NauticMixxx met de FLX4 aangesloten en kijk een seconde na het opstarten naar het scherm, **zonder iets aan te raken** | De knoppen en schuiven op het scherm staan zoals de hardware (trim, EQ, CFX, kanaalfaders, crossfader, tempo). Lukt dit niet: open `mixxx.log` en zoek `STARTSTANDEN`. Er staan twee regels: de eerste zegt dat de eerste vraag is verstuurd, de tweede telt wat de controller binnen 4 seconden daarna doorgaf, per soort. Staat overal 0, dan meldt de FLX4 zijn standen niet na de vraag, en kan geen software het oplossen (zie hieronder) |
| H | Zet een tempo-schuif op +4% (sync uit) en laad een liedje op dat deck | Het liedje start op het tempo van de schuif, zonder dat je de schuif eerst langs het midden hoeft te halen. Is sync aan, dan blijft het tempo van sync |
| I | Raak een tempo-schuif voor het eerst aan (als G de stand niet doorgaf) | Het tempo springt meteen naar de stand van de schuif; daarna werkt de schuif normaal |
| D2 | Druk op **SMART CFX** (de knop die in je log als `0x96 0x00` stond) | De CFX-keten springt naar de volgende (zie D hieronder). Doet hij niets of gebeurt er iets anders (bijvoorbeeld de crossfader gaat uit), dan was `0x96 0x00` een andere knop: zeg het me |
| J | Druk op **SMART FADER** | De crossfader doet niets meer (zoals de THRU-stand van een mixer). Nog een keer drukken zet hem weer aan. Staat in `mixxx.log`: `crossfader UIT (THRU)` of `AAN`. Doet de knop niets: druk een keer op hem en stuur me de regel met `ONBEKENDE KNOP` |

De knopadres van SMART FADER is, net als dat van SMART CFX, nergens openbaar; ik heb een gok erin gezet. Heb je met SMART FADER iets anders bedoeld (bijvoorbeeld het effect dat meekomt als je de fader dichtschuift), zeg het dan.

**Nog niet bevestigd uit 2.4:**

| # | Wat je doet | Wat je hoort te zien |
|---|---|---|
| A | Duw een jogwheel vooruit, hou hem aan en laat los (daarna ook: alleen de rand aanraken en loslaten) | Het liedje stopt of gaat meteen terug naar normaal op het moment dat het wiel stilstaat; geen uitrollen in de software meer |
| B | Draai een EQ-knop (HI, MID of LOW) langzaam van links naar rechts | Links: sterk gedempt maar niet helemaal dood (zoals de Pioneer, -26 dB). 12 uur: onveranderd. Rechts: een lichte boost (+6 dB, was +12) |
| C | Draai de CFX-knop van 12 uur naar links en naar rechts | Rond 12 uur klinkt niets (klikvlak), daarbuiten loopt het filter soepel tot het uiteinde |
| D | Druk op **SMART CFX** | De CFX-keten springt naar de volgende (1 REVERB, 2 PING PONG, 3 NOISE, 4 FILTER) voor beide kanalen. SHIFT + SMART CFX gaat terug. Zie mixxx.log: `SMART CFX: keten N` |
| E | Als D niets doet: druk **een keer** op elke SMART CFX-knop, open `mixxx.log` en zoek `ONBEKENDE KNOP` | Er staat een regel met `status=0x96 noot=0x..`; stuur me die regels. De knopadressen van de FLX4 zijn nergens openbaar, dus ik heb er twee gokken in gezet |
| F | Zet sync op deck 1 aan met BEAT SYNC, laad daarna een ander liedje op deck 1 | De sync-knop staat na het laden uit en het nieuwe liedje start op zijn eigen tempo. Alleen BEAT SYNC zet sync weer aan |

Instellingen voor dit alles staan bovenin het scriptbestand (`jogReleaseRamp`, `eqMode`, `eqCutDb`, `eqBoostDb`, `cfxDeadzone`, `smartCfxKeys`, `smartFaderKeys`, `syncOnLoad`, `startupSync`, `startupWindowMs`, `tempoFollowSlider`, `tempoLoadDelayMs`). Zet `eqMode` op `"mixxx"` voor de oude EQ.

**Eerder, in 2.3:**

| # | Wat je doet | Wat je hoort te zien |
|---|---|---|
| A | In een tracklijst of playlist-lijst: houd **SHIFT** ingedrukt en druk **BROWSE** één keer kort in | Eén niveau terug: van de tracks naar de lijst, van een playlist naar de map erboven, enzovoort |
| B | Hetzelfde terwijl je in het deck-beeld (PERFORMANCE) zit | Er gebeurt niets |
| C | In het deck-beeld: draai **BROWSE** rechtsom, dan linksom | Rechtsom worden de golfvormen groter, linksom kleiner. De browser opent **niet**. Is het andersom dan jij wilt: zie `zoomReverse` onderaan. |
| D | In het deck-beeld: druk **BROWSE** kort in | De browser opent |
| E | **SHIFT + BROWSE** 2 seconden vasthouden, dan loslaten | Het SHORTCUT-paneel opent, en bij loslaten gebeurt er geen BACK |

**Nog te testen uit versie 2:**

| # | Wat je doet | Wat je hoort te zien |
|---|---|---|
| 1 | Open INFO (rechtsboven), draai de **BROWSE-knop** | De **tracklijst** scrolt. De INFO-kolom rechts toont steeds de gemarkeerde track. |
| 2 | Houd de **BROWSE-knop ingedrukt** en draai (INFO open) | Nu scrollen de INFO-regels (bijvoorbeeld de sterren). Loslaten = weer tracks. |
| 3 | Zet een Beat FX aan (**ON/OFF**) en druk **FX SELECT** | Het effect wisselt en blijft aan. Je kunt een heel korte onderbreking horen (minder dan 0,2 seconde). |
| 4 | Zet de Beat FX uit en druk **FX SELECT** | Het effect wisselt en blijft uit |
| 5 | Speel een track op deck 1 en draai de **FILTER-knop van kanaal 1** | Links: geluid wordt dof. Rechts: geluid wordt dun. Midden: onveranderd. Hetzelfde met kanaal 2. |
| 6 | Zelfde test, maar je hoort galm, echo of ruis in plaats van een filter | Zeg me dat. Dan klopt het keten-nummer niet (zie "Onzeker"). |
| 7 | **TRIM** op 12 uur, tracks die eerst in het rood gingen | De meters blijven lager en het geluid clipt niet meer. Rechtsom geeft nog steeds extra versterking. |

Daarna blijft de testlijst van versie 1 gelden (BROWSE, LOAD, SHIFT + LOAD, PLAY, Beat FX, pad-modi, GRID, SHORTCUT, vinyl-stop). Die staat onderaan in "Bediening".

## Wat ik niet in de mapping kan oplossen

**Standen bij het opstarten.** Software kan de stand van een draaiknop of schuif alleen weten als de controller hem doorgeeft. De mapping stuurt bij het starten dezelfde vraag als rekordbox (de SysEx die uit Wireshark komt, elke 200 ms herhaald), en past alles toe wat terugkomt. Antwoordt jouw FLX4 daar niet op, dan blijft het bij de eerste beweging: dat is dan een eigenschap van de hardware, geen fout in de mapping. De regel `STARTSTANDEN` in `mixxx.log` laat zien welke van de twee het is.

**KEY-kolom, regelnummers en key in de playlist-preview.** De kolommen van de tracklijst (PREVIEW, TRACK, ARTIST, BPM, GENRE) en de tekst van de playlist-preview zitten vast ingebakken in de programmacode van NauticMixxx. Een mapping of skin kan daar niets aan veranderen, en de NauticMixxx die nu op je pc staat is een kant-en-klaar programma, dus dit kan ik **niet** in die versie zetten. Wel heb ik de wijziging al klaar voor de volgende build (de Raspberry Pi, of een nieuwe Windows-build): `source-patch/apply-rx3-key-column.py`. Dat geeft de kolommen **# PREVIEW TRACK ARTIST BPM KEY GENRE**, en in de playlist-preview staat voor elke track eerst de toonsoort. Ik heb dat script getest op een nagemaakte versie van de code. Compileren kon ik hier niet, dus de eerste echte build laat zien of het zonder fouten door komt.

De notatie van de toonsoort (1A tot 12B, het Camelot-wiel) stel je in NauticMixxx zelf in: Ctrl+P, **Key Detection**, **Key notation: Lancelot**. Dat is in Mixxx de naam voor Camelot. Nu staat die op *Traditional* (Am, F#m, enzovoort).

Wat nu al kan: links in de lijst staat **KEY** tussen de categorieën om op toonsoort te filteren, en het INFO-paneel toont de toonsoort van de gemarkeerde track.

**Jogwielen die blijven doordraaien.** Ik ga ervan uit dat je bedoelt dat het plateau zelf fysiek doordraait: het draait vrij en de FLX4 heeft geen motor of rem. Dat kan een mapping niet tegenhouden, maar ik kan de gevoeligheid ervan beperken als het geluid er te veel last van heeft. Zeg wat je wilt (bijvoorbeeld "pitch bend alleen zolang ik het wiel aanraak").

**Audio buffer.** Zet de buffer niet op 11 ms. In het log eindigt NauticMixxx precies op het moment dat die waarde werd toegepast (20:36), waarschijnlijk een crash van het geluidsstuurprogramma. 23 ms is veilig.

**Geluid stiller of minder goed dan rekordbox.** NauticMixxx gebruikt voor de FLX4 de geluids-API **MME**. Die loopt via de Windows-volumeregeling, rekordbox gebruikt het eigen ASIO-stuurprogramma van Pioneer en omzeilt Windows. Controleer: Windows, **Instellingen, Systeem, Geluid**, uitvoerapparaat **Line (2- DDJ-FLX4)**, volume op **100%**. Kijk ook in het **Volumemixer** of NauticMixxx daar niet lager staat. En zet de **MASTER LEVEL**-knop van de FLX4 vergelijkbaar met hoe je hem bij rekordbox hebt. Is het daarna nog stil, probeer dan in NauticMixxx (Ctrl+P, Sound Hardware) de **Sound API** "Windows WASAPI" als die in de lijst staat.

## Installatie (eerste keer)

1. Sluit NauticMixxx.
2. Open de Verkenner, tik in de adresbalk `%LOCALAPPDATA%\NauticMixxx\controllers` en druk Enter.
3. Zet daar `FLX4-Nautic.midi.xml` en `FLX4-Nautic-script.js` neer.
4. Start NauticMixxx met de snelkoppeling van NauticMixxx (die gebruikt dit profiel).
5. Ctrl+P, **Controllers**, kies **DDJ-FLX4**, bij **Load Mapping** kies je **Pioneer DDJ-FLX4 - NauticMixxx (eigen)**, vink **Enabled** aan, **Apply**, **OK**.
6. Het tweede apparaat "DDJ-FLX4 ... (HID)" laat je op "No Mapping".

Terugdraaien: kies bij stap 5 de standaardmapping van NauticMixxx, of haal de twee bestanden weg.

## Bediening

| FLX4 | Wat het doet |
|---|---|
| BROWSE draaien | in de browser: lijst; in PERFORMANCE: golfvormen groter/kleiner (rechtsom = groter). Met INFO open: tracks (BROWSE ingedrukt houden + draaien = INFO-regels). |
| BROWSE kort indrukken | browser openen, of geselecteerd item openen |
| BROWSE 2 sec ingedrukt | in de browser: een niveau terug; in PERFORMANCE: GRID-modus aan/uit |
| SHIFT + BROWSE kort | BACK: een niveau terug in de browser (niet als INFO of SHORTCUT open staat) |
| SHIFT + BROWSE 2 sec | SHORTCUT-paneel |
| LOAD 1 / LOAD 2 | PERFORMANCE: kies actief deck. Browser: laad track in dat deck. |
| SHIFT + LOAD 1 | SOURCE |
| SHIFT + LOAD 2 | browser of PERFORMANCE |
| PLAY | play/pauze, met vinyl-stop als dat aanstaat |
| FX SELECT (+SHIFT) | volgend (vorig) Beat FX-effect; een effect dat aan staat blijft aan |
| BEAT ◀ ▶ | parameter van het effect stapsgewijs |
| LEVEL/DEPTH (+SHIFT) | hoeveelheid effect (+SHIFT: meta) |
| ON/OFF (+SHIFT) | effect aan/uit (+SHIFT: uit) |
| CH SELECT | effect op deck 1, deck 2 of master |
| FILTER-knop per kanaal | het filter (CFX) van dat kanaal |
| TRIM | gain; 12 uur is ongeveer -6 dB |
| Pad-modus HOT CUE / BEAT LOOP / BEAT JUMP | zet de pad-pagina in de skin gelijk |

Alle andere knoppen (jogwielen, EQ, SYNC, loops, sampler, pads) werken zoals in de standaard Pioneer-mapping van Mixxx. Als de USB-bron van een deck wegvalt, blokkeert SYNC op dat deck, net als bij NauticMixxx zelf.

## Onzeker (dit kon ik hier niet uitproberen)

Ik kan NauticMixxx hier niet draaien. De logica heb ik getest met een nagebootste omgeving; hoe het in de echte app uitpakt zie ik pas na jouw test.

- **CFX-keten:** NauticMixxx heeft vier Sound Color FX-ketens (1 REVERB, 2 PING PONG, 3 NOISE, 4 FILTER). Ik laad nummer 4 (FILTER), zoals NauticMixxx' eigen script dat bedoelt. Hoor je bij test 6 iets anders, zeg dan welk effect je hoort. Je kunt `cfxPreset` ook zelf aanpassen (zie onder).
- **NauticMixxx zet CFX standaard uit.** Daarom deed de filterknop eerder niets. De mapping zet de keten nu na ongeveer 1 seconde aan, nadat NauticMixxx klaar is met opstarten.
- **FX SELECT en uitgezet effect:** NauticMixxx zet een nieuw gekozen effect altijd uit. De mapping zet het daarna terug als het eerder aan stond. Dat kost een korte onderbreking.
- **TRIM -6 dB:** is een aanname van mij die goed uitpakte bij jou. Nog zachter: zet `trimOffset` op `0.35`. Luider: `0.15`. Helemaal zoals standaard: `0`.
- **BEAT FX-lijst:** ik ga uit van 8 effecten. Zijn het er meer of minder, pas dan `nativeFxCount` aan.
- **BEAT ◀ ▶:** parameter 1 van het effect. NauticMixxx heeft een eigen X-PAD voor Beat FX, maar de FLX4 heeft geen touchpad.
- **Alleen deze pad-modi:** HOT CUE, BEAT LOOP, BEAT JUMP en SAMPLER hebben op de FLX4 pads. Gate cue, Slip loop en Release FX van de RX3 hebben geen eigen FLX4-knop.
- **Kiezen van een ander Sound Color FX** (reverb, ping pong, noise) via de FLX4 zit er nog niet in, alleen FILTER.

## Instellingen aanpassen

Open `FLX4-Nautic-script.js` met Kladblok. Zoek `FLX4RX3.options` (onderin). Sla op, start NauticMixxx opnieuw.

- `turnInPerformance`: `"zoom"` (standaard: draaien in het deck-beeld zoomt de golfvormen) of `"browse"` (draaien opent de browser)
- `zoomReverse`: `false` (rechtsom = groter) of `true` (rechtsom = kleiner)
- `shiftPressBack`: `true` (standaard: SHIFT + BROWSE kort = BACK) of `false` (doet niets)
- `infoTurn`: `"tracks"` (standaard) of `"info"` (INFO-regels scrollen, zoals bij NauticMixxx zelf)
- `fxKeepOnWhenSwitching`: `true` of `false`; `fxRestoreDelayMs`: wachttijd in milliseconden (verhoog naar 150 als het effect na wisselen toch uit blijft)
- `cfxPreset`: 1 REVERB, 2 PING PONG, 3 NOISE, 4 FILTER, 0 = geen keten laden
- `trimOffset`: 0,25 (standaard, 12 uur is ongeveer -6 dB). 0,35 is zachter, 0,15 luider, 0 is zoals de standaardmapping
- `nativeFxCount`: aantal effecten in de Beat FX-lijst
- `fxParamStep`: stapgrootte van BEAT ◀ ▶
- `debug`: `true` schrijft regels met `[FLX4RX3]` in `%LOCALAPPDATA%\NauticMixxx\mixxx.log`. Als iets niet werkt, stuur me de regels uit dat bestand.
