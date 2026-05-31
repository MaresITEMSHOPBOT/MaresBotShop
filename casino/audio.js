/* ==========================================================================
   MARES CASINO – zvukový engine (Web Audio API, vše syntetizované)
   Žádné externí soubory => funguje i bez sítě.
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};

    var ctx = null, master = null;

    function ensure() {
        if (ctx) return true;
        try {
            var AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return false;
            ctx = new AC();
            master = ctx.createGain();
            master.gain.value = 0.5;
            master.connect(ctx.destination);
        } catch (e) { return false; }
        return true;
    }

    function on() { return Casino.Account ? Casino.Account.isSoundOn() : true; }

    // jeden tón
    function tone(freq, dur, opts) {
        if (!ensure() || !on()) return;
        opts = opts || {};
        var t0 = ctx.currentTime + (opts.delay || 0);
        var osc = ctx.createOscillator();
        var g = ctx.createGain();
        osc.type = opts.type || 'sine';
        osc.frequency.setValueAtTime(freq, t0);
        if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), t0 + dur);
        var vol = opts.vol == null ? 0.35 : opts.vol;
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g); g.connect(master);
        osc.start(t0); osc.stop(t0 + dur + 0.02);
    }

    // šum (whoosh / buben)
    function noise(dur, opts) {
        if (!ensure() || !on()) return;
        opts = opts || {};
        var t0 = ctx.currentTime + (opts.delay || 0);
        var n = Math.floor(ctx.sampleRate * dur);
        var buf = ctx.createBuffer(1, n, ctx.sampleRate);
        var d = buf.getChannelData(0);
        for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1);
        var src = ctx.createBufferSource(); src.buffer = buf;
        var filt = ctx.createBiquadFilter();
        filt.type = opts.filter || 'bandpass';
        filt.frequency.setValueAtTime(opts.freq || 1200, t0);
        if (opts.to) filt.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);
        filt.Q.value = opts.q || 1;
        var g = ctx.createGain();
        var vol = opts.vol == null ? 0.2 : opts.vol;
        g.gain.setValueAtTime(vol, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        src.connect(filt); filt.connect(g); g.connect(master);
        src.start(t0); src.stop(t0 + dur + 0.02);
    }

    var Sound = Casino.Sound = {
        // odemkni audio kontext na první gesto uživatele
        unlock: function () { if (ensure() && ctx.state === 'suspended') ctx.resume(); },

        click: function () { tone(420, 0.06, { type: 'square', vol: 0.18 }); },
        toggle: function () { tone(660, 0.07, { type: 'triangle', vol: 0.2 }); },

        spin: function () {
            noise(0.45, { filter: 'lowpass', freq: 1800, to: 300, vol: 0.12 });
            tone(180, 0.4, { type: 'sawtooth', to: 90, vol: 0.06 });
        },
        reelStop: function (i) {
            tone(220 + (i || 0) * 35, 0.07, { type: 'square', vol: 0.22 });
            noise(0.05, { filter: 'highpass', freq: 2500, vol: 0.1 });
        },
        tick: function () { tone(880, 0.03, { type: 'square', vol: 0.08 }); },
        cascade: function (i) { tone(500 + (i || 0) * 80, 0.08, { type: 'triangle', vol: 0.18 }); },

        // výhra dle úrovně (0 malá ... 3 mega)
        win: function (level) {
            var seq;
            if (level >= 3) seq = [523, 659, 784, 1047, 1319, 1568];
            else if (level === 2) seq = [523, 659, 784, 1047];
            else if (level === 1) seq = [523, 659, 784];
            else seq = [523, 784];
            seq.forEach(function (f, i) {
                tone(f, 0.16, { type: 'triangle', vol: 0.28, delay: i * 0.09 });
                tone(f * 2, 0.12, { type: 'sine', vol: 0.12, delay: i * 0.09 });
            });
        },
        bigWinFanfare: function () {
            var base = [523, 587, 659, 698, 784, 880, 988, 1047];
            base.forEach(function (f, i) { tone(f, 0.18, { type: 'sawtooth', vol: 0.22, delay: i * 0.07 }); });
            tone(1047, 0.6, { type: 'triangle', vol: 0.3, delay: base.length * 0.07 });
        },
        freeSpins: function () {
            [392, 523, 659, 784, 1047].forEach(function (f, i) {
                tone(f, 0.25, { type: 'triangle', vol: 0.3, delay: i * 0.12 });
            });
        },
        lose: function () { tone(160, 0.18, { type: 'sine', to: 110, vol: 0.06 }); }
    };

})(typeof window !== 'undefined' ? window : global);
