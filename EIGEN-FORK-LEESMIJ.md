# Eigen versie van NauticMixxx voor de DDJ-FLX4

Dit is een kopie van de NauticMixxx 2.0.0-bron met onze eigen wijzigingen erbovenop. GitHub bouwt er een installer (Windows) en een pakket (Raspberry Pi) van. Wij hoeven niets zelf te compileren.

## Testlijst voor versie 2.7 (fase bij PLAY, tracknummers, CFX-naam, BEAT SYNC, startstanden)

Deze versie bevat nieuwe programmacode (C++) en een aangepaste skin. Je hebt dus **een nieuwe installer** nodig: start in GitHub, tabblad **Actions**, de workflow **NauticMixxx Windows x64**, wacht tot er een groen vinkje staat en installeer de `...-Setup.exe` uit het bestand `nauticmixxx-windows-...` onderaan de run (sluit NauticMixxx eerst af). Zet daarna ook de **twee bestanden uit `FLX4-Nautic-v2.7.zip`** in `%LOCALAPPDATA%\NauticMixxx\controllers` (overschrijven): die map gaat voor op de mapping in de installer.

| # | Wat je doet | Wat je hoort te zien |
|---|---|---|
| 1 | Deck 1 speelt. Zet op deck 2 een liedje klaar, **BEAT SYNC uit**, en druk **PLAY** | Deck 2 start precies op de plek waar het stond, **zonder** dat het zichzelf op de maat van deck 1 zet. Pas als je **BEAT SYNC** indrukt, volgen tempo en maat |
| 2 | Druk **BEAT SYNC** met twee spelende liedjes. Open daarna `mixxx.log` en zoek `SYNC-METING` | Tempo en maat komen overeen. In het log staat per deck de BPM, het tempo, de beat-afstand en het **fase-verschil in ms**. Klopt het niet: stuur me die regel plus wat je hoort (loopt het steeds verder uit elkaar, of staat het vast ernaast?) |
| 3 | Open een playlist op de USB en bekijk de tracklijst | Links staat **#** met **001, 002, ...**: de volgorde zoals rekordbox de lijst naar de USB exporteerde. Sorteer je op artiest of BPM, dan blijven de nummers bij de tracks horen |
| 4 | Selecteer een playlist links in de browser en kijk naar de lijst rechts | Voor elke track staat eerst het nummer, dan de toonsoort, dan de titel |
| 5 | Kijk in de balk bovenaan het scherm (links van de klok) | Er staat **CFX** met daarachter de gekozen keten (bijvoorbeeld **FILTER**) |
| 6 | Druk een paar keer op **SMART CFX** | De naam bovenin wisselt: REVERB, PING PONG, NOISE, FILTER en weer van voren af. Geen lege stand meer. SHIFT + SMART CFX gaat terug |
| 7 | Zet voor het starten knoppen en schuiven op duidelijke standen en start NauticMixxx; kijk dan in `mixxx.log` naar `STARTSTANDEN` | Staat er niet overal 0, dan neemt het scherm de standen over. Staat er wel overal 0, dan meldt de FLX4 niets na de vraag (de mapping stuurt in 2.7 ook de laadanimatie van de jogs opnieuw, zoals de standaardmapping), en dan zeg me dat |
| 8 | De punten uit 2.4 tot 2.6 (jog, EQ, CFX, SMART FADER, tempo) | Zie `fork/FLX4-LEESMIJ.md` |

## Eerdere testlijst (versie 2.6)

De bouw was alleen anders in de FLX4-mapping (JavaScript).

| # | Wat je doet | Wat je hoort te zien |
|---|---|---|
| 1 | Het programma staat al op je pc; je hoeft alleen de twee bestanden uit de zip te vervangen (of de nieuwe `...-Setup.exe` uit de Actions-run te installeren) | Het programma start; bij Controllers staat de mapping als versie 2.6 |
| 2 | Duw een jogwheel vooruit en laat los. Probeer ook de rand van het wiel (zonder aanraking van de bovenkant) | Geen uitrollen meer na loslaten: de software staat stil op het moment dat het wiel stilstaat |
| 3 | De overige punten staan in de tabel van de mapping: D2 en G tot J voor 2.5 en 2.6 (SMART CFX, startstanden, tempo, SMART FADER) en A tot F voor 2.4 (EQ, CFX, SMART CFX, sync) | Zie `fork/FLX4-LEESMIJ.md` |

## Eerdere testlijst (versie 2.3, niet allemaal bevestigd)

Zolang er nog nooit gebouwd is, weten we niet zeker dat de nieuwe C++-regels compileren. De bouw zelf is dus de eerste test. Gaat die rood, dan staat in het log precies welke regel het is en pas ik die aan.

| # | Wat je doet | Wat je hoort te zien |
|---|---|---|
| 1 | In GitHub, tabblad **Actions**: start **NauticMixxx Windows x64** en wacht (rond de 1 tot 2 uur) | Groen vinkje. Onderaan de run staat een downloadbaar bestand `nauticmixxx-windows-...` |
| 2 | Installeer de `...-Setup.exe` uit dat bestand (sluit de oude NauticMixxx eerst af) | Het programma start en laat de bekende RX3-schermen zien |
| 3 | Sluit de DDJ-FLX4 aan en start het programma, **zonder** iets in Voorkeuren te kiezen | In het log (`mixxx.log`) staat `[FLX4RX3] mapping gestart`. BROWSE, LOAD, Beat FX en CFX werken zoals in versie 2.3 |
| 4 | Open een playlist op de USB en bekijk de tracklijst | Kolommen: **# PREVIEW TRACK ARTIST BPM KEY GENRE**, met rijnummers 001, 002, ... |
| 5 | Scroll door je playlists links, en kijk naar de lijst rechts | Voor elke track staat eerst de toonsoort, dan de titel |
| 6 | Ctrl+P, **Key Detection**, **Key notation: Lancelot** | KEY toont 1A tot 12B in plaats van Am, F#m, enzovoort |
| 7 | Menu **Updates** | Er verschijnt geen melding over een nieuwe NauticMixxx. De updater kijkt alleen naar jouw eigen repo |

Als stap 3 faalt (de FLX4 start met de oude NauticMixxx-mapping), stuur me dan de laatste 30 regels van `mixxx.log`.

## Wat is er anders dan in NauticMixxx 2.0.0

- **FLX4-mapping ingebouwd.** `FLX4-Nautic.midi.xml` en `FLX4-Nautic-script.js` zitten in de installer. Voor een DDJ-FLX4 zonder opgeslagen mapping kiest het programma nu deze, dus je hoeft niets meer te selecteren. Dat is ook wat de Raspberry Pi nodig heeft, want die begint zonder profiel. Regel 25 van patch 0016 is hiervoor aangepast.
- **KEY-kolom, rijnummers en toonsoort in de playlist-preview.** Dit gebeurt in `fork/apply-rx3-key-column.py`. Dat script draait in beide bouwscripts (Linux en Windows) direct nadat de 44 patches zijn toegepast. Het weigert iets te doen als de code afwijkt van wat het verwacht, en je kunt het veilig opnieuw draaien. Ik heb het niet als 45e patch gemaakt, want zowel het Windows-script als `release-audit.py` eisen precies 44 patches.
- **Kortere jog-uitloop.** Mixxx middelt de jog over 25 audioblokjes; bij jouw buffer van 46 ms is dat bijna 1,2 seconde. `fork/apply-rx3-fork-tweaks.py` maakt daar ongeveer 60 ms van, welke buffer je ook gebruikt.
- **Geen automatische maat-uitlijning bij PLAY.** Staat Quantize aan (zoals bij jou), dan zette Mixxx een deck dat gaat spelen vanzelf op de maat van het andere spelende deck, ook zonder BEAT SYNC. Hetzelfde script (`apply-rx3-fork-tweaks.py`, `enginebuffer.cpp`) doet dat nu alleen nog als BEAT SYNC aanstaat. Quantize voor cue's en loops blijft werken.
- **Tracknummers van rekordbox.** De USB-tracklijst kreeg geen kolom **#** (het model had die kolom niet). Nu toont `#` de plaats in de afspeellijst zoals rekordbox hem exporteerde (001, 002, ...), ook na sorteren, en de voorbeeldlijst rechts in de browser begint elke regel met dat nummer. Ook dit zit in `apply-rx3-fork-tweaks.py`.
- **CFX-naam op het scherm.** In de skin staat in de topbalk **CFX** met de gekozen Sound Color FX-keten (`skins/XDJ_RX3_Mixxx/topbar.xml` en `style.qss`).
- **Updater naar eigen repo.** De startcontrole keek naar `nauticsoftware/NauticMixxx`. Daarmee kon onze versie je een update van het originele programma aanbieden. In patch 0019 staat nu een plaatshouder, en elke bouw vult de naam van de repo waarin hij draait.
- **Workflows.** De Windows-bouw draaide alleen in de originele repo; dat is losgelaten. De Raspberry Pi-bouw bewaart het pakket nu standaard (14 dagen).

Alles wat verder in NauticMixxx zit, blijft zoals het was. Mijn eigen tests (22 scripts van het project zelf) geven hetzelfde resultaat als op het origineel. Eén test slaat hier over omdat hij een gebouwde Mixxx-map nodig heeft.

## Wat nog niet gedaan is, en waarom

- **Eigen naam.** Het programma heet nog NauticMixxx. De naam zit in zo'n 50 bestanden en de installertest controleert hem letterlijk. Elke wijziging die ik niet kan bouwen, kan de bouw breken. Daarom doen we dit pas als de eerste bouw groen is, en vóórdat je iets deelt. Zie hieronder.
- **Raspberry Pi.** De bouw is voor Debian 12 (Raspberry Pi OS "bookworm"). Nieuwere Pi-installaties draaien Debian 13. Of het pakket daar werkt, moeten we testen.
- **macOS.** Niet aangesloten op onze stap.
- **Liedjes kiezen (BROWSE).** Je zei dat het nog niet perfect is. Wat precies, vertel ik graag: het scrollen, wat er in de lijst staat, laden naar een deck, of zoeken?

## Licentie en naam (belangrijk als je iets deelt)

- NauticMixxx-onderdelen zijn GPL v3, de Mixxx-engine is GPL v2 of nieuwer. Een eigen versie maken mag. Geef je het ooit aan iemand, dan moet de broncode meegaan.
- Het project vraagt in `TRADEMARKS.md` dat hun naam en icoon alleen voor hun eigen versie gelden. Voor eigen gebruik maakt dat niet uit. Voor delen: eerst een eigen naam en icoon, en nooit Pioneer, XDJ-RX3 of rekordbox als productnaam.
- Een **publieke** repo is nodig: de gratis bouwmachines (ook de ARM-machine voor de Pi) zijn alleen voor publieke repo's. In de code staan geen wachtwoorden of sleutels.

## Bestanden

- `fork/apply-rx3-key-column.py`: de KEY-wijziging.
- `fork/apply-rx3-fork-tweaks.py`: de kortere jog-uitloop, geen maat-uitlijning bij PLAY zonder BEAT SYNC en de tracknummers.
- `.github/workflows/inspect-mixxx-source.yml`: hulpmiddel om de Mixxx-code na de patches in het log te lezen (bouwt niets).
- `controllers/Pioneer_DDJ_FLX4_RX3/FLX4-Nautic.*`: onze FLX4-mapping.
- `fork/FLX4-LEESMIJ.md`: de uitleg van de FLX4-mapping (knoppen, opties).
- `.github/workflows/`: de bouw voor Windows en Raspberry Pi.
