// SoundFX — tiny Web Audio API sound synthesizer.
// No external files needed; all sounds are generated procedurally.
// Silently skipped if AudioContext is unavailable (e.g. locked on mobile).

let _ctx = null;

function ctx() {
  if (!_ctx) {
    try { _ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (_) {}
  }
  // Resume if suspended (browser autoplay policy).
  if (_ctx && _ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

// ── Friendly "Arf!" bark ────────────────────────────────────────────────────
// Two short tonal bursts falling in pitch, like a small happy dog.
export function playArf() {
  const c = ctx();
  if (!c) return;

  const now = c.currentTime;

  // Each "arf" is an oscillator (square → filtered) with pitch glide + gain envelope.
  const playBurst = (startTime, freq, duration) => {
    const osc  = c.createOscillator();
    const gain = c.createGain();
    const filt = c.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.55, startTime + duration);

    filt.type = 'bandpass';
    filt.frequency.value = freq * 1.2;
    filt.Q.value = 3;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.28, startTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(filt);
    filt.connect(gain);
    gain.connect(c.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  };

  playBurst(now,        520, 0.10);   // first "Ar-"
  playBurst(now + 0.13, 480, 0.08);   // "-f!"
}

// ── Coin clink ─────────────────────────────────────────────────────────────
// Two high sine tones in quick succession — like a coin dropping into a jar.
export function playCoinClink() {
  const c = ctx();
  if (!c) return;

  const now = c.currentTime;

  const playTone = (startTime, freq, duration) => {
    const osc  = c.createOscillator();
    const gain = c.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.35, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(c.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.01);
  };

  playTone(now,        1320, 0.18);   // first clink
  playTone(now + 0.09, 1760, 0.22);   // second, higher "ding"
}
