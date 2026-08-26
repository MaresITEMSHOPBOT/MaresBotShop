/* ══════════════════════════════════════════════════════════════════════
   KickChat – čtení chatu z Kicku přímo v prohlížeči.

   Kick posílá zprávy chatu přes Pusher (WebSocket). Nepotřebuje se
   žádný token ani přihlášení – stačí ID chatroomu daného kanálu.
   Žádná knihovna, žádný backend, jen holý WebSocket.
   ══════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var PUSHER_KEY = '32cbd69e4b950bf97679';           // veřejný klíč Kicku
  var PUSHER_URL = 'wss://ws-us2.pusher.com/app/' + PUSHER_KEY +
                   '?protocol=7&client=js&version=8.4.0&flash=false';

  var MSG_EVENT  = 'App\\Events\\ChatMessageEvent';

  function KickChat(opts) {
    opts = opts || {};
    this.chatroomId = String(opts.chatroomId || '').trim();
    this.url        = opts.url || PUSHER_URL;   // lze přepsat kvůli testům
    this.onMessage  = opts.onMessage  || function () {};
    this.onStatus   = opts.onStatus   || function () {};
    this.onEvent    = opts.onEvent    || function () {};

    this.ws         = null;
    this.wanted     = false;   // chceme být připojeni?
    this.attempts   = 0;
    this.timeoutMs  = 120000;  // activity timeout hlášený serverem
    this.pingTimer  = null;
    this.pongTimer  = null;
    this.retryTimer = null;
  }

  KickChat.prototype.status = function (state, text) {
    this.onStatus(state, text);
  };

  /* ── připojení ─────────────────────────────────────────────────── */
  KickChat.prototype.connect = function (chatroomId) {
    if (chatroomId) this.chatroomId = String(chatroomId).trim();
    if (!/^\d+$/.test(this.chatroomId)) {
      this.status('err', 'chybí chatroom ID');
      return false;
    }
    this.wanted = true;
    this.open();
    return true;
  };

  KickChat.prototype.open = function () {
    var self = this;
    this.cleanupSocket();
    this.status('wait', this.attempts ? 'připojuji znovu…' : 'připojuji…');

    var ws;
    try {
      ws = new WebSocket(this.url);
    } catch (e) {
      this.scheduleRetry();
      return;
    }
    this.ws = ws;

    ws.onopen = function () { /* čekáme na connection_established */ };

    ws.onmessage = function (ev) {
      var packet;
      try { packet = JSON.parse(ev.data); } catch (e) { return; }
      self.handlePacket(packet);
    };

    ws.onerror = function () {
      self.status('err', 'chyba spojení');
    };

    ws.onclose = function () {
      self.clearTimers();
      if (self.wanted) self.scheduleRetry();
      else self.status('off', 'odpojeno');
    };
  };

  /* ── zpracování paketů Pusheru ─────────────────────────────────── */
  KickChat.prototype.handlePacket = function (packet) {
    var name = packet.event;
    this.bumpActivity();

    if (name === 'pusher:connection_established') {
      var info = safeJson(packet.data) || {};
      if (info.activity_timeout) this.timeoutMs = info.activity_timeout * 1000;
      this.attempts = 0;
      this.subscribe();
      return;
    }

    if (name === 'pusher:ping') { this.send('pusher:pong', {}); return; }
    if (name === 'pusher:pong') { clearTimeout(this.pongTimer); return; }

    if (name === 'pusher_internal:subscription_succeeded') {
      this.status('live', 'chat připojen');
      return;
    }

    if (name === 'pusher:error') {
      var err = safeJson(packet.data) || {};
      this.status('err', err.message || 'Pusher error');
      return;
    }

    if (name === MSG_EVENT) {
      var msg = safeJson(packet.data);
      if (msg) this.onMessage(normalize(msg));
      return;
    }

    this.onEvent(name, safeJson(packet.data));
  };

  KickChat.prototype.subscribe = function () {
    this.send('pusher:subscribe', { auth: '', channel: 'chatrooms.' + this.chatroomId + '.v2' });
  };

  KickChat.prototype.send = function (event, data) {
    if (!this.ws || this.ws.readyState !== 1) return;
    try { this.ws.send(JSON.stringify({ event: event, data: data })); } catch (e) {}
  };

  /* ── udržování spojení ─────────────────────────────────────────── */
  KickChat.prototype.bumpActivity = function () {
    var self = this;
    clearTimeout(this.pingTimer);
    clearTimeout(this.pongTimer);
    this.pingTimer = setTimeout(function () {
      self.send('pusher:ping', {});
      self.pongTimer = setTimeout(function () {
        // server neodpověděl – spojení je mrtvé
        if (self.ws) try { self.ws.close(); } catch (e) {}
      }, 15000);
    }, Math.max(30000, this.timeoutMs - 10000));
  };

  KickChat.prototype.scheduleRetry = function () {
    var self = this;
    this.attempts++;
    var delay = Math.min(30000, 1000 * Math.pow(1.7, Math.min(this.attempts, 8)));
    this.status('wait', 'obnovuji za ' + Math.round(delay / 1000) + ' s');
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(function () { if (self.wanted) self.open(); }, delay);
  };

  KickChat.prototype.clearTimers = function () {
    clearTimeout(this.pingTimer);
    clearTimeout(this.pongTimer);
  };

  KickChat.prototype.cleanupSocket = function () {
    if (!this.ws) return;
    try {
      this.ws.onopen = this.ws.onmessage = this.ws.onerror = this.ws.onclose = null;
      this.ws.close();
    } catch (e) {}
    this.ws = null;
  };

  KickChat.prototype.disconnect = function () {
    this.wanted = false;
    this.attempts = 0;
    clearTimeout(this.retryTimer);
    this.clearTimers();
    this.cleanupSocket();
    this.status('off', 'odpojeno');
  };

  /* ── pomocné ───────────────────────────────────────────────────── */
  function safeJson(raw) {
    if (raw == null) return null;
    if (typeof raw === 'object') return raw;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  // Sjednotí zprávu z Kicku do jednoduchého tvaru pro hru.
  function normalize(msg) {
    var sender = msg.sender || {};
    var identity = sender.identity || {};
    var badges = identity.badges || [];
    var roles = {};
    for (var i = 0; i < badges.length; i++) {
      if (badges[i] && badges[i].type) roles[badges[i].type] = true;
    }
    return {
      id: msg.id,
      text: String(msg.content == null ? '' : msg.content),
      user: String(sender.username || sender.slug || 'anonym'),
      userId: sender.id,
      color: identity.color || null,
      isBroadcaster: !!roles.broadcaster,
      isMod: !!(roles.moderator || roles.broadcaster),
      isSub: !!(roles.subscriber || roles.founder),
      raw: msg
    };
  }

  global.KickChat = KickChat;
})(window);
