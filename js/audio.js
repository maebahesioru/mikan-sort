/* Mikan Sort! — tiny Web Audio sound effects (no audio files) */
'use strict';

const Sfx = (() => {
  let ctx = null;
  let enabled = true;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', when = 0, gain = 0.08) {
    if (!enabled) return;
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    correct() { tone(660, 0.09); tone(880, 0.12, 'sine', 0.08); },
    wrong() { tone(180, 0.22, 'square', 0, 0.06); },
    combo(mult) { tone(440 + mult * 110, 0.08, 'triangle', 0, 0.07); tone(660 + mult * 110, 0.11, 'triangle', 0.07); },
    levelUp() { tone(523, 0.09); tone(659, 0.09, 'sine', 0.09); tone(784, 0.14, 'sine', 0.18); },
    gameOver() { tone(392, 0.16); tone(311, 0.16, 'sine', 0.16); tone(233, 0.3, 'sine', 0.32); },
    toggle() { enabled = !enabled; if (enabled) tone(700, 0.08); return enabled; },
    get enabled() { return enabled; },
  };
})();
