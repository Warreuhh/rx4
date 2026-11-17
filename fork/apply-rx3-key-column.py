#!/usr/bin/env python3
"""NauticMixxx: KEY-kolom en regelnummers in de tracklijst van de browser.

Gebruik (na het toepassen van alle patches/00xx-*.patch op de Mixxx-bronmap):

    python3 -I apply-rx3-key-column.py <pad-naar-mixxx-2.5.6-bronmap>
    python3 -I apply-rx3-key-column.py <pad-naar-bronmap> --check   (alleen controleren)

Wat het doet:
  src/widget/wtracktableview.cpp  de uitgebreide tracklijst krijgt de kolommen
                                  #  PREVIEW  TRACK  ARTIST  BPM  KEY  GENRE
  src/widget/wrx3browser.h        de playlist-preview (rechts, tijdens het scrollen door
                                  playlists) toont voor elke track eerst de toonsoort
  Het script stopt met een duidelijke melding als een stuk code niet meer
  overeenkomt met wat het verwacht; het schrijft dan niets weg.
De toonsoort verschijnt in de notatie die in NauticMixxx is ingesteld
(Voorkeuren, Key detection, Key notation: "Lancelot" geeft 1A-12B).
"""
import re
import sys
from pathlib import Path

SP = r"\s*"


def die(msg):
    sys.exit("FOUT: " + msg)


def sub_once(text, pattern, repl, what):
    new, n = re.subn(pattern, repl, text, count=0, flags=re.S)
    if n != 1:
        die(f"{what}: verwacht 1 plaats, gevonden {n}. De code wijkt af van NauticMixxx 2.0.0; niets is aangepast.")
    return new


def patch(text):
    if "rx3-key-column" in text:
        return None  # al aangepast

    # 1. kolomlijst van de uitgebreide tracklijst
    text = sub_once(
        text,
        r"QStringList\{LIBRARYTABLE_PREVIEW," + SP + r"LIBRARYTABLE_TITLE," + SP +
        r"LIBRARYTABLE_ARTIST," + SP + r"LIBRARYTABLE_BPM," + SP + r"LIBRARYTABLE_GENRE\}",
        "QStringList{LIBRARYTABLE_TRACKNUMBER, LIBRARYTABLE_PREVIEW, LIBRARYTABLE_TITLE,\n"
        "                    LIBRARYTABLE_ARTIST, LIBRARYTABLE_BPM, LIBRARYTABLE_KEY, LIBRARYTABLE_GENRE} /* rx3-key-column */",
        "kolomlijst",
    )

    # 2. schilder-delegate ook voor KEY (de lijst staat in setRx3Browser)
    text = sub_once(
        text,
        r"(for \(const auto& field : \{LIBRARYTABLE_PREVIEW, LIBRARYTABLE_TRACKNUMBER,"
        + SP + r"LIBRARYTABLE_TITLE, LIBRARYTABLE_ARTIST, LIBRARYTABLE_BPM, LIBRARYTABLE_GENRE)\}",
        r"\1, LIBRARYTABLE_KEY}",
        "delegate-lijst",
    )

    # 3. KEY krijgt hetzelfde compacte lettertype als BPM en GENRE
    text = sub_once(
        text,
        r'const bool compact = field == "bpm" \|\| field == "genre";',
        'const bool compact = field == "bpm" || field == "genre" || field == "key";',
        "compact lettertype",
    )

    # 4. kolombreedtes in de uitgebreide tracklijst
    text = sub_once(
        text,
        r"const int genre = bpm \* 2;",
        "const int genre = bpm * 2;\n"
        "        const int number = qRound(54 * scale);\n"
        "        const int key = qRound(bpm * 1.1);",
        "breedte genre",
    )
    text = sub_once(
        text,
        r"viewport\(\)->width\(\) - preview - bpm - genre - 4",
        "viewport()->width() - number - preview - bpm - key - genre - 4",
        "breedte flexibel",
    )
    text = sub_once(
        text,
        r"const int width = field == LIBRARYTABLE_PREVIEW \? preview" + SP +
        r": field == LIBRARYTABLE_TITLE \? title" + SP +
        r": field == LIBRARYTABLE_ARTIST \? artist" + SP +
        r": field == LIBRARYTABLE_BPM \? bpm : genre;",
        "const int width = field == LIBRARYTABLE_TRACKNUMBER ? number\n"
        "                    : field == LIBRARYTABLE_PREVIEW ? preview\n"
        "                    : field == LIBRARYTABLE_TITLE ? title\n"
        "                    : field == LIBRARYTABLE_ARTIST ? artist\n"
        "                    : field == LIBRARYTABLE_BPM ? bpm\n"
        "                    : field == LIBRARYTABLE_KEY ? key : genre;",
        "breedte per kolom",
    )
    return text


def patch_browser(text):
    if "rx3-key-column" in text:
        return None  # al aangepast
    text = sub_once(
        text,
        r"for\(const auto id:playlist->trackIds\) rows\.append\(tracks\.value\(id\)\.title\);",
        "for(const auto id:playlist->trackIds) { /* rx3-key-column */\n"
        "                const auto track=tracks.value(id);\n"
        "                const auto chromatic=KeyUtils::guessKeyFromText(track.key);\n"
        "                const QString key=chromatic==mixxx::track::io::key::INVALID ? track.key\n"
        "                        : KeyUtils::keyToString(chromatic);\n"
        "                rows.append(QStringLiteral(\"%1   %2\").arg(key.leftJustified(3),track.title));\n"
        "            }",
        "playlist-preview",
    )
    if 'track/keyutils.h' not in text:
        text = sub_once(
            text,
            r'(#include "widget/wlibrary\.h"\n)',
            r'#include "track/keyutils.h"\n\1',
            "include keyutils",
        )
    return text


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check = "--check" in sys.argv
    if len(args) != 1:
        die("gebruik: apply-rx3-key-column.py <bronmap> [--check]")
    root = Path(args[0]) / "src" / "widget"
    jobs = [(root / "wtracktableview.cpp", patch), (root / "wrx3browser.h", patch_browser)]
    results = []
    for path, fn in jobs:
        if not path.is_file():
            die(f"{path} bestaat niet. Geef de bronmap van Mixxx 2.5.6 op, nadat de patches zijn toegepast.")
        results.append((path, fn(path.read_text(encoding="utf-8"))))
    done = [r for r in results if r[1] is None]
    if done and len(done) != len(results):
        die("maar een van de twee bestanden is al aangepast; begin met een schone bronmap.")
    if check:
        print("ok: al toegepast" if done else "ok: alle plekken gevonden, niets geschreven")
        return
    if done:
        print("al toegepast, niets te doen")
        return
    for path, new in results:
        path.write_text(new, encoding="utf-8", newline="")
        print(f"ok: {path} aangepast")
    print("kolommen: # PREVIEW TRACK ARTIST BPM KEY GENRE; playlist-preview met toonsoort")


if __name__ == "__main__":
    main()
