# Eigen versie van NauticMixxx voor de DDJ-FLX4

Dit is een kopie van de NauticMixxx 2.0.0-bron met onze eigen wijzigingen erbovenop. GitHub bouwt er een installer (Windows) en een pakket (Raspberry Pi) van. Wij hoeven niets zelf te compileren.

## Testlijst voor versie 2.5 (startstanden, tempo-schuif, SMART FADER)

De bouw is dit keer alleen anders in de FLX4-mapping (JavaScript); er is niets nieuws om te compileren.

| # | Wat je doet | Wat je hoort te zien |
|---|---|---|
| 1 | Het programma staat al op je pc; je hoeft alleen de twee bestanden uit de zip te vervangen (of de nieuwe `...-Setup.exe` uit de Actions-run te installeren) | Het programma start; bij Controllers staat de mapping als versie 2.5 |
| 2 | Duw een jogwheel vooruit en laat los. Probeer ook de rand van het wiel (zonder aanraking van de bovenkant) | Geen uitrollen meer na loslaten: de software staat stil op het moment dat het wiel stilstaat |
| 3 | De overige punten staan in de tabel van de mapping: G tot J voor 2.5 (startstanden, tempo, SMART FADER) en A tot F voor 2.4 (EQ, CFX, SMART CFX, sync) | Zie `fork/FLX4-LEESMIJ.md` |

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
- `fork/apply-rx3-fork-tweaks.py`: de kortere jog-uitloop.
- `.github/workflows/inspect-mixxx-source.yml`: hulpmiddel om de Mixxx-code na de patches in het log te lezen (bouwt niets).
- `controllers/Pioneer_DDJ_FLX4_RX3/FLX4-Nautic.*`: onze FLX4-mapping.
- `fork/FLX4-LEESMIJ.md`: de uitleg van de FLX4-mapping (knoppen, opties).
- `.github/workflows/`: de bouw voor Windows en Raspberry Pi.
