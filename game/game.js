/* ══════════════════════════════════════════════════════════════════════
   MARES DROP  –  plinko hra ovládaná chatem na Kicku
   Divák napíše !hraj, spadne mu kulička se jménem a získá body.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
'use strict';

/* ────────────────────────────────────────────────────────────────────
   1) KONFIGURACE A ULOŽENÁ DATA
   ──────────────────────────────────────────────────────────────────── */
var CFG_KEY = 'mares-drop-cfg-v1';
var DB_KEY  = 'mares-drop-scores-v1';

var cfg = Object.assign({
  slug: 'justmares',
  chatroomId: '',
  cooldown: 20,
  bonusEvery: 5,      // minuty; 0 = vypnuto
  sound: true,
  transparent: false,
  sim: false
}, load(CFG_KEY, {}));

var players = load(DB_KEY, {});   // klic(lowercase) -> {name,score,drops,best,color}
var lastJackpot = load('mares-drop-jackpot-v1', null);

function load(key, fallback) {
  try { var v = JSON.parse(localStorage.getItem(key)); return v || fallback; }
  catch (e) { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}
var saveScoresSoon = throttle(function () { save(DB_KEY, players); }, 2000);
function saveCfg() { save(CFG_KEY, cfg); }

/* ────────────────────────────────────────────────────────────────────
   2) GEOMETRIE HRACÍ DESKY
   ──────────────────────────────────────────────────────────────────── */
var W = 900, H = 1010;
var ROWS = 12, GAP = 58, PEG_R = 7, BALL_R = 10;
var TOP = 210, GAPY = 54;
var SLOT_TOP = 848, SLOT_BOT = 952;

// Chování kuliček. Hodnoty jsou vyladěné tak, aby rozložení výher bylo
// zvonovité – střed padá často, kraje (1000 bodů) jen výjimečně.
var PHYS = {
  grav:   0.32,   // gravitace
  rest:   0.30,   // odrazivost od kolíků
  kick:   6.0,    // síla odrazu do strany – právě ta dělá z plinka náhodu
  drag:   0.890,  // brzdění vodorovného pohybu mezi řadami
  maxV:   9.5,    // strop svislé rychlosti
  maxVX:  8.0     // strop vodorovné rychlosti
};

// 15 jamek = 13 mezer mezi kolíky poslední řady + 2 krajní.
// Kraje jsou nejtěžší na trefení, proto platí nejvíc.
var MULT = [1000, 250, 120, 60, 30, 16, 8, 5, 8, 16, 30, 60, 120, 250, 1000];

var TIERS = {
  1000:{ a: '#ffd447', b: '#ff8a00', txt: '#2a1500', glow: 'rgba(255,212,71,.85)' },
  250: { a: '#ff3ea5', b: '#b3006b', txt: '#2a0016', glow: 'rgba(255,62,165,.8)'  },
  120: { a: '#a855f7', b: '#5b21b6', txt: '#f4e8ff', glow: 'rgba(168,85,247,.7)'  },
  60:  { a: '#3b82f6', b: '#1e3a8a', txt: '#e6f0ff', glow: 'rgba(59,130,246,.6)'  },
  30:  { a: '#22d3ee', b: '#0e7490', txt: '#04222a', glow: 'rgba(34,211,238,.6)'  },
  16:  { a: '#53fc18', b: '#1e7a06', txt: '#04140a', glow: 'rgba(83,252,24,.6)'   },
  8:   { a: '#3f9c2a', b: '#1c4d12', txt: '#e8ffe0', glow: 'rgba(83,252,24,.35)'  },
  5:   { a: '#64748b', b: '#334155', txt: '#e2e8f0', glow: 'rgba(148,163,184,.4)' }
};

// Šikmé stěny kopírují tvar trojúhelníku z kolíků – kulička nemůže utéct
// mimo pole a krajní jamky se dají trefit jen pořádným odrazem.
function wallLeft(y) {
  var rf = clamp((y - TOP) / GAPY, 0, ROWS - 1);
  return W / 2 - (rf + 2) * GAP / 2 - GAP;
}
function wallRight(y) { return W - wallLeft(y); }
var BIN_X0 = 0;

var pegs = [];        // {x,y,glow}
var pegRows = [];     // kolíky po řadách kvůli rychlé kolizi
var bins = [];        // {x0,x1,cx,mult,flash}

(function buildBoard() {
  for (var r = 0; r < ROWS; r++) {
    var n = r + 3;
    var rw = (n - 1) * GAP;
    var x0 = W / 2 - rw / 2;
    var row = [];
    for (var i = 0; i < n; i++) {
      var peg = { x: x0 + i * GAP, y: TOP + r * GAPY, glow: 0 };
      pegs.push(peg); row.push(peg);
    }
    pegRows.push(row);
  }
  BIN_X0 = wallLeft(SLOT_TOP);
  for (var b = 0; b < MULT.length; b++) {
    bins.push({
      x0: BIN_X0 + b * GAP,
      x1: BIN_X0 + (b + 1) * GAP,
      cx: BIN_X0 + (b + 0.5) * GAP,
      mult: MULT[b],
      flash: 0
    });
  }
})();

/* ────────────────────────────────────────────────────────────────────
   3) STAV HRY
   ──────────────────────────────────────────────────────────────────── */
var balls = [], queue = [], particles = [], confetti = [];
var cooldowns = {};              // klic -> timestamp posledního hodu
var paused = false;
var bonusUntil = 0, nextBonus = 0;
var totalDrops = 0, bestEver = 0;
var lbDirty = true, statsDirty = true;
var cardQueue = [], cardUntil = 0;
var simulating = false, simHits = null;   // režim rychlého měření (bez kreslení)
var bannerUntil = 0;

var MAX_BALLS = 45, MAX_QUEUE = 120;

(function initTotals() {
  for (var k in players) {
    totalDrops += players[k].drops || 0;
    if ((players[k].best || 0) > bestEver) bestEver = players[k].best;
  }
})();

/* ────────────────────────────────────────────────────────────────────
   4) PLÁTNA
   ──────────────────────────────────────────────────────────────────── */
var boardCv = document.getElementById('board');
var fxCv    = document.getElementById('fx');
var ctx     = boardCv.getContext('2d');
var fx      = fxCv.getContext('2d');

function fitCanvas() {
  var host = document.querySelector('.board-inner');
  var rect = host.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  [boardCv, fxCv].forEach(function (cv) {
    cv.width  = Math.round(rect.width  * dpr);
    cv.height = Math.round(rect.height * dpr);
    var c = cv.getContext('2d');
    c.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
  });
}
window.addEventListener('resize', fitCanvas);

/* ────────────────────────────────────────────────────────────────────
   5) KULIČKY
   ──────────────────────────────────────────────────────────────────── */
function spawnBall(name, color) {
  var b = {
    name: name,
    label: name.length > 14 ? name.slice(0, 13) + '…' : name,
    color: color || '#53fc18',
    x: W / 2 + (Math.random() - 0.5) * 100,
    y: TOP - 120,
    vx: (Math.random() - 0.5) * 2,
    vy: 1,
    state: 'fall',
    bin: -1,
    trail: [],
    born: performance.now()
  };
  balls.push(b);
  statsDirty = true;
  return b;
}

function requestDrop(name, color) {
  if (paused) return;
  if (balls.length >= MAX_BALLS) {
    if (queue.length < MAX_QUEUE) queue.push({ name: name, color: color });
    return;
  }
  spawnBall(name, color);
}

function stepBall(b) {
  var i, p;

  if (b.state === 'fall') {
    b.vy += PHYS.grav;
    if (b.vy > PHYS.maxV) b.vy = PHYS.maxV;
    if (b.vx > PHYS.maxVX) b.vx = PHYS.maxVX;
    else if (b.vx < -PHYS.maxVX) b.vx = -PHYS.maxVX;
    b.vx *= PHYS.drag;
    b.x += b.vx;
    b.y += b.vy;

    // šikmé stěny hracího pole
    var wl = wallLeft(b.y), wr = W - wl;
    if (b.x - BALL_R < wl) { b.x = wl + BALL_R; b.vx = Math.abs(b.vx) * PHYS.rest + 0.2; }
    if (b.x + BALL_R > wr) { b.x = wr - BALL_R; b.vx = -Math.abs(b.vx) * PHYS.rest - 0.2; }

    // pegy – jen okolní řady
    var rowIdx = Math.floor((b.y - TOP) / GAPY);
    for (var r = rowIdx - 1; r <= rowIdx + 1; r++) {
      if (r < 0 || r >= pegRows.length) continue;
      var row = pegRows[r];
      for (i = 0; i < row.length; i++) {
        p = row[i];
        var dx = b.x - p.x, dy = b.y - p.y;
        var rr = BALL_R + PEG_R;
        var d2 = dx * dx + dy * dy;
        if (d2 < rr * rr) {
          var d = Math.sqrt(d2) || 0.0001;
          var nx = dx / d, ny = dy / d;
          b.x += nx * (rr - d);
          b.y += ny * (rr - d);
          var vn = b.vx * nx + b.vy * ny;
          if (vn < 0) {
            b.vx -= (1 + PHYS.rest) * vn * nx;
            b.vy -= (1 + PHYS.rest) * vn * ny;
          }
          // Kulička se musí rozhodnout doleva/doprava. Když trefí kolík
          // přesně doprostřed, hodíme si mincí – jinak by padala jen rovně.
          var dir = Math.abs(nx) > 0.15 ? (nx > 0 ? 1 : -1) : (Math.random() < 0.5 ? 1 : -1);
          b.vx += dir * PHYS.kick * (0.75 + Math.random() * 0.5);
          if (!simulating) { p.glow = 1; sfx.peg(); sparks(p.x, p.y, b.color, 3); }
        }
      }
    }

    if (b.y > SLOT_TOP - BALL_R) {
      b.state = 'settle';
      b.bin = clamp(Math.floor((b.x - BIN_X0) / GAP), 0, bins.length - 1);
      b.vx = 0;
    }

  } else { // settle – kulička dopadá do jamky
    b.x += (bins[b.bin].cx - b.x) * 0.25;
    b.vy = Math.min(b.vy + PHYS.grav, PHYS.maxV);
    b.y += b.vy;
    if (b.y > SLOT_BOT - BALL_R - 6) { award(b); return false; }
  }

  b.trail.push(b.x, b.y);
  if (b.trail.length > 16) b.trail.splice(0, 2);

  // pojistka proti zaseknutí
  if (performance.now() - b.born > 25000) return false;
  return true;
}

/* ────────────────────────────────────────────────────────────────────
   6) BODOVÁNÍ
   ──────────────────────────────────────────────────────────────────── */
function award(b) {
  var bin = bins[b.bin];
  if (simulating) { simHits[b.bin]++; return; }
  var bonus = bonusUntil > Date.now();
  var pts = bin.mult * (bonus ? 2 : 1);

  bin.flash = 1;
  bin.hits = (bin.hits || 0) + 1;
  burst(bin.cx, SLOT_TOP + 20, TIERS[bin.mult].a, bin.mult >= 250 ? 42 : 18);
  sfx.score(bin.mult);

  var key = b.name.toLowerCase();
  var pl = players[key];
  if (!pl) { pl = players[key] = { name: b.name, score: 0, drops: 0, best: 0, color: b.color }; }
  pl.name  = b.name;
  pl.color = b.color;
  pl.score += pts;
  pl.drops += 1;
  if (pts > pl.best) pl.best = pts;

  totalDrops++;
  if (pts > bestEver) bestEver = pts;

  saveScoresSoon();
  lbDirty = true; statsDirty = true;
  pushFeed(b.name, pts, bin.mult >= 250);

  if (bin.mult >= 1000) {
    lastJackpot = { name: b.name, pts: pts, at: Date.now() };
    save('mares-drop-jackpot-v1', lastJackpot);
    renderJackpot();
    showBanner('💥 ' + b.name + ' – JACKPOT ' + fmt(pts) + '!');
    popConfetti(120);
    sfx.jackpot();
  } else if (bin.mult >= 250) {
    showBanner('🔥 ' + b.name + ' +' + fmt(pts));
    popConfetti(45);
  }
}

/* ────────────────────────────────────────────────────────────────────
   7) ČÁSTICE A KONFETY
   ──────────────────────────────────────────────────────────────────── */
function sparks(x, y, color, n) {
  if (particles.length > 400) return;
  for (var i = 0; i < n; i++) {
    particles.push({
      x: x, y: y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3 - 1,
      life: 1, decay: 0.05 + Math.random() * 0.04,
      r: 1.5 + Math.random() * 1.6, color: color
    });
  }
}
function burst(x, y, color, n) {
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 6;
    particles.push({
      x: x, y: y,
      vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2.5,
      life: 1, decay: 0.014 + Math.random() * 0.02,
      r: 2 + Math.random() * 3.4, color: color
    });
  }
}
function popConfetti(n) {
  var cols = ['#53fc18', '#ffd447', '#ff3ea5', '#22d3ee', '#a855f7', '#ffffff'];
  for (var i = 0; i < n; i++) {
    confetti.push({
      x: Math.random() * W, y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 3, vy: 2 + Math.random() * 4,
      w: 5 + Math.random() * 7, h: 9 + Math.random() * 11,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      color: cols[(Math.random() * cols.length) | 0], life: 1
    });
  }
}

/* ────────────────────────────────────────────────────────────────────
   8) VYKRESLOVÁNÍ
   ──────────────────────────────────────────────────────────────────── */
function draw() {
  ctx.clearRect(0, 0, W, H);

  if (!cfg.transparent) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(12,17,26,.75)');
    g.addColorStop(1, 'rgba(5,7,12,.85)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  drawWalls();
  drawDropZone();
  drawPegs();
  drawBins();
  drawBalls();

  fx.clearRect(0, 0, W, H);
  drawParticles();
  drawConfetti();
}

function drawDropZone() {
  // světelný kužel v místě, kde kuličky padají
  var g = ctx.createLinearGradient(0, 40, 0, TOP);
  g.addColorStop(0, 'rgba(83,252,24,.16)');
  g.addColorStop(1, 'rgba(83,252,24,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 60, 40); ctx.lineTo(W / 2 + 60, 40);
  ctx.lineTo(W / 2 + 112, TOP); ctx.lineTo(W / 2 - 112, TOP);
  ctx.closePath(); ctx.fill();

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,.16)';
  ctx.font = '700 22px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('▼  START  ▼', W / 2, 56);
  ctx.restore();
}

function drawWalls() {
  var xTop = wallLeft(0), xBot = wallLeft(SLOT_TOP);

  // ztmavení mimo hrací pole
  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(xTop, 0); ctx.lineTo(xBot, SLOT_TOP);
  ctx.lineTo(0, SLOT_TOP); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W, 0); ctx.lineTo(W - xTop, 0); ctx.lineTo(W - xBot, SLOT_TOP);
  ctx.lineTo(W, SLOT_TOP); ctx.closePath(); ctx.fill();

  // svítící mantinely
  ctx.save();
  ctx.strokeStyle = 'rgba(83,252,24,.35)';
  ctx.shadowColor = 'rgba(83,252,24,.5)';
  ctx.shadowBlur = 14;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(xTop, 0); ctx.lineTo(xBot, SLOT_TOP); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W - xTop, 0); ctx.lineTo(W - xBot, SLOT_TOP); ctx.stroke();
  ctx.restore();
}

function drawPegs() {
  for (var i = 0; i < pegs.length; i++) {
    var p = pegs[i];
    if (p.glow > 0) {
      ctx.save();
      ctx.globalAlpha = p.glow * 0.85;
      ctx.fillStyle = '#53fc18';
      ctx.shadowColor = '#53fc18';
      ctx.shadowBlur = 22;
      ctx.beginPath(); ctx.arc(p.x, p.y, PEG_R + 5 * p.glow, 0, 6.2832); ctx.fill();
      ctx.restore();
      p.glow -= 0.05;
    }
    var g = ctx.createRadialGradient(p.x - 2, p.y - 3, 1, p.x, p.y, PEG_R);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, p.glow > 0 ? '#9dff6d' : '#7c8798');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, PEG_R, 0, 6.2832); ctx.fill();
  }
}

function drawBins() {
  var bonus = bonusUntil > Date.now();
  for (var i = 0; i < bins.length; i++) {
    var b = bins[i], t = TIERS[b.mult];
    var lift = b.flash * 8;
    var y0 = SLOT_TOP - lift, y1 = SLOT_BOT;

    ctx.save();
    if (b.flash > 0) { ctx.shadowColor = t.glow; ctx.shadowBlur = 40 * b.flash; b.flash -= 0.035; }
    var g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, t.a); g.addColorStop(1, t.b);
    ctx.fillStyle = g;
    roundRect(ctx, b.x0 + 2.5, y0, GAP - 5, y1 - y0, 10);
    ctx.fill();
    ctx.restore();

    // lesk nahoře
    ctx.fillStyle = 'rgba(255,255,255,.22)';
    roundRect(ctx, b.x0 + 2.5, y0, GAP - 5, 12, 10);
    ctx.fill();

    ctx.fillStyle = t.txt;
    ctx.textAlign = 'center';
    var lbl = String(b.mult);
    ctx.font = '400 ' + (lbl.length > 3 ? 23 : 31) + 'px "Bebas Neue", Impact, sans-serif';
    ctx.fillText(lbl, b.cx, y0 + 50);
    ctx.font = '600 10px Outfit, sans-serif';
    ctx.globalAlpha = 0.75;
    ctx.fillText(bonus ? '×2' : 'bodů', b.cx, y0 + 68);
    ctx.globalAlpha = 1;
  }
}

function drawBalls() {
  for (var i = 0; i < balls.length; i++) {
    var b = balls[i];

    // stopa
    for (var t = 0; t < b.trail.length; t += 2) {
      var a = (t / b.trail.length) * 0.32;
      ctx.globalAlpha = a;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.trail[t], b.trail[t + 1], BALL_R * (0.3 + a), 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 18;
    var g = ctx.createRadialGradient(b.x - 4, b.y - 5, 1, b.x, b.y, BALL_R);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, b.color);
    g.addColorStop(1, shade(b.color, -45));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(b.x, b.y, BALL_R, 0, 6.2832); ctx.fill();
    ctx.restore();

    // jmenovka
    if (balls.length <= 26 && b.state === 'fall') {
      ctx.font = '700 15px Outfit, sans-serif';
      ctx.textAlign = 'center';
      var wdt = ctx.measureText(b.label).width + 14;
      ctx.fillStyle = 'rgba(4,7,12,.72)';
      roundRect(ctx, b.x - wdt / 2, b.y - BALL_R - 26, wdt, 20, 8);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillText(b.label, b.x, b.y - BALL_R - 11);
    }
  }
}

function drawParticles() {
  for (var i = particles.length - 1; i >= 0; i--) {
    var p = particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.vx *= 0.99;
    p.life -= p.decay;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    fx.globalAlpha = Math.max(0, p.life);
    fx.fillStyle = p.color;
    fx.beginPath(); fx.arc(p.x, p.y, p.r * p.life, 0, 6.2832); fx.fill();
  }
  fx.globalAlpha = 1;
}

function drawConfetti() {
  for (var i = confetti.length - 1; i >= 0; i--) {
    var c = confetti[i];
    c.x += c.vx; c.y += c.vy; c.vy += 0.07; c.rot += c.vr;
    if (c.y > H + 40) { confetti.splice(i, 1); continue; }
    fx.save();
    fx.translate(c.x, c.y); fx.rotate(c.rot);
    fx.fillStyle = c.color;
    fx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    fx.restore();
  }
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* ────────────────────────────────────────────────────────────────────
   9) HLAVNÍ SMYČKA
   ──────────────────────────────────────────────────────────────────── */
var acc = 0, last = performance.now();
function loop(now) {
  var dt = Math.min(now - last, 100);
  last = now;
  acc += dt;

  while (acc >= 16.6667) {
    acc -= 16.6667;
    if (!paused) {
      for (var i = balls.length - 1; i >= 0; i--) {
        if (!stepBall(balls[i])) { balls.splice(i, 1); statsDirty = true; }
      }
      while (balls.length < MAX_BALLS && queue.length) {
        var q = queue.shift();
        spawnBall(q.name, q.color);
      }
    }
  }

  draw();
  tickUI(now);
  requestAnimationFrame(loop);
}

/* ────────────────────────────────────────────────────────────────────
   10) UI
   ──────────────────────────────────────────────────────────────────── */
var el = {};
['stat-players','stat-drops','stat-best','stat-live','leaderboard','lb-empty','feed',
 'conn','conn-txt','banner','banner-txt','bonus-flag','bonus-timer','playercard',
 'pc-name','pc-avatar','pc-score','pc-rank','pc-drops','pc-best','paused-veil',
 'channel-label','cd-label','modal','modal-note','api-link','podium','jackpot'
].forEach(function (id) { el[id] = document.getElementById(id); });

var lbTimer = 0;
function tickUI(now) {
  if (statsDirty) { renderStats(); statsDirty = false; }
  if (lbDirty && now - lbTimer > 350) { renderBoard(); lbDirty = false; lbTimer = now; }

  // bonus kolo
  var t = Date.now();
  if (cfg.bonusEvery > 0) {
    if (!nextBonus) nextBonus = t + cfg.bonusEvery * 60000;
    if (t > nextBonus && bonusUntil < t) startBonus();
  }
  if (bonusUntil > t) {
    el['bonus-flag'].classList.add('show');
    el['bonus-timer'].textContent = Math.ceil((bonusUntil - t) / 1000);
  } else {
    el['bonus-flag'].classList.remove('show');
  }

  if (bannerUntil && t > bannerUntil) { el.banner.classList.remove('show'); bannerUntil = 0; }

  // karta hráče
  if (cardUntil && t > cardUntil) { el.playercard.classList.remove('show'); cardUntil = 0; }
  if (!cardUntil && cardQueue.length) showCard(cardQueue.shift());
}

function renderStats() {
  el['stat-players'].textContent = fmt(Object.keys(players).length);
  el['stat-drops'].textContent   = fmt(totalDrops);
  el['stat-best'].textContent    = fmt(bestEver);
  el['stat-live'].textContent    = fmt(balls.length + queue.length);
}

function sortedPlayers() {
  return Object.keys(players).map(function (k) { return players[k]; })
    .sort(function (a, b) { return b.score - a.score; });
}

function renderBoard() {
  var list = sortedPlayers().slice(0, 10);
  var ol = el.leaderboard;
  ol.textContent = '';
  el['lb-empty'].style.display = list.length ? 'none' : 'block';

  var medals = ['🥇', '🥈', '🥉'];
  list.forEach(function (p, i) {
    var li = document.createElement('li');
    if (i < 3) li.className = 'top' + (i + 1);
    var rk = document.createElement('span');
    rk.className = 'rk';
    rk.textContent = i < 3 ? medals[i] : (i + 1);
    var nm = document.createElement('span');
    nm.className = 'nm';
    nm.textContent = p.name;               // textContent = bez rizika HTML injektáže
    var sc = document.createElement('span');
    sc.className = 'sc';
    sc.textContent = fmt(p.score);
    li.appendChild(rk); li.appendChild(nm); li.appendChild(sc);
    ol.appendChild(li);
  });
  renderPodium(list);
  renderStats();
}

function renderPodium(list) {
  var host = el.podium;
  if (!host) return;
  host.textContent = '';
  var order = [1, 0, 2];                     // stříbro, zlato, bronz
  for (var i = 0; i < order.length; i++) {
    var idx = order[i], p = list[idx];
    var d = document.createElement('div');
    d.className = 'pod pod' + (idx + 1) + (p ? '' : ' empty');

    var nm = document.createElement('div');
    nm.className = 'pod-name';
    nm.textContent = p ? p.name : '—';

    var sc = document.createElement('div');
    sc.className = 'pod-score';
    sc.textContent = p ? fmt(p.score) : '0';

    var bar = document.createElement('div');
    bar.className = 'pod-bar';
    bar.textContent = idx + 1;

    d.appendChild(nm); d.appendChild(sc); d.appendChild(bar);
    host.appendChild(d);
  }
}

function renderJackpot() {
  var host = el.jackpot;
  if (!host) return;
  host.textContent = '';
  if (!lastJackpot) {
    var e = document.createElement('span');
    e.className = 'jp-none';
    e.textContent = 'zatím nikdo…';
    host.appendChild(e);
    return;
  }
  var badge = document.createElement('span');
  badge.className = 'jp-badge';
  badge.textContent = fmt(lastJackpot.pts);

  var who = document.createElement('span');
  who.className = 'jp-who';
  var b = document.createElement('b'); b.textContent = lastJackpot.name;
  var i = document.createElement('i'); i.textContent = timeAgo(lastJackpot.at);
  who.appendChild(b); who.appendChild(i);

  host.appendChild(badge); host.appendChild(who);
}

function timeAgo(t) {
  var s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 90) return 'před chvílí';
  if (s < 3600) return 'před ' + Math.round(s / 60) + ' min';
  if (s < 86400) return 'před ' + Math.round(s / 3600) + ' h';
  return 'před ' + Math.round(s / 86400) + ' dny';
}

function pushFeed(name, pts, big) {
  var ul = el.feed;
  var li = document.createElement('li');
  if (big) li.className = 'big';
  var n = document.createElement('span'); n.className = 'f-name'; n.textContent = name;
  var v = document.createElement('span'); v.className = 'f-pts'; v.textContent = '+' + fmt(pts);
  li.appendChild(n); li.appendChild(v);
  ul.insertBefore(li, ul.firstChild);
  while (ul.children.length > 14) ul.removeChild(ul.lastChild);
}

function showBanner(text) {
  el['banner-txt'].textContent = text;
  el.banner.classList.remove('show');
  void el.banner.offsetWidth;             // restart animace
  el.banner.classList.add('show');
  bannerUntil = Date.now() + 3200;
}

function showCard(name) {
  var key = name.toLowerCase();
  var p = players[key];
  var list = sortedPlayers();
  var rank = 0;
  for (var i = 0; i < list.length; i++) if (list[i].name.toLowerCase() === key) { rank = i + 1; break; }

  el['pc-name'].textContent   = name;
  el['pc-avatar'].textContent = name.charAt(0).toUpperCase();
  el['pc-score'].textContent  = fmt(p ? p.score : 0);
  el['pc-rank'].textContent   = rank ? '#' + rank : '–';
  el['pc-drops'].textContent  = fmt(p ? p.drops : 0);
  el['pc-best'].textContent   = fmt(p ? p.best : 0);
  el.playercard.classList.add('show');
  cardUntil = Date.now() + 6000;
}

function setConn(state, text) {
  el.conn.className = 'conn ' + (state === 'off' ? '' : state);
  el['conn-txt'].textContent = text;
}

function startBonus() {
  bonusUntil = Date.now() + 45000;
  nextBonus  = bonusUntil + (cfg.bonusEvery || 5) * 60000;
  showBanner('★ BONUS ×2 ★');
  popConfetti(60);
  sfx.jackpot();
}

/* ────────────────────────────────────────────────────────────────────
   11) PŘÍKAZY Z CHATU
   ──────────────────────────────────────────────────────────────────── */
var COLORS = {
  cervena:'#ef4444', červená:'#ef4444', red:'#ef4444',
  modra:'#3b82f6', modrá:'#3b82f6', blue:'#3b82f6',
  zelena:'#53fc18', zelená:'#53fc18', green:'#53fc18',
  zluta:'#facc15', žlutá:'#facc15', yellow:'#facc15',
  ruzova:'#ff3ea5', růžová:'#ff3ea5', pink:'#ff3ea5',
  fialova:'#a855f7', fialová:'#a855f7', purple:'#a855f7',
  oranzova:'#fb923c', oranžová:'#fb923c', orange:'#fb923c',
  tyrkysova:'#22d3ee', tyrkysová:'#22d3ee', cyan:'#22d3ee',
  bila:'#ffffff', bílá:'#ffffff', white:'#ffffff',
  cerna:'#94a3b8', černá:'#94a3b8', black:'#94a3b8',
  zlata:'#ffd447', zlatá:'#ffd447', gold:'#ffd447'
};

var DROP_WORDS = ['hraj','hrat','hrát','drop','play','hod','hodit','kulicka','kulička','ball'];
var STAT_WORDS = ['body','skore','skóre','score','staty','stats','profil'];
var TOP_WORDS  = ['top','zebricek','žebříček','leaderboard','poradi','pořadí'];

function handleChat(msg) {
  var text = (msg.text || '').trim();
  if (text.charAt(0) !== '!') return;

  var parts = text.slice(1).split(/\s+/);
  var cmd = (parts[0] || '').toLowerCase();
  var arg = (parts[1] || '').toLowerCase();
  var user = msg.user;
  var key = user.toLowerCase();

  // ── příkazy pro streamera a moderátory ──
  if (msg.isMod) {
    if (cmd === 'pauza' || cmd === 'pause' || cmd === 'stop') { setPaused(true);  return; }
    if (cmd === 'start' || cmd === 'spust' || cmd === 'spusť') { setPaused(false); return; }
    if (cmd === 'bonus') { startBonus(); return; }
    if ((cmd === 'vynuluj' || cmd === 'reset') && msg.isBroadcaster) { resetScores(); return; }
  }

  // ── hod ──
  if (DROP_WORDS.indexOf(cmd) >= 0) {
    var now = Date.now();
    var cdMs = (cfg.cooldown || 0) * 1000;
    if (cooldowns[key] && now - cooldowns[key] < cdMs) return;   // ještě má cooldown
    cooldowns[key] = now;

    var color = (players[key] && players[key].color) || msg.color || pickColor(key);
    if (arg && COLORS[arg]) color = COLORS[arg];
    else if (/^#[0-9a-f]{6}$/i.test(parts[1] || '')) color = parts[1];
    requestDrop(user, color);
    return;
  }

  // ── barva ──
  if (cmd === 'barva' || cmd === 'color') {
    var c = COLORS[arg] || (/^#[0-9a-f]{6}$/i.test(parts[1] || '') ? parts[1] : null);
    if (!c) return;
    if (!players[key]) players[key] = { name: user, score: 0, drops: 0, best: 0, color: c };
    players[key].color = c;
    saveScoresSoon();
    return;
  }

  // ── statistiky ──
  if (STAT_WORDS.indexOf(cmd) >= 0) {
    if (cardQueue.length < 3) cardQueue.push(user);
    return;
  }

  // ── zvýraznění žebříčku ──
  if (TOP_WORDS.indexOf(cmd) >= 0) {
    el.leaderboard.classList.add('flash');
    setTimeout(function () { el.leaderboard.classList.remove('flash'); }, 600);
    return;
  }
}

function setPaused(v) {
  paused = v;
  el['paused-veil'].classList.toggle('show', v);
}

function resetScores() {
  players = {};
  totalDrops = 0; bestEver = 0;
  cooldowns = {};
  lastJackpot = null;
  save(DB_KEY, players);
  save('mares-drop-jackpot-v1', null);
  renderJackpot();
  lbDirty = true; statsDirty = true;
  el.feed.textContent = '';
  showBanner('ŽEBŘÍČEK VYNULOVÁN');
}

// stabilní barva odvozená ze jména, když divák žádnou nemá
function pickColor(key) {
  var pal = ['#53fc18','#22d3ee','#a855f7','#ff3ea5','#ffd447','#fb923c','#38bdf8','#f472b6'];
  var h = 0;
  for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return pal[h % pal.length];
}

/* ────────────────────────────────────────────────────────────────────
   12) ZVUKY (WebAudio, bez souborů)
   ──────────────────────────────────────────────────────────────────── */
var sfx = (function () {
  var ac = null, lastPeg = 0;
  function ctxOn() {
    if (!cfg.sound) return null;
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, dur, type, vol, delay) {
    var a = ctxOn(); if (!a) return;
    var t0 = a.currentTime + (delay || 0);
    var o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol || 0.08, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  return {
    peg: function () {
      var n = performance.now();
      if (n - lastPeg < 55) return;
      lastPeg = n;
      tone(760 + Math.random() * 420, 0.05, 'triangle', 0.035);
    },
    score: function (mult) {
      tone(mult >= 250 ? 660 : 480, 0.1, 'square', 0.06);
      tone(mult >= 250 ? 990 : 640, 0.16, 'square', 0.05, 0.07);
    },
    jackpot: function () {
      [523, 659, 784, 1046].forEach(function (f, i) {
        tone(f, 0.3, 'sawtooth', 0.05, i * 0.09);
      });
    },
    unlock: function () { ctxOn(); }
  };
})();

/* ────────────────────────────────────────────────────────────────────
   13) NAPOJENÍ NA KICK
   ──────────────────────────────────────────────────────────────────── */
// Umožní testům podstrčit vlastní WebSocket server (#wsurl=ws://…).
function testWsUrl() {
  var m = /wsurl=([^&]+)/.exec(location.hash || '');
  return m ? decodeURIComponent(m[1]) : null;
}

var chat = new KickChat({
  url: testWsUrl(),                       // přepis WebSocketu jen pro testy
  onMessage: handleChat,
  onStatus: function (state, text) {
    setConn(state, text);
    if (state === 'live') note('Připojeno k chatu kanálu ' + cfg.slug + '.', 'ok');
  }
});

function connectChat() {
  cfg.slug = (document.getElementById('in-slug').value || 'justmares').trim().replace(/^.*kick\.com\//, '');
  cfg.chatroomId = (document.getElementById('in-room').value || '').trim();
  saveCfg();
  el['channel-label'].textContent = cfg.slug;
  el['api-link'].href = 'https://kick.com/api/v2/channels/' + encodeURIComponent(cfg.slug);
  el['api-link'].textContent = 'kick.com/api/v2/channels/' + cfg.slug;

  if (!/^\d+$/.test(cfg.chatroomId)) {
    note('Vyplň číselné Chatroom ID – najdeš ho na odkazu výš pod klíčem "chatroom" → "id".', 'bad');
    return;
  }
  sfx.unlock();
  note('Připojuji k chatu…', '');
  chat.connect(cfg.chatroomId);
}

// Zkusí vytáhnout chatroom ID z veřejného API Kicku. Kick to z prohlížeče
// často blokuje (Cloudflare / CORS), proto je to jen pohodlná zkratka –
// když to neprojde, uživatel ID zadá ručně.
function lookupChatroom() {
  var slug = (document.getElementById('in-slug').value || 'justmares')
             .trim().replace(/^.*kick\.com\//, '').replace(/\/.*$/, '');
  if (!slug) { note('Nejdřív vyplň jméno kanálu.', 'bad'); return; }
  note('Zjišťuji ID kanálu ' + slug + '…', '');

  fetch('https://kick.com/api/v2/channels/' + encodeURIComponent(slug), {
    headers: { 'Accept': 'application/json' }
  }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function (data) {
    var id = data && data.chatroom && data.chatroom.id;
    if (!id) throw new Error('v odpovědi není chatroom');
    document.getElementById('in-room').value = id;
    note('Našel jsem ID ' + id + '. Teď klikni na Připojit chat.', 'ok');
  }).catch(function () {
    note('Kick nepustil dotaz z prohlížeče – zadej ID ručně podle odkazu níž.', 'bad');
  });
}

function note(text, kind) {
  el['modal-note'].textContent = text;
  el['modal-note'].className = 'modal-note ' + (kind || '');
}

/* ────────────────────────────────────────────────────────────────────
   14) SIMULACE CHATU (test bez připojení)
   ──────────────────────────────────────────────────────────────────── */
var SIM_NAMES = ['Pepa_CZ','xXKillerXx','Bara99','HonzaHrac','Terka','MiraGaming','Kuba_TTV',
                 'LuckyLuke','ZdenekK','NikolaS','ProchyCZ','Mates','Verca','DominikG','Sasha_',
                 'TomikCZ','EliskaQ','RadekR','PetraV','Ondra_23'];
var simTimer = null;
function setSim(on) {
  cfg.sim = on; saveCfg();
  clearInterval(simTimer);
  if (!on) return;
  simTimer = setInterval(function () {
    var n = SIM_NAMES[(Math.random() * SIM_NAMES.length) | 0];
    var r = Math.random();
    var text = r < 0.86 ? '!hraj' : (r < 0.94 ? '!body' : '!top');
    handleChat({ text: text, user: n, isMod: false, isBroadcaster: false, color: null });
  }, 900);
}

/* ────────────────────────────────────────────────────────────────────
   15) OVLÁDÁNÍ ROZHRANÍ
   ──────────────────────────────────────────────────────────────────── */
function bindUI() {
  var inSlug = document.getElementById('in-slug');
  var inRoom = document.getElementById('in-room');
  var inCd   = document.getElementById('in-cd');
  var inBon  = document.getElementById('in-bonus');
  var inTr   = document.getElementById('in-transparent');
  var inSim  = document.getElementById('in-sim');

  inSlug.value = cfg.slug;
  inRoom.value = cfg.chatroomId;
  inCd.value   = cfg.cooldown;
  inBon.value  = cfg.bonusEvery;
  inTr.checked = cfg.transparent;
  inSim.checked = cfg.sim;

  document.getElementById('btn-settings').onclick = function () { el.modal.classList.add('show'); };
  document.getElementById('modal-x').onclick     = function () { el.modal.classList.remove('show'); };
  el.modal.addEventListener('click', function (e) { if (e.target === el.modal) el.modal.classList.remove('show'); });

  document.getElementById('btn-lookup').onclick     = lookupChatroom;
  document.getElementById('btn-connect').onclick    = connectChat;
  document.getElementById('btn-disconnect').onclick = function () { chat.disconnect(); note('Odpojeno.', ''); };
  document.getElementById('btn-testdrop').onclick   = function () {
    sfx.unlock();
    handleChat({ text: '!hraj', user: SIM_NAMES[(Math.random() * SIM_NAMES.length) | 0], isMod: false, color: null });
  };
  document.getElementById('btn-reset').onclick = function () {
    if (confirm('Opravdu vynulovat celý žebříček?')) resetScores();
  };

  inCd.onchange  = function () { cfg.cooldown = clamp(parseInt(inCd.value, 10) || 0, 0, 600); el['cd-label'].textContent = cfg.cooldown; saveCfg(); };
  inBon.onchange = function () { cfg.bonusEvery = clamp(parseInt(inBon.value, 10) || 0, 0, 120); nextBonus = 0; saveCfg(); };
  inTr.onchange  = function () { cfg.transparent = inTr.checked; document.body.classList.toggle('transparent', cfg.transparent); saveCfg(); };
  inSim.onchange = function () { sfx.unlock(); setSim(inSim.checked); };

  var sb = document.getElementById('btn-sound');
  sb.classList.toggle('off', !cfg.sound);
  sb.textContent = cfg.sound ? '🔊' : '🔇';
  sb.onclick = function () {
    cfg.sound = !cfg.sound; saveCfg();
    sb.classList.toggle('off', !cfg.sound);
    sb.textContent = cfg.sound ? '🔊' : '🔇';
    if (cfg.sound) sfx.unlock();
  };

  document.addEventListener('keydown', function (e) {
    if (/input|textarea/i.test((e.target && e.target.tagName) || '')) return;
    var k = e.key.toLowerCase();
    if (k === 'd') document.getElementById('btn-testdrop').click();
    if (k === 's') el.modal.classList.toggle('show');
    if (k === 'b') startBonus();
    if (k === 'p') setPaused(!paused);
    if (k === 'escape') el.modal.classList.remove('show');
  });
}

/* ────────────────────────────────────────────────────────────────────
   16) POMOCNÉ FUNKCE
   ──────────────────────────────────────────────────────────────────── */
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
function throttle(fn, ms) {
  var t = 0, pending = false;
  return function () {
    var now = Date.now();
    if (now - t > ms) { t = now; fn(); }
    else if (!pending) {
      pending = true;
      setTimeout(function () { pending = false; t = Date.now(); fn(); }, ms);
    }
  };
}
function shade(hex, amt) {
  var m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#2f7d12';
  var num = parseInt(m[1], 16);
  var r = clamp((num >> 16) + amt, 0, 255);
  var g = clamp(((num >> 8) & 255) + amt, 0, 255);
  var b = clamp((num & 255) + amt, 0, 255);
  return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}

/* ────────────────────────────────────────────────────────────────────
   17) START
   ──────────────────────────────────────────────────────────────────── */
function init() {
  document.body.classList.toggle('transparent', cfg.transparent);
  el['channel-label'].textContent = cfg.slug;
  el['cd-label'].textContent = cfg.cooldown;
  el['api-link'].href = 'https://kick.com/api/v2/channels/' + encodeURIComponent(cfg.slug);
  el['api-link'].textContent = 'kick.com/api/v2/channels/' + cfg.slug;

  bindUI();
  fitCanvas();
  renderBoard();
  renderJackpot();
  setConn('off', 'odpojeno');

  if (cfg.chatroomId) chat.connect(cfg.chatroomId);
  else { el.modal.classList.add('show'); note('Vlož Chatroom ID svého kanálu a klikni na Připojit chat.', ''); }

  if (cfg.sim) setSim(true);
  requestAnimationFrame(loop);
}

/* Malé veřejné API – hodí se na ladění a případná rozšíření z konzole. */
window.MaresDrop = {
  drop:    function (name, color) { requestDrop(name || 'Tester', color); },
  chat:    handleChat,
  phys:    PHYS,
  bonus:   startBonus,
  pause:   setPaused,
  reset:   resetScores,
  players: function () { return players; },
  stats:   function () {
    return bins.map(function (b) { return { mult: b.mult, hits: b.hits || 0 }; });
  },
  // Rychlé proměření rozložení výher – spočítá n hodů bez kreslení.
  simulate: function (n) {
    var keep = balls, i, hits = [];
    for (i = 0; i < bins.length; i++) hits.push(0);
    simulating = true; simHits = hits;
    for (i = 0; i < n; i++) {
      balls = [];
      var b = spawnBall('sim', '#ffffff'), guard = 0;
      while (guard++ < 4000 && stepBall(b)) { /* padej */ }
    }
    balls = keep; simulating = false; simHits = null;
    return hits;
  }
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();

})();
