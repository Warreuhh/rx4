#!/usr/bin/env python3
"""NauticMixxx eigen fork: kleine aanpassingen in de Mixxx-code, na de 44 patches.

Gebruik (na het toepassen van alle patches/00xx-*.patch op de Mixxx-bronmap):

    python3 -I apply-rx3-fork-tweaks.py <pad-naar-mixxx-2.5.6-bronmap>
    python3 -I apply-rx3-fork-tweaks.py <pad-naar-bronmap> --check   (alleen controleren)

Aanpassingen:
  src/engine/controls/ratecontrol.cpp
      Jog-uitloop. Mixxx middelt de jog (het zijwiel van een draaischijf en elke jog-beweging
      zonder aanraking) over een vast aantal van 25 audioblokjes. Hoe groter de audiobuffer,
      hoe langer de software doorloopt nadat het wiel zelf stilstaat: bij een buffer van 46 ms
      bijna 1,2 seconde. Nu duurt de uitloop ongeveer 60 ms, welke buffer er ook is.

  src/engine/enginebuffer.cpp
      Geen automatische fase-uitlijning bij PLAY. Met Quantize aan lijnt Mixxx een deck dat gaat
      spelen automatisch uit met het andere spelende deck, ook zonder dat BEAT SYNC aanstaat. Nu
      gebeurt dat alleen als het deck gesynchroniseerd is (BEAT SYNC aan).
  src/library/rekordbox/rekordboxruntimetrackmodel.cpp, src/widget/wtracktableview.cpp,
  src/widget/wrx3browser.h
      Tracknummers zoals rekordbox ze naar de USB exporteert: de volgorde in de afspeellijst
      (001, 002, ...) in de kolom "#" van de USB-tracklijst en in de voorbeeldlijst van de browser.
      De nummers blijven kloppen als je de lijst anders sorteert.

Het script stopt met een duidelijke melding als een stuk code niet meer overeenkomt met wat het
verwacht; het schrijft dan niets weg. Het is veilig om het opnieuw te draaien.
"""
import re
import sys
from pathlib import Path

MARKER = "rx3-fork-jog"
SP = r"\s*"


def die(msg):
    sys.exit("FOUT: " + msg)


def sub_once(text, pattern, repl, what):
    new, n = re.subn(pattern, lambda _m: repl, text, count=0, flags=re.S)
    if n != 1:
        die(f"{what}: verwacht 1 plaats, gevonden {n}. De code wijkt af van NauticMixxx 2.0.0; niets is aangepast.")
    return new


JOG_BLOCK = """\
// rx3-fork-jog: het jog-filter middelt over een vast aantal blokjes (25). De uitloop na
        // loslaten groeit dan mee met de audiobuffer (bij 46 ms bijna 1,2 seconde). Hier
        // duurt de uitloop ongeveer 60 ms, welke buffer er ook is.
        {
            const double jogTrackRate = frameInfo().sampleRate.toDouble();
            const double jogSampleRate = jogTrackRate > 0.0 ? jogTrackRate : 44100.0;
            const double jogBlockMs =
                    static_cast<double>(iSamplesPerBuffer) / 2.0 / jogSampleRate * 1000.0;
            if (jogBlockMs > 0.0) {
                const int jogBlocks = static_cast<int>(std::lround(60.0 / jogBlockMs));
                m_pJogFilter->setFilterLength(math_max(1, math_min(jogBlocks, 25)));
            }
        }
        double jogFactor = getJogFactor();"""


def patch_ratecontrol(text):
    if MARKER in text:
        return None  # al aangepast
    return sub_once(
        text,
        r"double jogFactor" + SP + r"=" + SP + r"getJogFactor\(\);",
        JOG_BLOCK,
        "jog-filter",
    )


def patch_enginebuffer(text):
    marker = "rx3-fork-nophase"
    if marker in text:
        return None
    repl = (
        "if (m_pQuantize->toBool()\n"
        "                // rx3-fork-nophase: alleen fase uitlijnen als BEAT SYNC aanstaat.\n"
        "                && (isLeader(m_pSyncControl->getSyncMode())\n"
        "                        || isFollower(m_pSyncControl->getSyncMode()))\n"
        "#ifdef __VINYLCONTROL__"
    )
    return sub_once(
        text,
        r"if \(m_pQuantize->toBool\(\)\s*\n#ifdef __VINYLCONTROL__",
        repl,
        "fase-uitlijning bij play",
    )


def patch_rekordbox_model(text):
    marker = "rx3-tracknr"
    if marker in text:
        return None
    text = sub_once(
        text,
        r"(        LIBRARYTABLE_FILETYPE,\n)(\};)",
        "        LIBRARYTABLE_FILETYPE,\n        LIBRARYTABLE_TRACKNUMBER, // rx3-tracknr\n};",
        "kolommen van het USB-model",
    )
    text = sub_once(
        text,
        r"(    case ColumnCache::COLUMN_LIBRARYTABLE_FILETYPE:\n        return QFileInfo\(track->resolvedAudioPath\)\.suffix\(\);\n)",
        "    case ColumnCache::COLUMN_LIBRARYTABLE_TRACKNUMBER: // rx3-tracknr\n"
        "        // Volgorde in de afspeellijst zoals rekordbox die exporteert; het model "
        "houdt de rijen in die volgorde, sorteren gebeurt in de proxy.\n"
        "        return index.row() + 1;\n"
        "    case ColumnCache::COLUMN_LIBRARYTABLE_FILETYPE:\n"
        "        return QFileInfo(track->resolvedAudioPath).suffix();\n",
        "rawValue van het USB-model",
    )
    return text


def patch_tracktableview(text):
    marker = "rx3-tracknr"
    if marker in text:
        return None
    old = (
        "QString label = field == \"tracknumber\" ? "
        "QString::number(index.row()+1).rightJustified(3, '0') : index.data().toString();"
    )
    if text.count(old) != 1:
        die(f"tracknummer-label: verwacht 1 plaats, gevonden {text.count(old)}. De code wijkt af; niets is aangepast.")
    new = (
        "QString label = index.data().toString();\n"
        "            if (field == \"tracknumber\") { // rx3-tracknr\n"
        "                // USB-lijst: positie in de afspeellijst van rekordbox (ook na sorteren).\n"
        "                auto numberIndex = index;\n"
        "                auto* numberModel = m_view->model();\n"
        "                while (auto* proxy = qobject_cast<QAbstractProxyModel*>(numberModel)) {\n"
        "                    numberIndex = proxy->mapToSource(numberIndex);\n"
        "                    numberModel = proxy->sourceModel();\n"
        "                }\n"
        "                const bool usbList = qobject_cast<mixxx::rekordbox::RekordboxRuntimeTrackModel*>(numberModel) != nullptr;\n"
        "                label = QString::number((usbList ? numberIndex.row() : index.row()) + 1).rightJustified(3, '0');\n"
        "            }"
    )
    return text.replace(old, new)


def patch_browser_preview(text):
    marker = "rx3-tracknr"
    if marker in text:
        return None
    old = 'rows.append(QStringLiteral("%1   %2").arg(key.leftJustified(3),track.title));'
    if text.count(old) != 1:
        die(f"voorbeeldlijst: verwacht 1 plaats, gevonden {text.count(old)}. De code wijkt af; niets is aangepast.")
    new = (
        'rows.append(QStringLiteral("%1  %2   %3") /* rx3-tracknr */\n'
        "                        .arg(rows.size()+1,3,10,QLatin1Char('0'))\n"
        "                        .arg(key.leftJustified(3),track.title));"
    )
    return text.replace(old, new)


TWEAKS = [
    ("src/engine/controls/ratecontrol.cpp", patch_ratecontrol, "jog-uitloop"),
    ("src/engine/enginebuffer.cpp", patch_enginebuffer, "geen fase-uitlijning bij play zonder BEAT SYNC"),
    ("src/library/rekordbox/rekordboxruntimetrackmodel.cpp", patch_rekordbox_model, "tracknummers (model)"),
    ("src/widget/wtracktableview.cpp", patch_tracktableview, "tracknummers (tracklijst)"),
    ("src/widget/wrx3browser.h", patch_browser_preview, "tracknummers (voorbeeldlijst)"),
]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check = "--check" in sys.argv
    if len(args) != 1:
        die("gebruik: apply-rx3-fork-tweaks.py <bronmap> [--check]")
    root = Path(args[0])
    changes = []
    for rel, func, what in TWEAKS:
        path = root / rel
        if not path.is_file():
            die(f"{path} bestaat niet. Geef de bronmap van Mixxx 2.5.6 op, nadat de patches zijn toegepast.")
        text = path.read_text(encoding="utf-8")
        new = func(text)
        if new is not None:
            changes.append((path, new, what))
    if not changes:
        print("fork-aanpassingen: al toegepast, niets te doen.")
        return
    if check:
        print("fork-aanpassingen: kunnen worden toegepast (geen fouten): " + ", ".join(c[2] for c in changes))
        return
    for path, new, _what in changes:
        path.write_text(new, encoding="utf-8", newline="")
    print("fork-aanpassingen toegepast: " + ", ".join(c[2] for c in changes))


if __name__ == "__main__":
    main()
