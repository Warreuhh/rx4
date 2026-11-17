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


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    check = "--check" in sys.argv
    if len(args) != 1:
        die("gebruik: apply-rx3-fork-tweaks.py <bronmap> [--check]")
    path = Path(args[0]) / "src" / "engine" / "controls" / "ratecontrol.cpp"
    if not path.is_file():
        die(f"{path} bestaat niet. Geef de bronmap van Mixxx 2.5.6 op, nadat de patches zijn toegepast.")
    text = path.read_text(encoding="utf-8")
    new = patch_ratecontrol(text)
    if new is None:
        print("fork-aanpassingen: al toegepast, niets te doen.")
        return
    if check:
        print("fork-aanpassingen: kunnen worden toegepast (geen fouten).")
        return
    path.write_text(new, encoding="utf-8", newline="")
    print("fork-aanpassingen toegepast: jog-uitloop (ratecontrol.cpp).")


if __name__ == "__main__":
    main()
