/* ==========================================================
   MaresFy — audio engine, vizualizér, DJ pult, sekvencer.
   Vše lokálně přes Web Audio API. Spotify část je v spotify.js
   a komunikuje s tímto souborem přes window.MF.
   ========================================================== */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const root = document.documentElement;

/* ---------- veřejné rozhraní pro spotify.js ---------- */
const MF = window.MF = {
  toast, applyPalette, hsl2hex,
  setTrackTitle, setExternalBeat, setSpotifyMix,
  get audioReady() { return !!ctx; },
  ensureAudio: () => initAudio(),
  ui: {}
};

/* ---------- toast ---------- */
const toastEl = $('#toast');
let toastTimer = null;
function toast(msg, isErr) {
  toastEl.textContent = msg;
  toastEl.classList.toggle('err', !!isErr);
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), isErr ? 6000 : 3200);
}

/* =========================================================
   STAV
   ========================================================= */
let ctx = null, master, masterFilter, analyser, drumBus, delay, delayFb, delaySend, revSend, convolver, noiseBuf;
let freqData, timeData, simData;
const state = {
  playing: false, bpm: 124, step: 0, nextStepTime: 0,
  viz: 'bars', sens: 1, drumsOn: true, drumVol: .85,
  root: 9, scale: 'minor', wave: 'sawtooth', oct: 0, detune: 12, atk: .01, rel: .3,
  synthMix: 1
};
// externí (spotify) rytmus pro simulovanou vizualizaci
const ext = { playing: false, bpm: 0, startedAt: 0, positionMs: 0, energy: 0 };

const SCALES = {
  major:[0,2,4,5,7,9,11], minor:[0,2,3,5,7,8,10], dorian:[0,2,3,5,7,9,10],
  phrygian:[0,1,3,5,7,8,10], pentaMinor:[0,3,5,7,10], blues:[0,3,5,6,7,10], japanese:[0,1,5,7,8]
};
const NOTE_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','H'];
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
function degToMidi(deg, baseOct = 3) {
  const sc = SCALES[state.scale], n = sc.length;
  const oct = Math.floor(deg / n), idx = ((deg % n) + n) % n;
  return 12 * (baseOct + oct + 1 + state.oct) + state.root + sc[idx];
}

/* =========================================================
   AUDIO GRAF
   ========================================================= */
function initAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  ctx = new (window.AudioContext || window.webkitAudioContext)();

  master = ctx.createGain(); master.gain.value = .8;
  masterFilter = ctx.createBiquadFilter(); masterFilter.type = 'lowpass';
  masterFilter.frequency.value = 20000; masterFilter.Q.value = 1;

  analyser = ctx.createAnalyser();
  analyser.fftSize = 2048; analyser.smoothingTimeConstant = .75;
  freqData = new Uint8Array(analyser.frequencyBinCount);
  timeData = new Uint8Array(analyser.fftSize);

  master.connect(masterFilter).connect(analyser).connect(ctx.destination);

  delay = ctx.createDelay(2); delay.delayTime.value = 60 / state.bpm / 2;
  delayFb = ctx.createGain(); delayFb.gain.value = .35;
  delaySend = ctx.createGain(); delaySend.gain.value = .18;
  delay.connect(delayFb).connect(delay);
  delaySend.connect(delay).connect(master);

  convolver = ctx.createConvolver(); convolver.buffer = makeImpulse(2.6, 2.2);
  revSend = ctx.createGain(); revSend.gain.value = .22;
  revSend.connect(convolver).connect(master);

  drumBus = ctx.createGain(); drumBus.gain.value = state.drumVol;
  drumBus.connect(master); drumBus.connect(delaySend); drumBus.connect(revSend);

  noiseBuf = makeNoise(2);
  decks.forEach(d => d.build());
  applySynthMix();
  return ctx;
}
function makeNoise(sec) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function makeImpulse(sec, decay) {
  const len = Math.floor(ctx.sampleRate * sec);
  const b = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c2 = 0; c2 < 2; c2++) {
    const d = b.getChannelData(c2);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  return b;
}

/* ---------- bicí ---------- */
function noiseSrc(t, dur) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuf;
  s.start(t, Math.random() * 1.5, dur + .05);
  return s;
}
function env(t, a, d, peak = 1) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  return g;
}
const DRUMS = {
  kick(t) {
    const o = ctx.createOscillator(), g = env(t, .002, .34, 1.1);
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(42, t + .13);
    o.connect(g).connect(drumBus); o.start(t); o.stop(t + .45);
  },
  snare(t) {
    const n = noiseSrc(t, .22), f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = .8;
    n.connect(f).connect(env(t, .002, .18, .7)).connect(drumBus);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 185;
    o.connect(env(t, .002, .1, .45)).connect(drumBus); o.start(t); o.stop(t + .2);
  },
  hat(t) {
    const n = noiseSrc(t, .06), f = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 8200;
    n.connect(f).connect(env(t, .001, .045, .32)).connect(drumBus);
  },
  clap(t) {
    for (let i = 0; i < 3; i++) {
      const tt = t + i * .012, n = noiseSrc(tt, .12), f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1250; f.Q.value = 1.4;
      n.connect(f).connect(env(tt, .001, .1, .38)).connect(drumBus);
    }
  }
};
const DRUM_ROWS = [['kick', 'Kick'], ['snare', 'Snare'], ['hat', 'HiHat'], ['clap', 'Clap']];
let pattern = {
  kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
  snare: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
  hat:   [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,1,1,0],
  clap:  [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0]
};
const PRESETS = {
  house: { kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], hat:[0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0], clap:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0] },
  techno:{ kick:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1], snare:[0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0], hat:[1,0,1,1,0,1,1,0,1,0,1,1,0,1,1,0], clap:[0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0] },
  dnb:   { kick:[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0], snare:[0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,1], hat:[0,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1], clap:[0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0] }
};

const TRACKS = [
  { name:'Neon Drive',  bass:[0,null,0,null,-3,null,0,null,2,null,0,null,-3,null,-1,null], lead:[7,null,5,4,null,7,null,9,7,null,4,null,5,null,2,null] },
  { name:'Deep Space',  bass:[0,null,null,null,3,null,null,null,-2,null,null,null,2,null,null,null], lead:[null,11,null,9,null,7,null,9,null,11,null,12,null,9,null,7] },
  { name:'Acid Rain',   bass:[0,0,3,0,5,0,3,0,7,0,3,0,5,3,2,0], lead:[null,null,null,null,null,null,null,null,14,12,11,9,7,5,4,2] },
  { name:'Sunset Vibe', bass:[0,null,null,4,null,null,2,null,-3,null,null,0,null,null,2,null], lead:[9,null,7,null,5,null,4,null,5,null,7,null,9,null,11,null] },
  { name:'Hard Pulse',  bass:[0,0,0,0,0,0,0,0,-2,-2,-2,-2,3,3,3,3], lead:[7,7,null,7,null,9,null,7,10,null,9,null,7,null,5,null] },
  { name:'Chill Loop',  bass:[0,null,null,null,-3,null,null,null,2,null,null,null,4,null,null,null], lead:[null,null,7,null,null,9,null,null,11,null,null,9,null,null,7,null] },
  { name:'Ticho (jen bicí)', bass:new Array(16).fill(null), lead:new Array(16).fill(null) }
];

/* =========================================================
   DECK
   ========================================================= */
class Deck {
  constructor(id, trackIdx) {
    this.id = id; this.trackIdx = trackIdx;
    this.playing = false; this.step = 0; this.nextTime = 0;
    this.tempo = 1; this.vol = .85; this.filterPos = 0;
    this.eq = { low: 0, mid: 0, high: 0 };
    this.buffer = null; this.bufSource = null; this.scratch = 0;
    this.el = $(`.deck[data-deck="${id}"]`);
  }
  build() {
    this.gain = ctx.createGain(); this.gain.gain.value = 1;
    this.xf = ctx.createGain(); this.xf.gain.value = .707;
    this.lo = ctx.createBiquadFilter(); this.lo.type = 'lowshelf'; this.lo.frequency.value = 220;
    this.md = ctx.createBiquadFilter(); this.md.type = 'peaking'; this.md.frequency.value = 1100; this.md.Q.value = .9;
    this.hi = ctx.createBiquadFilter(); this.hi.type = 'highshelf'; this.hi.frequency.value = 3800;
    this.lpf = ctx.createBiquadFilter(); this.lpf.type = 'lowpass'; this.lpf.frequency.value = 20000; this.lpf.Q.value = 6;
    this.hpf = ctx.createBiquadFilter(); this.hpf.type = 'highpass'; this.hpf.frequency.value = 20; this.hpf.Q.value = 6;
    this.gain.connect(this.lo).connect(this.md).connect(this.hi).connect(this.lpf).connect(this.hpf).connect(this.xf);
    this.xf.connect(master); this.xf.connect(delaySend); this.xf.connect(revSend);
    this.applyVol(); this.applyFilter(); this.applyEq();
  }
  get track() { return TRACKS[this.trackIdx]; }
  applyVol() { if (this.gain) this.gain.gain.value = this.vol; }
  applyEq() {
    if (!this.lo) return;
    this.lo.gain.value = this.eq.low; this.md.gain.value = this.eq.mid; this.hi.gain.value = this.eq.high;
  }
  applyFilter() {
    if (!this.lpf) return;
    const p = this.filterPos / 100;
    if (p < -0.02) { this.lpf.frequency.value = 20000 * Math.pow(0.0045, -p); this.hpf.frequency.value = 20; }
    else if (p > 0.02) { this.hpf.frequency.value = 20 * Math.pow(500, p); this.lpf.frequency.value = 20000; }
    else { this.lpf.frequency.value = 20000; this.hpf.frequency.value = 20; }
  }
  play() {
    initAudio();
    ensureScheduler();
    this.playing = true; this.step = 0; this.nextTime = ctx.currentTime + .06;
    if (this.buffer) this.startBuffer();
    this.render();
  }
  stop() {
    this.playing = false;
    if (this.bufSource) { try { this.bufSource.stop(); } catch (e) {} this.bufSource = null; }
    this.render();
  }
  toggle() { this.playing ? this.stop() : this.play(); }
  startBuffer() {
    if (this.bufSource) { try { this.bufSource.stop(); } catch (e) {} }
    const s = ctx.createBufferSource();
    s.buffer = this.buffer; s.loop = true;
    s.playbackRate.value = this.tempo;
    s.connect(this.gain); s.start();
    this.bufSource = s;
  }
  setTempo(t) {
    this.tempo = t;
    if (this.bufSource) this.bufSource.playbackRate.setTargetAtTime(t, ctx.currentTime, .02);
  }
  bpm() { return state.bpm * this.tempo; }
  tick(now) {
    if (!this.playing || this.buffer) return;
    const spb = 60 / this.bpm() / 4;
    while (this.nextTime < now + .12) {
      this.scheduleStep(this.step, this.nextTime);
      this.nextTime += spb; this.step = (this.step + 1) % 16;
    }
  }
  scheduleStep(i, t) {
    const tr = this.track;
    const b = tr.bass[i], l = tr.lead[i];
    if (b !== null && b !== undefined) this.voice(degToMidi(b, 2), t, .9, .55);
    if (l !== null && l !== undefined) this.voice(degToMidi(l, 4), t, .45, .3);
  }
  voice(midi, t, dur, amp) {
    const f = mtof(midi);
    const g = ctx.createGain();
    const a = Math.max(.002, state.atk), r = Math.max(.03, state.rel * dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(amp, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + r);
    const mk = det => {
      const o = ctx.createOscillator();
      o.type = state.wave; o.frequency.value = f; o.detune.value = det;
      o.connect(g); o.start(t); o.stop(t + a + r + .05);
    };
    mk(-state.detune); mk(state.detune);
    g.connect(this.gain || master);
  }
  async loadFile(file) {
    initAudio();
    const buf = await file.arrayBuffer();
    this.buffer = await ctx.decodeAudioData(buf);
    this.customName = file.name.replace(/\.[^.]+$/, '');
    if (this.playing) this.startBuffer();
    this.render();
    toast('Načteno: ' + this.customName);
  }
  render() {
    const q = r => $(`[data-role="${r}"]`, this.el);
    q('title').textContent = this.buffer ? '📁 ' + this.customName : this.track.name;
    q('bpm').textContent = Math.round(this.bpm());
    q('key').textContent = NOTE_NAMES[state.root] + (state.scale === 'major' ? '' : 'm');
    q('state').textContent = this.playing ? 'PLAY' : 'STOP';
    q('state').style.color = this.playing ? 'var(--c1)' : 'var(--txt2)';
    q('play').textContent = this.playing ? '⏸ PAUSE' : '▶ PLAY';
    q('play').classList.toggle('on', this.playing);
    const p = q('platter');
    p.classList.toggle('spin', this.playing);
    p.style.animationDuration = (1.8 / this.tempo) + 's';
  }
}
const decks = [new Deck('a', 0), new Deck('b', 1)];

/* ---------- transport ---------- */
let schedTimer = null;
const beatQueue = [];
function ensureScheduler() { if (!schedTimer) schedTimer = setInterval(transportTick, 25); }
function transportTick() {
  if (!ctx) return;
  const now = ctx.currentTime;
  if (state.playing) {
    const spb = 60 / state.bpm / 4;
    while (state.nextStepTime < now + .12) {
      const s = state.step, t = state.nextStepTime;
      if (state.drumsOn) DRUM_ROWS.forEach(([k]) => { if (pattern[k][s]) DRUMS[k](t); });
      beatQueue.push({ step: s, time: t });
      state.nextStepTime += spb; state.step = (state.step + 1) % 16;
    }
  }
  decks.forEach(d => d.tick(now));
}
function startTransport() {
  initAudio(); ensureScheduler();
  state.playing = true; state.step = 0; state.nextStepTime = ctx.currentTime + .06;
  $('#masterPlay').textContent = '⏸ SYNTH';
  $('#masterPlay').classList.add('on');
  if (!decks.some(d => d.playing)) decks[0].play();
}
function stopTransport() {
  state.playing = false;
  decks.forEach(d => d.stop());
  $('#masterPlay').textContent = '▶ SYNTH';
  $('#masterPlay').classList.remove('on');
}
function toggleTransport() { state.playing ? stopTransport() : startTransport(); }

/* =========================================================
   VIZUALIZÉR
   ========================================================= */
const cv = $('#viz'), c = cv.getContext('2d');
const hist = $('#history'), hc = hist.getContext('2d');
const histData = new Array(160).fill(0);
let W = 0, H = 0, hueShift = 0, particles = [], tunnelZ = 0;
let srcMode = 'synth'; // synth | live | sim

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const r = cv.getBoundingClientRect();
  cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  W = r.width; H = r.height;
  const r2 = hist.getBoundingClientRect();
  hist.width = Math.max(1, r2.width * dpr); hist.height = Math.max(1, r2.height * dpr);
  hc.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
for (let i = 0; i < 120; i++) particles.push({ a: Math.random() * Math.PI * 2, r: Math.random(), s: .2 + Math.random(), sz: 1 + Math.random() * 3 });

const css = n => getComputedStyle(root).getPropertyValue(n).trim();
function bandAvg(from, to) {
  let s = 0; for (let i = from; i < to; i++) s += freqData[i];
  return s / (to - from) / 255;
}

/* Spotify zvuk kvůli ochraně obsahu nejde číst z prohlížeče.
   Když hraje a nemáme živý signál, spektrum dopočítáme z tempa. */
function simulateSpectrum(t) {
  if (!simData) simData = new Uint8Array(freqData.length);
  const bpm = ext.bpm || state.bpm;
  const beat = (t / (60 / bpm));
  const ph = beat % 1, ph2 = (beat / 2) % 1, ph4 = (beat / 4) % 1;
  const kick = Math.pow(1 - ph, 3.2);
  const snare = (Math.floor(beat) % 2 === 1) ? Math.pow(1 - ph, 6) : 0;
  const hats = Math.pow(1 - ((beat * 2) % 1), 8);
  const swell = .45 + .3 * Math.sin(ph4 * Math.PI * 2) + .12 * Math.sin(ph2 * Math.PI * 6);
  for (let i = 0; i < freqData.length; i++) {
    const f = i / freqData.length;
    let v;
    if (f < .02) v = kick * 235 + swell * 30;
    else if (f < .09) v = (kick * .55 + swell) * 165;
    else if (f < .3) v = (swell * .85 + snare * .6) * 145 * (1 - f);
    else if (f < .6) v = (snare * .7 + hats * .35 + swell * .4) * 105 * (1 - f);
    else v = (hats * .75 + swell * .25) * 80 * (1.2 - f);
    v *= .8 + .35 * Math.sin(i * .35 + t * 2.2 + f * 12);
    simData[i] = clamp(v, 0, 255);
  }
  freqData = simData;
  // odpovídající "časový" průběh
  for (let i = 0; i < timeData.length; i++) {
    const x = i / timeData.length;
    const amp = (kick * .55 + swell * .3 + hats * .12);
    timeData[i] = clamp(128 + Math.sin(x * Math.PI * 2 * (2 + Math.floor(bpm / 40))) * 120 * amp, 0, 255);
  }
}

let realBuf = null;
function draw() {
  requestAnimationFrame(draw);
  const t = performance.now() / 1000;

  if ($('#autoHue').checked) {
    hueShift = (hueShift + .35) % 360;
    root.style.filter = `hue-rotate(${hueShift}deg)`;
  } else if (root.style.filter) root.style.filter = '';

  if (!analyser) { c.clearRect(0, 0, W, H); return; }
  if (!realBuf) realBuf = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(realBuf);
  freqData = realBuf;
  analyser.getByteTimeDomainData(timeData);

  let sum = 0; for (let i = 1; i < 200; i++) sum += realBuf[i];
  const hasSignal = sum / 200 > 3;

  const liveInput = captureOn || !!micStream;
  const synthActive = state.playing || decks.some(d => d.playing);
  if (liveInput && hasSignal) srcMode = 'live';
  else if (synthActive) srcMode = 'synth';
  else if (ext.playing) { srcMode = 'sim'; simulateSpectrum(t); }
  else srcMode = 'synth';
  updateSrcBadge();

  const bass = bandAvg(1, 12) * state.sens;
  const mid = bandAvg(12, 90) * state.sens;
  const high = bandAvg(90, 320) * state.sens;
  const level = clamp((bass * .5 + mid * .3 + high * .2), 0, 2);
  ext.energy = level;

  setMeter('#mBass', bass); setMeter('#mMid', mid); setMeter('#mHigh', high);
  histData.push(clamp(level, 0, 1.2)); histData.shift();
  drawHistory();
  drawVU(level);

  const now = ctx ? ctx.currentTime : 0;
  while (beatQueue.length && beatQueue[0].time <= now) {
    const b = beatQueue.shift();
    highlightStep(b.step);
    $('#beatPos').textContent = Math.floor(b.step / 4) + 1;
    if (b.step % 4 === 0) flashBeat();
  }
  if (srcMode === 'sim') {
    const bpm = ext.bpm || state.bpm;
    const beatIdx = Math.floor(t / (60 / bpm));
    if (beatIdx !== simBeat) { simBeat = beatIdx; if (beatIdx % 4 === 0) flashBeat(); $('#beatPos').textContent = (beatIdx % 4) + 1; }
  }

  if ($('#txtReact').checked) bannerWrap.style.transform = `scale(${1 + clamp(bass, 0, 1) * .28})`;
  else bannerWrap.style.transform = '';

  if ($('#trails').checked) { c.fillStyle = 'rgba(5,6,10,0.22)'; c.fillRect(0, 0, W, H); }
  else { c.fillStyle = '#05060a'; c.fillRect(0, 0, W, H); }

  const c1 = css('--c1'), c2 = css('--c2'), c3 = css('--c3');
  c.save();
  switch (state.viz) {
    case 'bars': drawBars(c1, c2, c3); break;
    case 'wave': drawWave(c1, c2, c3); break;
    case 'radial': drawRadial(c1, c2, c3, bass, t); break;
    case 'particles': drawParticles(c1, c2, c3, bass, mid, t); break;
    case 'tunnel': drawTunnel(c1, c2, c3, bass, t); break;
  }
  c.restore();
}
let simBeat = -1;
function flashBeat() {
  if (!$('#beatFlash').checked) return;
  document.body.classList.remove('beat-flash'); void document.body.offsetWidth;
  document.body.classList.add('beat-flash');
}
const SRC_LABEL = { synth: 'zdroj: syntezátor', live: 'zdroj: živý zvuk', sim: 'zdroj: Spotify (rytmická simulace)' };
function updateSrcBadge() { $('#srcBadge').textContent = SRC_LABEL[srcMode]; }

function drawBars(c1, c2, c3) {
  const n = 72, step = Math.floor(freqData.length / 2.4 / n), bw = W / n;
  for (let i = 0; i < n; i++) {
    let v = 0; for (let j = 0; j < step; j++) v = Math.max(v, freqData[i * step + j]);
    const h = clamp((v / 255) * state.sens, 0, 1.4) * H * .85;
    const g = c.createLinearGradient(0, H, 0, H - h);
    g.addColorStop(0, c1); g.addColorStop(.55, c3); g.addColorStop(1, c2);
    c.fillStyle = g; c.shadowBlur = 18; c.shadowColor = c3;
    const x = i * bw + 1.5, w = bw - 3;
    c.fillRect(x, H - h, w, h);
    c.globalAlpha = .18; c.fillRect(x, H - h - 6, w, 3);
    c.globalAlpha = .12; c.fillRect(x, H - h - h * .25, w, h * .25); c.globalAlpha = 1;
  }
  c.shadowBlur = 0;
}
function drawWave(c1, c2, c3) {
  c.lineWidth = 3; c.shadowBlur = 22;
  for (let k = 0; k < 3; k++) {
    const col = [c1, c2, c3][k];
    c.strokeStyle = col; c.shadowColor = col; c.globalAlpha = k === 0 ? 1 : .55;
    c.beginPath();
    for (let i = 0; i < timeData.length; i += 2) {
      const x = (i / timeData.length) * W;
      const v = ((timeData[i] - 128) / 128) * state.sens;
      const y = H / 2 + v * H * .38 * (1 - k * .28) + k * 6;
      i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.stroke();
  }
  c.globalAlpha = 1; c.shadowBlur = 0;
}
function drawRadial(c1, c2, c3, bass, t) {
  const cx = W / 2, cy = H / 2, base = Math.min(W, H) * .16 * (1 + bass * .35), n = 128;
  c.translate(cx, cy); c.rotate(t * .18); c.shadowBlur = 16;
  for (let i = 0; i < n; i++) {
    const v = clamp(freqData[i * 2] / 255 * state.sens, 0, 1.5);
    const a = (i / n) * Math.PI * 2;
    const len = base * .25 + v * Math.min(W, H) * .3;
    const col = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
    c.strokeStyle = col; c.shadowColor = col; c.lineWidth = 3;
    c.beginPath();
    c.moveTo(Math.cos(a) * base, Math.sin(a) * base);
    c.lineTo(Math.cos(a) * (base + len), Math.sin(a) * (base + len));
    c.stroke();
  }
  c.beginPath(); c.arc(0, 0, base * (1 + bass * .1), 0, Math.PI * 2);
  c.strokeStyle = c3; c.lineWidth = 2; c.stroke(); c.shadowBlur = 0;
}
function drawParticles(c1, c2, c3, bass, mid, t) {
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) * .45;
  c.shadowBlur = 14;
  particles.forEach((p, i) => {
    p.a += .002 * p.s * (1 + mid * 2);
    const rr = (p.r * .7 + .3 + bass * .35) * R;
    const x = cx + Math.cos(p.a) * rr * 1.5, y = cy + Math.sin(p.a * 1.3 + t * .2) * rr;
    const col = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
    c.fillStyle = col; c.shadowColor = col;
    c.beginPath(); c.arc(x, y, p.sz * (1 + bass * 2.4), 0, Math.PI * 2); c.fill();
    if (i % 7 === 0) {
      c.strokeStyle = col; c.globalAlpha = .18; c.lineWidth = 1;
      c.beginPath(); c.moveTo(cx, cy); c.lineTo(x, y); c.stroke(); c.globalAlpha = 1;
    }
  });
  c.shadowBlur = 0;
}
function drawTunnel(c1, c2, c3, bass, t) {
  const cx = W / 2, cy = H / 2;
  tunnelZ += .015 + bass * .05;
  c.translate(cx, cy); c.shadowBlur = 12;
  for (let i = 0; i < 22; i++) {
    const z = (i / 22 + tunnelZ % (1 / 22)) % 1;
    const size = Math.pow(z, 2.2) * Math.max(W, H) * 1.1;
    const v = clamp(freqData[i * 6] / 255 * state.sens, 0, 1.4);
    const col = i % 3 === 0 ? c1 : i % 3 === 1 ? c2 : c3;
    c.strokeStyle = col; c.shadowColor = col;
    c.globalAlpha = clamp(1 - z, .05, 1); c.lineWidth = 2 + v * 8;
    c.save(); c.rotate(t * .25 + i * .12 + v);
    c.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k / 6) * Math.PI * 2, x = Math.cos(a) * size / 2, y = Math.sin(a) * size / 2;
      k === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
    }
    c.closePath(); c.stroke(); c.restore();
  }
  c.globalAlpha = 1; c.shadowBlur = 0;
}
function setMeter(sel, v) {
  const el = $(sel), pct = clamp(v * 100, 0, 100);
  $('.fill', el).style.width = pct + '%';
  $('.v', el).textContent = Math.round(pct);
}
function drawHistory() {
  const r = hist.getBoundingClientRect(), w = r.width, h = r.height;
  hc.clearRect(0, 0, w, h);
  hc.strokeStyle = 'rgba(255,255,255,.06)';
  for (let i = 1; i < 4; i++) { hc.beginPath(); hc.moveTo(0, h * i / 4); hc.lineTo(w, h * i / 4); hc.stroke(); }
  const g = hc.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, css('--c1')); g.addColorStop(.5, css('--c3')); g.addColorStop(1, css('--c2'));
  hc.strokeStyle = g; hc.lineWidth = 2; hc.beginPath();
  let peak = 0;
  histData.forEach((v, i) => {
    peak = Math.max(peak, v);
    const x = (i / (histData.length - 1)) * w, y = h - clamp(v, 0, 1) * (h - 4) - 2;
    i === 0 ? hc.moveTo(x, y) : hc.lineTo(x, y);
  });
  hc.stroke();
  hc.lineTo(w, h); hc.lineTo(0, h); hc.closePath();
  hc.globalAlpha = .16; hc.fillStyle = g; hc.fill(); hc.globalAlpha = 1;
  $('#peakLab').textContent = 'peak ' + Math.round(peak * 100);
}
const vuEl = $('#vu');
for (let i = 0; i < 14; i++) vuEl.appendChild(document.createElement('i'));
function drawVU(level) {
  const bars = $$('#vu i');
  bars.forEach((b, i) => {
    const seg = i / bars.length, on = level > seg * .95;
    b.style.height = (12 + i * 4.4) + 'px';
    b.style.background = on ? (seg > .8 ? css('--c2') : seg > .55 ? css('--c3') : css('--c1')) : '#171a24';
    b.style.boxShadow = on ? '0 0 10px ' + (seg > .8 ? css('--c2') : css('--c1')) : 'none';
  });
}

/* =========================================================
   NÁPIS
   ========================================================= */
const banner = $('#banner'), bannerWrap = $('#bannerWrap');
const activeFx = new Set(['blink', 'neon']);
let trackTitle = '';
function renderBanner() {
  const txt = $('#txtInput').value || ' ';
  banner.dataset.text = txt;
  if (activeFx.has('wave') || activeFx.has('rainbow')) {
    banner.innerHTML = '';
    [...txt].forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch === ' ' ? ' ' : ch;
      s.style.animationDelay = (i * .06) + 's';
      if (activeFx.has('rainbow')) s.style.color = `hsl(${(i * 26) % 360} 90% 60%)`;
      banner.appendChild(s);
    });
  } else banner.textContent = txt;
  ['blink', 'rainbow', 'wave', 'pulse', 'shake', 'glitch', 'neon', 'd3'].forEach(f =>
    banner.classList.toggle(f, activeFx.has(f)));
  bannerWrap.classList.toggle('run', activeFx.has('run'));
  $$('#fxChips .chip').forEach(b => b.classList.toggle('on', activeFx.has(b.dataset.fx)));
}
function setTrackTitle(title) {
  trackTitle = title || '';
  if (trackTitle && $('#txtFromTrack').checked) { $('#txtInput').value = trackTitle; renderBanner(); }
}
$('#txtFromTrack').addEventListener('change', e => { if (e.target.checked && trackTitle) setTrackTitle(trackTitle); });
$('#txtInput').addEventListener('input', renderBanner);
$$('#fxChips .chip').forEach(b => b.addEventListener('click', () => {
  const f = b.dataset.fx;
  activeFx.has(f) ? activeFx.delete(f) : activeFx.add(f);
  renderBanner();
}));
const bindRange = (sel, fn) => { const el = $(sel); const h = () => fn(+el.value, el); el.addEventListener('input', h); h(); };
bindRange('#fxSpeed', v => { root.style.setProperty('--fx-speed', (v / 10) + 's'); $('#fxSpeedVal').textContent = (v / 10).toFixed(1) + '×'; });
bindRange('#runSpeed', v => { root.style.setProperty('--run-speed', v + 's'); $('#runSpeedVal').textContent = v + 's'; });
bindRange('#txtSize', v => { banner.style.fontSize = `clamp(1rem, ${v / 20}vw, ${v / 25}rem)`; $('#sizeVal').textContent = v + '%'; });
bindRange('#txtSpace', v => { banner.style.letterSpacing = v + 'px'; $('#spaceVal').textContent = v + 'px'; });
$('#txtFont').addEventListener('change', e => banner.style.fontFamily = e.target.value);

/* =========================================================
   BARVY
   ========================================================= */
const PALETTES = [
  ['Spotify', '#1db954', '#191414', '#1ed760', '#07080c'],
  ['Neon', '#1db954', '#ff2d95', '#00e5ff', '#07080c'],
  ['Sunset', '#ff8a3d', '#ff2d6f', '#ffd93d', '#160a12'],
  ['Ice', '#5ad2ff', '#9d7bff', '#e6f9ff', '#050b14'],
  ['Vapor', '#ff71ce', '#01cdfe', '#05ffa1', '#12082a'],
  ['Matrix', '#00ff41', '#008f11', '#b6ffb6', '#000600'],
  ['Lava', '#ff3d00', '#ffb300', '#ff006e', '#150404'],
  ['Mono', '#ffffff', '#9aa0ad', '#4a5160', '#0a0a0a'],
  ['Bonbón', '#ff5ecd', '#ffe14d', '#5effc4', '#1b0b2a']
];
const palBox = $('#palettes');
PALETTES.forEach(p => {
  const b = document.createElement('button');
  b.className = 'swatch'; b.title = p[0]; b.setAttribute('aria-label', 'Paleta ' + p[0]);
  b.style.background = `linear-gradient(135deg,${p[1]},${p[2]},${p[3]})`;
  b.addEventListener('click', () => applyPalette(p[1], p[2], p[3], p[4]));
  palBox.appendChild(b);
});
function applyPalette(a, b2, c3v, bg) {
  $('#col1').value = a; $('#col2').value = b2; $('#col3').value = c3v;
  if (bg) $('#colBg').value = bg;
  syncColors();
}
function syncColors() {
  root.style.setProperty('--c1', $('#col1').value);
  root.style.setProperty('--c2', $('#col2').value);
  root.style.setProperty('--c3', $('#col3').value);
  root.style.setProperty('--bg', $('#colBg').value);
  if (activeFx.has('rainbow')) renderBanner();
}
['#col1', '#col2', '#col3', '#colBg'].forEach(s => $(s).addEventListener('input', syncColors));
bindRange('#glow', v => { root.style.setProperty('--glow', v + 'px'); $('#glowVal').textContent = v; });
$('#randomColors').addEventListener('click', randomColors);
function randomColors() {
  const h = Math.random() * 360;
  applyPalette(hsl2hex(h, 85, 55), hsl2hex((h + 130) % 360, 85, 60), hsl2hex((h + 220) % 360, 90, 62), hsl2hex(h, 40, 5));
}
function hsl2hex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))));
  return '#' + [f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('');
}

/* =========================================================
   TABY, VIZUALIZÉR, MASTER
   ========================================================= */
$$('.tabs button').forEach(b => b.addEventListener('click', () => {
  $$('.tabs button').forEach(x => x.classList.toggle('on', x === b));
  $$('.tab-body').forEach(x => x.classList.toggle('on', x.id === 'tab-' + b.dataset.tab));
}));
$$('[data-viz]').forEach(b => b.addEventListener('click', () => setViz(b.dataset.viz)));
function setViz(v) {
  state.viz = v;
  $$('[data-viz]').forEach(x => x.classList.toggle('on', x.dataset.viz === v));
}
setViz('bars');

$('#masterPlay').addEventListener('click', toggleTransport);
bindRange('#masterVol', v => { $('#volVal').textContent = v; applySynthMix(); });
bindRange('#bpm', v => {
  state.bpm = v; $('#bpmVal').textContent = v; $('#bpmBig').textContent = v;
  if (delay) delay.delayTime.value = 60 / v / [4, 2, 1, .5][+$('#delayTime').value];
  decks.forEach(d => d.render());
});
bindRange('#sens', v => { state.sens = v / 10; $('#sensVal').textContent = (v / 10).toFixed(1) + '×'; });
bindRange('#smooth', v => { $('#smoothVal').textContent = (v / 100).toFixed(2); if (analyser) analyser.smoothingTimeConstant = v / 100; });
bindRange('#delaySend', v => { $('#dlyVal').textContent = v + '%'; if (delaySend) delaySend.gain.value = v / 100; });
bindRange('#feedback', v => { $('#fbVal').textContent = v + '%'; if (delayFb) delayFb.gain.value = v / 100; });
bindRange('#delayTime', v => {
  $('#dtVal').textContent = ['1/16', '1/8', '1/4', '1/2'][v];
  if (delay) delay.delayTime.value = 60 / state.bpm / [4, 2, 1, .5][v];
});
bindRange('#revSend', v => { $('#revVal').textContent = v + '%'; if (revSend) revSend.gain.value = v / 100; });
bindRange('#masterFilt', v => {
  $('#mFiltVal').textContent = v === 0 ? 'vypnuto' : (v < 0 ? 'temno ' + v : 'ostře +' + v);
  if (!masterFilter) return;
  if (v < 0) { masterFilter.type = 'lowpass'; masterFilter.frequency.value = 20000 * Math.pow(0.006, -v / 100); }
  else if (v > 0) { masterFilter.type = 'highpass'; masterFilter.frequency.value = 20 * Math.pow(400, v / 100); }
  else { masterFilter.type = 'lowpass'; masterFilter.frequency.value = 20000; }
});
bindRange('#drumVol', v => { state.drumVol = v / 100; $('#drumVal').textContent = v; if (drumBus) drumBus.gain.value = v / 100; });

/* tóny */
$('#root').addEventListener('change', e => { state.root = +e.target.value; decks.forEach(d => d.render()); buildKeys(); });
$('#scale').addEventListener('change', e => { state.scale = e.target.value; decks.forEach(d => d.render()); buildKeys(); });
$$('#waveChips .chip').forEach(b => b.addEventListener('click', () => {
  state.wave = b.dataset.wave;
  $$('#waveChips .chip').forEach(x => x.classList.toggle('on', x === b));
}));
bindRange('#oct', v => { state.oct = v; $('#octVal').textContent = (v > 0 ? '+' : '') + v; });
bindRange('#detune', v => { state.detune = v; $('#detVal').textContent = v + ' ct'; });
bindRange('#atk', v => { state.atk = v / 1000; $('#atkVal').textContent = v + ' ms'; });
bindRange('#rel', v => { state.rel = v / 1000; $('#relVal').textContent = v + ' ms'; });

/* =========================================================
   DECK UI
   ========================================================= */
decks.forEach(deck => {
  const el = deck.el, q = r => $(`[data-role="${r}"]`, el);
  const sel = q('track');
  TRACKS.forEach((t, i) => { const o = document.createElement('option'); o.value = i; o.textContent = t.name; sel.appendChild(o); });
  sel.value = deck.trackIdx;
  sel.addEventListener('change', e => {
    deck.trackIdx = +e.target.value; deck.buffer = null;
    if (deck.bufSource) { try { deck.bufSource.stop(); } catch (err) {} deck.bufSource = null; }
    deck.render();
  });
  q('play').addEventListener('click', () => { initAudio(); ensureScheduler(); deck.toggle(); });
  const tempo = q('tempo');
  tempo.addEventListener('input', () => {
    deck.setTempo(+tempo.value / 100);
    q('tempoVal').textContent = tempo.value + '%';
    deck.render();
  });
  const vol = q('vol');
  vol.addEventListener('input', () => { deck.vol = +vol.value / 100; deck.applyVol(); q('volVal').textContent = vol.value; });
  q('loadFile').addEventListener('click', () => q('file').click());
  q('file').addEventListener('change', e => {
    if (e.target.files[0]) deck.loadFile(e.target.files[0]).catch(() => toast('Soubor se nepodařilo načíst.', true));
  });

  $$('.dial', el).forEach(dial => {
    const min = +dial.dataset.min, max = +dial.dataset.max;
    let val = +dial.dataset.val;
    const paint = () => {
      $('i', dial).style.transform = `rotate(${-140 + (val - min) / (max - min) * 280}deg)`;
      const k = dial.dataset.knob;
      if (k === 'filter') { deck.filterPos = val; deck.applyFilter(); }
      else { deck.eq[k] = val; deck.applyEq(); }
    };
    paint();
    let dragging = false, startY = 0, startVal = 0;
    const down = e => { dragging = true; startY = (e.touches ? e.touches[0].clientY : e.clientY); startVal = val; e.preventDefault(); };
    const move = e => {
      if (!dragging) return;
      const y = (e.touches ? e.touches[0].clientY : e.clientY);
      val = clamp(startVal + (startY - y) * (max - min) / 160, min, max); paint();
    };
    const up = () => { dragging = false; };
    dial.addEventListener('mousedown', down); dial.addEventListener('touchstart', down, { passive: false });
    addEventListener('mousemove', move); addEventListener('touchmove', move, { passive: false });
    addEventListener('mouseup', up); addEventListener('touchend', up);
    dial.addEventListener('dblclick', () => { val = 0; paint(); });
    dial.addEventListener('wheel', e => { e.preventDefault(); val = clamp(val - Math.sign(e.deltaY) * (max - min) / 40, min, max); paint(); }, { passive: false });
  });

  const plat = q('platter');
  let scratching = false, lastX = 0;
  const sdown = e => { scratching = true; lastX = (e.touches ? e.touches[0].clientX : e.clientX); plat.style.animationPlayState = 'paused'; e.preventDefault(); };
  const smove = e => {
    if (!scratching) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX), dx = x - lastX; lastX = x;
    deck.scratch = clamp(dx / 22, -1.4, 3);
    if (deck.bufSource) deck.bufSource.playbackRate.setTargetAtTime(Math.max(.05, deck.tempo * (1 + deck.scratch)), ctx.currentTime, .01);
    else if (deck.playing && ctx && Math.abs(dx) > 2) deck.voice(degToMidi(Math.round(dx / 6), 4), ctx.currentTime, .3, .35);
  };
  const sup = () => {
    if (!scratching) return;
    scratching = false; deck.scratch = 0;
    plat.style.animationPlayState = 'running';
    if (deck.bufSource) deck.bufSource.playbackRate.setTargetAtTime(deck.tempo, ctx.currentTime, .08);
  };
  plat.addEventListener('mousedown', sdown); plat.addEventListener('touchstart', sdown, { passive: false });
  addEventListener('mousemove', smove); addEventListener('touchmove', smove, { passive: false });
  addEventListener('mouseup', sup); addEventListener('touchend', sup);
});

/* crossfader + mix se Spotify */
bindRange('#xfader', v => {
  const x = v / 100;
  if (decks[0].xf) decks[0].xf.gain.value = Math.cos(x * Math.PI / 2);
  if (decks[1].xf) decks[1].xf.gain.value = Math.sin(x * Math.PI / 2);
  $('#xfVal').textContent = v < 40 ? 'deck A' : v > 60 ? 'deck B' : 'střed';
});
bindRange('#spMix', v => {
  const x = v / 100;
  state.synthMix = Math.sin(x * Math.PI / 2);
  $('#mixVal').textContent = (100 - v) + '/' + v;
  applySynthMix();
  if (MF.onMixChange) MF.onMixChange(Math.cos(x * Math.PI / 2));
});
function applySynthMix() {
  if (master) master.gain.value = ($('#masterVol').value / 100) * state.synthMix;
}
function setSpotifyMix(cb) { MF.onMixChange = cb; cb(Math.cos(($('#spMix').value / 100) * Math.PI / 2)); }

bindRange('#sweep', v => {
  $('#sweepVal').textContent = v;
  decks.forEach(d => { d.filterPos = v; d.applyFilter(); });
});
$('#syncBtn').addEventListener('click', () => {
  initAudio();
  decks.forEach(d => {
    d.setTempo(1); d.step = 0; d.nextTime = ctx.currentTime + .05;
    const t = $('[data-role="tempo"]', d.el); t.value = 100;
    $('[data-role="tempoVal"]', d.el).textContent = '100%';
    d.render();
  });
  state.step = 0; state.nextStepTime = ctx.currentTime + .05;
  flash($('#syncBtn')); toast('Decky srovnány na ' + state.bpm + ' BPM');
});
$('#dropBtn').addEventListener('click', () => {
  initAudio();
  const t0 = ctx.currentTime;
  masterFilter.frequency.cancelScheduledValues(t0);
  masterFilter.type = 'lowpass';
  masterFilter.frequency.setValueAtTime(400, t0);
  masterFilter.frequency.exponentialRampToValueAtTime(20000, t0 + 1.8);
  const vol = ($('#masterVol').value / 100) * state.synthMix;
  master.gain.setValueAtTime(vol, t0 + 1.8);
  master.gain.linearRampToValueAtTime(0.001, t0 + 1.95);
  master.gain.linearRampToValueAtTime(vol, t0 + 2.25);
  if (!state.playing) startTransport();
  flash($('#dropBtn'));
  const old = $('#txtInput').value;
  $('#txtInput').value = 'DROP!!!'; renderBanner();
  setTimeout(() => { $('#txtInput').value = old; renderBanner(); }, 2600);
});
function flash(btn) { btn.classList.add('on'); setTimeout(() => btn.classList.remove('on'), 350); }

/* =========================================================
   SEKVENCER, PADY, KLAVIATURA
   ========================================================= */
const seqBox = $('#seq');
function buildSeq() {
  seqBox.innerHTML = '';
  DRUM_ROWS.forEach(([key, label]) => {
    const row = document.createElement('div');
    row.className = 'seq-row'; row.dataset.row = key;
    const nm = document.createElement('div'); nm.className = 'name'; nm.textContent = label;
    row.appendChild(nm);
    for (let i = 0; i < 16; i++) {
      const b = document.createElement('button');
      b.className = 'step' + (pattern[key][i] ? ' on' : '');
      b.dataset.i = i;
      b.setAttribute('aria-label', label + ' krok ' + (i + 1));
      b.addEventListener('click', () => {
        pattern[key][i] = pattern[key][i] ? 0 : 1;
        b.classList.toggle('on', !!pattern[key][i]);
        initAudio(); if (pattern[key][i]) DRUMS[key](ctx.currentTime);
      });
      row.appendChild(b);
    }
    seqBox.appendChild(row);
  });
}
buildSeq();
function highlightStep(s) {
  $$('#seq .step').forEach(b => b.classList.toggle('cur', +b.dataset.i === s));
}
$('#clearSeq').addEventListener('click', () => { DRUM_ROWS.forEach(([k]) => pattern[k] = new Array(16).fill(0)); buildSeq(); });
$('#randSeq').addEventListener('click', () => {
  const p = { kick: [], snare: [], hat: [], clap: [] };
  for (let i = 0; i < 16; i++) {
    p.kick[i] = i % 4 === 0 ? 1 : (Math.random() < .12 ? 1 : 0);
    p.snare[i] = i % 8 === 4 ? 1 : (Math.random() < .1 ? 1 : 0);
    p.hat[i] = Math.random() < .5 ? 1 : 0;
    p.clap[i] = Math.random() < .1 ? 1 : 0;
  }
  pattern = p; buildSeq();
});
$$('[data-preset]').forEach(b => b.addEventListener('click', () => {
  const p = PRESETS[b.dataset.preset];
  pattern = { kick: [...p.kick], snare: [...p.snare], hat: [...p.hat], clap: [...p.clap] };
  buildSeq(); flash(b);
}));
$('#drumsOn').addEventListener('click', e => {
  state.drumsOn = !state.drumsOn;
  e.currentTarget.classList.toggle('on', state.drumsOn);
  e.currentTarget.textContent = state.drumsOn ? 'Bicí zapnuté' : 'Bicí vypnuté';
});

const PADS = [['kick', 'KICK'], ['snare', 'SNARE'], ['hat', 'HAT'], ['clap', 'CLAP']];
const PAD_KEYS = ['7', '8', '9', '0'];
const padBox = $('#pads');
PADS.forEach(([k, label], i) => {
  const b = document.createElement('button');
  b.className = 'pad'; b.innerHTML = `${label}<br><small style="opacity:.6">${PAD_KEYS[i]}</small>`;
  b.addEventListener('mousedown', () => hitPad(k, b));
  padBox.appendChild(b);
});
function hitPad(k, btn) {
  initAudio();
  DRUMS[k](ctx.currentTime);
  if (btn) { btn.classList.add('hit'); setTimeout(() => btn.classList.remove('hit'), 110); }
}
const KEYMAP = ['z', 's', 'x', 'd', 'c', 'v', 'g', 'b', 'h', 'n', 'j', 'm'];
const keysBox = $('#keys');
function buildKeys() {
  keysBox.innerHTML = '';
  for (let i = 0; i < 12; i++) {
    const b = document.createElement('button');
    const midi = degToMidi(i, 4);
    b.className = 'key' + ([1, 3, 6, 8, 10].includes(midi % 12) ? ' blk' : '');
    b.dataset.deg = i;
    b.textContent = KEYMAP[i].toUpperCase();
    b.title = NOTE_NAMES[midi % 12] + ' (' + KEYMAP[i].toUpperCase() + ')';
    b.addEventListener('mousedown', () => playKey(i, b));
    keysBox.appendChild(b);
  }
}
buildKeys();
function playKey(deg, btn) {
  initAudio();
  decks[0].voice(degToMidi(deg, 4), ctx.currentTime, .6, .4);
  if (btn) { btn.classList.add('hit'); setTimeout(() => btn.classList.remove('hit'), 140); }
}

/* =========================================================
   ZDROJE ZVUKU PRO VIZUALIZACI
   ========================================================= */
let micStream = null, micNode = null, capStream = null, capNode = null, captureOn = false;
$('#micBtn').addEventListener('click', async e => {
  initAudio();
  if (micStream) { stopStream('mic'); e.currentTarget.classList.remove('on'); return; }
  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false } });
    micNode = ctx.createMediaStreamSource(micStream);
    micNode.connect(analyser); // jen do analyzéru, ať nevzniká zpětná vazba
    e.currentTarget.classList.add('on');
    toast('Mikrofon zapnutý — vizualizér běží na to, co slyší.');
  } catch (err) { toast('Mikrofon se nepodařilo zapnout: ' + err.message, true); }
});
$('#captureBtn').addEventListener('click', async e => {
  initAudio();
  if (capStream) { stopStream('cap'); e.currentTarget.classList.remove('on'); return; }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    toast('Tenhle prohlížeč sdílení zvuku karty neumí. Zkus Chrome na počítači.', true); return;
  }
  try {
    capStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    if (!capStream.getAudioTracks().length) {
      stopStream('cap');
      toast('Zvuk se nesdílel. Vyber kartu a zaškrtni „Sdílet zvuk karty".', true); return;
    }
    capNode = ctx.createMediaStreamSource(capStream);
    capNode.connect(analyser);
    captureOn = true;
    e.currentTarget.classList.add('on');
    capStream.getAudioTracks()[0].addEventListener('ended', () => { stopStream('cap'); $('#captureBtn').classList.remove('on'); });
    toast('Zvuk karty zachycen — vizualizér teď kreslí skutečné spektrum.');
  } catch (err) { toast('Sdílení zrušeno.', true); }
});
function stopStream(which) {
  if (which === 'mic') {
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    if (micNode) micNode.disconnect();
    micStream = micNode = null;
  } else {
    if (capStream) capStream.getTracks().forEach(t => t.stop());
    if (capNode) capNode.disconnect();
    capStream = capNode = null; captureOn = false;
  }
}
$('#panicBtn').addEventListener('click', panic);
function panic() {
  stopTransport();
  if (master) { master.gain.cancelScheduledValues(ctx.currentTime); applySynthMix(); }
  toast('Ticho.');
}

/* externí beat (Spotify) */
function setExternalBeat({ playing, bpm, positionMs }) {
  ext.playing = !!playing;
  if (bpm) ext.bpm = bpm;
  if (typeof positionMs === 'number') ext.positionMs = positionMs;
}

/* =========================================================
   FULLSCREEN, INSTALACE, ZKRATKY
   ========================================================= */
$('#fsBtn').addEventListener('click', toggleFs);
function toggleFs() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  else document.exitFullscreen?.();
}
let installEvt = null;
addEventListener('beforeinstallprompt', e => {
  e.preventDefault(); installEvt = e;
  $('#installBtn').hidden = false;
});
$('#installBtn').addEventListener('click', async () => {
  if (!installEvt) return;
  installEvt.prompt();
  await installEvt.userChoice;
  installEvt = null; $('#installBtn').hidden = true;
});
addEventListener('appinstalled', () => { $('#installBtn').hidden = true; toast('MaresFy nainstalováno 🎧'); });

addEventListener('keydown', e => {
  const tag = (e.target.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'select' || tag === 'textarea' || e.metaKey || e.ctrlKey) return;
  const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); if (MF.onSpaceKey) MF.onSpaceKey(); else toggleTransport(); return; }
  if (k === 's') { toggleTransport(); return; }
  if (k === 'escape') { panic(); return; }
  if (k === 'f') { toggleFs(); return; }
  if (k === 'r') { randomColors(); return; }
  if (k === 'q') { initAudio(); ensureScheduler(); decks[0].toggle(); return; }
  if (k === 'w') { initAudio(); ensureScheduler(); decks[1].toggle(); return; }
  if (['1', '2', '3', '4', '5'].includes(k)) { setViz(['bars', 'wave', 'radial', 'particles', 'tunnel'][+k - 1]); return; }
  const padIdx = PAD_KEYS.indexOf(k);
  if (padIdx >= 0) { hitPad(PADS[padIdx][0], $$('.pad')[padIdx]); return; }
  const ki = KEYMAP.indexOf(k);
  if (ki >= 0 && !e.repeat) playKey(ki, $$('.key')[ki]);
});

/* ---------- start ---------- */
resize();
renderBanner();
syncColors();
decks.forEach(d => d.render());
requestAnimationFrame(draw);
addEventListener('pointerdown', function unlock() { initAudio(); }, { once: true });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
})();
