/* ==========================================================================
   MARES CASINO – Dealer (mluví: text v bublině + hlas přes Web Speech API)
   ========================================================================== */
(function (root) {
    'use strict';
    var Casino = root.Casino = root.Casino || {};

    var hasSpeech = (typeof window !== 'undefined') && ('speechSynthesis' in window);

    var Dealer = Casino.Dealer = {
        voice: null,
        ready: false,

        pickVoice: function () {
            if (!hasSpeech) return;
            try {
                var vs = window.speechSynthesis.getVoices() || [];
                this.voice = vs.filter(function (v) { return /cs|cz/i.test(v.lang); })[0]
                    || vs.filter(function (v) { return /sk/i.test(v.lang); })[0]
                    || vs.filter(function (v) { return /^en/i.test(v.lang); })[0]
                    || vs[0] || null;
                this.ready = true;
            } catch (e) { }
        },

        // řekni text: ukaž v bublině a (pokud lze) přehraj hlasem
        say: function (bubbleEl, text) {
            if (bubbleEl) {
                bubbleEl.textContent = text;
                bubbleEl.classList.remove('hidden', 'pop');
                void bubbleEl.offsetWidth;
                bubbleEl.classList.add('pop');
            }
            this.speak(text);
        },

        speak: function (text) {
            if (!hasSpeech) return;
            if (Casino.Account && !Casino.Account.isSoundOn()) return;
            try {
                if (!this.ready) this.pickVoice();
                var u = new SpeechSynthesisUtterance(text);
                if (this.voice) u.voice = this.voice;
                u.lang = (this.voice && this.voice.lang) || 'cs-CZ';
                u.rate = 1.02; u.pitch = 1.0; u.volume = 0.95;
                window.speechSynthesis.cancel();
                window.speechSynthesis.speak(u);
            } catch (e) { }
        },

        stop: function () { if (hasSpeech) { try { window.speechSynthesis.cancel(); } catch (e) { } } }
    };

    if (hasSpeech) {
        try { window.speechSynthesis.onvoiceschanged = function () { Dealer.pickVoice(); }; } catch (e) { }
    }

})(typeof window !== 'undefined' ? window : global);
