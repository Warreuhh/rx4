// FLX4-Nautic-script.js
// ****************************************************************************
// * Eigen mapping voor de Pioneer DDJ-FLX4, uitsluitend voor NauticMixxx
// * (native XDJ-RX3-app, Mixxx 2.5.6 + NauticMixxx-patches) en zijn RX3-skin.
// *
// * Basis:   de ingebouwde Mixxx-mapping "Pioneer DDJ-FLX4" (Pioneer-DDJ-FLX4-script.js)
// *          (auteurs: Warker, nschloe, dj3730, jusko, Robert904).
// * Bevat:   het encoder-gebaar en de vinyl-stop uit NauticMixxx' eigen FLX4-bestanden
// *          (Nautic-RX3-Encoder-FLX4.js / Pioneer-DDJ-FLX4-RX3-Browser.js, NauticMixxx, GPL).
// * Eigen:   LOAD-gedrag, Beat FX op de native Beat FX-bank, koppeling van de
// *          pad-modi met de skin (zie onderaan, "NauticMixxx-laag").
// * Licentie: GPL (zoals Mixxx en de basis-mapping).
// *
// * Dit bestand staat los van de bestanden van NauticMixxx en past die niet aan.
// ****************************************************************************
//
//  Indeling op de FLX4:
//    BROWSE (draaiknop)  draaien   = in BROWSE: lijst; in PERFORMANCE: BROWSE openen
//                        indrukken = BROWSE openen / geselecteerd item openen (korte druk)
//                        2 sec ingedrukt houden = een niveau terug (in BROWSE),
//                                       GRID-modus aan/uit (in PERFORMANCE)
//                        SHIFT + 2 sec houden = SHORTCUT-paneel
//    LOAD 1 / LOAD 2     in PERFORMANCE: kiest het deck (actief deck)
//                        in BROWSE: laadt de geselecteerde track in dat deck
//                        SHIFT + LOAD 1 = SOURCE, SHIFT + LOAD 2 = BROWSE <-> PERFORMANCE
//    PLAY                play/pauze; met VINYL SPEED/STOP aan in SHORTCUT: vinyl-stop
//    CFX (FILTER)        NauticMixxx' filterketen wordt bij het starten aangezet
//    TRIM                12 uur = ongeveer -6 dB (instelbaar: options.trimOffset)
//    BEAT FX             werkt op het ene Beat FX-effect van de skin (slot 1, unit 1)
//                          FX SELECT = volgend effect (SHIFT: vorig)
//                          BEAT < / >  = parameter 1 stapsgewijs
//                          LEVEL/DEPTH = wet/dry (SHIFT: meta)
//                          ON/OFF      = aan/uit (SHIFT: uit)
//                          CH SELECT   = deck 1 / deck 2 / MASTER
//    Pad-modi            HOT CUE, BEAT LOOP, BEAT JUMP schakelen de pad-pagina in de skin mee
//

var FLX4RX3 = {};

FLX4RX3.lights = {
    beatFx: {
        status: 0x94,
        data1: 0x47,
    },
    shiftBeatFx: {
        status: 0x94,
        data1: 0x43,
    },
    deck1: {
        vuMeter: {
            status: 0xB0,
            data1: 0x02,
        },
        playPause: {
            status: 0x90,
            data1: 0x0B,
        },
        shiftPlayPause: {
            status: 0x90,
            data1: 0x47,
        },
        cue: {
            status: 0x90,
            data1: 0x0C,
        },
        shiftCue: {
            status: 0x90,
            data1: 0x48,
        },
        hotcueMode: {
            status: 0x90,
            data1: 0x1B,
        },
        keyboardMode: {
            status: 0x90,
            data1: 0x69,
        },
        padFX1Mode: {
            status: 0x90,
            data1: 0x1E,
        },
        padFX2Mode: {
            status: 0x90,
            data1: 0x6B,
        },
        beatJumpMode: {
            status: 0x90,
            data1: 0x20,
        },
        beatLoopMode: {
            status: 0x90,
            data1: 0x6D,
        },
        samplerMode: {
            status: 0x90,
            data1: 0x22,
        },
        keyShiftMode: {
            status: 0x90,
            data1: 0x6F,
        },
    },
    deck2: {
        vuMeter: {
            status: 0xB0,
            data1: 0x02,
        },
        playPause: {
            status: 0x91,
            data1: 0x0B,
        },
        shiftPlayPause: {
            status: 0x91,
            data1: 0x47,
        },
        cue: {
            status: 0x91,
            data1: 0x0C,
        },
        shiftCue: {
            status: 0x91,
            data1: 0x48,
        },
        hotcueMode: {
            status: 0x91,
            data1: 0x1B,
        },
        keyboardMode: {
            status: 0x91,
            data1: 0x69,
        },
        padFX1Mode: {
            status: 0x91,
            data1: 0x1E,
        },
        padFX2Mode: {
            status: 0x91,
            data1: 0x6B,
        },
        beatJumpMode: {
            status: 0x91,
            data1: 0x20,
        },
        beatLoopMode: {
            status: 0x91,
            data1: 0x6D,
        },
        samplerMode: {
            status: 0x91,
            data1: 0x22,
        },
        keyShiftMode: {
            status: 0x91,
            data1: 0x6F,
        },
    },
};

// Store timer IDs
FLX4RX3.timers = {};

// Keep alive timer
FLX4RX3.sendKeepAlive = function() {
    midi.sendSysexMsg([0xF0, 0x00, 0x40, 0x05, 0x00, 0x00, 0x04, 0x05, 0x00, 0x50, 0x02, 0xf7], 12); // This was reverse engineered with Wireshark
};

// Jog wheel constants
FLX4RX3.vinylMode = true;
FLX4RX3.alpha = 1.0/8;
FLX4RX3.beta = FLX4RX3.alpha/32;

// Multiplier for fast seek through track using SHIFT+JOGWHEEL
FLX4RX3.fastSeekScale = 150;
FLX4RX3.bendScale = 0.8;

FLX4RX3.tempoRanges = [0.06, 0.10, 0.16, 0.25];

FLX4RX3.shiftButtonDown = [false, false];

// Jog wheel loop adjust
FLX4RX3.loopAdjustIn = [false, false];
FLX4RX3.loopAdjustOut = [false, false];
FLX4RX3.loopAdjustMultiply = 50;

// Beatjump pad (beatjump_size values)
FLX4RX3.beatjumpSizeForPad = {
    0x20: -1, // PAD 1
    0x21: 1,  // PAD 2
    0x22: -2, // PAD 3
    0x23: 2,  // PAD 4
    0x24: -4, // PAD 5
    0x25: 4,  // PAD 6
    0x26: -8, // PAD 7
    0x27: 8   // PAD 8
};

FLX4RX3.quickJumpSize = 32;

// Used for tempo slider
FLX4RX3.highResMSB = {
    "[Channel1]": {},
    "[Channel2]": {}
};

FLX4RX3.trackLoadedLED = function(value, group, _control) {
    midi.sendShortMsg(
        0x9F,
        group.match(script.channelRegEx)[1] - 1,
        value > 0 ? 0x7F : 0x00
    );
};

FLX4RX3.toggleLight = function(midiIn, active) {
    midi.sendShortMsg(midiIn.status, midiIn.data1, active ? 0x7F : 0);
};

//
// Init
//

FLX4RX3.init = function() {
    engine.setValue(FLX4RX3.fxUnit, "show_focus", 1);

    engine.makeConnection("[Channel1]", "vu_meter", FLX4RX3.vuMeterUpdate);
    engine.makeConnection("[Channel2]", "vu_meter", FLX4RX3.vuMeterUpdate);

    FLX4RX3.toggleLight(FLX4RX3.lights.deck1.vuMeter, false);
    FLX4RX3.toggleLight(FLX4RX3.lights.deck2.vuMeter, false);

    engine.softTakeover("[Channel1]", "rate", true);
    engine.softTakeover("[Channel2]", "rate", true);
    engine.softTakeover("[EffectRack1_EffectUnit1_Effect1]", "meta", true);
    engine.softTakeover("[EffectRack1_EffectUnit1_Effect2]", "meta", true);
    engine.softTakeover("[EffectRack1_EffectUnit1_Effect3]", "meta", true);
    engine.softTakeover("[EffectRack1_EffectUnit1]", "mix", true);

    const samplerCount = 16;
    if (engine.getValue("[App]", "num_samplers") < samplerCount) {
        engine.setValue("[App]", "num_samplers", samplerCount);
    }
    for (let i = 1; i <= samplerCount; ++i) {
        engine.makeConnection("[Sampler" + i + "]", "play", FLX4RX3.samplerPlayOutputCallbackFunction);
    }

    engine.makeConnection("[Channel1]", "track_loaded", FLX4RX3.trackLoadedLED);
    engine.makeConnection("[Channel2]", "track_loaded", FLX4RX3.trackLoadedLED);

    // play the "track loaded" animation on both decks at startup
    midi.sendShortMsg(0x9F, 0x00, 0x7F);
    midi.sendShortMsg(0x9F, 0x01, 0x7F);

    FLX4RX3.setLoopButtonLights(0x90, 0x7F);
    FLX4RX3.setLoopButtonLights(0x91, 0x7F);

    engine.makeConnection("[Channel1]", "loop_enabled", FLX4RX3.loopToggle);
    engine.makeConnection("[Channel2]", "loop_enabled", FLX4RX3.loopToggle);

    // RX3: Beat FX = slot 1 van effect-unit 1 (de rest van de LED-logica volgt dat slot)
    engine.makeConnection(FLX4RX3.fxSlot, "enabled", FLX4RX3.toggleFxLight);
    engine.makeConnection(FLX4RX3.fxUnit, "focused_effect", FLX4RX3.toggleFxLight);

    FLX4RX3.keepAliveTimer = engine.beginTimer(200, FLX4RX3.sendKeepAlive);

    // query the controller for current control positions on startup
    FLX4RX3.sendKeepAlive(); // the query seems to double as a keep alive message

    // RX3-laag (skin-koppeling)
    FLX4RX3.initRx3();
};

//
// Waveform zoom
//

FLX4RX3.waveformZoom = function(midichan, control, value, status, group) {
    if (value === 0x7f) {
        script.triggerControl(group, "waveform_zoom_up", 100);
    } else {
        script.triggerControl(group, "waveform_zoom_down", 100);
    }
};

//
// Channel level lights
//

FLX4RX3.vuMeterUpdate = function(value, group) {
    const newVal = value * 127;

    switch (group) {
    case "[Channel1]":
        midi.sendShortMsg(0xB0, 0x02, newVal);
        break;

    case "[Channel2]":
        midi.sendShortMsg(0xB1, 0x02, newVal);
        break;
    }
};

//
// Effects  (RX3-stijl: een Beat FX-effect = slot 1 van effect-unit 1)
//
// NauticMixxx bestuurt Beat FX zelf (bank, X-PAD). Deze mapping gebruikt dezelfde
// effect-unit en dezelfde gemeenschappelijke controls ([RX3BeatFx] select, amount).
//

FLX4RX3.fxUnit = "[EffectRack1_EffectUnit1]";
FLX4RX3.fxSlot = "[EffectRack1_EffectUnit1_Effect1]";
FLX4RX3.fxIndex = 0;

FLX4RX3.fxActive = function() {
    return engine.getValue(FLX4RX3.fxSlot, "enabled") > 0 &&
        engine.getValue(FLX4RX3.fxUnit, "enabled") > 0;
};

FLX4RX3.setFxActive = function(on) {
    const value = on ? 1 : 0;

    engine.setValue(FLX4RX3.fxSlot, "enabled", value);
    engine.setValue(FLX4RX3.fxUnit, "enabled", value);
};

FLX4RX3.toggleFxLight = function(_value, _group, _control) {
    const enabled = FLX4RX3.fxActive();

    FLX4RX3.toggleLight(FLX4RX3.lights.beatFx, enabled);
    FLX4RX3.toggleLight(FLX4RX3.lights.shiftBeatFx, enabled);
};

FLX4RX3.focusedFxGroup = function() {
    return FLX4RX3.fxSlot;
};

FLX4RX3.beatFxLevelDepthRotate = function(_channel, _control, value) {
    if (FLX4RX3.shiftButtonDown[0] || FLX4RX3.shiftButtonDown[1]) {
        engine.setParameter(FLX4RX3.fxSlot, "meta", value / 0x7F);
    } else {
        // [RX3BeatFx],amount is the native LEVEL/DEPTH (it drives the unit mix)
        engine.setValue("[RX3BeatFx]", "amount", value / 0x7F);
    }
};

// BEAT < en BEAT >: parameter 1 van het effect stapsgewijs verlagen/verhogen.
FLX4RX3.stepFxParameter = function(direction) {
    const step = FLX4RX3.options.fxParamStep;
    const current = engine.getParameter(FLX4RX3.fxSlot, "parameter1");
    const next = Math.min(1, Math.max(0, current + direction * step));

    engine.setParameter(FLX4RX3.fxSlot, "parameter1", next);
    FLX4RX3.log("BEAT FX parameter1 " + current.toFixed(3) + " -> " + next.toFixed(3));
};

// FX SELECT: native effectkeuze, 1-based in de volgorde van de skin-lijst.
// NauticMixxx zet een nieuw gekozen effect altijd uit (rx3LoadBeatFx). Was het
// effect aan, dan zet deze mapping het kort na het laden weer aan.
FLX4RX3.fxRestore = {timer: 0, wasActive: false};

FLX4RX3.cancelFxRestore = function() {
    if (FLX4RX3.fxRestore.timer) {
        engine.stopTimer(FLX4RX3.fxRestore.timer);
        FLX4RX3.fxRestore.timer = 0;
    }
};

FLX4RX3.fxSelectStep = function(direction) {
    const count = FLX4RX3.options.nativeFxCount;
    const restore = FLX4RX3.fxRestore;
    let next = FLX4RX3.fxIndex + direction;

    if (next > count) {
        next = 1;
    } else if (next < 1) {
        next = count;
    }
    FLX4RX3.fxIndex = next;

    // Onthoud of het effect aan stond (bij snel achter elkaar wisselen: de eerste stand)
    if (restore.timer) {
        engine.stopTimer(restore.timer);
        restore.timer = 0;
    } else {
        restore.wasActive = FLX4RX3.fxActive();
    }

    FLX4RX3.pulseValue("[RX3BeatFx]", "select", next);
    FLX4RX3.log("BEAT FX select " + next + (restore.wasActive ? " (was aan)" : ""));

    if (restore.wasActive && FLX4RX3.options.fxKeepOnWhenSwitching) {
        restore.timer = engine.beginTimer(FLX4RX3.options.fxRestoreDelayMs, function() {
            FLX4RX3.setFxActive(true);
            // tweede controle voor het geval het laden iets langer duurde
            restore.timer = engine.beginTimer(150, function() {
                restore.timer = 0;
                if (!FLX4RX3.fxActive()) { FLX4RX3.setFxActive(true); }
            }, true);
        }, true);
    }
};

FLX4RX3.beatFxSelectPressed = function(_channel, _control, value) {
    if (value === 0) { return; }

    FLX4RX3.fxSelectStep(1);
    FLX4RX3.showBeatFxPanel();
};

FLX4RX3.beatFxSelectShiftPressed = function(_channel, _control, value) {
    if (value === 0) { return; }

    FLX4RX3.fxSelectStep(-1);
    FLX4RX3.showBeatFxPanel();
};

FLX4RX3.beatFxLeftPressed = function(_channel, _control, value) {
    if (value === 0) { return; }

    FLX4RX3.stepFxParameter(-1);
    FLX4RX3.showBeatFxPanel();
};

FLX4RX3.beatFxRightPressed = function(_channel, _control, value) {
    if (value === 0) { return; }

    FLX4RX3.stepFxParameter(1);
    FLX4RX3.showBeatFxPanel();
};

FLX4RX3.beatFxOnOffPressed = function(_channel, _control, value) {
    if (value === 0) { return; }

    FLX4RX3.cancelFxRestore();
    FLX4RX3.setFxActive(!FLX4RX3.fxActive());
    FLX4RX3.showBeatFxPanel();
};

FLX4RX3.beatFxOnOffShiftPressed = function(_channel, _control, value) {
    if (value === 0) { return; }

    FLX4RX3.cancelFxRestore();
    FLX4RX3.setFxActive(false);
    FLX4RX3.showBeatFxPanel();
};

// CH SELECT: de schakelaar stuurt twee losse meldingen (CH1 en CH2).
//   alleen CH1 aan  -> effect op deck 1
//   alleen CH2 aan  -> effect op deck 2
//   beide aan       -> effect op MASTER
FLX4RX3.fxRoute = {ch1: false, ch2: false};

FLX4RX3.applyFxRoute = function() {
    const both = FLX4RX3.fxRoute.ch1 && FLX4RX3.fxRoute.ch2;

    engine.setValue(FLX4RX3.fxUnit, "group_[Master]_enable", both ? 1 : 0);
    engine.setValue(FLX4RX3.fxUnit, "group_[Channel1]_enable", (!both && FLX4RX3.fxRoute.ch1) ? 1 : 0);
    engine.setValue(FLX4RX3.fxUnit, "group_[Channel2]_enable", (!both && FLX4RX3.fxRoute.ch2) ? 1 : 0);
    FLX4RX3.log("BEAT FX route: ch1=" + FLX4RX3.fxRoute.ch1 + " ch2=" + FLX4RX3.fxRoute.ch2 +
        (both ? " -> MASTER" : ""));
};

FLX4RX3.beatFxChannel1 = function(_channel, _control, value) {
    FLX4RX3.fxRoute.ch1 = (value === 0x7f);
    FLX4RX3.applyFxRoute();
};

FLX4RX3.beatFxChannel2 = function(_channel, _control, value) {
    FLX4RX3.fxRoute.ch2 = (value === 0x7f);
    FLX4RX3.applyFxRoute();
};

//
// Loop IN/OUT ADJUST
//

FLX4RX3.toggleLoopAdjustIn = function(channel, _control, value, _status, group) {
    if (value === 0 || engine.getValue(group, "loop_enabled" === 0)) {
        return;
    }
    FLX4RX3.loopAdjustIn[channel] = !FLX4RX3.loopAdjustIn[channel];
    FLX4RX3.loopAdjustOut[channel] = false;
};

FLX4RX3.toggleLoopAdjustOut = function(channel, _control, value, _status, group) {
    if (value === 0 || engine.getValue(group, "loop_enabled" === 0)) {
        return;
    }
    FLX4RX3.loopAdjustOut[channel] = !FLX4RX3.loopAdjustOut[channel];
    FLX4RX3.loopAdjustIn[channel] = false;
};

// Two signals are sent here so that the light stays lit/unlit in its shift state too
FLX4RX3.setReloopLight = function(status, value) {
    midi.sendShortMsg(status, 0x4D, value);
    midi.sendShortMsg(status, 0x50, value);
};


FLX4RX3.setLoopButtonLights = function(status, value) {
    [0x10, 0x11, 0x4E, 0x4C].forEach(function(control) {
        midi.sendShortMsg(status, control, value);
    });
};

FLX4RX3.startLoopLightsBlink = function(channel, control, status, group) {
    let blink = 0x7F;

    FLX4RX3.stopLoopLightsBlink(group, control, status);

    FLX4RX3.timers[group][control] = engine.beginTimer(500, () => {
        blink = 0x7F - blink;

        // When adjusting the loop out position, turn the loop in light off
        if (FLX4RX3.loopAdjustOut[channel]) {
            midi.sendShortMsg(status, 0x10, 0x00);
            midi.sendShortMsg(status, 0x4C, 0x00);
        } else {
            midi.sendShortMsg(status, 0x10, blink);
            midi.sendShortMsg(status, 0x4C, blink);
        }

        // When adjusting the loop in position, turn the loop out light off
        if (FLX4RX3.loopAdjustIn[channel]) {
            midi.sendShortMsg(status, 0x11, 0x00);
            midi.sendShortMsg(status, 0x4E, 0x00);
        } else {
            midi.sendShortMsg(status, 0x11, blink);
            midi.sendShortMsg(status, 0x4E, blink);
        }
    });

};

FLX4RX3.stopLoopLightsBlink = function(group, control, status) {
    FLX4RX3.timers[group] = FLX4RX3.timers[group] || {};

    if (FLX4RX3.timers[group][control] !== undefined) {
        engine.stopTimer(FLX4RX3.timers[group][control]);
    }
    FLX4RX3.timers[group][control] = undefined;
    FLX4RX3.setLoopButtonLights(status, 0x7F);
};

FLX4RX3.loopToggle = function(value, group, control) {
    const status = group === "[Channel1]" ? 0x90 : 0x91,
        channel = group === "[Channel1]" ? 0 : 1;

    FLX4RX3.setReloopLight(status, value ? 0x7F : 0x00);

    if (value) {
        FLX4RX3.startLoopLightsBlink(channel, control, status, group);
    } else {
        FLX4RX3.stopLoopLightsBlink(group, control, status);
        FLX4RX3.loopAdjustIn[channel] = false;
        FLX4RX3.loopAdjustOut[channel] = false;
    }
};

//
// CUE/LOOP CALL
//

FLX4RX3.cueLoopCallLeft = function(_channel, _control, value, _status, group) {
    if (value) {
        engine.setValue(group, "loop_scale", 0.5);
    }
};

FLX4RX3.cueLoopCallRight = function(_channel, _control, value, _status, group) {
    if (value) {
        engine.setValue(group, "loop_scale", 2.0);
    }
};

//
// BEAT SYNC
//
// Note that the controller sends different signals for a short press and a long
// press of the same button.
//

FLX4RX3.syncPressed = function(channel, control, value, status, group) {
    if (value <= 0 || engine.getValue(group, "rx3_source_lost")) { return; }
    if (engine.getValue(group, "sync_enabled")) {
        engine.setValue(group, "sync_enabled", 0);
    } else {
        engine.setValue(group, "sync_enabled", 1);
        engine.setValue(group, "beatsync_phase", 1);
    }
};

FLX4RX3.syncLongPressed = function(channel, control, value, status, group) {
    if (value) {
        engine.setValue(group, "sync_enabled", 1);
    }
};

FLX4RX3.cycleTempoRange = function(_channel, _control, value, _status, group) {
    if (value === 0) { return; } // ignore release

    const currRange = engine.getValue(group, "rateRange");
    let idx = 0;

    for (let i = 0; i < this.tempoRanges.length; i++) {
        if (currRange === this.tempoRanges[i]) {
            // idx get the index of the value in tempoRanges following the currently configured one
            // or cycle back to 0 if the current is the last value of the list.
            idx = (i + 1) % this.tempoRanges.length;
            break;
        }
    }
    engine.setValue(group, "rateRange", this.tempoRanges[idx]);
};

//
// Jog wheels
//

FLX4RX3.jogTurn = function(channel, _control, value, _status, group) {
    const deckNum = channel + 1;
    // wheel center at 64; <64 rew >64 fwd
    let newVal = value - 64;

    // loop_in / out adjust
    const loopEnabled = engine.getValue(group, "loop_enabled");
    if (loopEnabled > 0) {
        if (FLX4RX3.loopAdjustIn[channel]) {
            newVal = newVal * FLX4RX3.loopAdjustMultiply + engine.getValue(group, "loop_start_position");
            engine.setValue(group, "loop_start_position", newVal);
            return;
        }
        if (FLX4RX3.loopAdjustOut[channel]) {
            newVal = newVal * FLX4RX3.loopAdjustMultiply + engine.getValue(group, "loop_end_position");
            engine.setValue(group, "loop_end_position", newVal);
            return;
        }
    }

    if (engine.isScratching(deckNum)) {
        engine.scratchTick(deckNum, newVal);
    } else { // fallback
        engine.setValue(group, "jog", newVal * this.bendScale);
    }
};


FLX4RX3.jogSearch = function(_channel, _control, value, _status, group) {
    const newVal = (value - 64) * FLX4RX3.fastSeekScale;
    engine.setValue(group, "jog", newVal);
};

FLX4RX3.jogTouch = function(channel, _control, value) {
    const deckNum = channel + 1;

    // skip while adjusting the loop points
    if (FLX4RX3.loopAdjustIn[channel] || FLX4RX3.loopAdjustOut[channel]) {
        return;
    }

    if (value !== 0 && this.vinylMode) {
        engine.scratchEnable(deckNum, 720, 33+1/3, this.alpha, this.beta);
    } else {
        engine.scratchDisable(deckNum, FLX4RX3.options.jogReleaseRamp);
    }
};

//
// Shift button
//

FLX4RX3.shiftPressed = function(channel, _control, value, _status, _group) {
    FLX4RX3.shiftButtonDown[channel] = value === 0x7F;
};


//
// Tempo sliders
//
// The tempo option in Mixxx's deck preferences determine whether down/up
// increases/decreases the rate. Therefore it must be inverted here so that the
// UI and the control sliders always move in the same direction.
//

FLX4RX3.tempoSliderMSB = function(channel, control, value, status, group) {
    FLX4RX3.highResMSB[group].tempoSlider = value;
};

FLX4RX3.tempoSliderLSB = function(channel, control, value, status, group) {
    const fullValue = (FLX4RX3.highResMSB[group].tempoSlider << 7) + value;

    engine.setValue(
        group,
        "rate",
        1 - (fullValue / 0x2000)
    );
};

//
// Beat Jump mode
//
// Note that when we increase/decrease the sizes on the pad buttons, we use the
// value of the first pad (0x21) as an upper/lower limit beyond which we don't
// allow further increasing/decreasing of all the values.
//

FLX4RX3.beatjumpPadPressed = function(_channel, control, value, _status, group) {
    if (value === 0) {
        return;
    }
    engine.setValue(group, "beatjump_size", Math.abs(FLX4RX3.beatjumpSizeForPad[control]));
    engine.setValue(group, "beatjump", FLX4RX3.beatjumpSizeForPad[control]);
};

FLX4RX3.increaseBeatjumpSizes = function(_channel, control, value, _status, group) {
    if (value === 0 || FLX4RX3.beatjumpSizeForPad[0x21] * 16 > 16) {
        return;
    }
    Object.keys(FLX4RX3.beatjumpSizeForPad).forEach(function(pad) {
        FLX4RX3.beatjumpSizeForPad[pad] = FLX4RX3.beatjumpSizeForPad[pad] * 16;
    });
    engine.setValue(group, "beatjump_size", FLX4RX3.beatjumpSizeForPad[0x21]);
};

FLX4RX3.decreaseBeatjumpSizes = function(_channel, control, value, _status, group) {
    if (value === 0 || FLX4RX3.beatjumpSizeForPad[0x21] / 16 < 1/16) {
        return;
    }
    Object.keys(FLX4RX3.beatjumpSizeForPad).forEach(function(pad) {
        FLX4RX3.beatjumpSizeForPad[pad] = FLX4RX3.beatjumpSizeForPad[pad] / 16;
    });
    engine.setValue(group, "beatjump_size", FLX4RX3.beatjumpSizeForPad[0x21]);
};

//
// Sampler mode
//

FLX4RX3.samplerPlayOutputCallbackFunction = function(value, group, _control) {
    if (value === 1) {
        const curPad = group.match(script.samplerRegEx)[1];
        let deckIndex = 0;
        let padIndex = 0;

        if (curPad >=1 && curPad <= 4) {
            deckIndex = 0;
            padIndex = curPad - 1;
        } else if (curPad >=5 && curPad <= 8) {
            deckIndex = 2;
            padIndex = curPad - 5;
        } else if (curPad >=9 && curPad <= 12) {
            deckIndex = 0;
            padIndex = curPad - 5;
        } else if (curPad >=13 && curPad <= 16) {
            deckIndex = 2;
            padIndex = curPad - 9;
        }

        FLX4RX3.startSamplerBlink(
            0x97 + deckIndex,
            0x30 + padIndex,
            group);
    }
};

FLX4RX3.padModeKeyPressed = function(_channel, _control, value, _status, _group) {
    const deck = (_status === 0x90 ? FLX4RX3.lights.deck1 : FLX4RX3.lights.deck2);

    if (_control === 0x1B) {
        FLX4RX3.toggleLight(deck.hotcueMode, true);
    } else if (_control === 0x69) {
        FLX4RX3.toggleLight(deck.keyboardMode, true);
    } else if (_control === 0x1E) {
        FLX4RX3.toggleLight(deck.padFX1Mode, true);
    } else if (_control === 0x6B) {
        FLX4RX3.toggleLight(deck.padFX2Mode, true);
    } else if (_control === 0x20) {
        FLX4RX3.toggleLight(deck.beatJumpMode, true);
    } else if (_control === 0x6D) {
        FLX4RX3.toggleLight(deck.beatLoopMode, true);
    } else if (_control === 0x22) {
        FLX4RX3.toggleLight(deck.samplerMode, true);
    } else if (_control === 0x6F) {
        FLX4RX3.toggleLight(deck.keyShiftMode, true);
    }

    // RX3: skin laat dezelfde pad-pagina zien als de FLX4 nu heeft
    if (value > 0) {
        FLX4RX3.skinPadMode(_status === 0x90 ? 1 : 2, _control);
    }
};

FLX4RX3.samplerPadPressed = function(_channel, _control, value, _status, group) {
    if (engine.getValue(group, "track_loaded")) {
        engine.setValue(group, "cue_gotoandplay", value);
    } else {
        engine.setValue(group, "LoadSelectedTrack", value);
    }
};

FLX4RX3.samplerPadShiftPressed = function(_channel, _control, value, _status, group) {
    if (engine.getValue(group, "play")) {
        engine.setValue(group, "cue_gotoandstop", value);
    } else if (engine.getValue(group, "track_loaded")) {
        engine.setValue(group, "eject", value);
    }
};

FLX4RX3.startSamplerBlink = function(channel, control, group) {
    let val = 0x7f;

    FLX4RX3.stopSamplerBlink(channel, control);
    FLX4RX3.timers[channel][control] = engine.beginTimer(250, () => {
        val = 0x7f - val;

        // blink the appropriate pad
        midi.sendShortMsg(channel, control, val);
        // also blink the pad while SHIFT is pressed
        midi.sendShortMsg((channel+1), control, val);

        const isPlaying = engine.getValue(group, "play") === 1;

        if (!isPlaying) {
            // kill timer
            FLX4RX3.stopSamplerBlink(channel, control);
            // set the pad LED to ON
            midi.sendShortMsg(channel, control, 0x7f);
            // set the pad LED to ON while SHIFT is pressed
            midi.sendShortMsg((channel+1), control, 0x7f);
        }
    });
};

FLX4RX3.stopSamplerBlink = function(channel, control) {
    FLX4RX3.timers[channel] = FLX4RX3.timers[channel] || {};

    if (FLX4RX3.timers[channel][control] !== undefined) {
        engine.stopTimer(FLX4RX3.timers[channel][control]);
        FLX4RX3.timers[channel][control] = undefined;
    }
};


FLX4RX3.toggleQuantize = function(_channel, _control, value, _status, group) {
    if (value) {
        script.toggleControl(group, "quantize");
    }
};

FLX4RX3.quickJumpForward = function(_channel, _control, value, _status, group) {
    if (value) {
        engine.setValue(group, "beatjump", FLX4RX3.quickJumpSize);
    }
};

FLX4RX3.quickJumpBack = function(_channel, _control, value, _status, group) {
    if (value) {
        engine.setValue(group, "beatjump", -FLX4RX3.quickJumpSize);
    }
};

//
// Shutdown
//

FLX4RX3.shutdown = function() {
    // reset vumeter
    FLX4RX3.toggleLight(FLX4RX3.lights.deck1.vuMeter, false);
    FLX4RX3.toggleLight(FLX4RX3.lights.deck2.vuMeter, false);

    // housekeeping
    // turn off all Sampler LEDs
    for (var i = 0; i <= 7; ++i) {
        midi.sendShortMsg(0x97, 0x30 + i, 0x00);    // Deck 1 pads
        midi.sendShortMsg(0x98, 0x30 + i, 0x00);    // Deck 1 pads with SHIFT
        midi.sendShortMsg(0x99, 0x30 + i, 0x00);    // Deck 2 pads
        midi.sendShortMsg(0x9A, 0x30 + i, 0x00);    // Deck 2 pads with SHIFT
    }
    // turn off all Hotcue LEDs
    for (i = 0; i <= 7; ++i) {
        midi.sendShortMsg(0x97, 0x00 + i, 0x00);    // Deck 1 pads
        midi.sendShortMsg(0x98, 0x00 + i, 0x00);    // Deck 1 pads with SHIFT
        midi.sendShortMsg(0x99, 0x00 + i, 0x00);    // Deck 2 pads
        midi.sendShortMsg(0x9A, 0x00 + i, 0x00);    // Deck 2 pads with SHIFT
    }

    // turn off loop in and out lights
    FLX4RX3.setLoopButtonLights(0x90, 0x00);
    FLX4RX3.setLoopButtonLights(0x91, 0x00);

    // turn off reloop lights
    FLX4RX3.setReloopLight(0x90, 0x00);
    FLX4RX3.setReloopLight(0x91, 0x00);

    // stop any flashing lights
    FLX4RX3.toggleLight(FLX4RX3.lights.beatFx, false);
    FLX4RX3.toggleLight(FLX4RX3.lights.shiftBeatFx, false);

    // NauticMixxx-laag opruimen
    FLX4RX3.shutdownRx3();

    // stop the keepalive timer
    engine.stopTimer(FLX4RX3.keepAliveTimer);
};

//
// ============================================================================
// NauticMixxx-laag: koppeling met de native app en de RX3-skin
// ============================================================================
//
// Native bedieningen die deze laag gebruikt (alleen aanwezig in NauticMixxx):
//   [RX3Browser]   enabled / open / source / move / enter / back
//   [RX3Shortcut]  visible / restore / move / enter / toggle      (SHORTCUT-paneel)
//   [RX3Info]      visible / hold / move / enter                  (INFO-pagina)
//   [RX3Controller] active_deck / grid_mode
//   [RX3Settings]  vinyl_speed1/2, vinyl_stop1/2                  (vinyl-stop)
//   [RX3BeatFx]    select / amount                                (Beat FX)
//   [RX3PadModeDeckN] modeX, [RX3SidePanel] status / beatfx       (skin-pagina's)
//   [ChannelN]     rx3_source_lost                                (USB-bron weg)
//

// ---- Instellingen (hier aanpassen) -----------------------------------------
FLX4RX3.options = {
    // Draaien aan BROWSE terwijl PERFORMANCE open is: "zoom" zoomt de golfvormen van
    // beide decks (rechtsom = groter), "browse" opent BROWSE. BROWSE open je dan met
    // een korte druk op de knop (of SHIFT + LOAD 2).
    turnInPerformance: "zoom",
    // true = draairichting van de zoom omkeren (rechtsom = kleiner).
    zoomReverse: false,
    // SHIFT + korte druk op BROWSE = BACK (een niveau terug in BROWSE). SHIFT + 2 sec
    // vasthouden blijft het SHORTCUT-paneel openen. false = SHIFT + korte druk doet niets.
    shiftPressBack: true,
    // Aantal effecten in de Beat FX-lijst van NauticMixxx (FX SELECT loopt hierover).
    nativeFxCount: 8,
    // Stapgrootte van BEAT < / > op parameter 1 van het effect (0..1).
    fxParamStep: 0.125,
    // Effect blijft aan als je met FX SELECT een ander effect kiest
    // (NauticMixxx zet het nieuwe effect zelf uit; de mapping zet het weer aan).
    fxKeepOnWhenSwitching: true,
    fxRestoreDelayMs: 80,
    // Draaien aan BROWSE terwijl het INFO-paneel openstaat:
    // "tracks" = de tracklijst scrolt (INFO volgt de geselecteerde track),
    // "info"   = de INFO-regels scrollen (zoals de standaardmapping van NauticMixxx).
    // Met "tracks" kun je de INFO-regels nog bedienen door BROWSE ingedrukt te houden en te draaien.
    infoTurn: "tracks",
    // CFX-knoppen (FILTER per kanaal). Nummer van de keten in NauticMixxx' lijst met
    // Sound Color FX: 1 REVERB, 2 PING PONG, 3 NOISE, 4 FILTER. 0 = niets laden, alleen aanzetten.
    cfxPreset: 4,
    // TRIM: 0.25 zet de stand "12 uur" op ongeveer -6 dB (ruimte voor harde tracks, geen clipping);
    // het uiteinde rechts blijft +12 dB. 0 = zoals de standaardmapping (12 uur = 0 dB).
    // Nog zachter: 0.35. Luider: 0.15.
    trimOffset: 0.25,
    // JOGWHEEL loslaten: false = de deck stopt meteen met scratchen (geen uitrollen in de software
    // terwijl het wiel zelf al stilstaat). true = zoals standaard Mixxx (rolt zacht uit).
    jogReleaseRamp: false,
    // EQ (HI / MID / LOW): "pioneer" = links -26 dB, 12 uur = 0 dB, rechts +6 dB (zoals de DDJ-FLX4);
    // "mixxx" = standaard Mixxx (helemaal links = kill, rechts +12 dB).
    eqMode: "pioneer",
    eqCutDb: 26,            // maximale demping links (dB)
    eqBoostDb: 6,           // maximale versterking rechts (dB)
    eqCutCurve: 1.0,        // 1 = rechte lijn in dB; hoger = meer gevoel vlak bij 12 uur
    eqBoostCurve: 1.0,
    eqCenterDeadzone: 0.012, // klein vlak rond 12 uur dat exact 0 dB is (de klik van de knop)
    // CFX-knop: vlak rond 12 uur waar het effect helemaal uit is (zoals de klik op de Pioneer).
    // Daarbuiten loopt de knop weer van 0 tot vol. 0 = geen vlak.
    cfxDeadzone: 0.04,
    // SMART CFX: kiest met elke druk de volgende CFX-keten (voor beide kanalen); met SHIFT
    // ingedrukt de vorige. De adressen (status<<8 | noot) van de SMART CFX-knoppen staan nergens
    // openbaar; lukt het niet, druk een keer op de knop en zoek in mixxx.log naar
    // "ONBEKENDE KNOP", dan zet ik het juiste adres hier neer.
    // 0x9600 is de knop die in jouw log als ONBEKENDE KNOP stond (nog niet bevestigd dat dit SMART CFX is).
    smartCfxKeys: [0x9600, 0x9651, 0x9609],
    // SMART FADER: zet de crossfader uit (THRU: geen kanaal hangt nog aan links of rechts) en
    // weer aan. Ook dit adres is niet openbaar; staat het verkeerd, druk een keer op de knop en
    // zoek in mixxx.log naar "ONBEKENDE KNOP".
    smartFaderKeys: [0x9601],
    logUnknownButtons: true,
    // Standen bij het opstarten: de mapping vraagt de controller bij het starten naar de stand
    // van alle knoppen en schuiven. Binnen dit venster (ms) telt mixxx.log wat er binnenkwam
    // ("STARTSTANDEN"), en volgt het tempo meteen de schuif (zonder soft-takeover).
    startupSync: true,
    startupWindowMs: 4000,
    // Tempo-schuif: de stand van de schuif is het tempo. Bij het opstarten, bij de eerste
    // beweging en na het laden van een liedje springt het tempo naar de schuif (zoals bij
    // Pioneer). Is sync aan, dan blijft soft-takeover gelden. false = zoals standaard Mixxx.
    tempoFollowSlider: true,
    tempoLoadDelayMs: 150,
    // Sync na het laden van een liedje: "off" = sync gaat uit (alleen BEAT SYNC zet hem aan; het
    // nieuwe liedje start op zijn eigen tempo), "keep" = zoals Mixxx (sync blijft aan).
    syncOnLoad: "off",
    // Bij "off": ook de tempo-stand terug op 0 als sync het tempo had aangepast.
    syncResetRate: true,
    // Meldingen in mixxx.log (zet op false als alles werkt).
    debug: true
};

FLX4RX3.log = function(message) {
    if (!FLX4RX3.options.debug) { return; }
    if (typeof console !== "undefined" && console.log) {
        console.log("[FLX4RX3] " + message);
    } else {
        print("[FLX4RX3] " + message);
    }
};

// Bediening kort op een waarde zetten en weer op 0.
FLX4RX3.pulseValue = function(group, key, value) {
    engine.setValue(group, key, value);
    engine.setValue(group, key, 0);
};

FLX4RX3.skinState = {initTimer: 0};

// ---- Encoder-gebaar van NauticMixxx (ongewijzigd overgenomen) ------------------
FLX4RX3.enc = {
    timer: null, pressed: false, consumed: false, moved: false,
    shifted: false, started: 0, backend: null, browserAtPress: false
};
FLX4RX3.enc.pulse = function(key, value) {
    engine.setValue("[RX3Shortcut]", key, value);
    engine.setValue("[RX3Shortcut]", key, 0);
};
FLX4RX3.enc.cancel = function() {
    if (FLX4RX3.enc.timer !== null) engine.stopTimer(FLX4RX3.enc.timer);
    FLX4RX3.enc.timer = null;
};
FLX4RX3.enc.init = function() {
    // Restore after the full transport mapper initializes its defaults.
    FLX4RX3.enc.timer = engine.beginTimer(1, function() {
        FLX4RX3.enc.timer = null;
        FLX4RX3.enc.pulse("restore", 1);
    }, true);
};
FLX4RX3.enc.shutdown = function() {
    FLX4RX3.enc.cancel();engine.setValue("[RX3Info]", "hold", 0);FLX4RX3.enc.pressed = false;
};
FLX4RX3.enc.longPress = function() {
    FLX4RX3.enc.timer = null;
    if (!FLX4RX3.enc.pressed || FLX4RX3.enc.moved || FLX4RX3.enc.consumed) return;
    FLX4RX3.enc.consumed = true;
    if (FLX4RX3.enc.shifted) {
        FLX4RX3.enc.pulse("toggle", 1);
    } else if (engine.getValue("[RX3Info]", "visible") > 0) {
        // INFO keeps the held selector available for rating edits.
    } else if (engine.getValue("[RX3Shortcut]", "visible") > 0) {
        // A long unshifted press does not leak into the covered page.
    } else if (FLX4RX3.enc.browserAtPress) {
        FLX4RX3.enc.backend.back(0, 0, 127);
    } else {
        const enabled = engine.getValue("[RX3Controller]", "grid_mode") <= 0;
        if (FLX4RX3.enc.backend.setGrid) FLX4RX3.enc.backend.setGrid(enabled);
        else engine.setValue("[RX3Controller]", "grid_mode", enabled ? 1 : 0);
    }
};
FLX4RX3.enc.press = function(backend, value, status, shifted) {
    const down = value > 0 && (status & 0xF0) !== 0x80;
    if (down) {
        if (FLX4RX3.enc.pressed) return;
        FLX4RX3.enc.cancel();
        FLX4RX3.enc.backend = backend;FLX4RX3.enc.pressed = true;
        FLX4RX3.enc.consumed = false;FLX4RX3.enc.moved = false;
        FLX4RX3.enc.shifted = shifted;FLX4RX3.enc.started = Date.now();
        FLX4RX3.enc.browserAtPress = backend.isOpen();
        if (engine.getValue("[RX3Info]", "visible") > 0) engine.setValue("[RX3Info]", "hold", 1);
        FLX4RX3.enc.timer = engine.beginTimer(2000, FLX4RX3.enc.longPress, true);
        return;
    }
    if (!FLX4RX3.enc.pressed) return;
    FLX4RX3.enc.cancel();
    if (Date.now() - FLX4RX3.enc.started >= 2000) FLX4RX3.enc.longPress();
    engine.setValue("[RX3Info]", "hold", 0);
    FLX4RX3.enc.pressed = false;
    if (FLX4RX3.enc.consumed || FLX4RX3.enc.moved || FLX4RX3.enc.shifted) return;
    if (engine.getValue("[RX3Info]", "visible") > 0) {
        engine.setValue("[RX3Info]", "enter", 1);engine.setValue("[RX3Info]", "enter", 0);
    } else if (engine.getValue("[RX3Shortcut]", "visible") > 0) {
        FLX4RX3.enc.pulse("enter", 1);
    } else if (engine.getValue("[RX3Controller]", "grid_mode") > 0) {
        engine.setValue("[RX3Controller]", "grid_mode", 0);
    } else backend.shortPress(0, 0, 127);
};
FLX4RX3.enc.turn = function(backend, channel, control, value, status, group) {
    if (!value) return;
    if (FLX4RX3.enc.pressed) {FLX4RX3.enc.moved = true;FLX4RX3.enc.cancel();}
    const direction = value > 0x3F ? -1 : 1;
    if (engine.getValue("[RX3Info]", "visible") > 0 &&
            (FLX4RX3.options.infoTurn === "info" || FLX4RX3.enc.pressed)) {
        engine.setValue("[RX3Info]", "move", direction);engine.setValue("[RX3Info]", "move", 0);return;
    }
    if (engine.getValue("[RX3Shortcut]", "visible") > 0) {
        FLX4RX3.enc.pulse("move", direction);return;
    }
    if (engine.getValue("[RX3Controller]", "grid_mode") > 0) {
        const deck = Math.round(engine.getValue("[RX3Controller]", "active_deck")) === 2 ? 2 : 1;
        engine.setValue(`[Channel${deck}]`, "beats_translate_move", direction);return;
    }
    backend.originalTurn(channel, control, value, status, group);
};

FLX4RX3.enc.brakeConsumed = {};
FLX4RX3.enc.brakePress = function(value, status, group) {
    const deck = Number((group.match(/Channel([1-4])/ ) || [0,0])[1]);
    if (!deck || deck > 2) return false;
    const down = value > 0 && (status & 0xF0) !== 0x80;
    if (!down && FLX4RX3.enc.brakeConsumed[deck]) {
        FLX4RX3.enc.brakeConsumed[deck] = false;return true;
    }
    if (down && engine.getValue(group,"play") > 0 &&
            engine.getValue("[RX3Settings]", "vinyl_speed"+deck) > 0) {
        const level = engine.getValue("[RX3Settings]", "vinyl_stop"+deck) || 3;
        // brake's factor scales filter deceleration; higher UI levels stop slower.
        engine.brake(deck, true, 2.5 / Math.max(1, Math.min(5,level)));
        FLX4RX3.enc.brakeConsumed[deck] = true;return true;
    }
    return false;
};

FLX4RX3.enc.play1 = function(c,k,v,st,g) {
    if (FLX4RX3.enc.brakePress(v,st,g)) return;
    if(v>0 && (st & 0xF0)!==0x80) engine.setValue(g,"play",engine.getValue(g,"play")>0?0:1);
};

FLX4RX3.enc.play2 = function(c,k,v,st,g) {
    if (FLX4RX3.enc.brakePress(v,st,g)) return;
    if(v>0 && (st & 0xF0)!==0x80) engine.setValue(g,"play",engine.getValue(g,"play")>0?0:1);
};

// ---- BROWSE / SOURCE / VIEW (naar NauticMixxx' Pioneer-DDJ-FLX4-RX3-Browser.js) ----
FLX4RX3.nb = {};

FLX4RX3.nb.isOpen = function() {
    return Math.round(engine.getValue("[Tab]", "current")) === 1;
};

FLX4RX3.nb.open = function() {
    if (FLX4RX3.nb.isOpen()) { return false; }
    engine.setValue("[XDJ_RX3]", "search_active", 0);
    engine.setValue("[Tab]", "library", 1);
    engine.setValue("[Skin]", "show_maximized_library", 1);
    FLX4RX3.pulseValue("[RX3Browser]", "open", 1);
    FLX4RX3.log("BROWSE open");
    return true;
};

FLX4RX3.nb.view = function(_channel, _control, value) {
    if (value === 0) { return; }
    if (!FLX4RX3.nb.isOpen()) {
        FLX4RX3.nb.open();
        return;
    }
    engine.setValue("[Skin]", "show_maximized_library", 0);
    // Page triggers are latched; the stack clears the previous page itself.
    // Resetting overview to zero would hide PERFORMANCE and reopen BROWSER.
    engine.setValue("[Tab]", "overview", 1);
    FLX4RX3.log("PERFORMANCE open");
};

FLX4RX3.nb.source = function(_channel, _control, value) {
    if (value === 0) { return; }
    FLX4RX3.nb.open();
    FLX4RX3.pulseValue("[RX3Browser]", "source", 1);
};

FLX4RX3.nb.shortPress = function(_channel, _control, value) {
    if (value === 0 || FLX4RX3.nb.open()) { return; }
    FLX4RX3.pulseValue("[RX3Browser]", "enter", 1);
};

FLX4RX3.nb.back = function(_channel, _control, value) {
    if (value === 0 || FLX4RX3.nb.open()) { return; }
    FLX4RX3.pulseValue("[RX3Browser]", "back", 1);
};

// Golfvormen groter/kleiner: rechtsom (direction +1) = inzoomen (waveform_zoom_up
// is de ZOOM-IN-knop van de skin), tenzij options.zoomReverse.
FLX4RX3.nb.zoomStep = function(direction) {
    const zoomIn = FLX4RX3.options.zoomReverse ? direction < 0 : direction > 0;
    const zoom = zoomIn ? "waveform_zoom_up" : "waveform_zoom_down";

    FLX4RX3.pulseValue("[Channel1]", zoom, 1);
    FLX4RX3.pulseValue("[Channel2]", zoom, 1);
    FLX4RX3.log("ZOOM " + (zoomIn ? "in" : "uit"));
};

FLX4RX3.nb.originalTurn = function(_channel, _control, value) {
    if (value === 0) { return; }
    const direction = value > 0x3f ? -1 : 1;

    if (!FLX4RX3.nb.isOpen()) {
        if (FLX4RX3.options.turnInPerformance === "zoom") {
            FLX4RX3.nb.zoomStep(direction);
        } else {
            FLX4RX3.nb.open();
        }
        return;
    }
    FLX4RX3.pulseValue("[RX3Browser]", "move", direction);
};

// BROWSE-knop (draaien, indrukken, SHIFT + indrukken) loopt via het encoder-gebaar
FLX4RX3.browseTurn = function(channel, control, value, status, group) {
    FLX4RX3.enc.turn(FLX4RX3.nb, channel, control, value, status, group);
};

FLX4RX3.browsePress = function(_channel, _control, value, status, _group) {
    FLX4RX3.enc.press(FLX4RX3.nb, value, status || 0x90, false);
};

// SHIFT + BROWSE-knop: lang (2 sec) = SHORTCUT-paneel (via het encoder-gebaar),
// kort = BACK, zoals op de FLX4 zelf bedrukt. BACK werkt alleen in BROWSE en niet
// terwijl INFO of SHORTCUT het scherm bedekt.
FLX4RX3.shiftPressState = {active: false};

FLX4RX3.browseShiftPress = function(_channel, _control, value, status, _group) {
    const down = value > 0 && (status & 0xF0) !== 0x80;

    FLX4RX3.enc.press(FLX4RX3.nb, value, status || 0x90, true);
    if (down) {
        FLX4RX3.shiftPressState.active = !!FLX4RX3.enc.pressed;
        return;
    }
    if (!FLX4RX3.shiftPressState.active) { return; }
    FLX4RX3.shiftPressState.active = false;
    if (!FLX4RX3.options.shiftPressBack || FLX4RX3.enc.consumed || FLX4RX3.enc.moved) { return; }
    if (!FLX4RX3.nb.isOpen()) { return; }
    if (engine.getValue("[RX3Shortcut]", "visible") > 0 || engine.getValue("[RX3Info]", "visible") > 0) { return; }
    FLX4RX3.pulseValue("[RX3Browser]", "back", 1);
    FLX4RX3.log("SHIFT + druk = BACK");
};

FLX4RX3.shiftLoad1 = function(channel, control, value, status, group) {
    FLX4RX3.nb.source(channel, control, value, status, group);
};

FLX4RX3.shiftLoad2 = function(channel, control, value, status, group) {
    FLX4RX3.nb.view(channel, control, value, status, group);
};

// ---- LOAD (zoals de RX3-mapping van NauticMixxx) --------------------------------
//   PERFORMANCE: LOAD kiest het actieve deck
//   BROWSE:      LOAD laadt de geselecteerde track (niet tijdens het SHORTCUT-paneel)
FLX4RX3.loadPress = function(_channel, _control, value, status, group) {
    const deck = group === "[Channel2]" ? 2 : 1;

    if (!FLX4RX3.nb.isOpen()) {
        if (value > 0 && (status & 0xF0) !== 0x80) {
            engine.setValue("[RX3Controller]", "active_deck", deck);
            FLX4RX3.log("LOAD in PERFORMANCE: actief deck " + deck);
        }
        return;
    }
    if (engine.getValue("[RX3Shortcut]", "visible") > 0) { return; }
    engine.setValue(group, "LoadSelectedTrack", value > 0 ? 1 : 0);
    if (value > 0) { FLX4RX3.log("LOAD " + group); }
};

// ---- PLAY (met vinyl-stop van NauticMixxx) --------------------------------------
FLX4RX3.playPressed = function(channel, control, value, status, group) {
    FLX4RX3.enc.play1(channel, control, value, status, group);
};

// ---- Onderste strook: pads (STATUS) of BEAT FX ----------------------------------
FLX4RX3.showBeatFxPanel = function() {
    engine.setValue("[RX3SidePanel]", "beatfx", 1);
};

FLX4RX3.showStatusPanel = function() {
    engine.setValue("[RX3SidePanel]", "status", 1);
};

// FLX4 pad-modus knop -> pagina-nummer van de skin (zelfde namen als op de RX3)
FLX4RX3.skinPageForPadMode = {
    0x1B: 1,  // HOT CUE   -> HOT CUE
    0x6D: 2,  // BEAT LOOP -> BEAT LOOP
    0x20: 4   // BEAT JUMP -> BEAT JUMP
};

FLX4RX3.skinPadMode = function(deckNumber, control) {
    const page = FLX4RX3.skinPageForPadMode[control];

    // Een pad-modus knop brengt je terug naar de pad-strook
    FLX4RX3.showStatusPanel();
    if (page !== undefined) {
        engine.setValue("[RX3PadModeDeck" + deckNumber + "]", "mode" + page, 1);
        FLX4RX3.log("deck " + deckNumber + " pad-pagina " + page);
    } else {
        FLX4RX3.log("deck " + deckNumber + " pad-modus 0x" + control.toString(16) + " (geen skin-pagina)");
    }
};

// ---- Standen bij het opstarten ----------------------------------------------------------
// De FLX4 stuurt zijn knop- en schuifstanden pas door na de SysEx-vraag (en anders bij de
// eerste beweging). Let op: Mixxx gooit alle MIDI-berichten uit init() weg ("not open for
// output"), en de timers van de mapping lopen pas als Mixxx de controllers gaat uitlezen,
// ruim 4 seconden na init(). De eerste vraag die echt aankomt is dus de eerste keep-alive uit
// de timer. Het telvenster begint daarom daar, en schrijft daarna een samenvatting in mixxx.log.
FLX4RX3.startup = {armed: false, active: false, seen: {}, connections: [], timer: 0, t0: 0, first: -1};

FLX4RX3.startupNote = function(kind) {
    const s = FLX4RX3.startup;

    if (!s.active) { return; }
    s.seen[kind] = (s.seen[kind] || 0) + 1;
    if (s.first < 0) { s.first = Date.now() - s.t0; }
};

FLX4RX3.startupStop = function() {
    const s = FLX4RX3.startup;

    s.armed = false;
    s.active = false;
    if (s.timer) { engine.stopTimer(s.timer); s.timer = 0; }
    s.connections.forEach(function(c) { if (c && c.disconnect) { c.disconnect(); } });
    s.connections = [];
};

FLX4RX3.startupReport = function() {
    const s = FLX4RX3.startup;
    const kinds = ["trim", "eq", "cfx", "tempo", "fader", "crossfader"];
    let total = 0;
    const parts = kinds.map(function(k) { total += s.seen[k] || 0; return k + " " + (s.seen[k] || 0); });
    const first = s.first;

    s.timer = 0;
    FLX4RX3.startupStop();
    FLX4RX3.log("STARTSTANDEN binnen " + FLX4RX3.options.startupWindowMs + " ms na de eerste vraag: " + parts.join(", ") +
        (total > 0 ? " (eerste antwoord na " + first + " ms)" :
            " -> de controller meldt geen standen na de vraag; regelaars nemen over bij de eerste beweging"));
};

FLX4RX3.startStartupSync = function() {
    if (!FLX4RX3.options.startupSync) { return; }
    FLX4RX3.startup.armed = true;
    FLX4RX3.startup.seen = {};
};

FLX4RX3.startupAnchor = function() {
    const s = FLX4RX3.startup;

    if (!s.armed) { return; }
    s.armed = false;
    s.active = true;
    s.seen = {};
    s.first = -1;
    s.t0 = Date.now();
    [["[Channel1]", "volume", "fader"], ["[Channel2]", "volume", "fader"], ["[Master]", "crossfader", "crossfader"]].forEach(
        function(item) {
            s.connections.push(engine.makeConnection(item[0], item[1], function() { FLX4RX3.startupNote(item[2]); }));
        });
    s.timer = engine.beginTimer(FLX4RX3.options.startupWindowMs, FLX4RX3.startupReport, true);
    FLX4RX3.log("STARTSTANDEN: eerste vraag aan de controller verstuurd, telvenster open");
};

// De vraag aan de controller (uit Wireshark, ongewijzigd); doet ook dienst als keep-alive.
FLX4RX3.sendKeepAlive = function() {
    midi.sendSysexMsg([0xF0, 0x00, 0x40, 0x05, 0x00, 0x00, 0x04, 0x05, 0x00, 0x50, 0x02, 0xf7], 12);
    FLX4RX3.startupAnchor();
};

// ---- Tempo-schuif: de schuif is het tempo -----------------------------------------------
// Mixxx negeert met soft-takeover de eerste waarde van een schuif en daarna alles tot de schuif
// langs de huidige stand komt: je moet dus eerst aan de schuif draaien. Bij Pioneer is de stand
// van de schuif gewoon het tempo. Hier springt het tempo naar de schuif bij het opstarten, bij
// de eerste beweging en na het laden van een liedje. Staat sync aan, dan blijft soft-takeover.
FLX4RX3.tempoLsbState = {};
FLX4RX3.tempoLoadTimers = {};

FLX4RX3.tempoSliderMSB = function(_channel, _control, value, _status, group) {
    FLX4RX3.highResMSB[group].tempoSlider = value;
};

FLX4RX3.tempoRateFromSlider = function(group) {
    const msb = FLX4RX3.highResMSB[group].tempoSlider;
    const lsb = FLX4RX3.tempoLsbState[group];

    if (msb === undefined || lsb === undefined) { return null; }
    return 1 - (((msb << 7) + lsb) / 0x2000);
};

FLX4RX3.setRateDirect = function(group, rate) {
    engine.softTakeover(group, "rate", false);
    engine.setValue(group, "rate", rate);
    engine.softTakeover(group, "rate", true);
};

FLX4RX3.tempoSliderLSB = function(_channel, _control, value, _status, group) {
    const known = FLX4RX3.tempoLsbState[group] !== undefined;

    FLX4RX3.startupNote("tempo");
    FLX4RX3.tempoLsbState[group] = value;

    const rate = FLX4RX3.tempoRateFromSlider(group);
    const follow = FLX4RX3.options.tempoFollowSlider &&
        (FLX4RX3.startup.active || (!known && engine.getValue(group, "sync_enabled") <= 0));

    if (rate === null) { return; }
    if (follow) {
        FLX4RX3.setRateDirect(group, rate);
    } else {
        engine.setValue(group, "rate", rate);
    }
};

FLX4RX3.trackLoadedTempo = function(value, group) {
    if (value <= 0 || !FLX4RX3.options.tempoFollowSlider) { return; }
    if (FLX4RX3.tempoLoadTimers[group]) { engine.stopTimer(FLX4RX3.tempoLoadTimers[group]); }

    FLX4RX3.tempoLoadTimers[group] = engine.beginTimer(FLX4RX3.options.tempoLoadDelayMs, function() {
        const rate = FLX4RX3.tempoRateFromSlider(group);

        FLX4RX3.tempoLoadTimers[group] = 0;
        if (rate === null || engine.getValue(group, "sync_enabled") > 0) { return; }
        FLX4RX3.setRateDirect(group, rate);
        FLX4RX3.log("tempo na laden op " + group + " = stand van de schuif");
    }, true);
};

// ---- SMART FADER: crossfader aan/uit ----------------------------------------------------
FLX4RX3.xfade = {off: false, saved: {}};
FLX4RX3.xfadeDefaults = {"[Channel1]": 0, "[Channel2]": 2};

FLX4RX3.xfadeRestore = function() {
    Object.keys(FLX4RX3.xfadeDefaults).forEach(function(group) {
        const saved = FLX4RX3.xfade.saved[group];

        engine.setValue(group, "orientation", saved !== undefined && saved !== 1 ? saved : FLX4RX3.xfadeDefaults[group]);
    });
    FLX4RX3.xfade.off = false;
};

FLX4RX3.smartFaderPressed = function() {
    if (FLX4RX3.xfade.off) {
        FLX4RX3.xfadeRestore();
    } else {
        Object.keys(FLX4RX3.xfadeDefaults).forEach(function(group) {
            FLX4RX3.xfade.saved[group] = engine.getValue(group, "orientation");
            engine.setValue(group, "orientation", 1);
        });
        FLX4RX3.xfade.off = true;
    }
    FLX4RX3.log("crossfader " + (FLX4RX3.xfade.off ? "UIT (THRU)" : "AAN"));
};

// ---- Start en stop ---------------------------------------------------------------
FLX4RX3.initRx3 = function() {
    // Altijd slot 1 als Beat FX-effect; LED volgt effect + unit
    engine.setValue(FLX4RX3.fxUnit, "focused_effect", 1);
    engine.makeConnection(FLX4RX3.fxUnit, "enabled", FLX4RX3.toggleFxLight);

    // Sync gaat uit bij het laden van een liedje
    engine.makeConnection("[Channel1]", "track_loaded", FLX4RX3.trackLoadedSync);
    engine.makeConnection("[Channel2]", "track_loaded", FLX4RX3.trackLoadedSync);
    // Het tempo volgt daarna de schuif (de volgorde is belangrijk: eerst sync uit, dan tempo)
    engine.makeConnection("[Channel1]", "track_loaded", FLX4RX3.trackLoadedTempo);
    engine.makeConnection("[Channel2]", "track_loaded", FLX4RX3.trackLoadedTempo);

    // Standen van de controller ophalen en tellen (de SysEx-vraag is al verstuurd in init)
    FLX4RX3.startStartupSync();

    // NauticMixxx zet zijn gebruikersinstellingen terug nadat de mapping klaar is
    FLX4RX3.enc.init();

    FLX4RX3.skinState.initTimer = engine.beginTimer(1000, function() {
        FLX4RX3.skinState.initTimer = 0;
        FLX4RX3.showStatusPanel();
        FLX4RX3.initCfx();
        FLX4RX3.log("NauticMixxx-koppeling gestart");
    }, true);
    FLX4RX3.log("mapping gestart");
};

// ---- CFX (de FILTER-knop per kanaal) ---------------------------------------------
// NauticMixxx laat de Sound Color FX standaard uit; alleen zijn eigen knoppen zetten ze aan.
// De FLX4 heeft die knoppen niet, dus zet de mapping de keten zelf aan, op FILTER.
FLX4RX3.initCfx = function() {
    for (let deck = 1; deck <= 2; ++deck) {
        const group = "[QuickEffectRack1_[Channel" + deck + "]]";

        engine.setValue(group, "group_[Channel" + deck + "]_enable", 1);
        if (FLX4RX3.options.cfxPreset > 0) {
            engine.setValue(group, "loaded_chain_preset", FLX4RX3.options.cfxPreset);
        }
        engine.setValue(group, "enabled", 1);
    }
    FLX4RX3.log("CFX aan op deck 1 en 2 (keten " + FLX4RX3.options.cfxPreset + ")");
};

// ---- TRIM -------------------------------------------------------------------------
// Standaard stuurt de knop [ChannelN],pregain rechtstreeks (12 uur = 0 dB). Hier wordt de
// stand verschoven zodat 12 uur ongeveer -6 dB is; links blijft 0 en rechts blijft 1.
FLX4RX3.trimState = {msb: {}, lsb: {}};

FLX4RX3.trimShift = function(raw) {
    const offset = Math.min(0.45, Math.max(0, FLX4RX3.options.trimOffset));
    const noon = 0.5 - offset;

    if (raw <= 0.5) {
        return raw * noon / 0.5;
    }
    return noon + (raw - 0.5) * (1 - noon) / 0.5;
};

FLX4RX3.trimApply = function(group) {
    const msb = FLX4RX3.trimState.msb[group] || 0;
    const lsb = FLX4RX3.trimState.lsb[group] || 0;
    const raw = ((msb << 7) | lsb) / 16383;

    engine.setParameter(group, "pregain", FLX4RX3.trimShift(raw));
};

FLX4RX3.trimMsb = function(_channel, _control, value, _status, group) {
    FLX4RX3.startupNote("trim");
    FLX4RX3.trimState.msb[group] = value;
    FLX4RX3.trimApply(group);
};

FLX4RX3.trimLsb = function(_channel, _control, value, _status, group) {
    FLX4RX3.startupNote("trim");
    FLX4RX3.trimState.lsb[group] = value;
    FLX4RX3.trimApply(group);
};

// ---- EQ (HI / MID / LOW) ----------------------------------------------------------
// De knoppen sturen 14 bits (MSB + LSB). Standaard gaat de knopstand rechtstreeks naar
// Mixxx' "Biquad Full Kill" EQ: links = kill, 12 uur = 0 dB, rechts = +12 dB. De Pioneer
// doet links -26 dB en rechts +6 dB. Hier wordt de knopstand daarom eerst omgerekend naar
// de dB-waarde van de Pioneer en daarna naar de parameter die Mixxx daarvoor nodig heeft.
FLX4RX3.eqState = {msb: {}, lsb: {}};
FLX4RX3.eqBand = {0x07: 3, 0x27: 3, 0x0B: 2, 0x2B: 2, 0x0F: 1, 0x2F: 1}; // HI=3, MID=2, LOW=1

// Gewenste versterking in dB voor knopstand x (0..1, 0.5 = 12 uur).
FLX4RX3.eqTargetDb = function(x) {
    const o = FLX4RX3.options;

    if (Math.abs(x - 0.5) <= o.eqCenterDeadzone) { return 0; }
    if (x < 0.5) {
        return -o.eqCutDb * Math.pow(1 - x / 0.5, o.eqCutCurve);
    }
    return o.eqBoostDb * Math.pow((x - 0.5) / 0.5, o.eqBoostCurve);
};

// Totale demping in dB van Mixxx' EQ bij waarde v (1 = 0 dB): tot v = 0,25 (-12 dB) precies
// 20*log10(v); daaronder komt de kill-filter erbij (-23 dB) en de isolator die de band wegdraait.
FLX4RX3.eqActualDb = function(v) {
    if (v >= 0.25) { return 20 * Math.log10(v); }
    return (-23 + 12) * (1 - v / 0.25) - 12 + 20 * Math.log10(v / 0.25);
};

// Waarde v (verhouding) waarbij Mixxx' EQ de gevraagde dB levert.
FLX4RX3.eqRatioFor = function(db) {
    if (db >= -12) { return Math.pow(10, db / 20); }

    let lowRatio = 0.0005;
    let highRatio = 0.25;

    for (let i = 0; i < 40; ++i) {
        const midRatio = (lowRatio + highRatio) / 2;
        if (FLX4RX3.eqActualDb(midRatio) < db) { lowRatio = midRatio; } else { highRatio = midRatio; }
    }
    return (lowRatio + highRatio) / 2;
};

// Parameter (0..1) van Mixxx' effectknop voor waarde v. Zelfde formules als Mixxx'
// "audio taper" voor EQ-knoppen: -12 dB .. +12,04 dB met 0 dB op 0,5.
FLX4RX3.eqParameterForRatio = function(v) {
    if (v < 1) {
        const offset = Math.pow(10, -12 / 20);
        const overlay = offset * (1 - v);
        return (20 * Math.log10(v + overlay) + 12) / 12 * 0.5;
    }
    if (v === 1) { return 0.5; }
    return Math.min(1, 0.5 + 20 * Math.log10(v) / 12.0412 * 0.5);
};

FLX4RX3.eqParameter = function(x) {
    if (FLX4RX3.options.eqMode !== "pioneer") { return x; }
    return FLX4RX3.eqParameterForRatio(FLX4RX3.eqRatioFor(FLX4RX3.eqTargetDb(x)));
};

FLX4RX3.eqApply = function(group, band, id) {
    const msb = FLX4RX3.eqState.msb[id] || 0;
    const lsb = FLX4RX3.eqState.lsb[id] || 0;
    const x = ((msb << 7) | lsb) / 16383;

    engine.setParameter(group, "parameter" + band, FLX4RX3.eqParameter(x));
};

FLX4RX3.eqMsb = function(_channel, control, value, _status, group) {
    FLX4RX3.startupNote("eq");
    const band = FLX4RX3.eqBand[control];
    const id = group + band;

    FLX4RX3.eqState.msb[id] = value;
    FLX4RX3.eqApply(group, band, id);
};

FLX4RX3.eqLsb = function(_channel, control, value, _status, group) {
    FLX4RX3.startupNote("eq");
    const band = FLX4RX3.eqBand[control];
    const id = group + band;

    FLX4RX3.eqState.lsb[id] = value;
    FLX4RX3.eqApply(group, band, id);
};

// ---- CFX-knop met vlak rond 12 uur -------------------------------------------------
FLX4RX3.cfxState = {msb: {}, lsb: {}};

FLX4RX3.cfxShape = function(x) {
    const zone = Math.min(0.2, Math.max(0, FLX4RX3.options.cfxDeadzone));
    const distance = Math.abs(x - 0.5);

    if (distance <= zone) { return 0.5; }
    const scaled = (distance - zone) / (0.5 - zone) * 0.5;
    return x < 0.5 ? 0.5 - scaled : 0.5 + scaled;
};

FLX4RX3.cfxApply = function(group) {
    const msb = FLX4RX3.cfxState.msb[group] || 0;
    const lsb = FLX4RX3.cfxState.lsb[group] || 0;

    engine.setParameter(group, "super1", FLX4RX3.cfxShape(((msb << 7) | lsb) / 16383));
};

FLX4RX3.cfxMsb = function(_channel, _control, value, _status, group) {
    FLX4RX3.startupNote("cfx");
    FLX4RX3.cfxState.msb[group] = value;
    FLX4RX3.cfxApply(group);
};

FLX4RX3.cfxLsb = function(_channel, _control, value, _status, group) {
    FLX4RX3.startupNote("cfx");
    FLX4RX3.cfxState.lsb[group] = value;
    FLX4RX3.cfxApply(group);
};

// ---- SMART CFX: de CFX-keten kiezen ---------------------------------------------------
// Keten 1 REVERB, 2 PING PONG, 3 NOISE, 4 FILTER (NauticMixxx' lijst met Sound Color FX).
FLX4RX3.smartCfxStep = function(direction) {
    const key = direction > 0 ? "next_chain_preset" : "prev_chain_preset";

    for (let deck = 1; deck <= 2; ++deck) {
        const group = "[QuickEffectRack1_[Channel" + deck + "]]";

        FLX4RX3.pulseValue(group, key, 1);
    }
    // Een nieuwe keten kan uitstaan: zet hem na het laden weer aan.
    engine.beginTimer(80, function() {
        for (let deck = 1; deck <= 2; ++deck) {
            const group = "[QuickEffectRack1_[Channel" + deck + "]]";

            engine.setValue(group, "enabled", 1);
        }
        FLX4RX3.log("SMART CFX: keten " + engine.getValue("[QuickEffectRack1_[Channel1]]", "loaded_chain_preset") +
            " (1 REVERB, 2 PING PONG, 3 NOISE, 4 FILTER)");
    }, true);
};

FLX4RX3.smartCfxPressed = function() {
    const shifted = FLX4RX3.shiftButtonDown[0] || FLX4RX3.shiftButtonDown[1];

    FLX4RX3.smartCfxStep(shifted ? -1 : 1);
};

// Alle knoppen van het mengpaneel (status 0x96) die de mapping niet gebruikt, komen hier uit.
// Zo vangt de mapping de SMART CFX-knop op, en laat hij in mixxx.log zien welk adres een
// onbekende knop heeft.
FLX4RX3.unmappedButton = function(_channel, control, value, status, _group) {
    const down = value > 0 && (status & 0xF0) !== 0x80;

    if (!down) { return; }
    const key = ((status & 0xFF) << 8) | (control & 0xFF);

    if (FLX4RX3.options.smartCfxKeys.indexOf(key) >= 0) {
        FLX4RX3.smartCfxPressed();
        return;
    }
    if (FLX4RX3.options.smartFaderKeys.indexOf(key) >= 0) {
        FLX4RX3.smartFaderPressed();
        return;
    }
    if (FLX4RX3.options.logUnknownButtons) {
        FLX4RX3.log("ONBEKENDE KNOP status=0x" + (status & 0xFF).toString(16) + " noot=0x" + (control & 0xFF).toString(16));
    }
};

// ---- Sync alleen met BEAT SYNC ----------------------------------------------------------
// Mixxx laat de sync-knop van een deck aan staan als je een nieuw liedje laadt; het nieuwe
// liedje neemt dan zelf het tempo over. Hier gaat sync bij het laden uit.
FLX4RX3.trackLoadedSync = function(value, group) {
    if (value <= 0 || FLX4RX3.options.syncOnLoad !== "off") { return; }
    if (engine.getValue(group, "sync_enabled") <= 0) { return; }

    engine.setValue(group, "sync_enabled", 0);
    if (FLX4RX3.options.syncResetRate) {
        engine.softTakeoverIgnoreNextValue(group, "rate");
        engine.setValue(group, "rate", 0);
    }
    FLX4RX3.log("sync uit na laden op " + group + " (alleen BEAT SYNC zet hem aan)");
};


FLX4RX3.shutdownRx3 = function() {
    FLX4RX3.startupStop();
    if (FLX4RX3.xfade.off) { FLX4RX3.xfadeRestore(); }
    FLX4RX3.cancelFxRestore();
    if (FLX4RX3.skinState.initTimer) {
        engine.stopTimer(FLX4RX3.skinState.initTimer);
        FLX4RX3.skinState.initTimer = 0;
    }
    FLX4RX3.enc.shutdown();
};
