/* ==========================================================
   MaresFy — připojení ke Spotify.
   Přihlášení běží přímo proti Spotify (Authorization Code + PKCE),
   žádný server uprostřed. Tokeny zůstávají v tomhle prohlížeči.
   ========================================================== */
(() => {
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const MF = window.MF;

const AUTH = 'https://accounts.spotify.com/authorize';
const TOKEN = 'https://accounts.spotify.com/api/token';
const API = 'https://api.spotify.com/v1';
const SCOPES = [
  'streaming', 'user-read-email', 'user-read-private',
  'user-read-playback-state', 'user-modify-playback-state', 'user-read-currently-playing',
  'playlist-read-private', 'playlist-read-collaborative', 'user-library-read'
].join(' ');
const REDIRECT = location.origin + location.pathname;
const LS = { cid: 'mf_client_id', tok: 'mf_token', ver: 'mf_verifier', bpm: 'mf_bpm_map' };

let clientId = localStorage.getItem(LS.cid) || '';
let token = null;           // {access_token, refresh_token, expires_at}
let player = null;          // Web Playback SDK
let deviceId = null;
let premium = null;         // null = neznámo
let current = null;         // aktuální skladba
let isPlaying = false;
let posMs = 0, posAt = 0, durMs = 0;
let pollTimer = null, uiTimer = null;
let bpmMap = {};
try { bpmMap = JSON.parse(localStorage.getItem(LS.bpm) || '{}'); } catch (e) { bpmMap = {}; }

/* ---------- pomocné ---------- */
const setStatus = (txt, cls) => {
  const el = $('#spStatus');
  el.textContent = txt;
  el.className = 'badge' + (cls ? ' ' + cls : '');
};
const fmt = ms => {
  if (!ms && ms !== 0) return '0:00';
  const s = Math.floor(ms / 1000);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
function saveToken(t) {
  token = t;
  if (t) localStorage.setItem(LS.tok, JSON.stringify(t));
  else localStorage.removeItem(LS.tok);
}
function loadToken() {
  try { token = JSON.parse(localStorage.getItem(LS.tok) || 'null'); } catch (e) { token = null; }
  return token;
}

/* ---------- PKCE ---------- */
function randomString(n) {
  const a = new Uint8Array(n);
  crypto.getRandomValues(a);
  return Array.from(a, b => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[b % 66]).join('');
}
async function challenge(verifier) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function login() {
  clientId = ($('#spClientId').value || localStorage.getItem(LS.cid) || '').trim();
  if (!clientId) { MF.toast('Nejdřív vlož Client ID své Spotify aplikace.', true); $('#spClientId').focus(); return; }
  if (!/^[0-9a-f]{32}$/i.test(clientId)) {
    MF.toast('Tohle nevypadá na Client ID — má 32 znaků (písmena a čísla). Pozor, ne Client Secret.', true);
    $('#spClientId').focus(); return;
  }
  if (!canLogin()) return;
  localStorage.setItem(LS.cid, clientId);
  const verifier = randomString(96);
  localStorage.setItem(LS.ver, verifier);
  const url = new URL(AUTH);
  url.search = new URLSearchParams({
    client_id: clientId, response_type: 'code', redirect_uri: REDIRECT,
    code_challenge_method: 'S256', code_challenge: await challenge(verifier),
    scope: SCOPES
  }).toString();
  location.href = url.toString();
}
async function exchangeCode(code) {
  const verifier = localStorage.getItem(LS.ver);
  const res = await fetch(TOKEN, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId, grant_type: 'authorization_code', code,
      redirect_uri: REDIRECT, code_verifier: verifier || ''
    })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(tokenErrorText(data));
  saveToken({ access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Date.now() + data.expires_in * 1000 });
  localStorage.removeItem(LS.ver);
}
/* Spotify vrací strohé kódy — přeložíme je na to, co se s tím dá udělat. */
function tokenErrorText(data) {
  const e = (data && data.error) || '';
  const d = (data && data.error_description) || '';
  if (e === 'invalid_client') return 'Client ID Spotify nezná. Zkopíruj ho znovu z dashboardu (Client ID, ne Secret).';
  if (e === 'invalid_grant' && /redirect/i.test(d)) return 'Redirect URI se neshoduje. V dashboardu musí být přesně: ' + REDIRECT;
  if (e === 'invalid_grant') return 'Přihlašovací kód propadl. Klikni na přihlášení znovu.';
  return d || e || 'přihlášení selhalo';
}
async function refresh() {
  if (!token || !token.refresh_token) throw new Error('no refresh token');
  const res = await fetch(TOKEN, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, grant_type: 'refresh_token', refresh_token: token.refresh_token })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'refresh failed');
  saveToken({
    access_token: data.access_token,
    refresh_token: data.refresh_token || token.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000
  });
}
async function validToken() {
  if (!token) return null;
  if (Date.now() > token.expires_at - 30000) await refresh();
  return token.access_token;
}

/* ---------- API ---------- */
async function api(path, opts = {}, retry = true) {
  const at = await validToken();
  if (!at) throw new Error('not logged in');
  const res = await fetch(path.startsWith('http') ? path : API + path, {
    ...opts,
    headers: { Authorization: 'Bearer ' + at, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  if (res.status === 401 && retry) { await refresh(); return api(path, opts, false); }
  if (res.status === 204) return null;
  if (res.status === 403) {
    const body = await res.text();
    const err = new Error(body || 'forbidden'); err.status = 403; throw err;
  }
  if (res.status === 429) { const err = new Error('rate limit'); err.status = 429; throw err; }
  if (!res.ok) { const err = new Error(await res.text()); err.status = res.status; throw err; }
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

/* ---------- Web Playback SDK ---------- */
function loadSdk() {
  return new Promise((resolve, reject) => {
    if (window.Spotify) return resolve();
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    const s = document.createElement('script');
    s.src = 'https://sdk.scdn.co/spotify-player.js';
    s.async = true;
    s.onerror = () => reject(new Error('sdk blocked'));
    document.head.appendChild(s);
    setTimeout(() => { if (!window.Spotify) reject(new Error('sdk timeout')); }, 12000);
  });
}
async function initPlayer() {
  try { await loadSdk(); }
  catch (e) {
    setStatus('jen ovládání', 'warn');
    MF.toast('Přehrávač Spotify se tady nenačetl. Ovládat jde přehrávání spuštěné v aplikaci Spotify.', true);
    startPolling();
    return;
  }
  player = new Spotify.Player({
    name: 'MaresFy 🎧',
    getOAuthToken: cb => validToken().then(cb).catch(() => {}),
    volume: $('#spVol').value / 100
  });
  player.addListener('ready', ({ device_id }) => {
    deviceId = device_id;
    setStatus('připojeno', 'ok');
    MF.toast('Přehrávač připraven. Vyber skladbu a hraj.');
  });
  player.addListener('not_ready', () => { deviceId = null; });
  player.addListener('player_state_changed', st => {
    if (!st) return;
    applyState({
      item: st.track_window.current_track,
      is_playing: !st.paused,
      progress_ms: st.position,
      duration: st.duration
    });
  });
  player.addListener('initialization_error', ({ message }) => MF.toast('Chyba přehrávače: ' + message, true));
  player.addListener('authentication_error', () => { MF.toast('Přihlášení vypršelo, přihlas se znovu.', true); logout(); });
  player.addListener('account_error', () => {
    premium = false;
    setStatus('bez Premium', 'warn');
    MF.toast('Přehrávání v prohlížeči vyžaduje Spotify Premium. Uvidíš aspoň, co hraje jinde.', true);
  });
  player.addListener('playback_error', ({ message }) => MF.toast('Přehrávání: ' + message, true));
  player.connect();
  startPolling();
}

/* ---------- stav přehrávání ---------- */
function applyState(st) {
  if (!st || !st.item) return;
  MF.ensureAudio(); // vizualizér potřebuje analyzér i pro rytmickou simulaci
  const track = st.item;
  const changed = !current || current.id !== track.id;
  current = track;
  isPlaying = !!st.is_playing;
  posMs = st.progress_ms || 0;
  posAt = performance.now();
  durMs = st.duration || (track.duration_ms || 0);

  $('#npTitle').textContent = track.name || '—';
  $('#npArtist').textContent = (track.artists || []).map(a => a.name).join(', ');
  $('#npAlbum').textContent = (track.album && track.album.name) || '';
  $('#npDur').textContent = fmt(durMs);
  $('#spPlay').textContent = isPlaying ? '⏸' : '▶';

  const art = track.album && track.album.images && track.album.images[0];
  if (art && $('#npArt').dataset.src !== art.url) {
    $('#npArt').dataset.src = art.url;
    $('#npArt').src = art.url;
    $('#npArt').alt = 'Obal alba ' + ((track.album && track.album.name) || '');
    if ($('#autoArt').checked) paletteFromArt(art.url);
  }
  if (changed) {
    MF.setTrackTitle(track.name);
    $('#tapBpm').textContent = bpmMap[track.id] ? bpmMap[track.id] + '' : '';
    markPlaying();
  }
  MF.setExternalBeat({ playing: isPlaying, bpm: bpmMap[track.id] || 0, positionMs: posMs });
}
function startPolling() {
  if (pollTimer) return;
  const poll = async () => {
    if (!token) return;
    try {
      const st = await api('/me/player');
      if (st && st.item) {
        applyState({ item: st.item, is_playing: st.is_playing, progress_ms: st.progress_ms, duration: st.item.duration_ms });
        if (premium === null && st.device) premium = true;
      }
    } catch (e) { /* ticho — přehrávač může být offline */ }
  };
  poll();
  pollTimer = setInterval(poll, 4000);
  if (!uiTimer) uiTimer = setInterval(tickUi, 200);
}
function tickUi() {
  if (!current) return;
  const p = isPlaying ? posMs + (performance.now() - posAt) : posMs;
  const pct = durMs ? Math.min(100, p / durMs * 100) : 0;
  $('#seekFill').style.width = pct + '%';
  $('#seekbar').setAttribute('aria-valuenow', Math.round(pct));
  $('#npPos').textContent = fmt(p);
  MF.setExternalBeat({ playing: isPlaying, bpm: bpmMap[current.id] || 0, positionMs: p });
}

/* ---------- ovládání ---------- */
async function cmd(fn, remote) {
  try {
    if (player && deviceId) await fn();
    else await remote();
  } catch (e) {
    if (e.status === 403) MF.toast('Na tohle je potřeba Spotify Premium.', true);
    else MF.toast('Nepovedlo se: ' + (e.message || e), true);
  }
}
const togglePlay = () => cmd(
  () => player.togglePlay(),
  () => api(isPlaying ? '/me/player/pause' : '/me/player/play', { method: 'PUT' })
);
$('#spPlay').addEventListener('click', togglePlay);
$('#spNext').addEventListener('click', () => cmd(() => player.nextTrack(), () => api('/me/player/next', { method: 'POST' })));
$('#spPrev').addEventListener('click', () => cmd(() => player.previousTrack(), () => api('/me/player/previous', { method: 'POST' })));
$('#spShuffle').addEventListener('click', async e => {
  const on = !e.currentTarget.classList.contains('on');
  try { await api('/me/player/shuffle?state=' + on, { method: 'PUT' }); e.currentTarget.classList.toggle('on', on); }
  catch (err) { MF.toast('Náhodné pořadí se nepodařilo přepnout.', true); }
});
$('#spRepeat').addEventListener('click', async e => {
  const on = !e.currentTarget.classList.contains('on');
  try { await api('/me/player/repeat?state=' + (on ? 'context' : 'off'), { method: 'PUT' }); e.currentTarget.classList.toggle('on', on); }
  catch (err) { MF.toast('Opakování se nepodařilo přepnout.', true); }
});
$('#seekbar').addEventListener('click', e => {
  if (!durMs) return;
  const r = e.currentTarget.getBoundingClientRect();
  const ms = Math.round((e.clientX - r.left) / r.width * durMs);
  cmd(() => player.seek(ms), () => api('/me/player/seek?position_ms=' + ms, { method: 'PUT' }));
  posMs = ms; posAt = performance.now();
});
let spGain = 1;
$('#spVol').addEventListener('input', e => { $('#spVolVal').textContent = e.target.value; applyVolume(); });
function applyVolume() {
  const v = ($('#spVol').value / 100) * spGain;
  if (player) player.setVolume(Math.max(0, Math.min(1, v))).catch(() => {});
  else if (token) api('/me/player/volume?volume_percent=' + Math.round(v * 100), { method: 'PUT' }).catch(() => {});
}
MF.setSpotifyMix(g => { spGain = g; applyVolume(); });
MF.onSpaceKey = () => { if (token && current) togglePlay(); else $('#masterPlay').click(); };

$('#spDevice').addEventListener('click', async () => {
  if (!deviceId) { MF.toast('Přehrávač v prohlížeči není připravený (chce to Premium).', true); return; }
  try {
    await api('/me/player', { method: 'PUT', body: JSON.stringify({ device_ids: [deviceId], play: true }) });
    MF.toast('Přehrávání přesunuto sem 🎧');
  } catch (e) { MF.toast('Přesun se nepovedl: ' + (e.message || e), true); }
});

/* tap tempo — Spotify tempo skladeb nepůjčuje, tak si ho naklepeš sám */
let taps = [];
$('#spTap').addEventListener('click', () => {
  const now = performance.now();
  taps = taps.filter(t => now - t < 2500);
  taps.push(now);
  if (taps.length >= 3) {
    const gaps = taps.slice(1).map((t, i) => t - taps[i]);
    const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const bpm = Math.round(60000 / avg);
    if (bpm > 50 && bpm < 220) {
      $('#tapBpm').textContent = bpm;
      if (current) { bpmMap[current.id] = bpm; localStorage.setItem(LS.bpm, JSON.stringify(bpmMap)); }
      MF.setExternalBeat({ playing: isPlaying, bpm, positionMs: posMs });
    }
  }
});

/* barvy z obalu alba */
$('#spArtColors').addEventListener('click', () => {
  const url = $('#npArt').dataset.src;
  if (url) paletteFromArt(url, true); else MF.toast('Nehraje žádná skladba.', true);
});
function paletteFromArt(url, announce) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const n = 48, cv = document.createElement('canvas');
      cv.width = cv.height = n;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, 0, 0, n, n);
      const d = cx.getImageData(0, 0, n, n).data;
      const buckets = new Map();
      for (let i = 0; i < d.length; i += 4) {
        const [h, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2]);
        if (l < 12 || l > 94) continue;
        const key = Math.round(h / 18);
        const b = buckets.get(key) || { h: 0, s: 0, l: 0, n: 0 };
        b.h += h; b.s += s; b.l += l; b.n++;
        buckets.set(key, b);
      }
      const sorted = [...buckets.values()].sort((a, b) => b.n * b.s / b.n - a.n * a.s / a.n).sort((a, b) => b.n - a.n);
      if (!sorted.length) return;
      const pick = i => {
        const b = sorted[Math.min(i, sorted.length - 1)];
        return [b.h / b.n, Math.max(55, Math.min(95, b.s / b.n * 1.25)), Math.max(48, Math.min(68, b.l / b.n * 1.2))];
      };
      const p1 = pick(0), p2 = pick(1), p3 = pick(2);
      MF.applyPalette(
        MF.hsl2hex(p1[0], p1[1], p1[2]),
        MF.hsl2hex((p2[0] + 20) % 360, p2[1], p2[2]),
        MF.hsl2hex((p3[0] + 200) % 360, 90, 62),
        MF.hsl2hex(p1[0], 35, 5)
      );
      if (announce) MF.toast('Barvy převzaty z obalu alba 🎨');
    } catch (e) {
      if (announce) MF.toast('Obal se nepodařilo přečíst (blokuje ho prohlížeč).', true);
    }
  };
  img.onerror = () => { if (announce) MF.toast('Obal alba se nenačetl.', true); };
  img.src = url;
}
function rgb2hsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const l = (mx + mn) / 2;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return [h, s * 100, l * 100];
}

/* ---------- knihovna ---------- */
let libMode = 'playlists', libCtx = null;
$$('.lib-tabs button').forEach(b => b.addEventListener('click', () => {
  $$('.lib-tabs button').forEach(x => x.classList.toggle('on', x === b));
  libMode = b.dataset.lib; libCtx = null;
  $('#libSearchBox').hidden = libMode !== 'search';
  loadLib();
}));
let searchTimer = null;
$('#libSearch').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadLib, 350);
});
const listEl = () => $('#libList');
function libLoading() { listEl().innerHTML = '<div class="lib-empty">Načítám…</div>'; }
function libEmpty(msg) { listEl().innerHTML = `<div class="lib-empty">${msg}</div>`; }

async function loadLib() {
  if (!token) return;
  libLoading();
  try {
    if (libMode === 'playlists') {
      if (libCtx) return renderTracks(libCtx.items, libCtx.uri, libCtx.name);
      const d = await api('/me/playlists?limit=50');
      const items = (d.items || []).filter(Boolean);
      if (!items.length) return libEmpty('Žádné playlisty.');
      listEl().innerHTML = '';
      items.forEach(pl => listEl().appendChild(row({
        img: pl.images && pl.images[0] && pl.images[0].url,
        title: pl.name, sub: (pl.tracks && pl.tracks.total || 0) + ' skladeb',
        onClick: () => openPlaylist(pl)
      })));
    } else if (libMode === 'liked') {
      const d = await api('/me/tracks?limit=50');
      const tracks = (d.items || []).map(i => i.track).filter(Boolean);
      if (!tracks.length) return libEmpty('Zatím nic v Oblíbených.');
      renderTracks(tracks, null, 'Oblíbené');
    } else {
      const q = $('#libSearch').value.trim();
      if (!q) return libEmpty('Napiš, co hledáš.');
      const d = await api('/search?type=track&limit=30&q=' + encodeURIComponent(q));
      const tracks = (d.tracks && d.tracks.items) || [];
      if (!tracks.length) return libEmpty('Nic nenalezeno.');
      renderTracks(tracks, null, 'Výsledky');
    }
  } catch (e) {
    libEmpty('Načtení selhalo. Zkus se odhlásit a přihlásit znovu.');
  }
}
async function openPlaylist(pl) {
  libLoading();
  try {
    const d = await api(`/playlists/${pl.id}/tracks?limit=100&fields=items(track(id,uri,name,duration_ms,artists(name),album(name,images)))`);
    const tracks = (d.items || []).map(i => i.track).filter(t => t && t.uri);
    libCtx = { items: tracks, uri: pl.uri, name: pl.name };
    renderTracks(tracks, pl.uri, pl.name);
  } catch (e) { libEmpty('Playlist se nenačetl.'); }
}
function row({ img, title, sub, onClick, id }) {
  const b = document.createElement('button');
  b.className = 'lib-item';
  if (id) b.dataset.trackId = id;
  b.innerHTML = `${img ? `<img src="${img}" alt="">` : '<img alt="">'}<span class="t"><b></b><small></small></span>`;
  $('b', b).textContent = title;
  $('small', b).textContent = sub;
  b.addEventListener('click', onClick);
  return b;
}
function renderTracks(tracks, contextUri, name) {
  const el = listEl();
  el.innerHTML = '';
  if (libMode === 'playlists' && libCtx) {
    const back = document.createElement('button');
    back.className = 'lib-back'; back.textContent = '← zpět na playlisty';
    back.addEventListener('click', () => { libCtx = null; loadLib(); });
    el.appendChild(back);
  }
  tracks.forEach((t, i) => el.appendChild(row({
    img: t.album && t.album.images && (t.album.images[2] || t.album.images[0] || {}).url,
    title: t.name, sub: (t.artists || []).map(a => a.name).join(', '), id: t.id,
    onClick: () => play(t, contextUri, i)
  })));
  markPlaying();
}
function markPlaying() {
  $$('.lib-item').forEach(b => b.classList.toggle('playing', !!current && b.dataset.trackId === current.id));
}
async function play(track, contextUri, index) {
  MF.ensureAudio();
  const qs = deviceId ? '?device_id=' + deviceId : '';
  const body = contextUri
    ? { context_uri: contextUri, offset: { position: index }, position_ms: 0 }
    : { uris: [track.uri] };
  try {
    await api('/me/player/play' + qs, { method: 'PUT', body: JSON.stringify(body) });
    // nečekáme na událost přehrávače — kartu naplníme hned tím, na co se kliklo
    applyState({ item: track, is_playing: true, progress_ms: 0, duration: track.duration_ms });
  } catch (e) {
    if (e.status === 403) MF.toast('Přehrávání ovládá jen Spotify Premium.', true);
    else if (e.status === 404) MF.toast('Není aktivní zařízení. Klikni na „Zařízení" nebo spusť Spotify.', true);
    else MF.toast('Nepovedlo se spustit: ' + (e.message || e), true);
  }
}

/* ---------- přihlášení / odhlášení / UI ---------- */
$('#spRedirect').textContent = REDIRECT;
$('#spClientId').value = clientId;
// ID si pamatujeme hned při psaní, ať se neztratí při přesměrování
$('#spClientId').addEventListener('input', e => {
  const v = e.target.value.trim();
  clientId = v;
  if (v) localStorage.setItem(LS.cid, v); else localStorage.removeItem(LS.cid);
});
$('#spClientId').addEventListener('keydown', e => { if (e.key === 'Enter') login(); });

/* Spotify pustí přihlášení jen z https nebo z loopbacku 127.0.0.1 —
   otevřít index.html dvojklikem (file://) tedy nestačí. */
function envProblem() {
  if (location.protocol === 'file:') {
    return 'Appka běží ze souboru (file://). Spotify takovou adresu nepřijme — spusť <b>start.command</b> ' +
      '(Mac/Linux) nebo <b>start.bat</b> (Windows) ve složce maresfy a otevři <code>http://127.0.0.1:8080/maresfy/</code>.';
  }
  if (location.protocol !== 'https:' && !/^(127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
    return 'Spotify přijímá jen <b>https</b> adresy nebo <b>http://127.0.0.1</b>. ' +
      (location.hostname === 'localhost'
        ? 'Otevři tu samou adresu přes <code>127.0.0.1</code> místo <code>localhost</code>.'
        : 'Spusť appku přes GitHub Pages nebo lokálně na 127.0.0.1.');
  }
  return null;
}
function canLogin() {
  const p = envProblem();
  if (p) { MF.toast(p.replace(/<[^>]+>/g, ''), true); return false; }
  return true;
}
$('#spCopy').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(REDIRECT); MF.toast('Redirect URI zkopírováno.'); }
  catch (e) { MF.toast('Zkopíruj ručně: ' + REDIRECT, true); }
});
$('#spLogin').addEventListener('click', login);
$('#spLogout').addEventListener('click', logout);
function logout() {
  saveToken(null);
  if (player) { try { player.disconnect(); } catch (e) {} player = null; }
  deviceId = null; current = null; isPlaying = false;
  clearInterval(pollTimer); pollTimer = null;
  MF.setExternalBeat({ playing: false });
  showLoggedOut();
  MF.toast('Odhlášeno.');
}
function showLoggedOut() {
  $('#spSetup').hidden = false;
  $('#spPlayer').hidden = true;
  setStatus('nepřipojeno');
}
function showLoggedIn() {
  $('#spSetup').hidden = true;
  $('#spPlayer').hidden = false;
  setStatus('přihlašuji…');
}

/* Náhled v cizí stránce (iframe) nesmí přesměrovat na přihlášení
   a nepustí ani přehrávač Spotify — řekneme to rovnou. */
function embedded() {
  try { return window.top !== window.self; } catch (e) { return true; }
}
function showEmbeddedNotice() {
  const box = document.createElement('p');
  box.className = 'hint';
  box.style.cssText = 'border:1px solid var(--c2);border-radius:10px;padding:10px 12px';
  box.innerHTML = '<b>Tohle je náhled.</b> Přihlášení ke Spotify funguje jen když appku spustíš ' +
    'z vlastní adresy (GitHub Pages nebo <code>http://127.0.0.1:8080/maresfy/</code>) — ' +
    'náhled nesmí načíst přehrávač Spotify. Všechno ostatní — vizualizér, DJ pult, sekvencer — jede i tady.';
  $('#spSetup').prepend(box);
  $('#spLogin').disabled = true;
  $('#spLogin').textContent = 'Přihlášení jen z vlastní adresy';
  setStatus('náhled', 'warn');
}

function showEnvNotice(msg) {
  const box = document.createElement('p');
  box.className = 'hint';
  box.style.cssText = 'border:1px solid var(--c2);border-radius:10px;padding:10px 12px';
  box.innerHTML = msg;
  $('#spSetup').prepend(box);
}

async function boot() {
  if (embedded()) { showEmbeddedNotice(); return; }
  const envMsg = envProblem();
  if (envMsg) { showEnvNotice(envMsg); setStatus('špatná adresa', 'warn'); }

  const params = new URLSearchParams(location.search);
  if (params.get('error')) {
    const err = params.get('error');
    MF.toast(err === 'access_denied'
      ? 'Přístup jsi Spotify nepovolil — zkus to znovu a dej Agree.'
      : 'Spotify odmítlo přihlášení: ' + err, true);
    history.replaceState({}, '', REDIRECT);
  }
  const code = params.get('code');
  if (code) {
    history.replaceState({}, '', REDIRECT);
    try {
      await exchangeCode(code);
    } catch (e) {
      MF.toast('Přihlášení selhalo: ' + e.message, true);
      showLoggedOut();
      $('#spClientId').value = clientId;
      return;
    }
  } else loadToken();

  if (!token) { showLoggedOut(); return; }
  showLoggedIn();
  try {
    const me = await api('/me');
    premium = me.product === 'premium';
    setStatus(me.display_name || 'přihlášen', 'ok');
    if (!premium) {
      setStatus('bez Premium', 'warn');
      MF.toast('Účet nemá Premium — přehrávat nepůjde, ale uvidíš, co ti hraje jinde.', true);
    }
  } catch (e) {
    MF.toast('Účet se nenačetl, přihlas se prosím znovu.', true);
    logout(); return;
  }
  await initPlayer();
  loadLib();
  applyVolume();
}
boot();
})();
