/**
 * ============================================================================
 * XAZINA QIDIRISH: QAROQCHILAR OROLI (TREASURE HUNT: PIRATE ISLAND)
 * Sof Vanilla JavaScript, HTML5 Canvas va Web Audio API asosidagi 2D retro o'yin
 * ============================================================================
 */

'use strict';

/* ============================================================================
   1. O'YIN KONSTANTALARI VA SOZLAMALARI
   ============================================================================ */
const TILE_SIZE = 48; // Har bir katak o'lchami (pikselda)

// Xarita katak turlari
const TILE = {
  WATER: 0,   // Dengiz / Suv (o'tib bo'lmaydi)
  SAND: 1,    // Qum (erkin yuriladi)
  GRASS: 2,   // O'tloq / Maysa (erkin yuriladi)
  TREE: 3,    // Daraxt / Palma (to'siq)
  ROCK: 4,    // Qoya / Tosh (to'siq)
  SHALLOW: 5  // Sohil bo'yi sayoz suv (yuriladi)
};

// O'yin holatlari
const STATE = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  MATH_ESCAPE: 'MATH_ESCAPE',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY'
};

/* ============================================================================
   2. WEB AUDIO API - RETRO OVOZ EFFEKTLARI (SOUND MANAGER)
   ============================================================================ */
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = localStorage.getItem('treasure_hunt_sound') !== 'false';
  }

  // Audio kontekstni ishga tushirish (foydalanuvchi birinchi marta bosganda)
  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('treasure_hunt_sound', this.enabled);
    return this.enabled;
  }

  // Tanga olingandagi retro chig'irlash ovozi
  playCoin() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Zumrad / Javohir olingandagi ovoz
  playGem() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [659.25, 783.99, 1046.50, 1318.51]; // E5, G5, C6, E6

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  }

  // Kalit topilgandagi tantanali ovoz
  playKey() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.09;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.27);
    });
  }

  // O'yinchi zarba olgandagi ovoz
  playHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  // Matematik qochish savoli chiqqandagi qo'ng'iroq ovozi
  playMathPrompt() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
    osc.frequency.setValueAtTime(1174.66, now + 0.16); // D6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  // Tutun bombasi portlashi va qochish ovozi
  playSmokeBomb() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.32);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  // Matematik misol to'g'ri yechilgandagi tantanali ovoz
  playMathSuccess() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    freqs.forEach((f, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = now + idx * 0.06;

      osc.type = 'square';
      osc.frequency.setValueAtTime(f, st);

      gain.gain.setValueAtTime(0.16, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(st);
      osc.stop(st + 0.25);
    });
  }

  // Matematik misol xato yechilgandagi ovoz
  playMathFail() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(130, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  // Tuzoq ovozi (metall tikan zarbasi)
  playTrap() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.18);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Sandiq ochilgandagi g'alaba akkordi
  playChest() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const chords = [
      [523.25, 659.25, 783.99], // C major
      [587.33, 739.99, 880.00], // D major
      [659.25, 830.61, 987.77], // E major
      [1046.50, 1318.51, 1567.98] // C High
    ];

    chords.forEach((chord, step) => {
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = now + step * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 0.42);
      });
    });
  }

  // Mag'lubiyat ovozi (Game Over)
  playGameOver() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 415.3, 392, 349.2, 293.66]; // G'amgin pastlab boruvchi nota

    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.16;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  // Hayot tiklangandagi ovoz (Heal / Heart)
  playHeal() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.08;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  // Sehrli qalqon ovozi (Shield)
  playShield() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.35);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  // To'p otilishi ovozi (Cannon fire / Explosion)
  playCannon() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Boss hayqirig'i / ogohlantirish ovozi
  playBossRoar() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.5);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Dushman sezib qolgandagi ogohlantirish ovozi (!)
  playAlert() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.setValueAtTime(880.00, now + 0.05); // A5

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Qilich siltangandagi retro ovoz (Whoosh)
  playSwordSlash() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(460, now);
    osc.frequency.exponentialRampToValueAtTime(130, now + 0.15);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.16);
  }

  // Qilich dushmanga tekkandagi metall zarbasi (Hit Clang)
  playSwordHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(220, now + 0.18);

    osc2.type = 'sawtooth';
    osc2.frequency.setValueAtTime(1320, now);
    osc2.frequency.exponentialRampToValueAtTime(440, now + 0.12);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.19);
    osc2.stop(now + 0.19);
  }

  // Dushman mag'lub bo'lgandagi ovoz
  playEnemyDefeat() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [260, 390, 520, 180];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.05;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  // Sekundomer chertilishi (oxirgi soniyalarda)
  playTick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Vaqt tugagandagi ovoz
  playTimeUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const notes = [440, 370, 311, 240];
    const now = this.ctx.currentTime;
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + idx * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    });
  }
}

/* ============================================================================
   3. BOSHQARUV TIZIMI (INPUT HANDLER - WASD, STRELKALAR, MOBIL D-PAD)
   ============================================================================ */
class InputHandler {
  constructor(game) {
    this.game = game;
    this.keys = {
      up: false,
      down: false,
      left: false,
      right: false
    };

    this.setupKeyboard();
    this.setupTouchControls();
  }

  setupKeyboard() {
    window.addEventListener('keydown', (e) => {
      // Audio kontekstni birinchi bosishda uyg'otish
      this.game.sound.init();

      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.keys.up = true;
        e.preventDefault();
      } else if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        this.keys.down = true;
        e.preventDefault();
      } else if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.keys.left = true;
        e.preventDefault();
      } else if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.keys.right = true;
        e.preventDefault();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        this.game.togglePause();
        e.preventDefault();
      } else if (e.code === 'KeyM') {
        this.game.toggleSound();
        e.preventDefault();
      } else if (e.code === 'KeyF') {
        this.game.toggleFullscreen();
        e.preventDefault();
      } else if (e.code === 'KeyQ' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (this.game.state === STATE.PLAYING) {
          this.game.triggerMathEscape(false);
          e.preventDefault();
        }
      } else if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyZ' || e.code === 'KeyE') {
        this.keys.attack = true;
        if (this.game.player) {
          this.game.player.attack(this.game);
        }
        e.preventDefault();
      }

      // Matematik qochish ekranida 1-4 raqamlarini bosish
      if (this.game.state === STATE.MATH_ESCAPE) {
        if (e.code === 'Digit1' || e.code === 'Numpad1') {
          this.game.handleMathAnswer(0);
          e.preventDefault();
        } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
          this.game.handleMathAnswer(1);
          e.preventDefault();
        } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
          this.game.handleMathAnswer(2);
          e.preventDefault();
        } else if (e.code === 'Digit4' || e.code === 'Numpad4') {
          this.game.handleMathAnswer(3);
          e.preventDefault();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.keys.up = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.keys.down = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.keys.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.keys.right = false;
    });

    // Oyna fokusdan chiqqanda tugmalarni tozalash
    window.addEventListener('blur', () => this.reset());
  }

  setupTouchControls() {
    const dpadGrid = document.querySelector('.dpad-grid');
    const dpadBtns = {
      up: document.getElementById('btn-up'),
      down: document.getElementById('btn-down'),
      left: document.getElementById('btn-left'),
      right: document.getElementById('btn-right')
    };

    const clearDpad = () => {
      this.keys.up = false;
      this.keys.down = false;
      this.keys.left = false;
      this.keys.right = false;
      Object.values(dpadBtns).forEach(b => b && b.classList.remove('pressed'));
    };

    const updateDpadFromPoint = (clientX, clientY) => {
      this.game.sound.init();
      const el = document.elementFromPoint(clientX, clientY);
      const targetBtn = el ? el.closest('.dpad-btn') : null;

      // Agar bevosita biror tugma ustida bo'lsa
      if (targetBtn && targetBtn.id) {
        const dir = targetBtn.id.replace('btn-', '');
        ['up', 'down', 'left', 'right'].forEach(d => {
          const isTarget = d === dir;
          this.keys[d] = isTarget;
          if (dpadBtns[d]) {
            dpadBtns[d].classList.toggle('pressed', isTarget);
          }
        });
        return;
      }

      // Agar D-pad chegarasi ichida barmoq surilayotgan bo'lsa (diagonal va burchaklar)
      if (dpadGrid) {
        const rect = dpadGrid.getBoundingClientRect();
        if (
          clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top && clientY <= rect.bottom
        ) {
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          const dx = clientX - cx;
          const dy = clientY - cy;
          const deadzone = 12;

          this.keys.left = dx < -deadzone;
          this.keys.right = dx > deadzone;
          this.keys.up = dy < -deadzone;
          this.keys.down = dy > deadzone;

          if (dpadBtns.left) dpadBtns.left.classList.toggle('pressed', this.keys.left);
          if (dpadBtns.right) dpadBtns.right.classList.toggle('pressed', this.keys.right);
          if (dpadBtns.up) dpadBtns.up.classList.toggle('pressed', this.keys.up);
          if (dpadBtns.down) dpadBtns.down.classList.toggle('pressed', this.keys.down);
          return;
        }
      }

      clearDpad();
    };

    if (dpadGrid) {
      let activeTouchId = null;

      dpadGrid.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        activeTouchId = touch.identifier;
        updateDpadFromPoint(touch.clientX, touch.clientY);
      }, { passive: false });

      dpadGrid.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchId) {
            updateDpadFromPoint(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
            break;
          }
        }
      }, { passive: false });

      const handleTouchEnd = (e) => {
        e.preventDefault();
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === activeTouchId) {
            activeTouchId = null;
            clearDpad();
            break;
          }
        }
      };

      dpadGrid.addEventListener('touchend', handleTouchEnd, { passive: false });
      dpadGrid.addEventListener('touchcancel', handleTouchEnd, { passive: false });

      // Sichqoncha bilan ham sinash imkoniyati
      let isMouseDown = false;
      dpadGrid.addEventListener('mousedown', (e) => {
        isMouseDown = true;
        updateDpadFromPoint(e.clientX, e.clientY);
      });
      window.addEventListener('mousemove', (e) => {
        if (isMouseDown) updateDpadFromPoint(e.clientX, e.clientY);
      });
      window.addEventListener('mouseup', () => {
        if (isMouseDown) {
          isMouseDown = false;
          clearDpad();
        }
      });
    }

    // Mobil qochish (matematik/savol) tugmasi
    const escapeBtn = document.getElementById('btn-escape');
    if (escapeBtn) {
      const handleEscape = (e) => {
        e.preventDefault();
        this.game.sound.init();
        if (this.game.state === STATE.PLAYING) {
          this.game.triggerMathEscape(false);
        }
      };
      escapeBtn.addEventListener('touchstart', handleEscape, { passive: false });
      escapeBtn.addEventListener('mousedown', handleEscape);
    }

    // Mobil qilich (hujum) tugmasi
    const attackBtn = document.getElementById('btn-attack');
    if (attackBtn) {
      const handleAttack = (e) => {
        e.preventDefault();
        this.game.sound.init();
        if (this.game.player) {
          this.game.player.attack(this.game);
        }
        attackBtn.classList.add('pressed');
      };
      const handleAttackRelease = (e) => {
        e.preventDefault();
        attackBtn.classList.remove('pressed');
      };
      attackBtn.addEventListener('touchstart', handleAttack, { passive: false });
      attackBtn.addEventListener('touchend', handleAttackRelease, { passive: false });
      attackBtn.addEventListener('touchcancel', handleAttackRelease, { passive: false });
      attackBtn.addEventListener('mousedown', handleAttack);
      attackBtn.addEventListener('mouseup', handleAttackRelease);
      attackBtn.addEventListener('mouseleave', handleAttackRelease);
    }

    // Sichqoncha bilan bosilganda ham qilich zarbasi (Katta ekranlar)
    if (this.game.canvas) {
      this.game.canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { // Chap tugma
          this.game.sound.init();
          if (this.game.state === STATE.PLAYING && this.game.player) {
            this.game.player.attack(this.game);
          }
        }
      });
    }
  }

  reset() {
    this.keys.up = false;
    this.keys.down = false;
    this.keys.left = false;
    this.keys.right = false;
  }
}

/* ============================================================================
   4. KAMERA TIZIMI (SMOOTH CAMERA FOLLOW)
   ============================================================================ */
class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.x = 0;
    this.y = 0;
    this.width = viewportWidth;
    this.height = viewportHeight;
    this.lerpSpeed = 0.08; // Silliq harakat koeffitsiyenti
  }

  resize(viewportWidth, viewportHeight) {
    this.width = viewportWidth;
    this.height = viewportHeight;
  }

  update(targetX, targetY, mapWidth, mapHeight) {
    // Ekranning eni oroldan katta bo'lsa - orol gorizontal markazda bo'ladi
    if (this.width >= mapWidth) {
      this.x = (mapWidth - this.width) / 2;
    } else {
      // Aks holda kamera o'yinchiga ergashadi va orol chetlariga cheklanadi
      const targetCamX = targetX - this.width / 2;
      this.x += (targetCamX - this.x) * this.lerpSpeed;
      const maxCamX = mapWidth - this.width;
      this.x = Math.max(0, Math.min(this.x, maxCamX));
    }

    // Ekranning bo'yi oroldan katta bo'lsa - orol vertikal markazda bo'ladi
    if (this.height >= mapHeight) {
      this.y = (mapHeight - this.height) / 2;
    } else {
      const targetCamY = targetY - this.height / 2;
      this.y += (targetCamY - this.y) * this.lerpSpeed;
      const maxCamY = mapHeight - this.height;
      this.y = Math.max(0, Math.min(this.y, maxCamY));
    }
  }
}

/* ============================================================================
   4.5. SUZUVCHI BALIQLAR (OCEAN FISH - TROPICAL REEF LIFE)
   ============================================================================ */
class Fish {
  constructor(x, y, type = 0) {
    this.x = x;
    this.y = y;
    this.type = type; // 0: Kloun baliq, 1: Moviy Dori, 2: Tillarang baliq, 3: Zumrad rif
    this.angle = Math.random() * Math.PI * 2;
    this.baseSpeed = 28 + Math.random() * 22; // 28 - 50 px/s
    this.speed = this.baseSpeed;
    this.wiggleTimer = Math.random() * 10;
    this.changeDirTimer = 1 + Math.random() * 3;
    this.size = 13 + Math.random() * 6; // Baliq o'lchami (13 - 19px)
    this.bubbleTimer = Math.random() * 4;
    this.bubbles = [];
  }

  update(dt, level, player) {
    this.wiggleTimer += dt * (this.speed > 42 ? 16 : 9);
    this.changeDirTimer -= dt;

    // Har bir necha soniyada yo'nalishni ohista o'zgartirish
    if (this.changeDirTimer <= 0) {
      this.angle += (Math.random() - 0.5) * 1.5;
      this.changeDirTimer = 2 + Math.random() * 4;
      this.speed = this.baseSpeed * (0.85 + Math.random() * 0.3);
    }

    // O'yinchi qirg'oqqa yaqinlashsa baliq cho'chib tez suzib qochadi
    if (player) {
      const pX = player.getCenterX();
      const pY = player.getCenterY();
      const dx = this.x - pX;
      const dy = this.y - pY;
      const dist = Math.hypot(dx, dy);
      if (dist < 95) {
        this.angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.4;
        this.speed = this.baseSpeed * 2.2;
      }
    }

    // Quruqlikdan (oroldan) uzoqlashish - kelgusi 28px masofani tekshirish
    const lookAheadDist = 28;
    const nextX = this.x + Math.cos(this.angle) * lookAheadDist;
    const nextY = this.y + Math.sin(this.angle) * lookAheadDist;
    const nextCol = Math.floor(nextX / TILE_SIZE);
    const nextRow = Math.floor(nextY / TILE_SIZE);

    if (!level.isWaterTile(nextCol, nextRow)) {
      // Quruqlik bo'lsa burilib suv tomonga ketadi
      this.angle += Math.PI * 0.8 + (Math.random() - 0.5) * 0.4;
      this.changeDirTimer = 1.5 + Math.random() * 2;
    }

    // Orol markazidan juda uzoqqa (cheksizlikka) ketib qolmaslik
    const islandCenterX = (level.cols * TILE_SIZE) / 2;
    const islandCenterY = (level.rows * TILE_SIZE) / 2;
    const maxOceanDist = Math.max(level.cols, level.rows) * TILE_SIZE * 0.8 + 350;
    const distFromCenter = Math.hypot(this.x - islandCenterX, this.y - islandCenterY);
    if (distFromCenter > maxOceanDist) {
      const angleToCenter = Math.atan2(islandCenterY - this.y, islandCenterX - this.x);
      this.angle = angleToCenter + (Math.random() - 0.5) * 0.4;
      this.changeDirTimer = 3;
    }

    // Harakatlanish
    this.x += Math.cos(this.angle) * this.speed * dt;
    this.y += Math.sin(this.angle) * this.speed * dt;

    // Havo pufakchalari (yengil atmosfera)
    this.bubbleTimer -= dt;
    if (this.bubbleTimer <= 0) {
      this.bubbleTimer = 3 + Math.random() * 5;
      if (this.bubbles.length < 3) {
        this.bubbles.push({
          x: this.x,
          y: this.y,
          r: 1.5 + Math.random() * 1.5,
          alpha: 0.65,
          vy: -14 - Math.random() * 10
        });
      }
    }

    // Pufakchalarni yangilash
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.y += b.vy * dt;
      b.alpha -= dt * 0.4;
      if (b.alpha <= 0) {
        this.bubbles.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    const sx = Math.floor(this.x - camera.x);
    const sy = Math.floor(this.y - camera.y);

    // Pufakchalarni chizish
    for (const b of this.bubbles) {
      const bx = Math.floor(b.x - camera.x);
      const by = Math.floor(b.y - camera.y);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, b.alpha)})`;
      ctx.beginPath();
      ctx.arc(bx, by, b.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(this.angle);

    const s = this.size;
    const wiggle = Math.sin(this.wiggleTimer) * 3.5;

    // Baliq turlariga qarab ranglar
    let bodyColor = '#ff6b35';
    let stripeColor = '#ffffff';
    let finColor = '#ff9f1c';
    let eyeColor = '#000000';

    if (this.type === 1) {
      // Blue Tang (Dori)
      bodyColor = '#1d3557';
      stripeColor = '#457b9d';
      finColor = '#ffd166';
    } else if (this.type === 2) {
      // Golden Angel Fish
      bodyColor = '#ffb703';
      stripeColor = '#fb8500';
      finColor = '#e76f51';
    } else if (this.type === 3) {
      // Emerald Reef Fish
      bodyColor = '#06d6a0';
      stripeColor = '#118ab2';
      finColor = '#073b4c';
    }

    // DUM (Wiggling tail)
    ctx.fillStyle = finColor;
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, 0);
    ctx.lineTo(-s * 0.9, -s * 0.35 + wiggle);
    ctx.lineTo(-s * 0.65, wiggle * 0.5);
    ctx.lineTo(-s * 0.9, s * 0.35 + wiggle);
    ctx.closePath();
    ctx.fill();

    // QANOTCHA (Fins)
    ctx.fillStyle = finColor;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.25);
    ctx.lineTo(-s * 0.25, -s * 0.55);
    ctx.lineTo(s * 0.1, -s * 0.3);
    ctx.closePath();
    ctx.fill();

    // GAVDA (Body)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.55, s * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // CHIZIQLAR (Stripes)
    ctx.fillStyle = stripeColor;
    ctx.beginPath();
    ctx.ellipse(-s * 0.05, 0, s * 0.1, s * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();

    // KO'Z (Eye)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(s * 0.3, -s * 0.08, s * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = eyeColor;
    ctx.beginPath();
    ctx.arc(s * 0.33, -s * 0.08, s * 0.05, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

/* ============================================================================
   5. PARTIKLLAR TIZIMI (UCHQUNLAR VA EFFEKTLAR)
   ============================================================================ */
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  // Uchqunlar portlashini hosil qilish (kuchsiz kompyuterlar uchun optimallashgan)
  burst(x, y, color = '#ffd700', count = 10, speed = 110) {
    const allowed = Math.max(0, 35 - this.particles.length);
    const actualCount = Math.min(count, allowed);
    for (let i = 0; i < actualCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 0.7 + 0.3) * speed;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size: Math.random() * 3 + 2,
        color: color,
        alpha: 1,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.5 + Math.random() * 0.3
      });
    }
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt; // Kichik tortishish kuchi
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(
        Math.floor(p.x - camera.x),
        Math.floor(p.y - camera.y),
        Math.floor(p.size),
        Math.floor(p.size)
      );
    }
    ctx.restore();
  }

  // Tutun bombasi effekti (qochish paytidagi qalin tutun buluti)
  smoke(x, y, count = 30) {
    const colors = ['#f5f6fa', '#dcdde1', '#718093', '#2f3640', '#00d2d3'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = Math.random() * 95 + 25;
      this.particles.push({
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 18,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 18,
        size: Math.random() * 9 + 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.95,
        life: 0.85 + Math.random() * 0.6,
        maxLife: 0.85 + Math.random() * 0.6
      });
    }
  }

  clear() {
    this.particles = [];
  }
}

/* ============================================================================
   6. QAHRAMON SINFI (PLAYER CLASS)
   ============================================================================ */
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 36;
    this.speed = 165; // Piksel/sekund

    // Harakat va yo'nalish
    this.facing = 'right'; // 'left' | 'right' | 'up' | 'down'
    this.isMoving = false;
    this.walkAnimTimer = 0;

    // Shikastlanish va himoya (Invincibility frames)
    this.invincibleTimer = 0;
    this.invincibleDuration = 1.6; // 1.6 soniya himoya

    // Sehrli qalqon (Shield)
    this.shieldTimer = 0;
    this.shieldAnimTimer = 0;

    // Qilich bilan himoyalanish va hujum (Sword Slash)
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 0.22;
    this.attackCooldown = 0;
    this.hasHitThisSwing = new Set();

    // Tezkor sprint qochish (Matematik qochish natijasida)
    this.sprintTimer = 0;
  }

  update(dt, input, level) {
    let dx = 0;
    let dy = 0;

    if (input.keys.left) dx -= 1;
    if (input.keys.right) dx += 1;
    if (input.keys.up) dy -= 1;
    if (input.keys.down) dy += 1;

    // Diagonali bo'yicha teng tezlik berish (normalizatsiya)
    if (dx !== 0 && dy !== 0) {
      const norm = Math.SQRT1_2;
      dx *= norm;
      dy *= norm;
    }

    this.isMoving = (dx !== 0 || dy !== 0);

    if (this.isMoving) {
      this.walkAnimTimer += dt * 10;
      if (dx < 0) this.facing = 'left';
      else if (dx > 0) this.facing = 'right';
      else if (dy < 0) this.facing = 'up';
      else if (dy > 0) this.facing = 'down';
    } else {
      this.walkAnimTimer = 0;
    }

    // Tezkor sprint qochish vaqtini yangilash (+80% tezlik)
    let speedMult = 1.0;
    if (this.sprintTimer > 0) {
      this.sprintTimer -= dt;
      speedMult = 1.8;
    }
    const currentSpeed = this.speed * speedMult;

    // Harakatni X va Y o'qi bo'yicha alohida tekshirish (devor bo'ylab silliq sirg'alish)
    const moveX = dx * currentSpeed * dt;
    const moveY = dy * currentSpeed * dt;

    if (moveX !== 0) {
      if (!this.checkWallCollision(this.x + moveX, this.y, level)) {
        this.x += moveX;
      }
    }

    if (moveY !== 0) {
      if (!this.checkWallCollision(this.x, this.y + moveY, level)) {
        this.y += moveY;
      }
    }

    // Himoyalanish vaqtini yangilash
    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }

    // Sehrli qalqon vaqtini yangilash
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      this.shieldAnimTimer += dt;
    }

    // Qilich zarbasi vaqtini yangilash
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }
    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }
  }

  // Qilich bilan zarba berish
  attack(game) {
    if (this.attackCooldown > 0 || !game || game.state !== STATE.PLAYING) return;

    this.isAttacking = true;
    this.attackTimer = this.attackDuration;
    this.attackCooldown = 0.32; // Cooldown
    this.hasHitThisSwing.clear();

    if (game.sound) {
      game.sound.playSwordSlash();
    }

    const range = 46;
    const cx = this.getCenterX();
    const cy = this.getCenterY();
    let swordBox = { x: 0, y: 0, w: 0, h: 0 };

    if (this.facing === 'right') {
      swordBox = { x: cx, y: cy - 24, w: range, h: 48 };
    } else if (this.facing === 'left') {
      swordBox = { x: cx - range, y: cy - 24, w: range, h: 48 };
    } else if (this.facing === 'up') {
      swordBox = { x: cx - 24, y: cy - range, w: 48, h: range };
    } else if (this.facing === 'down') {
      swordBox = { x: cx - 24, y: cy, w: 48, h: range };
    }

    // Qilich uchqunlari
    if (game.particles) {
      const sparkX = cx + (this.facing === 'right' ? 24 : this.facing === 'left' ? -24 : 0);
      const sparkY = cy + (this.facing === 'down' ? 24 : this.facing === 'up' ? -24 : 0);
      game.particles.burst(sparkX, sparkY, '#ffffff', 5, 80);
      game.particles.burst(sparkX, sparkY, '#00d2d3', 5, 70);
    }

    // Dushmanlarga shikast yetkazish
    if (game.level && game.level.enemies) {
      for (const enemy of game.level.enemies) {
        if (enemy.hp > 0 && !this.hasHitThisSwing.has(enemy)) {
          const eBox = {
            x: enemy.x,
            y: enemy.y,
            w: enemy.width,
            h: enemy.height
          };
          if (game.checkAABB(swordBox, eBox)) {
            this.hasHitThisSwing.add(enemy);
            enemy.takeDamage(1, cx, cy, game);
          }
        }
      }
    }
  }

  // Devor va to'siqlar bilan to'qnashuvni tekshirish
  checkWallCollision(newX, newY, level) {
    // Qahramonning biroz qisqartirilgan hitbox'i (erkinroq o'tish uchun)
    const paddingX = 6;
    const paddingY = 8;
    const left = newX + paddingX;
    const right = newX + this.width - paddingX;
    const top = newY + paddingY;
    const bottom = newY + this.height - 2;

    const startCol = Math.floor(left / TILE_SIZE);
    const endCol = Math.floor(right / TILE_SIZE);
    const startRow = Math.floor(top / TILE_SIZE);
    const endRow = Math.floor(bottom / TILE_SIZE);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (level.isSolid(c, r)) {
          return true;
        }
      }
    }
    return false;
  }

  // O'yinchining to'liq markazi
  getCenterX() {
    return this.x + this.width / 2;
  }

  getCenterY() {
    return this.y + this.height / 2;
  }

  // Pixel-art uslubida qaroqchini chizish
  draw(ctx, camera) {
    const drawX = Math.floor(this.x - camera.x);
    const drawY = Math.floor(this.y - camera.y);

    // Miltillash effekti (shikastlanganda)
    if (this.invincibleTimer > 0) {
      if (Math.floor(this.invincibleTimer * 12) % 2 === 0) {
        return; // Ushbu kadrda ko'rinmaydi
      }
    }

    // 4K O'yinchi soyasi (Ambient drop shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(drawX + this.width / 2, drawY + this.height - 2, 12, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4K Sehrli qalqon aurosi (Glowing shield orb)
    if (this.shieldTimer > 0) {
      const shieldPulse = Math.sin(this.shieldAnimTimer * 8) * 3;
      ctx.strokeStyle = 'rgba(0, 210, 211, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(drawX + this.width / 2, drawY + this.height / 2, 24 + shieldPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 210, 211, 0.15)';
      ctx.fill();
    }

    ctx.save();
    ctx.translate(drawX + this.width / 2, drawY + this.height / 2);

    // Qadam tebranishi
    const bob = this.isMoving ? Math.sin(this.walkAnimTimer) * 2 : 0;
    ctx.translate(0, bob);

    // Agar chapga qarayotgan bo'lsa, gorizontal aks ettirish
    if (this.facing === 'left') {
      ctx.scale(-1, 1);
    }

    // 1. Oyoqlar (shim)
    ctx.fillStyle = '#223344'; // To'q ko'k shim
    const legOffset = this.isMoving ? Math.sin(this.walkAnimTimer) * 4 : 0;
    ctx.fillRect(-10, 8, 8, 10 + legOffset);
    ctx.fillRect(2, 8, 8, 10 - legOffset);

    // Botinkalar
    ctx.fillStyle = '#111';
    ctx.fillRect(-11, 15 + legOffset, 9, 4);
    ctx.fillRect(1, 15 - legOffset, 9, 4);

    // 2. Qaroqchi kamzuli (qizil va chiziqli ko'ylak)
    ctx.fillStyle = '#b71c1c'; // Qizil nimcha
    ctx.fillRect(-12, -4, 24, 14);

    ctx.fillStyle = '#fff9e6'; // Oq ko'ylak chizig'i
    ctx.fillRect(-4, -4, 8, 10);

    // Oltin to'qali kamar
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(-13, 4, 26, 4);
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-3, 3, 6, 6);

    // 3. Bosh va yuz
    ctx.fillStyle = '#f5cba7'; // Teri rangi
    ctx.fillRect(-9, -16, 18, 13);

    // Ko'z bog'lagichi (Eye-patch)
    ctx.fillStyle = '#111';
    ctx.fillRect(-9, -13, 18, 2); // Bog'lagich ipi
    ctx.fillRect(1, -15, 6, 6);   // O'ng ko'z bog'lagichi

    // Chap ko'z
    ctx.fillStyle = '#111';
    ctx.fillRect(-6, -14, 3, 4);

    // Qaroqchi soqoli
    ctx.fillStyle = '#4a2c1b';
    ctx.fillRect(-7, -5, 14, 3);

    // 4. Qaroqchi shlyapasi (Tricorn Hat)
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(-16, -18, 32, 5); // Keng hoshiya
    ctx.fillRect(-12, -26, 24, 9); // Shlyapa tepasi

    // Oltin hoshiyasi va kalla suyagi
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(-12, -18, 24, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-2, -23, 4, 4); // Mini skull

    // 5. Sehrli Qalqon aurasini chizish
    if (this.shieldTimer > 0) {
      const auraPulse = 0.8 + Math.sin(this.shieldAnimTimer * 8) * 0.2;
      ctx.strokeStyle = `rgba(0, 210, 255, ${auraPulse})`;
      ctx.lineWidth = 3;
      ctx.fillStyle = `rgba(0, 210, 255, ${0.15 * auraPulse})`;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Orbita bo'ylab aylanuvchi yulduzchalar
      for (let i = 0; i < 4; i++) {
        const angle = this.shieldAnimTimer * 4 + (i * Math.PI) / 2;
        const sx = Math.cos(angle) * 25;
        const sy = Math.sin(angle) * 25;
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      }
    }

    // 6. Qilich (Cutlass) chizilishi
    if (this.isAttacking) {
      const progress = 1 - (this.attackTimer / this.attackDuration);
      const swingAngle = -Math.PI / 4 + progress * (Math.PI * 0.85);

      ctx.save();
      ctx.translate(6, 4);
      ctx.rotate(swingAngle);

      // Qilich dastagi va gardasi
      ctx.fillStyle = '#4a2c1b';
      ctx.fillRect(-2, -2, 5, 4);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(2, -5, 3, 10);

      // Qilich tig'i (egri po'lat qaroqchi qilichi)
      ctx.fillStyle = '#dcdde1';
      ctx.fillRect(5, -3, 24, 6);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(7, -3, 20, 2);

      // Qilich uchi
      ctx.beginPath();
      ctx.moveTo(29, -3);
      ctx.lineTo(36, 0);
      ctx.lineTo(29, 3);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Qilichning havoda siltanish nuri (Slash Arc)
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.85 - progress * 0.4})`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 36, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      ctx.strokeStyle = `rgba(0, 210, 255, ${0.7 - progress * 0.4})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 34, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      ctx.restore();
    } else {
      // Qilich belbog'dagi qinda turgan holati
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(-15, 6, 4, 14);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-16, 4, 6, 2);
      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(-15, 1, 4, 3);
    }

    // Tezkor sprint qochish effekti (shamol va tezlik izlari)
    if (this.sprintTimer > 0) {
      ctx.fillStyle = 'rgba(0, 210, 211, 0.6)';
      ctx.fillRect(-22, 10, 6, 16);
      ctx.fillRect(-28, 14, 4, 8);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillRect(18, 10, 4, 12);
    }

    ctx.restore();
  }
}

/* ============================================================================
   7. DUSHMANLAR TIZIMI (ENEMY CLASS - CRAB, SKELETON, BAT, GHOST, BOSS)
   ============================================================================ */
class Enemy {
  constructor(x, y, type = 'crab', patrolAxis = 'horizontal', distance = 160, speed = null) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.type = type; // 'crab' | 'skeleton' | 'bat' | 'ghost' | 'boss'
    this.axis = patrolAxis; // Zaxira uchun
    this.distance = distance;
    this.direction = 1;
    this.animTimer = Math.random() * 5;
    this.shootTimer = 0;

    // Sezish va hujum tizimi (Detection & Alert mechanic)
    this.isAlerted = false;
    this.alertTimer = 0;
    this.alertAnimTimer = 0;
    this.stunTimer = 0; // Matematik qochish tufayli karaxt (stun) holati

    // Random kezish va xaritani qidirish tizimi (Wandering & Searching AI)
    this.roamTarget = null;
    this.roamTimer = Math.random() * 1.5;
    this.roamAngle = Math.random() * Math.PI * 2;
    this.stuckTimer = 0;
    this.searchTimer = 0; // O'yinchini yo'qotgandan keyin atrofni qidirish
    this.lookAroundPause = 0;
    this.lastKnownPlayerPos = null;

    if (type === 'boss') {
      this.width = 42;
      this.height = 46;
      this.baseSpeed = speed || 110;
      this.baseDetection = 320;
    } else if (type === 'ghost') {
      this.width = 30;
      this.height = 32;
      this.baseSpeed = speed || 65;
      this.baseDetection = 175;
    } else if (type === 'bat') {
      this.width = 28;
      this.height = 28;
      this.baseSpeed = speed || 115;
      this.baseDetection = 210;
    } else if (type === 'crab') {
      this.width = 32;
      this.height = 32;
      this.baseSpeed = speed || 70;
      this.baseDetection = 115;
    } else {
      // skeleton
      this.width = 32;
      this.height = 32;
      this.baseSpeed = speed || 90;
      this.baseDetection = 160;
    }
    this.speed = this.baseSpeed;

    // Dushman joni (HP)
    if (type === 'boss') {
      this.maxHp = 8;
    } else if (type === 'skeleton' || type === 'ghost') {
      this.maxHp = 2;
    } else {
      this.maxHp = 1;
    }
    this.hp = this.maxHp;
    this.hitFlashTimer = 0;
  }

  // Xaritada tasodifiy ochiq (yurish mumkin bo'lgan) joyni qidirish
  pickRandomRoamTarget(level, nearPos = null) {
    if (!level) return;

    for (let attempt = 0; attempt < 30; attempt++) {
      let targetCol, targetRow;

      if (nearPos && attempt < 10) {
        // Oxirgi ma'lum bo'lgan joy atrofini tekshirish (qidiruv rejimi)
        const centerCol = Math.floor(nearPos.x / TILE_SIZE);
        const centerRow = Math.floor(nearPos.y / TILE_SIZE);
        const r = Math.floor(Math.random() * 5) + 2;
        const a = Math.random() * Math.PI * 2;
        targetCol = Math.round(centerCol + Math.cos(a) * r);
        targetRow = Math.round(centerRow + Math.sin(a) * r);
      } else if (attempt < 18) {
        // Dushmanning hozirgi joyi atrofidagi 4-11 plitka radiusdagi hududlar
        const curCol = Math.floor(this.x / TILE_SIZE);
        const curRow = Math.floor(this.y / TILE_SIZE);
        const r = Math.floor(Math.random() * 8) + 4;
        const a = Math.random() * Math.PI * 2;
        targetCol = Math.round(curCol + Math.cos(a) * r);
        targetRow = Math.round(curRow + Math.sin(a) * r);
      } else {
        // Butun orol bo'ylab tasodifiy joy qidirish
        targetCol = Math.floor(Math.random() * (level.cols - 2)) + 1;
        targetRow = Math.floor(Math.random() * (level.rows - 2)) + 1;
      }

      if (
        targetCol >= 1 && targetCol < level.cols - 1 &&
        targetRow >= 1 && targetRow < level.rows - 1 &&
        !level.isSolid(targetCol, targetRow)
      ) {
        this.roamTarget = {
          x: targetCol * TILE_SIZE + (TILE_SIZE - this.width) / 2,
          y: targetRow * TILE_SIZE + (TILE_SIZE - this.height) / 2
        };
        this.roamTimer = Math.random() * 4.0 + 3.0; // 3.0 - 7.0 soniya davomida harakat qiladi
        this.roamAngle = Math.atan2(this.roamTarget.y - this.y, this.roamTarget.x - this.x);
        this.stuckTimer = 0;
        return;
      }
    }

    // Agar ochiq joy topilmasa tasodifiy burchak tanlash
    this.roamAngle = Math.random() * Math.PI * 2;
    this.roamTarget = null;
    this.roamTimer = Math.random() * 2.0 + 1.5;
  }

  update(dt, player, level, game) {
    // Agar dushman matematik qochish tufayli karaxt (stun) holatida bo'lsa
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.isAlerted = false;
      this.alertTimer = 0;
      return; // Harakat qilmaydi va hujum qila olmaydi!
    }

    this.animTimer += dt * (this.isAlerted ? 9 : 5);
    if (this.alertAnimTimer > 0) {
      this.alertAnimTimer -= dt;
    }
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }

    const enemyCenterX = this.x + this.width / 2;
    const enemyCenterY = this.y + this.height / 2;
    const playerCenterX = player.getCenterX();
    const playerCenterY = player.getCenterY();

    const distToPlayer = Math.hypot(playerCenterX - enemyCenterX, playerCenterY - enemyCenterY);

    // Bosqich oshgan sari dushmanlar yanada sezgirroq bo'ladi
    const stageLevel = level ? level.number : 1;
    const detectionRadius = this.baseDetection + (stageLevel - 1) * 14;

    // 1. SEZIB QOLISH (DETECTION CHECK)
    if (distToPlayer <= detectionRadius) {
      if (!this.isAlerted) {
        this.isAlerted = true;
        this.alertAnimTimer = 1.2;
        this.searchTimer = 0;
        this.lookAroundPause = 0;
        if (game && game.sound) {
          game.sound.playAlert();
        }
        if (game && game.particles) {
          game.particles.burst(enemyCenterX, this.y - 10, '#ffd700', 6, 60);
        }
      }
      this.alertTimer = 2.2; // O'yinchini ta'qib qilish vaqti
      this.lastKnownPlayerPos = { x: playerCenterX, y: playerCenterY };
    } else if (distToPlayer > detectionRadius * 1.35) {
      if (this.isAlerted) {
        this.alertTimer -= dt;
        if (this.alertTimer <= 0) {
          this.isAlerted = false;
          // O'yinchini yo'qotgach, oxirgi ko'rgan joyi atrofida qidiruv boshlaydi
          this.searchTimer = 3.0;
          if (this.lastKnownPlayerPos) {
            this.pickRandomRoamTarget(level, this.lastKnownPlayerPos);
          }
        }
      }
    }

    // 2. HARAKAT: HUJUM REJIMI (ATTACK) YOKI RANDOM KEZISH / QIDIRISH
    if (this.isAlerted) {
      // Hujum rejimida tezlik 38% ga oshadi va bosqichga ko'ra qo'shimcha tezlashadi
      const attackSpeed = this.baseSpeed * (1.38 + stageLevel * 0.02);
      const angle = Math.atan2(playerCenterY - enemyCenterY, playerCenterX - enemyCenterX);

      if (this.type === 'ghost') {
        // Arvoh devorlarni tan olmasdan to'g'ri bostirib keladi
        this.x += Math.cos(angle) * attackSpeed * dt;
        this.y += Math.sin(angle) * attackSpeed * dt;
      } else if (this.type === 'bat') {
        // Ko'rshapalak uchar holda to'lqinsimon tez shong'iydi
        const swoop = Math.sin(this.animTimer * 2.5) * 20 * dt;
        this.x += Math.cos(angle) * attackSpeed * dt;
        this.y += Math.sin(angle) * attackSpeed * dt + swoop;
      } else if (this.type === 'boss') {
        // Boss to'g'ridan-to'g'ri bostirib keladi va har 2.8 soniyada 4-tomonlama to'p otadi
        const vx = Math.cos(angle) * attackSpeed * 0.9 * dt;
        const vy = Math.sin(angle) * attackSpeed * 0.9 * dt;
        if (!this.checkSolid(this.x + vx, this.y, level)) this.x += vx;
        if (!this.checkSolid(this.x, this.y + vy, level)) this.y += vy;

        this.shootTimer += dt;
        if (this.shootTimer >= 2.8 && level) {
          this.shootTimer = 0;
          if (game && game.sound) {
            game.sound.playBossRoar();
            game.sound.playCannon();
          }
          const angles = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
          for (const a of angles) {
            const spd = 170;
            level.projectiles.push(new Cannonball(
              this.x + 21,
              this.y + 23,
              Math.cos(a) * spd,
              Math.sin(a) * spd
            ));
          }
          if (game && game.particles) {
            game.particles.burst(this.x + 21, this.y + 23, '#e84118', 16, 140);
          }
        }
      } else {
        // Qisqichbaqa va Skelet: to'g'ridan-to'g'ri o'yinchi tomonga hujum qiladi!
        const vx = Math.cos(angle) * attackSpeed * dt;
        const vy = Math.sin(angle) * attackSpeed * dt;
        let moved = false;

        if (!this.checkSolid(this.x + vx, this.y, level)) {
          this.x += vx;
          moved = true;
        }
        if (!this.checkSolid(this.x, this.y + vy, level)) {
          this.y += vy;
          moved = true;
        }

        // Burchak yoki to'siqqa taqalib qolganda sirg'alib chetlab o'tish
        if (!moved) {
          const sideAngle = angle + (Math.sin(this.animTimer) > 0 ? Math.PI / 2 : -Math.PI / 2);
          const svx = Math.cos(sideAngle) * attackSpeed * 0.6 * dt;
          const svy = Math.sin(sideAngle) * attackSpeed * 0.6 * dt;
          if (!this.checkSolid(this.x + svx, this.y, level)) this.x += svx;
          if (!this.checkSolid(this.x, this.y + svy, level)) this.y += svy;
        }
      }
    } else {
      // TINCH HOLATDA TASODIFIY KEZISH VA QIDIRISH (RANDOM ROAMING & SEARCHING)
      if (this.lookAroundPause > 0) {
        this.lookAroundPause -= dt;
        return; // Qisqa to'xtab atrofni ko'zdan kechirmoqda
      }

      if (this.searchTimer > 0) {
        this.searchTimer -= dt;
      }

      this.roamTimer -= dt;
      if (this.roamTimer <= 0 || !this.roamTarget) {
        this.pickRandomRoamTarget(level, this.searchTimer > 0 ? this.lastKnownPlayerPos : null);
      }

      const patrolSpeed = this.baseSpeed * (this.searchTimer > 0 ? 1.05 : 0.88);

      let angle = this.roamAngle;
      if (this.roamTarget) {
        const dx = this.roamTarget.x - this.x;
        const dy = this.roamTarget.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist <= 20) {
          // Nishonga yetib kelindi! Qisqa to'xtab yangi joy tanlaydi
          if (Math.random() < 0.35) {
            this.lookAroundPause = Math.random() * 0.7 + 0.3;
          }
          this.pickRandomRoamTarget(level);
          return;
        }
        angle = Math.atan2(dy, dx);
        this.roamAngle = angle;
      }

      if (this.type === 'ghost') {
        // Arvoh devorlardan o'tib xaritadagi tasodifiy nuqtalarga qarab suzadi
        const drift = Math.sin(this.animTimer * 1.5) * 14 * dt;
        this.x += Math.cos(angle) * patrolSpeed * dt;
        this.y += Math.sin(angle) * patrolSpeed * dt + drift;

        const mapW = level ? level.cols * TILE_SIZE : 600;
        const mapH = level ? level.rows * TILE_SIZE : 450;
        if (this.x < 32 || this.x > mapW - 48 || this.y < 32 || this.y > mapH - 48) {
          this.pickRandomRoamTarget(level);
        }
      } else if (this.type === 'bat') {
        // Ko'rshapalak uchar holda to'lqinsimon parvoz qilib orolni aylanadi
        const wobble = Math.sin(this.animTimer * 2.5) * 18 * dt;
        this.x += Math.cos(angle) * patrolSpeed * dt;
        this.y += Math.sin(angle) * patrolSpeed * dt + wobble;

        const mapW = level ? level.cols * TILE_SIZE : 600;
        const mapH = level ? level.rows * TILE_SIZE : 450;
        if (this.x < 32 || this.x > mapW - 48 || this.y < 32 || this.y > mapH - 48) {
          this.pickRandomRoamTarget(level);
        }
      } else {
        // Qisqichbaqa, Skelet va Boss ochiq yerda harakatlanadi
        const vx = Math.cos(angle) * patrolSpeed * dt;
        const vy = Math.sin(angle) * patrolSpeed * dt;
        let movedX = false;
        let movedY = false;

        if (!this.checkSolid(this.x + vx, this.y, level)) {
          this.x += vx;
          movedX = true;
        }
        if (!this.checkSolid(this.x, this.y + vy, level)) {
          this.y += vy;
          movedY = true;
        }

        // Agar harakat to'silgan bo'lsa (devor, qoya, daraxt)
        if (!movedX && !movedY) {
          // Perpendikulyar yo'nalishlarni tekshirib burilish
          const alt1 = angle + Math.PI / 2;
          const alt2 = angle - Math.PI / 2;
          const avx1 = Math.cos(alt1) * patrolSpeed * dt;
          const avy1 = Math.sin(alt1) * patrolSpeed * dt;
          const avx2 = Math.cos(alt2) * patrolSpeed * dt;
          const avy2 = Math.sin(alt2) * patrolSpeed * dt;

          let turned = false;
          if (!this.checkSolid(this.x + avx1, this.y + avy1, level)) {
            this.x += avx1;
            this.y += avy1;
            turned = true;
          } else if (!this.checkSolid(this.x + avx2, this.y + avy2, level)) {
            this.x += avx2;
            this.y += avy2;
            turned = true;
          }

          if (!turned) {
            this.stuckTimer = (this.stuckTimer || 0) + dt;
            if (this.stuckTimer > 0.25) {
              this.stuckTimer = 0;
              this.pickRandomRoamTarget(level);
            }
          } else {
            this.stuckTimer = 0;
          }
        } else {
          this.stuckTimer = 0;
        }
      }
    }
  }

  takeDamage(amount, fromX, fromY, game) {
    if (this.hp <= 0) return;

    this.hp -= amount;
    this.hitFlashTimer = 0.2;

    // Qilich zarbasi dushmanni orqaga suradi (Knockback)
    const enemyCx = this.x + this.width / 2;
    const enemyCy = this.y + this.height / 2;
    const knockAngle = Math.atan2(enemyCy - fromY, enemyCx - fromX);
    const knockDist = 26;
    const kx = Math.cos(knockAngle) * knockDist;
    const ky = Math.sin(knockAngle) * knockDist;

    if (!this.checkSolid(this.x + kx, this.y, game.level)) this.x += kx;
    if (!this.checkSolid(this.x, this.y + ky, game.level)) this.y += ky;

    if (game && game.sound) {
      game.sound.playSwordHit();
    }
    if (game && game.particles) {
      game.particles.burst(enemyCx, enemyCy, '#ffffff', 8, 120);
      game.particles.burst(enemyCx, enemyCy, '#ffd700', 8, 90);
    }

    // Zarba olganda darhol o'yinchiga qarab g'azablanib intiladi
    this.isAlerted = true;
    this.alertTimer = 3.0;

    if (this.hp <= 0) {
      this.hp = 0;
      if (game && game.sound) {
        game.sound.playEnemyDefeat();
      }

      if (this.type === 'crab') {
        game.score += 20;
        game.showToast("🦀 Qisqichbaqa qilich bilan yengildi! (+20)", 1.2);
        if (game.particles) game.particles.burst(enemyCx, enemyCy, '#e63946', 15, 140);
      } else if (this.type === 'bat') {
        game.score += 30;
        game.showToast("🦇 Ko'rshapalak qilich bilan urib tushirildi! (+30)", 1.2);
        if (game.particles) game.particles.burst(enemyCx, enemyCy, '#3b1236', 15, 140);
      } else if (this.type === 'skeleton') {
        game.score += 50;
        game.showToast("💀 Skelet qilich zarbasidan parchalandi! (+50)", 1.2);
        if (game.particles) game.particles.burst(enemyCx, enemyCy, '#eaeaea', 18, 150);
      } else if (this.type === 'ghost') {
        game.score += 60;
        game.showToast("👻 Arvoh qilich nuri bilan haydildi! (+60)", 1.2);
        if (game.particles) game.particles.burst(enemyCx, enemyCy, '#48dbfb', 18, 150);
      } else if (this.type === 'boss') {
        game.score += 500;
        if (game.sound) game.sound.playChest();
        game.showToast("👑 QORA SOQOL QILICH JANGIDA MAG'LUB ETILDI!! (+500)", 3.5);
        if (game.particles) {
          game.particles.burst(enemyCx, enemyCy, '#e74c3c', 35, 200);
          game.particles.burst(enemyCx, enemyCy, '#ffd700', 35, 200);
        }
      }
      game.updateHUD();
    }
  }

  checkSolid(nx, ny, level) {
    if (!level) return false;
    const pad = 4;
    const l = Math.floor((nx + pad) / TILE_SIZE);
    const r = Math.floor((nx + this.width - pad) / TILE_SIZE);
    const t = Math.floor((ny + pad) / TILE_SIZE);
    const b = Math.floor((ny + this.height - pad) / TILE_SIZE);

    for (let row = t; row <= b; row++) {
      for (let col = l; col <= r; col++) {
        if (level.isSolid(col, row)) return true;
      }
    }
    return false;
  }

  draw(ctx, camera) {
    const drawX = Math.floor(this.x - camera.x);
    const drawY = Math.floor(this.y - camera.y);

    // 4K Dushman soyasi (Ambient drop shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(drawX + this.width / 2, drawY + this.height - 2, this.width / 2.2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(drawX + this.width / 2, drawY + this.height / 2);

    if (this.type === 'crab') {
      // Qizil qisqichbaqa chizish
      const clawBob = Math.sin(this.animTimer) * 4;

      // Gavda
      ctx.fillStyle = this.isAlerted ? '#d63031' : '#e63946';
      ctx.beginPath();
      ctx.ellipse(0, 2, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#9e1b24';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ko'zlar (Hujumda qizil yorug'lik bilan)
      ctx.fillStyle = '#fff';
      ctx.fillRect(-6, -9, 4, 6);
      ctx.fillRect(2, -9, 4, 6);
      ctx.fillStyle = this.isAlerted ? '#ff0033' : '#000';
      ctx.fillRect(-5, -8, 2, 2);
      ctx.fillRect(3, -8, 2, 2);

      // Qisqichlar (Hujumda tezroq harakatlanadi)
      ctx.fillStyle = '#e63946';
      ctx.fillRect(-18, -4 + clawBob, 6, 6);
      ctx.fillRect(-20, -8 + clawBob, 6, 4);
      ctx.fillRect(12, -4 - clawBob, 6, 6);
      ctx.fillRect(14, -8 - clawBob, 6, 4);

      // Oyoqlar
      ctx.fillStyle = '#9e1b24';
      for (let i = -1; i <= 1; i++) {
        ctx.fillRect(-14, 6 + i * 4, 4, 2);
        ctx.fillRect(10, 6 + i * 4, 4, 2);
      }
    } else if (this.type === 'bat') {
      // Ko'rshapalak chizish
      const wingBob = Math.sin(this.animTimer * 2.5) * 10;
      ctx.fillStyle = this.isAlerted ? '#3b1236' : '#2d132c';
      // Qanotlar
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-14, wingBob);
      ctx.lineTo(-8, 8);
      ctx.lineTo(0, 2);
      ctx.lineTo(8, 8);
      ctx.lineTo(14, wingBob);
      ctx.closePath();
      ctx.fill();

      // Tanasi va ko'zlari
      ctx.fillStyle = '#160820';
      ctx.beginPath();
      ctx.ellipse(0, 2, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = this.isAlerted ? '#ff0000' : '#ff0055';
      ctx.fillRect(-3, -1, 2, 2);
      ctx.fillRect(1, -1, 2, 2);
    } else if (this.type === 'ghost') {
      // Arvoh chizish (Yorug' moviy-shaffof)
      const ghostBob = Math.sin(this.animTimer * 1.5) * 4;
      ctx.globalAlpha = 0.78 + Math.sin(this.animTimer) * 0.15;

      ctx.fillStyle = this.isAlerted ? '#ff7675' : '#48dbfb';
      ctx.beginPath();
      ctx.arc(0, -6 + ghostBob, 11, Math.PI, 0, false);
      ctx.lineTo(11, 8 + ghostBob);
      ctx.quadraticCurveTo(0, 16 + ghostBob, -11, 8 + ghostBob);
      ctx.closePath();
      ctx.fill();

      // Qaroqchi bandanasi
      ctx.fillStyle = this.isAlerted ? '#d63031' : '#10ac84';
      ctx.fillRect(-11, -12 + ghostBob, 22, 5);

      // Ko'zlar
      ctx.fillStyle = this.isAlerted ? '#ff0000' : '#01a3a4';
      ctx.fillRect(-6, -7 + ghostBob, 4, 4);
      ctx.fillRect(2, -7 + ghostBob, 4, 4);
    } else if (this.type === 'boss') {
      // Qora Soqol (Boss) chizish
      const bossBob = Math.sin(this.animTimer) * 2;

      // Olovli aura
      ctx.strokeStyle = this.isAlerted ? 'rgba(255, 0, 0, 0.7)' : 'rgba(231, 76, 60, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, Math.PI * 2);
      ctx.stroke();

      // Qizil qaroqchi kamzuli
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(-14, -6 + bossBob, 28, 22);

      // Oltin tugmalar
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-2, -4 + bossBob, 4, 4);
      ctx.fillRect(-2, 4 + bossBob, 4, 4);

      // Bosh va teri
      ctx.fillStyle = '#f5cba7';
      ctx.fillRect(-10, -18 + bossBob, 20, 14);

      // Qora uzun soqol (Blackbeard)
      ctx.fillStyle = '#111';
      ctx.beginPath();
      ctx.moveTo(-11, -8 + bossBob);
      ctx.lineTo(11, -8 + bossBob);
      ctx.lineTo(6, 14 + bossBob);
      ctx.lineTo(-6, 14 + bossBob);
      ctx.closePath();
      ctx.fill();

      // Qizil yonuvchi ko'zlar
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(-7, -15 + bossBob, 4, 4);
      ctx.fillRect(3, -15 + bossBob, 4, 4);

      // Katta qaroqchi shlyapasi
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(-20, -22 + bossBob, 40, 6);
      ctx.fillRect(-14, -32 + bossBob, 28, 11);

      // Shlyapa ustidagi oltin kalla suyagi
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-4, -28 + bossBob, 8, 6);

      // Qilich (Cutlass)
      ctx.strokeStyle = '#dcdde1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(14, -4 + bossBob);
      ctx.lineTo(24, -14 + bossBob);
      ctx.stroke();
    } else {
      // Qaroqchi Skelet chizish
      const skelBob = Math.sin(this.animTimer) * 2;

      // Suyaklar (tanasi)
      ctx.fillStyle = '#eaeaea';
      ctx.fillRect(-3, -2 + skelBob, 6, 14);
      ctx.fillRect(-8, 2 + skelBob, 16, 2);
      ctx.fillRect(-6, 6 + skelBob, 12, 2);

      // Bosh suyagi
      ctx.beginPath();
      ctx.arc(0, -9 + skelBob, 9, 0, Math.PI * 2);
      ctx.fill();

      // Ko'z chuqurlari (Hujumda qizil yonadi)
      ctx.fillStyle = this.isAlerted ? '#ff1744' : '#111';
      ctx.fillRect(-5, -11 + skelBob, 3, 4);
      ctx.fillRect(2, -11 + skelBob, 3, 4);

      // Skelet shlyapasi
      ctx.fillStyle = '#8b0000';
      ctx.fillRect(-9, -16 + skelBob, 18, 4);

      // Oyoqlar
      ctx.fillStyle = '#eaeaea';
      ctx.fillRect(-6, 12 + skelBob, 3, 8);
      ctx.fillRect(3, 12 - skelBob, 3, 8);
    }

    // 3. SEZIB QOLGANDAGI OGOHLANTIRISH / HUJUM BELGISI (!)
    if (this.isAlerted) {
      const alertBob = Math.sin(this.animTimer * 10) * 3;
      const bubbleY = -this.height / 2 - 16 + alertBob;

      // Ogohlantirish foni (qizil-sariq pikselli nishon)
      ctx.fillStyle = '#ff1744';
      ctx.fillRect(-8, bubbleY - 8, 16, 16);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-8, bubbleY - 8, 16, 16);

      // Undov belgisi (!)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1.5, bubbleY - 5, 3, 6);
      ctx.fillRect(-1.5, bubbleY + 3, 3, 3);
    } else if (this.searchTimer > 0 && this.stunTimer <= 0) {
      // Qidiruv holati (?) - o'yinchini qidirayotganini ko'rsatish
      const searchBob = Math.sin(this.animTimer * 6) * 2;
      const bubbleY = -this.height / 2 - 16 + searchBob;

      ctx.fillStyle = '#e67e22';
      ctx.fillRect(-8, bubbleY - 8, 16, 16);
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-8, bubbleY - 8, 16, 16);

      // So'roq belgisi (?)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-4, bubbleY - 6, 8, 2);
      ctx.fillRect(2, bubbleY - 4, 2, 3);
      ctx.fillRect(-1, bubbleY - 1, 3, 3);
      ctx.fillRect(-1, bubbleY + 3, 3, 2);
    }

    // 4. Zarba olganda oq yaltirash (Hit Flash)
    if (this.hitFlashTimer > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.arc(0, 0, this.width / 2 + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Jon ko'rsatkichi (HP bar - bir necha zarba talab qiladigan dushmanlar uchun)
    if (this.maxHp > 1 && this.hp > 0) {
      const barW = this.type === 'boss' ? 38 : 22;
      const barH = 4;
      const barY = -this.height / 2 - 10;

      ctx.fillStyle = '#111';
      ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);
      ctx.fillStyle = '#c0392b';
      ctx.fillRect(-barW / 2, barY, barW, barH);

      const ratio = this.hp / this.maxHp;
      ctx.fillStyle = this.type === 'boss' ? '#f1c40f' : '#2ecc71';
      ctx.fillRect(-barW / 2, barY, barW * ratio, barH);
    }

    // Karaxtlik (Stun) effekti - aylanuvchi yulduzchalar
    if (this.stunTimer > 0) {
      const starOffset = Math.sin(this.animTimer * 6) * 10;
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('💫', starOffset - 7, -this.height / 2 - 8);
    }

    ctx.restore();
  }
}

/* ============================================================================
   7.5. QAL'A TO'PLARI VA YADROLARI (CANNON & CANNONBALL)
   ============================================================================ */
class Cannon {
  constructor(tileX, tileY, direction = 'right', fireInterval = 2.5, initialDelay = 0) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.x = tileX * TILE_SIZE;
    this.y = tileY * TILE_SIZE;
    this.width = TILE_SIZE;
    this.height = TILE_SIZE;
    this.direction = direction; // 'left' | 'right' | 'up' | 'down'
    this.fireInterval = fireInterval;
    this.timer = initialDelay;
  }

  update(dt, level, game) {
    this.timer += dt;
    if (this.timer >= this.fireInterval) {
      this.timer = 0;
      this.fire(level, game);
    }
  }

  fire(level, game) {
    let spawnX = this.x + TILE_SIZE / 2;
    let spawnY = this.y + TILE_SIZE / 2;
    let vx = 0;
    let vy = 0;
    const speed = 190;

    if (this.direction === 'right') { spawnX += 16; vx = speed; }
    else if (this.direction === 'left') { spawnX -= 16; vx = -speed; }
    else if (this.direction === 'down') { spawnY += 16; vy = speed; }
    else if (this.direction === 'up') { spawnY -= 16; vy = -speed; }

    level.projectiles.push(new Cannonball(spawnX, spawnY, vx, vy));
    if (game && game.sound) {
      game.sound.playCannon();
      game.particles.burst(spawnX, spawnY, '#ffaa00', 8, 80);
      game.particles.burst(spawnX, spawnY, '#888888', 6, 50);
    }
  }

  draw(ctx, camera) {
    const drawX = Math.floor(this.x - camera.x);
    const drawY = Math.floor(this.y - camera.y);

    ctx.save();
    ctx.translate(drawX + TILE_SIZE / 2, drawY + TILE_SIZE / 2);

    let angle = 0;
    if (this.direction === 'right') angle = 0;
    else if (this.direction === 'down') angle = Math.PI / 2;
    else if (this.direction === 'left') angle = Math.PI;
    else if (this.direction === 'up') angle = -Math.PI / 2;
    ctx.rotate(angle);

    // Qora yog'och lafet
    ctx.fillStyle = '#3e2723';
    ctx.fillRect(-14, -10, 20, 20);
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(-16, -12, 6, 24);

    // Temir to'p stvoli
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.moveTo(-10, -8);
    ctx.lineTo(16, -6);
    ctx.lineTo(16, 6);
    ctx.lineTo(-10, 8);
    ctx.closePath();
    ctx.fill();

    // To'p uchidagi bronza halqa
    ctx.fillStyle = '#d35400';
    ctx.fillRect(14, -7, 4, 14);

    // To'p og'zi
    ctx.fillStyle = '#111';
    ctx.fillRect(17, -5, 2, 10);

    ctx.restore();
  }
}

class Cannonball {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 7;
    this.alive = true;
    this.trailTimer = 0;
  }

  update(dt, level, game) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.trailTimer += dt;
    if (this.trailTimer > 0.06) {
      this.trailTimer = 0;
      game.particles.burst(this.x, this.y, '#555555', 1, 20);
      game.particles.burst(this.x, this.y, '#ffaa00', 1, 15);
    }

    // Devor bilan to'qnashuv
    const col = Math.floor(this.x / TILE_SIZE);
    const row = Math.floor(this.y / TILE_SIZE);
    if (level.isSolid(col, row)) {
      this.alive = false;
      game.particles.burst(this.x, this.y, '#e67e22', 12, 110);
      game.particles.burst(this.x, this.y, '#7f8c8d', 8, 80);
    }
  }

  draw(ctx, camera) {
    const drawX = Math.floor(this.x - camera.x);
    const drawY = Math.floor(this.y - camera.y);

    ctx.save();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(drawX, drawY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ffeb3b';
    ctx.fillRect(drawX - 2, drawY - 2, 3, 3);
    ctx.restore();
  }
}

/* ============================================================================
   8. TUZOQLAR SINFI (TRAP CLASS - SPİKELAR)
   ============================================================================ */
class Trap {
  constructor(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.x = tileX * TILE_SIZE;
    this.y = tileY * TILE_SIZE;
    this.width = TILE_SIZE;
    this.height = TILE_SIZE;

    // Tuzoq holati: 2.2 soniya yashirin, 1.3 soniya ochiq va xavfli
    this.timer = Math.random() * 3.5; // Fazani aralashtirish
    this.cycleTime = 3.5;
    this.activeDuration = 1.3;
    this.isActive = false;
  }

  update(dt) {
    this.timer = (this.timer + dt) % this.cycleTime;
    this.isActive = this.timer > (this.cycleTime - this.activeDuration);
  }

  draw(ctx, camera) {
    const drawX = Math.floor(this.x - camera.x);
    const drawY = Math.floor(this.y - camera.y);

    ctx.save();
    // Asosiy metall plita
    ctx.fillStyle = '#4a4036';
    ctx.fillRect(drawX + 4, drawY + 4, TILE_SIZE - 8, TILE_SIZE - 8);

    ctx.fillStyle = '#2b241e';
    ctx.fillRect(drawX + 8, drawY + 8, TILE_SIZE - 16, TILE_SIZE - 16);

    // Tikanlar
    if (this.isActive) {
      // O'tkir kumush tikanlar chiqib turgan holat
      ctx.fillStyle = '#dcdde1';
      const spikePoints = [
        [12, 12], [24, 12], [36, 12],
        [18, 24], [30, 24],
        [12, 36], [24, 36], [36, 36]
      ];

      for (const [px, py] of spikePoints) {
        ctx.beginPath();
        ctx.moveTo(drawX + px - 4, drawY + py + 4);
        ctx.lineTo(drawX + px, drawY + py - 6);
        ctx.lineTo(drawX + px + 4, drawY + py + 4);
        ctx.fill();

        // Tikan uchi qon/qizil rangda
        ctx.fillStyle = '#e84118';
        ctx.fillRect(drawX + px - 1, drawY + py - 6, 2, 2);
        ctx.fillStyle = '#dcdde1';
      }
    } else {
      // Tikanlar yashiringan teshiklar
      ctx.fillStyle = '#111';
      const holePoints = [
        [12, 12], [24, 12], [36, 12],
        [18, 24], [30, 24],
        [12, 36], [24, 36], [36, 36]
      ];
      for (const [px, py] of holePoints) {
        ctx.fillRect(drawX + px - 2, drawY + py - 2, 4, 4);
      }
    }
    ctx.restore();
  }
}

/* ============================================================================
   9. YIG'ILADIGAN BUYUMLAR (COLLECTIBLE CLASS)
   ============================================================================ */
class Collectible {
  constructor(tileX, tileY, type = 'coin') {
    this.tileX = tileX;
    this.tileY = tileY;
    this.x = tileX * TILE_SIZE + TILE_SIZE / 2;
    this.y = tileY * TILE_SIZE + TILE_SIZE / 2;
    this.type = type; // 'coin', 'gem', 'key'
    this.collected = false;
    this.radius = type === 'key' ? 16 : 12;
    this.animTime = Math.random() * 10;
  }

  update(dt) {
    this.animTime += dt * 4;
  }

  draw(ctx, camera) {
    if (this.collected) return;

    const drawX = Math.floor(this.x - camera.x);
    const drawY = Math.floor(this.y - camera.y);

    // 4K Soya (Drop shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(drawX, drawY + 14, 8, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(drawX, drawY);

    if (this.type === 'gem') {
      // 4K Zumrad javohir aurosi
      ctx.fillStyle = 'rgba(46, 204, 113, 0.22)';
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'key') {
      // 4K Oltin kalit aurosi
      ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.type === 'coin') {
      // Oltin tanga (3D aylanuvchi disk effekti)
      const scaleX = Math.abs(Math.cos(this.animTime));
      const bob = Math.sin(this.animTime * 0.8) * 3;

      ctx.translate(0, bob);
      ctx.scale(scaleX, 1);

      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#c29b00';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Ichki naqsh
      ctx.fillStyle = '#ffea70';
      ctx.fillRect(-2, -5, 4, 10);
    } else if (this.type === 'gem') {
      // Yashil zumrad javohir
      const bob = Math.sin(this.animTime * 0.8) * 3;
      ctx.translate(0, bob);

      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.moveTo(0, -11);
      ctx.lineTo(9, -3);
      ctx.lineTo(0, 11);
      ctx.lineTo(-9, -3);
      ctx.closePath();
      ctx.fill();

      // Qirra nuri
      ctx.strokeStyle = '#a3e4d7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -5, 3, 3);
    } else if (this.type === 'key') {
      // Qadimiy oltin kalit (uchib tebranadi)
      const bob = Math.sin(this.animTime) * 5;
      ctx.translate(0, bob);

      // Nurlanish aylanasi
      ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      // Kalit halqasi
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, -6, 7, 0, Math.PI * 2);
      ctx.stroke();

      // Kalit tanasi va tishlari
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(-2, 0, 4, 14);
      ctx.fillRect(2, 5, 5, 3);
      ctx.fillRect(2, 10, 5, 3);
    } else if (this.type === 'heart') {
      // Shifobaxsh Qizil Yurak Eliksiri
      const bob = Math.sin(this.animTime * 1.2) * 3;
      const pulse = 1 + Math.sin(this.animTime * 2.5) * 0.12;
      ctx.translate(0, bob);
      ctx.scale(pulse, pulse);

      // Shisha idish
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.beginPath();
      ctx.arc(0, 2, 11, 0, Math.PI * 2);
      ctx.fill();

      // Qizil porlovchi yurak
      ctx.fillStyle = '#ff2a55';
      ctx.beginPath();
      ctx.moveTo(0, 7);
      ctx.bezierCurveTo(-10, -2, -10, -8, -5, -8);
      ctx.bezierCurveTo(0, -8, 0, -3, 0, -3);
      ctx.bezierCurveTo(0, -3, 0, -8, 5, -8);
      ctx.bezierCurveTo(10, -8, 10, -2, 0, 7);
      ctx.fill();

      // Yaltirash
      ctx.fillStyle = '#fff';
      ctx.fillRect(-4, -6, 2, 2);
    } else if (this.type === 'shield') {
      // Sehrli Oltin-Moviy Qalqon
      const bob = Math.sin(this.animTime) * 3.5;
      ctx.translate(0, bob);

      // Qalqon hoshiyasi
      ctx.fillStyle = '#00d2d3';
      ctx.beginPath();
      ctx.moveTo(-10, -10);
      ctx.lineTo(10, -10);
      ctx.lineTo(10, 2);
      ctx.quadraticCurveTo(0, 13, 0, 13);
      ctx.quadraticCurveTo(0, 13, -10, 2);
      ctx.closePath();
      ctx.fill();

      // Oltin markaz
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.moveTo(-7, -7);
      ctx.lineTo(7, -7);
      ctx.lineTo(7, 1);
      ctx.quadraticCurveTo(0, 10, 0, 10);
      ctx.quadraticCurveTo(0, 10, -7, 1);
      ctx.closePath();
      ctx.fill();

      // Markazdagi yulduz
      ctx.fillStyle = '#fff';
      ctx.fillRect(-2, -3, 4, 4);
    }

    ctx.restore();
  }
}

/* ============================================================================
   10. XAZINA SANDIG'I (CHEST CLASS)
   ============================================================================ */
class Chest {
  constructor(tileX, tileY) {
    this.tileX = tileX;
    this.tileY = tileY;
    this.x = tileX * TILE_SIZE;
    this.y = tileY * TILE_SIZE;
    this.width = TILE_SIZE;
    this.height = TILE_SIZE;
    this.isOpen = false;
    this.openAnim = 0; // 0 dan 1 gacha
  }

  open() {
    this.isOpen = true;
  }

  update(dt) {
    if (this.isOpen && this.openAnim < 1) {
      this.openAnim = Math.min(1, this.openAnim + dt * 3);
    }
  }

  draw(ctx, camera) {
    const drawX = Math.floor(this.x - camera.x);
    const drawY = Math.floor(this.y - camera.y);

    ctx.save();
    ctx.translate(drawX, drawY);

    // 4K Sandiq soyasi
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(24, 43, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 4K Ochilgan sandiqdan nur taralishi
    if (this.isOpen) {
      ctx.fillStyle = 'rgba(255, 215, 0, 0.35)';
      ctx.beginPath();
      ctx.moveTo(12, 18);
      ctx.lineTo(2, -15);
      ctx.lineTo(46, -15);
      ctx.lineTo(36, 18);
      ctx.closePath();
      ctx.fill();
    }

    // Sandiq tagligi (yog'och)
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(6, 16, 36, 26);

    // Oltin kamarlar
    ctx.fillStyle = '#ffd700';
    ctx.fillRect(10, 16, 4, 26);
    ctx.fillRect(34, 16, 4, 26);

    // Qulf
    ctx.fillStyle = '#ffeaa7';
    ctx.fillRect(21, 20, 6, 8);
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(23, 23, 2, 3);

    // Sandiq qopqog'i
    if (!this.isOpen) {
      // Yopiq qopqoq
      ctx.fillStyle = '#78472a';
      ctx.fillRect(4, 8, 40, 10);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(10, 8, 4, 10);
      ctx.fillRect(34, 8, 4, 10);
    } else {
      // Ochiq qopqoq (yuqoriga ko'tarilgan) va ichidan chiqayotgan tilla nur
      const lift = this.openAnim * 14;

      // Ichki tilla nur
      ctx.fillStyle = '#fff275';
      ctx.fillRect(8, 16 - lift / 2, 32, 6);

      // Ko'tarilgan qopqoq
      ctx.fillStyle = '#78472a';
      ctx.fillRect(4, 8 - lift, 40, 8);
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(10, 8 - lift, 4, 8);
      ctx.fillRect(34, 8 - lift, 4, 8);
    }

    ctx.restore();
  }
}

/* ============================================================================
   11. BOSQICH XARITALARI VA MA'LUMOTLARI (15 TA DARAJA)
   ============================================================================ */
const LEVEL_CONFIGS = [
  // LEVEL 1: Tinch Sohil (20x15)
  {
    num: 1,
    name: "Tinch Sohil",
    subtitle: "Xavfsiz sohil va birinchi tangalar",
    cols: 20,
    rows: 15,
    playerStart: { x: 2, y: 6 },
    key: { x: 16, y: 2 },
    chest: { x: 17, y: 11 },
    map: [
      "00000000000000000000",
      "00011111111111111000",
      "00112222111122221100",
      "01122332211223322110",
      "01223333211233332210",
      "01222222211222222210",
      "01111111111111111110",
      "01114411111111441110",
      "01122221111122221110",
      "01123322111223321110",
      "00112222111122221100",
      "00111111111111111100",
      "00011111111111111000",
      "00001111111111100000",
      "00000000000000000000"
    ],
    coins: [
      [3, 2], [4, 2], [5, 2], [14, 2], [15, 2],
      [4, 6], [7, 6], [10, 6], [13, 6],
      [3, 10], [5, 10], [14, 10], [16, 10],
      [9, 2], [10, 2], [9, 12], [10, 12]
    ],
    gems: [[3, 4], [16, 4]],
    hearts: [],
    shields: [],
    traps: [[8, 6], [12, 6]],
    enemies: [
      { x: 6, y: 5, type: 'crab', axis: 'horizontal', dist: 140, speed: 65 },
      { x: 14, y: 6, type: 'crab', axis: 'vertical', dist: 120, speed: 65 }
    ],
    cannons: []
  },

  // LEVEL 2: Yovvoyi Qoyalar (22x16)
  {
    num: 2,
    name: "Yovvoyi Qoyalar",
    subtitle: "Toshli so'qmoqlar va birinchi skelet",
    cols: 22,
    rows: 16,
    playerStart: { x: 2, y: 7 },
    key: { x: 19, y: 3 },
    chest: { x: 4, y: 13 },
    map: [
      "0000000000000000000000",
      "0001111111111111111000",
      "0011222211441122221100",
      "0112233221441223322110",
      "0112333221111233322110",
      "0112222211111122222110",
      "0111114411221144111110",
      "0111114411221144111110",
      "0112222211111122222110",
      "0112333221111233322110",
      "0112233221441223322110",
      "0011222211441122221100",
      "0011111111111111111100",
      "0001111111111111111000",
      "0000111111111111100000",
      "0000000000000000000000"
    ],
    coins: [
      [3, 2], [6, 2], [15, 2], [18, 2],
      [4, 5], [17, 5], [4, 8], [17, 8],
      [6, 12], [10, 12], [15, 12]
    ],
    gems: [[10, 4], [10, 9]],
    hearts: [[10, 7]],
    shields: [],
    traps: [[8, 4], [13, 4], [11, 12]],
    enemies: [
      { x: 5, y: 5, type: 'crab', axis: 'vertical', dist: 140, speed: 70 },
      { x: 16, y: 7, type: 'crab', axis: 'vertical', dist: 140, speed: 70 },
      { x: 11, y: 5, type: 'skeleton', axis: 'horizontal', dist: 160, speed: 85 }
    ],
    cannons: []
  },

  // LEVEL 3: Sirli Qoya (25x18)
  {
    num: 3,
    name: "Sirli Qoya",
    cols: 25,
    rows: 18,
    playerStart: { x: 2, y: 8 },
    key: { x: 22, y: 3 },
    chest: { x: 22, y: 14 },
    map: [
      "0000000000000000000000000",
      "0001111111111111111111000",
      "0011222222111122222211100",
      "0112233442211224433221110",
      "0112334442211224443321110",
      "0112222222211222222221110",
      "0111114411111111441111110",
      "0111114411222211441111110",
      "0112222221233212222221110",
      "0112222221233212222221110",
      "0111114411222211441111110",
      "0111114411111111441111110",
      "0112222222211222222221110",
      "0112334442211224443321110",
      "0112233442211224433221110",
      "0011222222111122222211100",
      "0001111111111111111111000",
      "0000000000000000000000000"
    ],
    coins: [
      [3, 2], [4, 2], [8, 2], [16, 2], [20, 2],
      [3, 8], [5, 8], [19, 8], [21, 8],
      [3, 15], [7, 15], [12, 15], [18, 15], [21, 15],
      [10, 5], [14, 5], [10, 11], [14, 11]
    ],
    gems: [[12, 6], [3, 14], [21, 5]],
    hearts: [],
    shields: [],
    traps: [[9, 6], [15, 6], [9, 11], [15, 11]],
    enemies: [
      { x: 6, y: 5, type: 'crab', axis: 'vertical', dist: 150, speed: 75 },
      { x: 18, y: 12, type: 'crab', axis: 'vertical', dist: 150, speed: 75 },
      { x: 12, y: 3, type: 'skeleton', axis: 'horizontal', dist: 180, speed: 90 },
      { x: 12, y: 13, type: 'skeleton', axis: 'horizontal', dist: 180, speed: 90 }
    ],
    cannons: []
  },

  // LEVEL 4: Ko'rshapalaklar G'ori (26x18)
  {
    num: 4,
    name: "Ko'rshapalaklar G'ori",
    cols: 26,
    rows: 18,
    playerStart: { x: 3, y: 9 },
    key: { x: 22, y: 2 },
    chest: { x: 22, y: 15 },
    map: [
      "00000000000000000000000000",
      "00011111111111111111111000",
      "00112224411111144222211100",
      "01122444411221144442211110",
      "01122441112222111442211110",
      "01111111144114411111111110",
      "01144112244114422114411110",
      "01144112222112222114411110",
      "01111111111111111111111110",
      "01111111111111111111111110",
      "01144112222112222114411110",
      "01144112244114422114411110",
      "01111111144114411111111110",
      "01122441112222111442211110",
      "01122444411221144442211110",
      "00112224411111144222211100",
      "00011111111111111111111000",
      "00000000000000000000000000"
    ],
    coins: [
      [4, 2], [6, 2], [18, 2], [4, 15], [18, 15],
      [10, 8], [15, 8], [10, 9], [15, 9],
      [6, 5], [19, 5], [6, 12], [19, 12]
    ],
    gems: [[12, 4], [13, 13]],
    hearts: [[13, 8]],
    shields: [],
    traps: [[7, 8], [18, 8], [7, 9], [18, 9], [12, 6]],
    enemies: [
      { x: 12, y: 4, type: 'bat', axis: 'horizontal', dist: 160, speed: 105 },
      { x: 13, y: 13, type: 'bat', axis: 'horizontal', dist: 160, speed: 105 },
      { x: 6, y: 8, type: 'skeleton', axis: 'vertical', dist: 140, speed: 95 },
      { x: 19, y: 9, type: 'skeleton', axis: 'vertical', dist: 140, speed: 95 }
    ],
    cannons: []
  },

  // LEVEL 5: Qadimiy Qabriston (28x18)
  {
    num: 5,
    name: "Qadimiy Qabriston",
    cols: 28,
    rows: 18,
    playerStart: { x: 2, y: 9 },
    key: { x: 25, y: 14 },
    chest: { x: 25, y: 3 },
    map: [
      "0000000000000000000000000000",
      "0001111111111111111111111000",
      "0011224411224411224411221100",
      "0112244112244112244112221110",
      "0111111111111111111111111110",
      "0114411441144114411441144110",
      "0114411441144114411441144110",
      "0111111111111111111111111110",
      "0112222222222222222222222110",
      "0112222222222222222222222110",
      "0111111111111111111111111110",
      "0114411441144114411441144110",
      "0114411441144114411441144110",
      "0111111111111111111111111110",
      "0112244112244112244112221110",
      "0011224411224411224411221100",
      "0001111111111111111111111000",
      "0000000000000000000000000000"
    ],
    coins: [
      [3, 4], [7, 4], [12, 4], [17, 4], [22, 4],
      [3, 7], [10, 7], [18, 7], [24, 7],
      [3, 10], [10, 10], [18, 10], [24, 10],
      [3, 13], [12, 13], [22, 13]
    ],
    gems: [[14, 8], [14, 9]],
    hearts: [],
    shields: [[14, 7]],
    traps: [[6, 7], [14, 4], [20, 7], [6, 10], [14, 13], [20, 10]],
    enemies: [
      { x: 8, y: 7, type: 'skeleton', axis: 'horizontal', dist: 180, speed: 100 },
      { x: 18, y: 7, type: 'skeleton', axis: 'horizontal', dist: 180, speed: 100 },
      { x: 14, y: 10, type: 'skeleton', axis: 'horizontal', dist: 180, speed: 100 },
      { x: 7, y: 4, type: 'bat', axis: 'vertical', dist: 150, speed: 110 },
      { x: 21, y: 13, type: 'bat', axis: 'vertical', dist: 150, speed: 110 }
    ],
    cannons: []
  },

  // LEVEL 6: Minalashtirilgan So'qmoq (28x20)
  {
    num: 6,
    name: "Minalashtirilgan So'qmoq",
    cols: 28,
    rows: 20,
    playerStart: { x: 2, y: 2 },
    key: { x: 25, y: 17 },
    chest: { x: 25, y: 2 },
    map: [
      "0000000000000000000000000000",
      "0001111111111111111111111000",
      "0011114444444444444444111100",
      "0111444444444444444444441110",
      "0111111111111111111111111110",
      "0114444444444444444444111110",
      "0114444444444444444444111110",
      "0111111111111111111111111110",
      "0111114444444444444444441110",
      "0111114444444444444444441110",
      "0111111111111111111111111110",
      "0114444444444444444444111110",
      "0114444444444444444444111110",
      "0111111111111111111111111110",
      "0111114444444444444444441110",
      "0111114444444444444444441110",
      "0111111111111111111111111110",
      "0011111111111111111111111100",
      "0001111111111111111111111000",
      "0000000000000000000000000000"
    ],
    coins: [
      [8, 4], [14, 4], [20, 4],
      [6, 7], [12, 7], [18, 7],
      [8, 10], [14, 10], [20, 10],
      [6, 13], [12, 13], [18, 13],
      [8, 16], [14, 16], [20, 16]
    ],
    gems: [[24, 7], [3, 10]],
    hearts: [[14, 7]],
    shields: [],
    traps: [
      [10, 4], [16, 4],
      [8, 7], [16, 7],
      [10, 10], [18, 10],
      [8, 13], [16, 13]
    ],
    enemies: [
      { x: 12, y: 4, type: 'crab', axis: 'horizontal', dist: 160, speed: 85 },
      { x: 10, y: 7, type: 'crab', axis: 'horizontal', dist: 160, speed: 85 },
      { x: 14, y: 10, type: 'crab', axis: 'horizontal', dist: 160, speed: 85 },
      { x: 23, y: 10, type: 'skeleton', axis: 'vertical', dist: 180, speed: 100 },
      { x: 3, y: 13, type: 'skeleton', axis: 'vertical', dist: 180, speed: 100 }
    ],
    cannons: []
  },

  // LEVEL 7: La'natlangan Botqoqlik (30x20)
  {
    num: 7,
    name: "La'natlangan Botqoqlik",
    cols: 30,
    rows: 20,
    playerStart: { x: 2, y: 10 },
    key: { x: 26, y: 2 },
    chest: { x: 25, y: 16 },
    map: [
      "000000000000000000000000000000",
      "000111111111111111111111111000",
      "001122223311111111113322221100",
      "011223322311111111113223322110",
      "011233332211111111112233332110",
      "011222222211111111112222222110",
      "011111111111111111111111111110",
      "011222111112222222111111222110",
      "011232111112333332111111232110",
      "011232111112333332111111232110",
      "011222111112222222111111222110",
      "011111111111111111111111111110",
      "011222222211111111112222222110",
      "011233332211111111112233332110",
      "011223322311111111113223322110",
      "001122223311111111113322221100",
      "001111111111111111111111111100",
      "000111111111111111111111111000",
      "000001111111111111111111100000",
      "000000000000000000000000000000"
    ],
    coins: [
      [5, 2], [14, 2], [22, 2],
      [4, 6], [14, 6], [24, 6],
      [4, 11], [14, 11], [24, 11],
      [5, 16], [14, 16], [22, 16]
    ],
    gems: [[13, 7], [15, 7]],
    hearts: [],
    shields: [[14, 10]],
    traps: [[10, 6], [18, 6], [10, 11], [18, 11], [6, 8], [22, 8]],
    enemies: [
      { x: 14, y: 4, type: 'ghost', axis: 'horizontal', dist: 160, speed: 60 },
      { x: 14, y: 14, type: 'ghost', axis: 'horizontal', dist: 160, speed: 60 },
      { x: 6, y: 5, type: 'bat', axis: 'vertical', dist: 140, speed: 110 },
      { x: 22, y: 5, type: 'bat', axis: 'vertical', dist: 140, speed: 110 },
      { x: 14, y: 7, type: 'skeleton', axis: 'vertical', dist: 140, speed: 105 }
    ],
    cannons: []
  },

  // LEVEL 8: To'pchi Qal'a (30x20)
  {
    num: 8,
    name: "To'pchi Qal'a",
    cols: 30,
    rows: 20,
    playerStart: { x: 3, y: 10 },
    key: { x: 26, y: 4 },
    chest: { x: 15, y: 10 },
    map: [
      "000000000000000000000000000000",
      "000111111111111111111111111000",
      "001144444444111111444444441100",
      "011144444444112211444444441110",
      "011111111111112211111111111110",
      "011441144444111111444441144110",
      "011441144444112211444441144110",
      "011111111111112211111111111110",
      "011444111111444444111111444110",
      "011444111111444444111111444110",
      "011111111111112211111111111110",
      "011441144444112211444441144110",
      "011441144444111111444441144110",
      "011111111111112211111111111110",
      "011144444444112211444444441110",
      "001144444444111111444444441100",
      "001111111111111111111111111100",
      "000111111111111111111111111000",
      "000011111111111111111111110000",
      "000000000000000000000000000000"
    ],
    coins: [
      [4, 4], [10, 4], [19, 4], [25, 4],
      [4, 7], [19, 7], [25, 7],
      [4, 13], [10, 13], [19, 13], [25, 13],
      [14, 6], [15, 6], [14, 14], [15, 14]
    ],
    gems: [[8, 8], [21, 8]],
    hearts: [[15, 7]],
    shields: [],
    traps: [[6, 4], [23, 4], [6, 13], [23, 13], [14, 5], [15, 12]],
    enemies: [
      { x: 8, y: 4, type: 'skeleton', axis: 'horizontal', dist: 160, speed: 105 },
      { x: 20, y: 7, type: 'skeleton', axis: 'horizontal', dist: 160, speed: 105 },
      { x: 8, y: 13, type: 'skeleton', axis: 'horizontal', dist: 160, speed: 105 },
      { x: 5, y: 7, type: 'crab', axis: 'vertical', dist: 140, speed: 80 },
      { x: 24, y: 10, type: 'crab', axis: 'vertical', dist: 140, speed: 80 }
    ],
    cannons: [
      { tileX: 5, tileY: 5, dir: 'right', interval: 2.6, delay: 0 },
      { tileX: 24, tileY: 11, dir: 'left', interval: 2.6, delay: 1.3 }
    ]
  },

  // LEVEL 9: Arvohlar Kemasi (32x22)
  {
    num: 9,
    name: "Arvohlar Kemasi",
    cols: 32,
    rows: 22,
    playerStart: { x: 3, y: 9 },
    key: { x: 28, y: 3 },
    chest: { x: 4, y: 18 },
    map: [
      "00000000000000000000000000000000",
      "00001111111111111111111111110000",
      "00011144411144411144411144411000",
      "00111144411144411144411144411100",
      "01111111111111111111111111111110",
      "01144411144411144411144411144410",
      "01144411144411144411144411144410",
      "01111111111111111111111111111110",
      "01111122222222222222222222111110",
      "01111122222222222222222222111110",
      "01144411111111111111111111144410",
      "01144411111111111111111111144410",
      "01111122222222222222222222111110",
      "01111122222222222222222222111110",
      "01111111111111111111111111111110",
      "01144411144411144411144411144410",
      "01144411144411144411144411144410",
      "01111111111111111111111111111110",
      "00111144411144411144411144411100",
      "00011144411144411144411144411000",
      "00001111111111111111111111110000",
      "00000000000000000000000000000000"
    ],
    coins: [
      [5, 4], [11, 4], [17, 4], [23, 4],
      [8, 7], [14, 7], [20, 7], [26, 7],
      [8, 14], [14, 14], [20, 14], [26, 14],
      [5, 17], [11, 17], [17, 17], [23, 17]
    ],
    gems: [[15, 8], [16, 13]],
    hearts: [[16, 9]],
    shields: [[15, 12]],
    traps: [[10, 4], [22, 4], [10, 7], [22, 7], [10, 14], [22, 14], [16, 10]],
    enemies: [
      { x: 10, y: 7, type: 'ghost', axis: 'horizontal', dist: 180, speed: 65 },
      { x: 20, y: 14, type: 'ghost', axis: 'horizontal', dist: 180, speed: 65 },
      { x: 15, y: 10, type: 'ghost', axis: 'vertical', dist: 180, speed: 65 },
      { x: 8, y: 4, type: 'bat', axis: 'horizontal', dist: 160, speed: 115 },
      { x: 22, y: 17, type: 'skeleton', axis: 'horizontal', dist: 160, speed: 110 }
    ],
    cannons: [
      { tileX: 4, tileY: 4, dir: 'right', interval: 2.5, delay: 0 },
      { tileX: 27, tileY: 17, dir: 'left', interval: 2.5, delay: 1.25 }
    ]
  },

  // LEVEL 10: Qora Soqol Qasri - Ajal Jangi (FINAL BOSS) (38x26)
  {
    num: 10,
    name: "Qora Soqol Qasri",
    subtitle: "FINAL BOSS: Afsonaviy Qora Soqol bilan hal qiluvchi jang!",
    cols: 38,
    rows: 26,
    playerStart: { x: 3, y: 4 },
    key: { x: 19, y: 4 },
    chest: { x: 19, y: 13 },
    map: [
      "00000000000000000000000000000000000000",
      "00011111111111111111111111111111111000",
      "00114444111144444444444411114444111100",
      "01114444111144444444444411114444111110",
      "01111111111111112222111111111111111110",
      "01144411444411112222111144441144411110",
      "01144411444411111111111144441144411110",
      "01111111111111444444441111111111111110",
      "01144444111111444444441111114444411110",
      "01144444112211111111111122114444411110",
      "01111111112211222222221122111111111110",
      "01144111111111222222221111111111441110",
      "01144111111111222222221111111111441110",
      "01144111111111222222221111111111441110",
      "01144111111111222222221111111111441110",
      "01111111112211222222221122111111111110",
      "01144444112211111111111122114444411110",
      "01144444111111444444441111114444411110",
      "01111111111111444444441111111111111110",
      "01144411444411111111111144441144411110",
      "01144411444411112222111144441144411110",
      "01111111111111112222111111111111111110",
      "01114444111144444444444411114444111110",
      "00114444111144444444444411114444111100",
      "00011111111111111111111111111111111000",
      "00000000000000000000000000000000000000"
    ],
    coins: [
      [5, 4], [10, 4], [28, 4], [33, 4],
      [5, 7], [10, 7], [28, 7], [33, 7],
      [5, 18], [10, 18], [28, 18], [33, 18],
      [5, 21], [10, 21], [28, 21], [33, 21],
      [14, 10], [24, 10], [14, 15], [24, 15]
    ],
    gems: [[14, 12], [24, 12], [14, 13], [24, 13], [19, 6]],
    hearts: [[6, 13], [33, 10]],
    shields: [[19, 10], [19, 15]],
    traps: [
      [8, 4], [30, 4],
      [8, 7], [30, 7],
      [8, 18], [30, 18],
      [8, 21], [30, 21],
      [13, 11], [25, 11], [13, 14], [25, 14]
    ],
    enemies: [
      // BOSS: Qora Soqol
      { x: 19, y: 10, type: 'boss', axis: 'horizontal', dist: 220, speed: 110 },
      // Royal Guards
      { x: 11, y: 9, type: 'skeleton', axis: 'vertical', dist: 160, speed: 130 },
      { x: 27, y: 9, type: 'skeleton', axis: 'vertical', dist: 160, speed: 130 },
      { x: 19, y: 2, type: 'ghost', axis: 'horizontal', dist: 200, speed: 85 },
      { x: 19, y: 21, type: 'ghost', axis: 'horizontal', dist: 200, speed: 85 }
    ],
    cannons: [
      { tileX: 3, tileY: 4, dir: 'right', interval: 2.0, delay: 0 },
      { tileX: 34, tileY: 4, dir: 'left', interval: 2.0, delay: 0.5 },
      { tileX: 3, tileY: 21, dir: 'right', interval: 2.0, delay: 1.0 },
      { tileX: 34, tileY: 21, dir: 'left', interval: 2.0, delay: 1.5 }
    ]
  }
];

class Level {
  constructor(levelNumber) {
    this.number = levelNumber;
    this.name = "";
    this.subtitle = "";
    this.cols = 0;
    this.rows = 0;
    this.tiles = [];
    this.playerStart = { x: 0, y: 0 };
    this.chest = null;
    this.keyItem = null;
    this.collectibles = [];
    this.traps = [];
    this.enemies = [];
    this.cannons = [];
    this.projectiles = [];
    this.fishes = [];

    this.waterAnimTime = 0;
    this.loadLevelData(levelNumber);
  }

  loadLevelData(levelNum) {
    const config = LEVEL_CONFIGS[levelNum - 1] || LEVEL_CONFIGS[0];
    this.name = config.name;
    this.subtitle = config.subtitle || "";
    this.cols = config.cols;
    this.rows = config.rows;
    this.parseMap(config.map);

    this.playerStart = {
      x: config.playerStart.x * TILE_SIZE + 8,
      y: config.playerStart.y * TILE_SIZE + 6
    };

    this.keyItem = new Collectible(config.key.x, config.key.y, 'key');
    this.chest = new Chest(config.chest.x, config.chest.y);

    // Tangalar
    for (const [cx, cy] of config.coins) {
      this.collectibles.push(new Collectible(cx, cy, 'coin'));
    }

    // Zumradlar
    for (const [gx, gy] of config.gems) {
      this.collectibles.push(new Collectible(gx, gy, 'gem'));
    }

    // Hayot tiklovchi eliksirlar
    if (config.hearts) {
      for (const [hx, hy] of config.hearts) {
        this.collectibles.push(new Collectible(hx, hy, 'heart'));
      }
    }

    // Sehrli qalqonlar
    if (config.shields) {
      for (const [sx, sy] of config.shields) {
        this.collectibles.push(new Collectible(sx, sy, 'shield'));
      }
    }

    // Tuzoqlar (tikanlar qiyinlikka qarab tezlashadi)
    const trapCycle = Math.max(1.8, 3.5 - levelNum * 0.1);
    for (const [tx, ty] of config.traps) {
      const trap = new Trap(tx, ty);
      trap.cycleTime = trapCycle;
      this.traps.push(trap);
    }

    // Dushmanlar
    for (const e of config.enemies) {
      const ex = e.x * TILE_SIZE;
      const ey = e.y * TILE_SIZE;
      this.enemies.push(new Enemy(ex, ey, e.type, e.axis || 'horizontal', e.dist || 160, e.speed));
    }

    // Qal'a to'plari
    if (config.cannons) {
      for (const c of config.cannons) {
        this.cannons.push(new Cannon(c.tileX, c.tileY, c.dir, c.interval, c.delay));
      }
    }

    // Jonli baliqlar (Orol atrofidagi okean hayoti)
    this.initFishes();
  }

  initFishes() {
    this.fishes = [];
    const fishCount = 24;
    const waterSpots = [];

    // Orol ichidagi suvlar
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.tiles[r][c] === TILE.WATER) {
          waterSpots.push({ x: (c + 0.5) * TILE_SIZE, y: (r + 0.5) * TILE_SIZE });
        }
      }
    }

    // Orol atrofidagi butun okean (har tomondan 1-6 blok masofada)
    for (let c = -6; c <= this.cols + 6; c += 2) {
      waterSpots.push({ x: (c + 0.5) * TILE_SIZE, y: (-1.5 - Math.random() * 4) * TILE_SIZE });
      waterSpots.push({ x: (c + 0.5) * TILE_SIZE, y: (this.rows + 0.5 + Math.random() * 4) * TILE_SIZE });
    }
    for (let r = -4; r <= this.rows + 4; r += 2) {
      waterSpots.push({ x: (-1.5 - Math.random() * 4) * TILE_SIZE, y: (r + 0.5) * TILE_SIZE });
      waterSpots.push({ x: (this.cols + 0.5 + Math.random() * 4) * TILE_SIZE, y: (r + 0.5) * TILE_SIZE });
    }

    if (waterSpots.length === 0) {
      waterSpots.push({ x: -60, y: -60 });
    }

    for (let i = 0; i < fishCount; i++) {
      const spot = waterSpots[Math.floor(Math.random() * waterSpots.length)];
      const type = i % 4; // 0: Kloun, 1: Dori (ko'k), 2: Oltin baliq, 3: Zumrad
      this.fishes.push(new Fish(
        spot.x + (Math.random() - 0.5) * 30,
        spot.y + (Math.random() - 0.5) * 30,
        type
      ));
    }
  }

  isWaterTile(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return true; // Xaritadan tashqari butun maydon cheksiz okean suvi
    }
    return this.tiles[row][col] === TILE.WATER;
  }

  parseMap(mapRaw) {
    this.tiles = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      const line = mapRaw[r] || "";
      for (let c = 0; c < this.cols; c++) {
        const char = line[c] !== undefined ? parseInt(line[c], 10) : TILE.WATER;
        row.push(char);
      }
      this.tiles.push(row);
    }
  }

  isSolid(col, row) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return true; // Xaritadan tashqari suv deb hisoblanadi
    }
    const type = this.tiles[row][col];
    // Suv, daraxt va tosh orqali o'tib bo'lmaydi
    return type === TILE.WATER || type === TILE.TREE || type === TILE.ROCK;
  }

  update(dt, game) {
    this.waterAnimTime += dt * 2.5;

    // Baliqlarni yangilash
    for (const fish of this.fishes) {
      fish.update(dt, this, game ? game.player : null);
    }

    // Tuzoqlarni yangilash
    for (const trap of this.traps) {
      trap.update(dt);
    }

    // Buyumlarni yangilash
    for (const item of this.collectibles) {
      item.update(dt);
    }
    if (this.keyItem) {
      this.keyItem.update(dt);
    }
    if (this.chest) {
      this.chest.update(dt);
    }

    // To'plarni yangilash
    for (const cannon of this.cannons) {
      cannon.update(dt, this, game);
    }

    // Yadrolarni yangilash
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.update(dt, this, game);
      if (!p.alive) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  draw(ctx, camera) {
    // Butun ko'rinib turgan ekran koordinatalari (Xarita tashqarisidagi cheksiz okean ham to'liq qamrab olinadi)
    const viewStartCol = Math.floor(camera.x / TILE_SIZE) - 1;
    const viewEndCol = Math.ceil((camera.x + camera.width) / TILE_SIZE) + 1;
    const viewStartRow = Math.floor(camera.y / TILE_SIZE) - 1;
    const viewEndRow = Math.ceil((camera.y + camera.height) / TILE_SIZE) + 1;

    // 1. CHEKSIZ OKEAN VA OROL ZAMINI CHIZISH (Ground & Living Infinite Ocean)
    for (let r = viewStartRow; r <= viewEndRow; r++) {
      for (let c = viewStartCol; c <= viewEndCol; c++) {
        const dx = Math.floor(c * TILE_SIZE - camera.x);
        const dy = Math.floor(r * TILE_SIZE - camera.y);

        const isInside = r >= 0 && r < this.rows && c >= 0 && c < this.cols;
        const type = isInside ? this.tiles[r][c] : TILE.WATER;

        if (type === TILE.WATER) {
          // 4K Tirik okean suvi va to'lqinlar animatsiyasi
          ctx.fillStyle = '#145d82';
          ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);

          // Qirg'oq bo'yidagi sayoz firuza suv va ko'pik (4K Coastal Surf)
          const isNearSand = isInside && (
            (c > 0 && this.tiles[r][c - 1] === TILE.SAND) ||
            (c < this.cols - 1 && this.tiles[r][c + 1] === TILE.SAND) ||
            (r > 0 && this.tiles[r - 1][c] === TILE.SAND) ||
            (r < this.rows - 1 && this.tiles[r + 1][c] === TILE.SAND)
          );

          if (isNearSand) {
            ctx.fillStyle = 'rgba(72, 187, 210, 0.3)';
            ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            const surf = Math.sin(this.waterAnimTime * 1.6 + (c + r) * 0.9) * 3;
            ctx.fillRect(dx + 2 + surf, dy + 2, TILE_SIZE - 4, 3);
          }

          // Oq ko'pik to'lqinchalari
          ctx.fillStyle = '#4ea5cc';
          const waveOffset = Math.sin(this.waterAnimTime + c * 0.7 + r * 0.9) * 4;
          ctx.fillRect(dx + 6 + waveOffset, dy + 14, 18, 3);
          ctx.fillRect(dx + 20 - waveOffset, dy + 32, 16, 3);

          // Nozik suv yaltirashi (chuqur dengiz jilosi)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
          const waveOffset2 = Math.cos(this.waterAnimTime * 0.8 + c * 0.6 + r * 1.1) * 3;
          ctx.fillRect(dx + 12 + waveOffset2, dy + 22, 12, 2);

          // 4K Quyosh nuri jilosi (Sun glints / sparkles)
          if ((c * 7 + r * 13) % 9 === 0) {
            const sparkleAlpha = (Math.sin(this.waterAnimTime * 2.2 + c + r) + 1) * 0.35;
            ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha.toFixed(2)})`;
            ctx.fillRect(dx + 28, dy + 8, 3, 3);
          }
        } else if (type === TILE.SAND || type === TILE.TREE || type === TILE.ROCK) {
          // 4K Oltin qum zamini
          ctx.fillStyle = '#e6c587';
          ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);

          // Mayda qum donachalari (tekstura)
          ctx.fillStyle = '#d2ad67';
          if ((c + r) % 2 === 0) {
            ctx.fillRect(dx + 10, dy + 12, 3, 3);
            ctx.fillRect(dx + 32, dy + 28, 2, 2);
          } else {
            ctx.fillRect(dx + 22, dy + 16, 2, 2);
            ctx.fillRect(dx + 12, dy + 36, 3, 3);
          }
          if ((c * 3 + r * 5) % 7 === 0) {
            ctx.fillStyle = '#fff4d3';
            ctx.fillRect(dx + 18, dy + 24, 2, 2);
          }
        } else if (type === TILE.GRASS) {
          // 4K Tropik yashil maysa zamini
          ctx.fillStyle = '#3e8938';
          ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);

          // Maysa poyachalari
          ctx.fillStyle = '#2f6d2a';
          ctx.fillRect(dx + 8, dy + 14, 2, 6);
          ctx.fillRect(dx + 10, dy + 12, 2, 8);
          ctx.fillRect(dx + 26, dy + 28, 2, 6);
          ctx.fillRect(dx + 28, dy + 26, 2, 8);

          // 4K Mayda rangli gullar
          if ((c + r * 3) % 6 === 0) {
            ctx.fillStyle = '#f1c40f'; // Sariq gul
            ctx.fillRect(dx + 16, dy + 18, 3, 3);
          } else if ((c * 2 + r) % 7 === 0) {
            ctx.fillStyle = '#e74c3c'; // Qizil gul
            ctx.fillRect(dx + 34, dy + 14, 3, 3);
          }
        }
      }
    }

    const camX1 = camera.x - 48;
    const camX2 = camera.x + camera.width + 48;
    const camY1 = camera.y - 48;
    const camY2 = camera.y + camera.height + 48;

    // 1.5. BALIQLAR (Okeanda suzuvchi rang-barang baliqlar - faqat ko'rinadiganlari)
    for (const fish of this.fishes) {
      if (fish.x + 40 >= camX1 && fish.x - 40 <= camX2 && fish.y + 40 >= camY1 && fish.y - 40 <= camY2) {
        fish.draw(ctx, camera);
      }
    }

    // 2. TUZOQLARNI CHIZISH (Kamera ichidagilar)
    for (const trap of this.traps) {
      if (trap.x + trap.width >= camX1 && trap.x <= camX2 && trap.y + trap.height >= camY1 && trap.y <= camY2) {
        trap.draw(ctx, camera);
      }
    }

    // 3. TO'SIQLAR (DARAXT VA QOYALAR) CHIZILISHI - Faqat xarita ichidagi orol hududi
    const islandStartRow = Math.max(0, viewStartRow);
    const islandEndRow = Math.min(this.rows - 1, viewEndRow);
    const islandStartCol = Math.max(0, viewStartCol);
    const islandEndCol = Math.min(this.cols - 1, viewEndCol);

    for (let r = islandStartRow; r <= islandEndRow; r++) {
      for (let c = islandStartCol; c <= islandEndCol; c++) {
        const type = this.tiles[r][c];
        const dx = Math.floor(c * TILE_SIZE - camera.x);
        const dy = Math.floor(r * TILE_SIZE - camera.y);

        if (type === TILE.TREE) {
          // Kokosli palma daraxti
          ctx.fillStyle = '#5d4037';
          ctx.fillRect(dx + 20, dy + 18, 8, 26);
          ctx.fillStyle = '#3e2723';
          ctx.fillRect(dx + 20, dy + 24, 8, 3);
          ctx.fillRect(dx + 20, dy + 34, 8, 3);

          ctx.fillStyle = '#2e7d32';
          ctx.beginPath();
          ctx.arc(dx + 24, dy + 16, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#43a047';
          ctx.beginPath();
          ctx.arc(dx + 24, dy + 14, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#4e342e';
          ctx.beginPath();
          ctx.arc(dx + 21, dy + 19, 4, 0, Math.PI * 2);
          ctx.arc(dx + 27, dy + 19, 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (type === TILE.ROCK) {
          // 3D qadimiy tosh / qoya
          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.beginPath();
          ctx.ellipse(dx + 24, dy + 40, 18, 6, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#7f8c8d';
          ctx.beginPath();
          ctx.roundRect(dx + 6, dy + 10, 36, 30, 8);
          ctx.fill();

          ctx.fillStyle = '#95a5a6';
          ctx.beginPath();
          ctx.roundRect(dx + 9, dy + 12, 16, 14, 4);
          ctx.fill();

          ctx.strokeStyle = '#34495e';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(dx + 22, dy + 18);
          ctx.lineTo(dx + 28, dy + 26);
          ctx.lineTo(dx + 34, dy + 24);
          ctx.stroke();
        }
      }
    }

    // 3.5. TO'PLARDAN OTILGAN YADROLARNI CHIZISH
    for (const p of this.projectiles) {
      if (p.x + p.radius >= camX1 && p.x - p.radius <= camX2 && p.y + p.radius >= camY1 && p.y - p.radius <= camY2) {
        p.draw(ctx, camera);
      }
    }

    // 3.6. QAL'A TO'PLARINI CHIZISH
    for (const cannon of this.cannons) {
      if (cannon.x + cannon.width >= camX1 && cannon.x <= camX2 && cannon.y + cannon.height >= camY1 && cannon.y <= camY2) {
        cannon.draw(ctx, camera);
      }
    }

    // 4. BUYUMLARNI CHIZISH (Faqat ko'rinib turganlari)
    for (const item of this.collectibles) {
      if (item.x + item.radius >= camX1 && item.x - item.radius <= camX2 && item.y + item.radius >= camY1 && item.y - item.radius <= camY2) {
        item.draw(ctx, camera);
      }
    }
    if (this.keyItem && this.keyItem.x + this.keyItem.radius >= camX1 && this.keyItem.x - this.keyItem.radius <= camX2 && this.keyItem.y + this.keyItem.radius >= camY1 && this.keyItem.y - this.keyItem.radius <= camY2) {
      this.keyItem.draw(ctx, camera);
    }
    if (this.chest && this.chest.x + this.chest.width >= camX1 && this.chest.x <= camX2 && this.chest.y + this.chest.height >= camY1 && this.chest.y <= camY2) {
      this.chest.draw(ctx, camera);
    }
  }
}

/* ============================================================================
   12. ASOSIY O'YIN DVIGATELI (GAME ENGINE - 15 TA BOSQICH)
   ============================================================================ */
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // Tizimlar
    this.sound = new SoundManager();
    this.input = new InputHandler(this);
    this.particles = new ParticleSystem();
    this.camera = new Camera(this.canvas.width, this.canvas.height);

    // O'yin holati
    this.state = STATE.MENU;
    this.currentLevelIndex = 1;
    this.maxLevels = 10;
    this.level = null;
    this.player = null;

    // Ko'rsatkichlar
    this.score = 0;
    this.levelStartScore = 0;
    this.lives = 3;
    this.hasKey = false;
    this.highScore = parseInt(localStorage.getItem('treasure_hunt_highscore') || '0', 10);

    // Animatsiya sikli
    this.lastTime = 0;
    this.toastTimer = 0;

    // DOM elementlari
    this.dom = {
      hud: document.getElementById('game-hud'),
      hudHearts: document.getElementById('hud-hearts'),
      hudScore: document.getElementById('hud-score'),
      hudLevel: document.getElementById('hud-level'),
      hudLevelName: document.getElementById('hud-level-name'),
      hudKey: document.getElementById('hud-key'),
      compassBox: document.getElementById('compass-indicator'),
      compassNeedle: document.getElementById('compass-needle'),
      compassText: document.getElementById('compass-text'),
      toast: document.getElementById('game-toast'),

      // Ekranlar
      screenMenu: document.getElementById('screen-menu'),
      screenLevelSelect: document.getElementById('screen-level-select'),
      screenInstructions: document.getElementById('screen-instructions'),
      screenPause: document.getElementById('screen-pause'),
      screenLevelClear: document.getElementById('screen-level-clear'),
      screenVictory: document.getElementById('screen-victory'),
      screenGameOver: document.getElementById('screen-game-over'),

      // Tugmalar va yozuvlar
      menuHighscore: document.getElementById('menu-highscore'),
      menuSoundStatus: document.getElementById('menu-sound-status'),
      btnStart: document.getElementById('btn-start'),
      btnLevelSelect: document.getElementById('btn-level-select'),
      btnLevelSelectBack: document.getElementById('btn-level-select-back'),
      btnHowTo: document.getElementById('btn-how-to'),
      btnMenuSound: document.getElementById('btn-menu-sound'),
      btnBackToMenu: document.getElementById('btn-back-to-menu'),
      btnSoundToggle: document.getElementById('btn-sound-toggle'),
      btnPauseToggle: document.getElementById('btn-pause-toggle'),
      btnResume: document.getElementById('btn-resume'),
      btnRestartLevel: document.getElementById('btn-restart-level'),
      btnToMainMenu: document.getElementById('btn-to-main-menu'),
      btnNextLevel: document.getElementById('btn-next-level'),
      levelClearScore: document.getElementById('level-clear-score'),
      levelClearTotalScore: document.getElementById('level-clear-total-score'),
      btnVictoryRestart: document.getElementById('btn-victory-restart'),
      btnVictoryMenu: document.getElementById('btn-victory-menu'),
      victoryFinalScore: document.getElementById('victory-final-score'),
      victoryNewRecord: document.getElementById('victory-new-record'),
      btnRetry: document.getElementById('btn-retry'),
      btnGameOverMenu: document.getElementById('btn-game-over-menu'),
      gameOverScore: document.getElementById('game-over-score'),
      btnFullscreenToggle: document.getElementById('btn-fullscreen-toggle'),

      // Savol-Javob va Qochish elementlari
      screenMathEscape: document.getElementById('screen-math-escape'),
      mathEquation: document.getElementById('math-equation'),
      mathOptions: document.getElementById('math-options'),
      mathTimerBar: document.getElementById('math-timer-bar'),
      btnHudEscape: document.getElementById('btn-hud-escape'),
      btnEscapeMobile: document.getElementById('btn-escape'),
      escapeBtnCooldown: document.getElementById('escape-btn-cooldown'),
      btnQuizCategory: document.getElementById('btn-quiz-category'),
      menuQuizCategory: document.getElementById('menu-quiz-category'),
      btnPauseQuizCategory: document.getElementById('btn-pause-quiz-category'),
      pauseQuizCategory: document.getElementById('pause-quiz-category'),
      quizCategoryTag: document.getElementById('quiz-category-tag'),
      mathModalTitle: document.getElementById('math-modal-title'),

      // Mobil boshqaruv va Burger menyu elementlari
      mobileControls: document.getElementById('mobile-controls'),
      mobileAttack: document.getElementById('mobile-attack'),
      btnBurgerMenu: document.getElementById('btn-burger-menu'),
      mobileBurgerMenu: document.getElementById('mobile-burger-menu'),
      btnBurgerClose: document.getElementById('btn-burger-close'),
      btnBurgerResume: document.getElementById('btn-burger-resume'),
      btnBurgerSound: document.getElementById('btn-burger-sound'),
      burgerSoundStatus: document.getElementById('burger-sound-status'),
      btnBurgerQuizCategory: document.getElementById('btn-burger-quiz-category'),
      burgerQuizCategory: document.getElementById('burger-quiz-category'),
      btnBurgerFullscreen: document.getElementById('btn-burger-fullscreen'),
      btnBurgerRestart: document.getElementById('btn-burger-restart'),
      btnBurgerLevelSelect: document.getElementById('btn-burger-level-select'),
      btnBurgerHowTo: document.getElementById('btn-burger-how-to'),
      btnBurgerToMenu: document.getElementById('btn-burger-to-menu'),
      burgerStatLevel: document.getElementById('burger-stat-level'),
      burgerStatScore: document.getElementById('burger-stat-score'),
      burgerStatHighscore: document.getElementById('burger-stat-highscore'),
      burgerStatLevelName: document.getElementById('burger-stat-level-name'),

      // Timer elementlari
      timerBox: document.getElementById('timer-box'),
      hudTimer: document.getElementById('hud-timer'),
      burgerStatTimer: document.getElementById('burger-stat-timer'),
      levelClearTimeBonus: document.getElementById('level-clear-time-bonus')
    };

    // Savol-javob / Qochish ko'rsatkichlari
    this.quizCategory = localStorage.getItem('treasure_quiz_category') || 'ALL';
    this.escapeCooldown = 0;
    this.maxEscapeCooldown = 12; // 12 soniya cooldown
    this.mathEscapeTimer = 0;
    this.mathEscapeDuration = 7.5; // 7.5 soniya vaqt (savollarni qulay o'qish uchun)
    this.isEmergencyEscape = false;
    this.activeMathProblem = null;
    this.wasPlayingBeforeBurger = false;

    // Bosqich taymeri ko'rsatkichlari
    this.levelTimeLimit = 90;
    this.levelTimer = 90;
    this.lastTickedSecond = 90;

    this.initUI();
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Siklni boshlash
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  // Ekranni to'liq o'lchamga moslash
  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    // 4K Ultra HD render masshtabi (DevicePixelRatio 2x yoki undan yuqori)
    const dpr = Math.max(window.devicePixelRatio || 1, 2);

    this.dpr = dpr;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';

    this.ctx.imageSmoothingEnabled = false;
    this.camera.resize(width, height);

    if (this.level && this.player) {
      const mapWidth = this.level.cols * TILE_SIZE;
      const mapHeight = this.level.rows * TILE_SIZE;
      if (this.camera.width >= mapWidth) {
        this.camera.x = (mapWidth - this.camera.width) / 2;
      }
      if (this.camera.height >= mapHeight) {
        this.camera.y = (mapHeight - this.camera.height) / 2;
      }
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      const docEl = document.documentElement;
      if (docEl.requestFullscreen) {
        docEl.requestFullscreen().catch(() => {});
      } else if (docEl.webkitRequestFullscreen) {
        docEl.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  initUI() {
    // Rekord ballni yangilash
    this.dom.menuHighscore.textContent = this.highScore;
    this.updateSoundBtn();
    this.initLevelSelectUI();
    this.updateQuizCategoryUI();

    if (this.dom.btnQuizCategory) {
      this.dom.btnQuizCategory.addEventListener('click', () => {
        this.sound.init();
        this.cycleQuizCategory();
      });
    }

    if (this.dom.btnPauseQuizCategory) {
      this.dom.btnPauseQuizCategory.addEventListener('click', () => {
        this.sound.init();
        this.cycleQuizCategory();
      });
    }

    if (this.dom.btnFullscreenToggle) {
      this.dom.btnFullscreenToggle.addEventListener('click', () => {
        this.sound.init();
        this.toggleFullscreen();
      });
    }

    if (this.dom.btnHudEscape) {
      this.dom.btnHudEscape.addEventListener('click', () => {
        this.sound.init();
        if (this.state === STATE.PLAYING) {
          this.triggerMathEscape(false);
        }
      });
    }

    document.addEventListener('fullscreenchange', () => {
      if (this.dom.btnFullscreenToggle) {
        this.dom.btnFullscreenToggle.textContent = document.fullscreenElement ? '🗗' : '⛶';
      }
      this.handleResize();
    });

    // Tugma eshituvchilari
    this.dom.btnStart.addEventListener('click', () => {
      this.sound.init();
      this.startNewGame();
    });

    if (this.dom.btnLevelSelect) {
      this.dom.btnLevelSelect.addEventListener('click', () => {
        this.sound.init();
        this.showScreen('levelSelect');
      });
    }

    if (this.dom.btnLevelSelectBack) {
      this.dom.btnLevelSelectBack.addEventListener('click', () => {
        this.sound.init();
        this.showScreen('menu');
      });
    }

    this.dom.btnHowTo.addEventListener('click', () => {
      this.sound.init();
      this.showScreen('instructions');
    });

    this.dom.btnBackToMenu.addEventListener('click', () => {
      this.sound.init();
      this.showScreen('menu');
    });

    this.dom.btnMenuSound.addEventListener('click', () => this.toggleSound());
    this.dom.btnSoundToggle.addEventListener('click', () => this.toggleSound());

    this.dom.btnPauseToggle.addEventListener('click', () => this.togglePause());
    this.dom.btnResume.addEventListener('click', () => this.togglePause());

    this.dom.btnRestartLevel.addEventListener('click', () => {
      this.sound.init();
      this.restartCurrentLevel();
    });

    this.dom.btnToMainMenu.addEventListener('click', () => {
      this.sound.init();
      this.showMainMenu();
    });

    this.dom.btnNextLevel.addEventListener('click', () => {
      this.sound.init();
      this.nextLevel();
    });

    this.dom.btnRetry.addEventListener('click', () => {
      this.sound.init();
      this.startNewGame();
    });

    this.dom.btnGameOverMenu.addEventListener('click', () => {
      this.sound.init();
      this.showMainMenu();
    });

    this.dom.btnVictoryRestart.addEventListener('click', () => {
      this.sound.init();
      this.startNewGame();
    });

    this.dom.btnVictoryMenu.addEventListener('click', () => {
      this.sound.init();
      this.showMainMenu();
    });

    // Mobil Burger Menyu eshituvchilari
    if (this.dom.btnBurgerMenu) {
      this.dom.btnBurgerMenu.addEventListener('click', () => {
        this.sound.init();
        this.toggleBurgerMenu();
      });
    }

    if (this.dom.btnBurgerClose) {
      this.dom.btnBurgerClose.addEventListener('click', () => {
        this.sound.init();
        this.closeBurgerMenu();
      });
    }

    if (this.dom.btnBurgerResume) {
      this.dom.btnBurgerResume.addEventListener('click', () => {
        this.sound.init();
        this.closeBurgerMenu();
      });
    }

    if (this.dom.btnBurgerSound) {
      this.dom.btnBurgerSound.addEventListener('click', () => {
        this.toggleSound();
      });
    }

    if (this.dom.btnBurgerQuizCategory) {
      this.dom.btnBurgerQuizCategory.addEventListener('click', () => {
        this.sound.init();
        this.cycleQuizCategory();
      });
    }

    if (this.dom.btnBurgerFullscreen) {
      this.dom.btnBurgerFullscreen.addEventListener('click', () => {
        this.sound.init();
        this.toggleFullscreen();
      });
    }

    if (this.dom.btnBurgerRestart) {
      this.dom.btnBurgerRestart.addEventListener('click', () => {
        this.sound.init();
        this.closeBurgerMenu();
        this.restartCurrentLevel();
      });
    }

    if (this.dom.btnBurgerLevelSelect) {
      this.dom.btnBurgerLevelSelect.addEventListener('click', () => {
        this.sound.init();
        this.closeBurgerMenu();
        this.showScreen('levelSelect');
      });
    }

    if (this.dom.btnBurgerHowTo) {
      this.dom.btnBurgerHowTo.addEventListener('click', () => {
        this.sound.init();
        this.closeBurgerMenu();
        this.showScreen('instructions');
      });
    }

    if (this.dom.btnBurgerToMenu) {
      this.dom.btnBurgerToMenu.addEventListener('click', () => {
        this.sound.init();
        this.closeBurgerMenu();
        this.showMainMenu();
      });
    }
  }

  // Mobil Burger Menyu boshqaruvi
  openBurgerMenu() {
    this.sound.init();
    if (this.dom.mobileBurgerMenu) {
      this.dom.mobileBurgerMenu.classList.remove('hidden');
    }
    if (this.state === STATE.PLAYING) {
      this.wasPlayingBeforeBurger = true;
      this.state = STATE.PAUSED;
    }
    if (this.dom.burgerStatLevel) {
      this.dom.burgerStatLevel.textContent = `${this.currentLevelIndex}/${this.maxLevels}`;
    }
    if (this.dom.burgerStatLevelName && this.level) {
      this.dom.burgerStatLevelName.textContent = `${this.currentLevelIndex}-Bosqich: ${this.level.name}`;
    }
    if (this.dom.burgerStatScore) {
      this.dom.burgerStatScore.textContent = this.score;
    }
    if (this.dom.burgerStatHighscore) {
      this.dom.burgerStatHighscore.textContent = this.highScore;
    }
    if (this.dom.burgerStatTimer) {
      this.dom.burgerStatTimer.textContent = this.formatTime(this.levelTimer);
    }
    this.updateSoundBtn();
    this.updateQuizCategoryUI();
  }

  closeBurgerMenu() {
    this.sound.init();
    if (this.dom.mobileBurgerMenu) {
      this.dom.mobileBurgerMenu.classList.add('hidden');
    }
    if (this.wasPlayingBeforeBurger && this.state === STATE.PAUSED) {
      this.state = STATE.PLAYING;
      this.wasPlayingBeforeBurger = false;
    }
  }

  toggleBurgerMenu() {
    if (this.dom.mobileBurgerMenu && !this.dom.mobileBurgerMenu.classList.contains('hidden')) {
      this.closeBurgerMenu();
    } else {
      this.openBurgerMenu();
    }
  }

  initLevelSelectUI() {
    const grid = document.getElementById('level-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const badges = [
      { text: 'Oson', class: 'badge-easy' },         // L1
      { text: 'Oson', class: 'badge-easy' },         // L2
      { text: "O'rta", class: 'badge-medium' },       // L3
      { text: "O'rta", class: 'badge-medium' },       // L4
      { text: "O'rta", class: 'badge-medium' },       // L5
      { text: 'Qiyin', class: 'badge-hard' },         // L6
      { text: 'Qiyin', class: 'badge-hard' },         // L7
      { text: 'Qiyin', class: 'badge-hard' },         // L8
      { text: 'Juda Qiyin', class: 'badge-veryhard' }, // L9
      { text: 'FINAL BOSS', class: 'badge-boss' }      // L10
    ];

    LEVEL_CONFIGS.forEach((cfg, idx) => {
      const card = document.createElement('div');
      card.className = 'level-card';
      const badgeInfo = badges[idx] || { text: 'Qiyin', class: 'badge-hard' };

      card.innerHTML = `
        <span class="level-card-num">${cfg.num}</span>
        <span class="level-card-name">${cfg.name}</span>
        <span class="level-badge ${badgeInfo.class}">${badgeInfo.text}</span>
      `;

      card.addEventListener('click', () => {
        this.sound.init();
        this.currentLevelIndex = cfg.num;
        this.lives = 3;
        this.loadLevel(this.currentLevelIndex);
        this.state = STATE.PLAYING;
        this.hideScreens();
        this.showToast(`${cfg.num}-Bosqich: ${cfg.name}! 🏴‍☠️`);
      });

      grid.appendChild(card);
    });
  }

  updateSoundBtn() {
    const statusText = this.sound.enabled ? 'YOQILGAN' : 'O\'CHIRILGAN';
    const icon = this.sound.enabled ? '🔊' : '🔇';
    if (this.dom.menuSoundStatus) this.dom.menuSoundStatus.textContent = statusText;
    if (this.dom.btnSoundToggle) this.dom.btnSoundToggle.textContent = icon;
    if (this.dom.burgerSoundStatus) this.dom.burgerSoundStatus.textContent = statusText;
  }

  toggleSound() {
    this.sound.init();
    this.sound.toggle();
    this.updateSoundBtn();
  }

  togglePause() {
    if (this.state === STATE.PLAYING) {
      this.state = STATE.PAUSED;
      this.showScreen('pause');
    } else if (this.state === STATE.PAUSED) {
      this.state = STATE.PLAYING;
      this.hideScreens();
    }
  }

  showToast(msg, duration = 2.2) {
    this.dom.toast.textContent = msg;
    this.dom.toast.classList.remove('hidden');
    this.toastTimer = duration;
  }

  showScreen(screenName) {
    this.dom.screenMenu.classList.add('hidden');
    if (this.dom.screenLevelSelect) this.dom.screenLevelSelect.classList.add('hidden');
    this.dom.screenInstructions.classList.add('hidden');
    this.dom.screenPause.classList.add('hidden');
    this.dom.screenLevelClear.classList.add('hidden');
    this.dom.screenVictory.classList.add('hidden');
    this.dom.screenGameOver.classList.add('hidden');
    if (this.dom.mobileBurgerMenu) this.dom.mobileBurgerMenu.classList.add('hidden');
    if (this.dom.mobileControls) this.dom.mobileControls.classList.add('hidden');
    if (this.dom.mobileAttack) this.dom.mobileAttack.classList.add('hidden');

    if (screenName === 'menu') {
      this.dom.screenMenu.classList.remove('hidden');
      this.dom.hud.classList.add('hidden');
      this.dom.menuHighscore.textContent = this.highScore;
    } else if (screenName === 'levelSelect') {
      if (this.dom.screenLevelSelect) this.dom.screenLevelSelect.classList.remove('hidden');
    } else if (screenName === 'instructions') {
      this.dom.screenInstructions.classList.remove('hidden');
    } else if (screenName === 'pause') {
      this.dom.screenPause.classList.remove('hidden');
    } else if (screenName === 'levelClear') {
      this.dom.screenLevelClear.classList.remove('hidden');
    } else if (screenName === 'victory') {
      this.dom.screenVictory.classList.remove('hidden');
    } else if (screenName === 'gameOver') {
      this.dom.screenGameOver.classList.remove('hidden');
    }
  }

  hideScreens() {
    this.dom.screenMenu.classList.add('hidden');
    if (this.dom.screenLevelSelect) this.dom.screenLevelSelect.classList.add('hidden');
    this.dom.screenInstructions.classList.add('hidden');
    this.dom.screenPause.classList.add('hidden');
    this.dom.screenLevelClear.classList.add('hidden');
    this.dom.screenVictory.classList.add('hidden');
    this.dom.screenGameOver.classList.add('hidden');
    if (this.dom.screenMathEscape) this.dom.screenMathEscape.classList.add('hidden');
    if (this.dom.mobileBurgerMenu) this.dom.mobileBurgerMenu.classList.add('hidden');
    this.dom.hud.classList.remove('hidden');
    if (this.dom.mobileControls) this.dom.mobileControls.classList.remove('hidden');
    if (this.dom.mobileAttack) this.dom.mobileAttack.classList.remove('hidden');
  }

  showMainMenu() {
    this.state = STATE.MENU;
    this.showScreen('menu');
  }

  startNewGame() {
    this.score = 0;
    this.lives = 3;
    this.currentLevelIndex = 1;
    this.loadLevel(this.currentLevelIndex);
    this.state = STATE.PLAYING;
    this.hideScreens();
    this.showToast("1-Bosqich: Xazina sari olg'a! 🏝️");
  }

  restartCurrentLevel() {
    this.score = this.levelStartScore;
    this.lives = 3;
    this.loadLevel(this.currentLevelIndex);
    this.state = STATE.PLAYING;
    this.hideScreens();
    this.showToast(`Bosqich ${this.currentLevelIndex} qayta boshlandi!`);
  }

  loadLevel(levelIndex) {
    this.currentLevelIndex = levelIndex;
    this.levelStartScore = this.score;
    this.hasKey = false;
    this.particles.clear();

    this.level = new Level(levelIndex);
    this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);
    this.escapeCooldown = 0;
    this.updateEscapeHUD();

    // Bosqich taymeri (xarita hajmiga qarab 85 - 150 soniya)
    const config = LEVEL_CONFIGS[levelIndex - 1];
    this.levelTimeLimit = (config && config.timeLimit) ? config.timeLimit : Math.round(Math.max(85, (this.level.cols + this.level.rows) * 2.8));
    this.levelTimer = this.levelTimeLimit;
    this.lastTickedSecond = Math.ceil(this.levelTimer);
    this.updateTimerHUD();

    // Kamera boshlang'ich pozitsiyasiga darhol keltirish (Orol markaziga to'g'irlash)
    const mapWidth = this.level.cols * TILE_SIZE;
    const mapHeight = this.level.rows * TILE_SIZE;

    if (this.camera.width >= mapWidth) {
      this.camera.x = (mapWidth - this.camera.width) / 2;
    } else {
      const targetCamX = this.player.x - this.camera.width / 2;
      const maxCamX = Math.max(0, mapWidth - this.camera.width);
      this.camera.x = Math.max(0, Math.min(targetCamX, maxCamX));
    }

    if (this.camera.height >= mapHeight) {
      this.camera.y = (mapHeight - this.camera.height) / 2;
    } else {
      const targetCamY = this.player.y - this.camera.height / 2;
      const maxCamY = Math.max(0, mapHeight - this.camera.height);
      this.camera.y = Math.max(0, Math.min(targetCamY, maxCamY));
    }

    this.updateHUD();
  }

  nextLevel() {
    if (this.currentLevelIndex < this.maxLevels) {
      this.currentLevelIndex++;
      this.loadLevel(this.currentLevelIndex);
      this.state = STATE.PLAYING;
      this.hideScreens();
      this.showToast(`${this.currentLevelIndex}-Bosqich: ${this.level.name}! 🌟`);
    } else {
      this.triggerVictory();
    }
  }

  triggerLevelClear() {
    this.state = STATE.LEVEL_CLEAR;
    this.sound.playChest();

    // Vaqt bonusi: har bir soniya uchun +5 ball!
    const timeBonus = Math.floor(this.levelTimer) * 5;
    this.score += timeBonus;

    const levelGained = this.score - this.levelStartScore;
    this.dom.levelClearScore.textContent = `+${levelGained - timeBonus}`;
    if (this.dom.levelClearTimeBonus) {
      this.dom.levelClearTimeBonus.textContent = `+${timeBonus} (${Math.floor(this.levelTimer)}s)`;
    }
    this.dom.levelClearTotalScore.textContent = this.score;

    this.checkHighScore();
    this.showScreen('levelClear');
  }

  triggerVictory() {
    this.state = STATE.VICTORY;
    this.sound.playChest();

    this.dom.victoryFinalScore.textContent = this.score;
    const isNew = this.checkHighScore();
    if (isNew) {
      this.dom.victoryNewRecord.classList.remove('hidden');
    } else {
      this.dom.victoryNewRecord.classList.add('hidden');
    }

    this.showScreen('victory');
  }

  triggerGameOver() {
    this.state = STATE.GAME_OVER;
    this.sound.playGameOver();

    this.dom.gameOverScore.textContent = this.score;
    this.checkHighScore();
    this.showScreen('gameOver');
  }

  checkHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('treasure_hunt_highscore', this.highScore);
      this.dom.menuHighscore.textContent = this.highScore;
      return true;
    }
    return false;
  }

  // Qahramon zararlanganda (dushmandan qochish imkoniyati)
  takeDamage(isTrap = false) {
    if (this.player.invincibleTimer > 0 || this.player.shieldTimer > 0) return;

    // Agar dushman hujum qilganda matematik qochish tayyor bo'lsa -> Favqulodda qochish imkoniyati!
    if (!isTrap && this.escapeCooldown <= 0 && this.state === STATE.PLAYING) {
      this.triggerMathEscape(true);
      return;
    }

    this.executePlayerDamage();
  }

  executePlayerDamage() {
    this.lives--;
    this.player.invincibleTimer = this.player.invincibleDuration;
    this.sound.playHit();
    this.particles.burst(this.player.getCenterX(), this.player.getCenterY(), '#e63946', 16, 140);
    this.updateHUD();

    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  // =========================================================================
  // BILIMDONLIK VA SAVOL-JAVOB TIZIMI (QUIZ & ESCAPE ENGINE)
  // Matematika, Ingliz tili va Geografiya savollari
  // =========================================================================

  cycleQuizCategory() {
    const list = ['ALL', 'MATH', 'ENGLISH', 'GEO'];
    const idx = list.indexOf(this.quizCategory);
    this.quizCategory = list[(idx + 1) % list.length];
    localStorage.setItem('treasure_quiz_category', this.quizCategory);
    this.updateQuizCategoryUI();

    const names = {
      ALL: "Aralash (🎲 Matematika, Ingliz tili, Geografiya)",
      MATH: "Faqat Matematika savollari (🔢)",
      ENGLISH: "Faqat Ingliz tili savollari (🇬🇧)",
      GEO: "Faqat Geografiya savollari (🌍)"
    };
    this.showToast(`Savollar tanlandi: ${names[this.quizCategory]}`, 2.0);
  }

  updateQuizCategoryUI() {
    const labels = {
      ALL: 'ARALASH 🎲',
      MATH: 'MATEMATIKA 🔢',
      ENGLISH: 'INGLIZ TILI 🇬🇧',
      GEO: 'GEOGRAFIYA 🌍'
    };
    const text = labels[this.quizCategory] || 'ARALASH 🎲';
    if (this.dom.menuQuizCategory) this.dom.menuQuizCategory.textContent = text;
    if (this.dom.pauseQuizCategory) this.dom.pauseQuizCategory.textContent = text;
  }

  // 1. INGLIZ TILIDAN ODDIY SAVOLLAR
  generateEnglishProblem() {
    const questions = [
      { q: "'Apple' so'zining tarjimasi qaysi?", a: "Olma", opts: ["Olma", "Nok", "Uzum", "Banan"] },
      { q: "'Water' so'zining ma'nosi nima?", a: "Suv", opts: ["Suv", "Non", "Sharbat", "Choy"] },
      { q: "'Book' so'zi qanday tarjima qilinadi?", a: "Kitob", opts: ["Kitob", "Daftar", "Qalam", "Maktab"] },
      { q: "'Cat' qaysi hayvonni bildiradi?", a: "Mushuk", opts: ["Mushuk", "Kuchuk", "Quyon", "Ot"] },
      { q: "'Dog' so'zining ma'nosi nima?", a: "Kuchuk", opts: ["Kuchuk", "Bo'ri", "Mushuk", "Tulki"] },
      { q: "'Sun' so'zining tarjimasi qaysi?", a: "Quyosh", opts: ["Quyosh", "Oy", "Yulduz", "Bulut"] },
      { q: "'Moon' so'zining ma'nosi nima?", a: "Oy", opts: ["Oy", "Quyosh", "Yer", "Yulduz"] },
      { q: "'School' so'zi nimani anglatadi?", a: "Maktab", opts: ["Maktab", "Bog'cha", "Kutubxona", "Xona"] },
      { q: "'Friend' so'zining ma'nosi nima?", a: "Do'st", opts: ["Do'st", "Dushman", "Qo'shni", "Aka"] },
      { q: "'Red' qaysi rangni bildiradi?", a: "Qizil", opts: ["Qizil", "Ko'k", "Yashil", "Sariq"] },
      { q: "'Blue' qaysi rang?", a: "Ko'k", opts: ["Ko'k", "Qizil", "Qora", "Oq"] },
      { q: "'Green' qaysi rang?", a: "Yashil", opts: ["Yashil", "Sariq", "Jigarrang", "Pushti"] },
      { q: "'Yellow' qaysi rang?", a: "Sariq", opts: ["Sariq", "Qizil", "Yashil", "Binafsha"] },
      { q: "'Black' qaysi rang?", a: "Qora", opts: ["Qora", "Oq", "Kulrang", "Ko'k"] },
      { q: "'White' qaysi rang?", a: "Oq", opts: ["Oq", "Qora", "Sariq", "Qizil"] },
      { q: "'Treasure' so'zi nimani bildiradi?", a: "Xazina", opts: ["Xazina", "Qaroqchi", "Kema", "Orol"] },
      { q: "'Ship' so'zining ma'nosi nima?", a: "Kema", opts: ["Kema", "Qayiq", "Samolyot", "Poyezd"] },
      { q: "'Key' so'zining tarjimasi qaysi?", a: "Kalit", opts: ["Kalit", "Qulf", "Eshik", "Sandiq"] },
      { q: "'Gold' so'zining ma'nosi nima?", a: "Oltin", opts: ["Oltin", "Kumush", "Temir", "Mis"] },
      { q: "'Sword' so'zi nimani anglatadi?", a: "Qilich", opts: ["Qilich", "Qalqon", "Kamon", "Nayza"] },
      { q: "'Pirate' so'zining ma'nosi nima?", a: "Qaroqchi", opts: ["Qaroqchi", "Dengizchi", "Kapitan", "Askari"] },
      { q: "'Island' so'zi qanday tarjima qilinadi?", a: "Orol", opts: ["Orol", "Dengiz", "Tog'", "Daryo"] },
      { q: "'Good morning' iborasining ma'nosi:", a: "Xayrli tong", opts: ["Xayrli tong", "Xayrli kun", "Xayrli kech", "Xayr"] },
      { q: "'Thank you' so'zi nimani bildiradi?", a: "Rahmat", opts: ["Rahmat", "Iltimos", "Salom", "Kechirasiz"] },
      { q: "'Hello' so'zining ma'nosi nima?", a: "Salom", opts: ["Salom", "Xayr", "Rahmat", "Ha"] },
      { q: "'Goodbye' so'zining tarjimasi qaysi?", a: "Xayr", opts: ["Xayr", "Salom", "Rahmat", "Kechirasiz"] },
      { q: "'How are you?' qanday tarjima qilinadi?", a: "Qandaysiz?", opts: ["Qandaysiz?", "Ismingiz nima?", "Qayerdansiz?", "Necha yoshdasiz?"] },
      { q: "'Family' so'zining ma'nosi nima?", a: "Oila", opts: ["Oila", "Sinf", "Do'stlar", "Odamlar"] },
      { q: "'Mother' so'zining tarjimasi qaysi?", a: "Ona", opts: ["Ona", "Opa", "Xola", "Buvi"] },
      { q: "'Father' so'zining ma'nosi qaysi?", a: "Ota", opts: ["Ota", "Aka", "Tog'a", "Bobo"] },
      { q: "'Boy' va 'Girl' so'zlarining ma'nosi:", a: "O'g'il va Qiz bola", opts: ["O'g'il va Qiz bola", "Aka va Singil", "Do'st va Dushman", "Ota va Ona"] },
      { q: "'Big' so'ziga qarama-qarshi (antonim) so'z:", a: "Small", opts: ["Small", "Fast", "Cold", "Good"] },
      { q: "'Hot' so'ziga qarama-qarshi so'z qaysi?", a: "Cold", opts: ["Cold", "Warm", "Dark", "Sweet"] },
      { q: "'Run' fe'lining ma'nosi nima?", a: "Yugurmoq", opts: ["Yugurmoq", "Yurmoq", "Sakramoq", "Uxlamoq"] },
      { q: "'Jump' fe'li qanday tarjima qilinadi?", a: "Sakramoq", opts: ["Sakramoq", "O'tirmoq", "Suzmoq", "Yozmoq"] },
      { q: "'One, Two, Three' bu qaysi sonlar?", a: "1, 2, 3", opts: ["1, 2, 3", "2, 3, 4", "10, 20, 30", "4, 5, 6"] },
      { q: "'Five' qaysi sonni bildiradi?", a: "5", opts: ["5", "4", "6", "15"] },
      { q: "'Ten' soni o'zbekchada nima?", a: "10", opts: ["10", "1", "100", "20"] }
    ];

    const item = questions[Math.floor(Math.random() * questions.length)];
    const shuffled = item.opts.slice().sort(() => Math.random() - 0.5);
    return {
      category: 'ENGLISH',
      categoryTag: '🇬🇧 INGLIZ TILI',
      categoryTitle: 'INGLIZ TILI SAVOLI!',
      question: item.q,
      options: shuffled,
      correctIndex: shuffled.indexOf(item.a),
      answer: item.a,
      isMathExpr: false
    };
  }

  // 2. GEOGRAFIYADAN OSON SAVOLLAR
  generateGeographyProblem() {
    const questions = [
      { q: "O'zbekistonning poytaxti qaysi shahar?", a: "Toshkent", opts: ["Toshkent", "Samarqand", "Buxoro", "Xiva"] },
      { q: "O'zbekiston qaysi qit'ada joylashgan?", a: "Osiyo", opts: ["Osiyo", "Yevropa", "Afrika", "Amerika"] },
      { q: "Fransiyaning poytaxti qaysi shahar?", a: "Parij", opts: ["Parij", "Lion", "Marsel", "Bordo"] },
      { q: "Turkiyaning poytaxti qaysi shahar?", a: "Anqara", opts: ["Anqara", "Istanbul", "Izmir", "Antaliya"] },
      { q: "Rossiyaning poytaxti qaysi shahar?", a: "Moskva", opts: ["Moskva", "Sankt-Peterburg", "Qozon", "Sochi"] },
      { q: "Buyuk Britaniyaning poytaxti qaysi?", a: "London", opts: ["London", "Liverpul", "Manchester", "Edinburg"] },
      { q: "AQSH (Amerika) poytaxti qaysi shahar?", a: "Vashington", opts: ["Vashington", "Nyu-York", "Chikago", "Los-Anjeles"] },
      { q: "Germaniyaning poytaxti qaysi shahar?", a: "Berlin", opts: ["Berlin", "Myunxen", "Frankfurt", "Gamburg"] },
      { q: "Italiyaning poytaxti qaysi shahar?", a: "Rim", opts: ["Rim", "Milan", "Venetsiya", "Neapol"] },
      { q: "Ispaniyaning poytaxti qaysi shahar?", a: "Madrid", opts: ["Madrid", "Barselona", "Valensiya", "Sevilya"] },
      { q: "Yaponiyaning poytaxti qaysi shahar?", a: "Tokio", opts: ["Tokio", "Kioto", "Osaka", "Xirosima"] },
      { q: "Xitoyning poytaxti qaysi shahar?", a: "Pekin", opts: ["Pekin", "Shanxay", "Guanjou", "Gonkong"] },
      { q: "Qozog'istonning poytaxti qaysi shahar?", a: "Ostona", opts: ["Ostona", "Olmaota", "Chimkent", "Aqtau"] },
      { q: "Tojikistonning poytaxti qaysi shahar?", a: "Dushanbe", opts: ["Dushanbe", "Xo'jand", "Ko'lob", "Boxtar"] },
      { q: "Qirg'izistonning poytaxti qaysi shahar?", a: "Bishkek", opts: ["Bishkek", "O'sh", "Jalolobod", "Norin"] },
      { q: "Misr (Yegipet) poytaxti qaysi shahar?", a: "Qohira", opts: ["Qohira", "Iskandariya", "Giza", "Luvsor"] },
      { q: "Dunyoning eng katta okeani qaysi?", a: "Tinch okeani", opts: ["Tinch okeani", "Atlantika okeani", "Hind okeani", "Shimoliy Muz"] },
      { q: "Dunyodagi eng uzun daryolardan biri qaysi?", a: "Nil daryosi", opts: ["Nil daryosi", "Volga", "Dunay", "Amudaryo"] },
      { q: "Dunyoning eng baland cho'qqisi qaysi?", a: "Everest (Jomolungma)", opts: ["Everest (Jomolungma)", "Monblan", "Elbrus", "K2"] },
      { q: "Orol dengizi qaysi davlatlar chegarasida?", a: "O'zbekiston va Qozog'iston", opts: ["O'zbekiston va Qozog'iston", "Turkmaniston va Rossiya", "Xitoy va Qirg'iziston", "Eron va Afg'oniston"] },
      { q: "Quyosh qaysi tomondan chiqadi?", a: "Sharqdan", opts: ["Sharqdan", "G'arbdan", "Shimoldan", "Janubdan"] },
      { q: "Dunyodagi eng sovuq qit'a qaysi?", a: "Antarktida", opts: ["Antarktida", "Afrika", "Avstraliya", "Yevropa"] },
      { q: "Eng kichik qit'a qaysi?", a: "Avstraliya", opts: ["Avstraliya", "Yevropa", "Afrika", "Janubiy Amerika"] },
      { q: "O'zbekistondagi eng yirik ikki daryo:", a: "Amudaryo va Sirdaryo", opts: ["Amudaryo va Sirdaryo", "Nil va Amazonka", "Volga va Dunay", "Tigris va Furot"] },
      { q: "Amir Temur poytaxti bo'lgan tarixiy shahar:", a: "Samarqand", opts: ["Samarqand", "Xiva", "Qo'qon", "Termiz"] },
      { q: "Afrikaning eng katta sahrosi qaysi?", a: "Saxroi Kabir (Sahara)", opts: ["Saxroi Kabir (Sahara)", "Qizilqum", "Qoraqum", "Gobi"] },
      { q: "Piramidalar (ehromlar) vatani qaysi davlat?", a: "Misr", opts: ["Misr", "Gretsiya", "Braziliya", "Meksika"] },
      { q: "Yer sharida nechta asosiy okean bor?", a: "4 ta", opts: ["4 ta", "2 ta", "7 ta", "10 ta"] }
    ];

    const item = questions[Math.floor(Math.random() * questions.length)];
    const shuffled = item.opts.slice().sort(() => Math.random() - 0.5);
    return {
      category: 'GEO',
      categoryTag: '🌍 GEOGRAFIYA',
      categoryTitle: 'GEOGRAFIYA SAVOLI!',
      question: item.q,
      options: shuffled,
      correctIndex: shuffled.indexOf(item.a),
      answer: item.a,
      isMathExpr: false
    };
  }

  // 3. MATEMATIK HISOB-KITOB VA SAVOLLAR
  generateMathProblem() {
    // 25% ehtimollik bilan oson mantiqiy-matematik savollar
    if (Math.random() < 0.25) {
      const trivia = [
        { q: "Uchburchakning nechta tomoni bor?", a: "3 ta", opts: ["3 ta", "4 ta", "5 ta", "2 ta"] },
        { q: "To'g'ri to'rtburchakning nechta burchagi bor?", a: "4 ta", opts: ["4 ta", "3 ta", "5 ta", "6 ta"] },
        { q: "Bir soatda necha daqiqa bor?", a: "60 daqiqa", opts: ["60 daqiqa", "100 daqiqa", "30 daqiqa", "45 daqiqa"] },
        { q: "Bir sutkada necha soat bor?", a: "24 soat", opts: ["24 soat", "12 soat", "36 soat", "48 soat"] },
        { q: "1 metrda necha santimetr bor?", a: "100 sm", opts: ["100 sm", "10 sm", "1000 sm", "50 sm"] },
        { q: "1 kilogrammda necha gramm bor?", a: "1000 g", opts: ["1000 g", "100 g", "500 g", "10 g"] },
        { q: "Bir haftada necha kun bor?", a: "7 kun", opts: ["7 kun", "5 kun", "6 kun", "8 kun"] },
        { q: "Bir yilda necha oy bor?", a: "12 oy", opts: ["12 oy", "10 oy", "11 oy", "14 oy"] },
        { q: "Qaysi son toq son hisoblanadi?", a: "15", opts: ["15", "12", "20", "28"] },
        { q: "5 ning kvadrati nechiga teng? (5 × 5)", a: "25", opts: ["25", "20", "15", "30"] },
        { q: "10 ning yarmi (10 ÷ 2) nechiga teng?", a: "5", opts: ["5", "4", "6", "2"] }
      ];
      const item = trivia[Math.floor(Math.random() * trivia.length)];
      const shuffled = item.opts.slice().sort(() => Math.random() - 0.5);
      return {
        category: 'MATH',
        categoryTag: '🔢 MATEMATIKA',
        categoryTitle: 'MATEMATIK SAVOL!',
        question: item.q,
        options: shuffled,
        correctIndex: shuffled.indexOf(item.a),
        answer: item.a,
        isMathExpr: false
      };
    }

    const level = this.currentLevelIndex || 1;
    let num1, num2, answer, question;

    if (level <= 2) {
      // 1-2 bosqich: Oson qo'shish va ayirish
      const isAdd = Math.random() > 0.45;
      if (isAdd) {
        num1 = Math.floor(Math.random() * 20) + 5;
        num2 = Math.floor(Math.random() * 18) + 4;
        answer = num1 + num2;
        question = `${num1} + ${num2} = ?`;
      } else {
        num1 = Math.floor(Math.random() * 25) + 16;
        num2 = Math.floor(Math.random() * (num1 - 6)) + 4;
        answer = num1 - num2;
        question = `${num1} - ${num2} = ?`;
      }
    } else if (level <= 5) {
      // 3-5 bosqich: Karra jadvali va bo'lish
      const r = Math.random();
      if (r < 0.5) {
        num1 = Math.floor(Math.random() * 8) + 2;
        num2 = Math.floor(Math.random() * 8) + 2;
        answer = num1 * num2;
        question = `${num1} × ${num2} = ?`;
      } else if (r < 0.8) {
        num2 = Math.floor(Math.random() * 7) + 2;
        answer = Math.floor(Math.random() * 8) + 2;
        num1 = answer * num2;
        question = `${num1} ÷ ${num2} = ?`;
      } else {
        num1 = Math.floor(Math.random() * 35) + 20;
        num2 = Math.floor(Math.random() * 25) + 10;
        answer = num1 + num2;
        question = `${num1} + ${num2} = ?`;
      }
    } else {
      // 6-10 bosqich: Tezkor hisob-kitob
      const r = Math.random();
      if (r < 0.5) {
        num1 = Math.floor(Math.random() * 8) + 4;
        num2 = Math.floor(Math.random() * 8) + 3;
        answer = num1 * num2;
        question = `${num1} × ${num2} = ?`;
      } else if (r < 0.8) {
        const a = Math.floor(Math.random() * 6) + 2;
        const b = Math.floor(Math.random() * 6) + 2;
        const c = Math.floor(Math.random() * 15) + 5;
        answer = a * b + c;
        question = `(${a} × ${b}) + ${c} = ?`;
      } else {
        num1 = Math.floor(Math.random() * 50) + 35;
        num2 = Math.floor(Math.random() * 30) + 15;
        answer = num1 - num2;
        question = `${num1} - ${num2} = ?`;
      }
    }

    // 4 ta variant (1 to'g'ri, 3 ta chalg'ituvchi)
    const options = new Set([answer]);
    while (options.size < 4) {
      let offset = (Math.floor(Math.random() * 7) + 1) * (Math.random() > 0.5 ? 1 : -1);
      if (Math.random() > 0.6) {
        offset = (Math.random() > 0.5 ? 10 : -10);
      }
      const fake = answer + offset;
      if (fake > 0 && fake !== answer) {
        options.add(fake);
      }
    }

    const shuffled = Array.from(options).sort(() => Math.random() - 0.5);
    const correctIndex = shuffled.indexOf(answer);

    return {
      category: 'MATH',
      categoryTag: '🔢 MATEMATIKA',
      categoryTitle: 'MATEMATIK HISOB!',
      question,
      options: shuffled,
      correctIndex,
      answer,
      isMathExpr: true
    };
  }

  // Tanlangan fanga qarab savolni hosil qilish
  generateQuizQuestion() {
    let mode = this.quizCategory;
    if (mode === 'ALL') {
      const cats = ['MATH', 'ENGLISH', 'GEO'];
      mode = cats[Math.floor(Math.random() * cats.length)];
    }

    if (mode === 'ENGLISH') {
      return this.generateEnglishProblem();
    } else if (mode === 'GEO') {
      return this.generateGeographyProblem();
    } else {
      return this.generateMathProblem();
    }
  }

  triggerMathEscape(isEmergency = false) {
    if (this.state !== STATE.PLAYING) return;
    if (!isEmergency && this.escapeCooldown > 0) {
      this.showToast(`Qochish tayyor emas! (${Math.ceil(this.escapeCooldown)}s)`, 1.2);
      return;
    }

    this.state = STATE.MATH_ESCAPE;
    this.isEmergencyEscape = isEmergency;
    this.mathEscapeTimer = this.mathEscapeDuration;
    this.activeMathProblem = this.generateQuizQuestion();

    // DOM yangilash
    if (this.dom.mathEquation) {
      this.dom.mathEquation.textContent = this.activeMathProblem.question;
      if (this.activeMathProblem.isMathExpr) {
        this.dom.mathEquation.classList.add('math-equation-large');
      } else {
        this.dom.mathEquation.classList.remove('math-equation-large');
      }
    }

    if (this.dom.quizCategoryTag) {
      this.dom.quizCategoryTag.textContent = this.activeMathProblem.categoryTag || '🎲 ARALASH';
    }

    if (this.dom.mathModalTitle) {
      this.dom.mathModalTitle.textContent = this.activeMathProblem.categoryTitle || 'TEZKOR SAVOL-JAVOB!';
    }

    const descEl = document.getElementById('math-prompt-desc');
    if (descEl) {
      descEl.textContent = isEmergency
        ? "⚠️ DUSHMAN HUJUMI! Qochish uchun to'g'ri javobni tanlang!"
        : "💡 TEZKOR QOCHISH: To'g'ri javob berib dushmandan qoching!";
    }

    if (this.dom.mathOptions) {
      this.dom.mathOptions.innerHTML = '';
      this.activeMathProblem.options.forEach((val, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-math-opt';
        btn.innerHTML = `<span class="opt-num">[${idx + 1}]</span> <span class="opt-val">${val}</span>`;
        btn.addEventListener('click', () => {
          this.sound.init();
          this.handleMathAnswer(idx);
        });
        this.dom.mathOptions.appendChild(btn);
      });
    }

    if (this.dom.mathTimerBar) {
      this.dom.mathTimerBar.style.width = '100%';
    }

    if (this.dom.screenMathEscape) {
      this.dom.screenMathEscape.classList.remove('hidden');
    }

    this.sound.playMathPrompt();
  }

  handleMathAnswer(chosenIndex) {
    if (this.state !== STATE.MATH_ESCAPE) return;

    const isCorrect = this.activeMathProblem && chosenIndex === this.activeMathProblem.correctIndex;

    // Ekranni yashirish va o'yinni davom ettirish
    if (this.dom.screenMathEscape) {
      this.dom.screenMathEscape.classList.add('hidden');
    }
    this.state = STATE.PLAYING;
    this.escapeCooldown = this.maxEscapeCooldown;
    this.updateEscapeHUD();

    if (isCorrect) {
      // G'ALABA: Tutun bombasi, stun, sprint va qalqon!
      this.sound.playMathSuccess();
      this.sound.playSmokeBomb();

      this.score += 100;
      this.levelTimer = Math.min(this.levelTimeLimit + 30, this.levelTimer + 15); // +15s bonus vaqt!
      this.updateTimerHUD();
      this.player.sprintTimer = 4.5; // +80% tezlik!
      this.player.invincibleTimer = 3.5; // 3.5 soniya himoya!

      // Barcha dushmanlarni 4.5 soniyaga karaxt (stun) qilish
      if (this.level && this.level.enemies) {
        this.level.enemies.forEach(e => {
          e.stunTimer = 4.5;
          e.isAlerted = false;
          e.alertTimer = 0;
        });
      }

      // Qalin tutun buluti portlashi
      this.particles.smoke(this.player.getCenterX(), this.player.getCenterY(), 35);
      this.updateHUD();
      this.showToast("Ajoyib bilim! +15s vaqt bonusi va dushmanlar karaxt bo'ldi! 💨 💡 ⏱️", 2.6);
    } else {
      // XATO YOKI VAQT TUGADI
      this.sound.playMathFail();
      const correctAns = (this.activeMathProblem && this.activeMathProblem.options && this.activeMathProblem.correctIndex >= 0)
        ? this.activeMathProblem.options[this.activeMathProblem.correctIndex]
        : '';

      if (this.isEmergencyEscape) {
        this.executePlayerDamage();
        this.showToast(`Javob xato! To'g'ri javob: "${correctAns}". Dushmandan qochib bo'lmadi! 💔`, 2.5);
      } else {
        this.showToast(`Javob xato! To'g'ri javob: "${correctAns}". Qochish amalga oshmadi! ⚠️`, 2.5);
      }
    }
  }

  updateMathEscape(dt) {
    this.mathEscapeTimer -= dt;
    if (this.dom.mathTimerBar) {
      const pct = Math.max(0, (this.mathEscapeTimer / this.mathEscapeDuration) * 100);
      this.dom.mathTimerBar.style.width = `${pct}%`;
    }

    if (this.mathEscapeTimer <= 0) {
      this.handleMathAnswer(-1); // Vaqt tugadi -> xato
    }
  }

  updateEscapeHUD() {
    const isReady = this.escapeCooldown <= 0;
    if (this.dom.btnHudEscape) {
      if (isReady) {
        this.dom.btnHudEscape.textContent = '⚡ QOCHISH [Q]';
        this.dom.btnHudEscape.classList.add('ready');
        this.dom.btnHudEscape.classList.remove('cooldown');
      } else {
        this.dom.btnHudEscape.textContent = `⏳ ${Math.ceil(this.escapeCooldown)}s`;
        this.dom.btnHudEscape.classList.remove('ready');
        this.dom.btnHudEscape.classList.add('cooldown');
      }
    }

    if (this.dom.btnEscapeMobile) {
      if (isReady) {
        this.dom.btnEscapeMobile.classList.remove('cooldown');
        this.dom.btnEscapeMobile.classList.add('ready');
        if (this.dom.escapeBtnCooldown) {
          this.dom.escapeBtnCooldown.textContent = '';
        }
      } else {
        this.dom.btnEscapeMobile.classList.add('cooldown');
        this.dom.btnEscapeMobile.classList.remove('ready');
        if (this.dom.escapeBtnCooldown) {
          this.dom.escapeBtnCooldown.textContent = `${Math.ceil(this.escapeCooldown)}s`;
        }
      }
    }
  }

  // HUD elementlarini yangilash
  updateHUD() {
    // Yuraklar
    let heartsStr = '';
    for (let i = 0; i < this.lives; i++) {
      heartsStr += '❤️';
    }
    for (let i = this.lives; i < 3; i++) {
      heartsStr += '🖤';
    }
    this.dom.hudHearts.textContent = heartsStr;

    // Ball va bosqich
    this.dom.hudScore.textContent = this.score;
    this.dom.hudLevel.textContent = `${this.currentLevelIndex}/${this.maxLevels}`;
    if (this.dom.hudLevelName && this.level) {
      this.dom.hudLevelName.textContent = this.level.name;
    }

    // Kalit indikatori
    if (this.hasKey) {
      this.dom.hudKey.classList.remove('uncollected');
      this.dom.hudKey.classList.add('collected');
    } else {
      this.dom.hudKey.classList.remove('collected');
      this.dom.hudKey.classList.add('uncollected');
    }

    // Bosqich taymerini yangilash
    this.updateTimerHUD();
  }

  // =========================================================================
  // BOSQICH TIMERI METODLARI (LEVEL COUNTDOWN TIMER)
  // =========================================================================

  formatTime(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  updateTimerHUD() {
    const timeStr = this.formatTime(this.levelTimer);
    if (this.dom.hudTimer) this.dom.hudTimer.textContent = timeStr;
    if (this.dom.burgerStatTimer) this.dom.burgerStatTimer.textContent = timeStr;

    if (this.dom.timerBox) {
      if (this.levelTimer <= 7) {
        this.dom.timerBox.classList.add('danger');
        this.dom.timerBox.classList.remove('warning');
      } else if (this.levelTimer <= 20) {
        this.dom.timerBox.classList.add('warning');
        this.dom.timerBox.classList.remove('danger');
      } else {
        this.dom.timerBox.classList.remove('danger', 'warning');
      }
    }
  }

  handleTimeUp() {
    this.sound.playTimeUp();
    this.lives--;
    this.updateHUD();
    if (this.lives <= 0) {
      this.triggerGameOver();
      this.showToast("⏰ VAQT TUGADI! Mag'lub bo'ldingiz! 💀", 3.0);
    } else {
      const remainingLives = this.lives;
      this.loadLevel(this.currentLevelIndex);
      this.lives = remainingLives;
      this.updateHUD();
      this.state = STATE.PLAYING;
      this.hideScreens();
      this.showToast(`⏰ VAQT TUGADI! 1 ta hayot yo'qotildi. Qayta urinish! (${this.lives} ta hayot qoldi) 💔`, 3.0);
    }
  }

  // Ishora tizimi: Kompas va Issiq-Sovuq detektori
  updateCompass() {
    if (!this.player || !this.level) return;

    // Nishonni aniqlash: agar kalit topilmagan bo'lsa -> Kalit, agar topilgan bo'lsa -> Sandiq!
    let targetX = 0;
    let targetY = 0;
    let targetName = '';

    if (!this.hasKey && this.level.keyItem && !this.level.keyItem.collected) {
      targetX = this.level.keyItem.x;
      targetY = this.level.keyItem.y;
      targetName = 'Kalit';
    } else if (this.level.chest) {
      targetX = this.level.chest.x + TILE_SIZE / 2;
      targetY = this.level.chest.y + TILE_SIZE / 2;
      targetName = 'Sandiq';
    }

    const pX = this.player.getCenterX();
    const pY = this.player.getCenterY();

    const dx = targetX - pX;
    const dy = targetY - pY;
    const distance = Math.hypot(dx, dy);
    const distTiles = Math.round(distance / TILE_SIZE);

    // Kompas strelkasining burchagi
    const angleRad = Math.atan2(dy, dx);
    const angleDeg = Math.round(angleRad * (180 / Math.PI));
    this.dom.compassNeedle.style.transform = `rotate(${angleDeg + 90}deg)`;

    // Masofa holati: Sovuq, Iliq, Issiq, Qaynoq
    const box = this.dom.compassBox;
    box.classList.remove('cold', 'warm', 'hot', 'boiling');

    let heatLabel = '';
    if (distTiles > 12) {
      box.classList.add('cold');
      heatLabel = 'Muzdek ❄️';
    } else if (distTiles > 7) {
      box.classList.add('warm');
      heatLabel = 'Iliq 🌤️';
    } else if (distTiles > 3) {
      box.classList.add('hot');
      heatLabel = 'Issiq! 🔥';
    } else {
      box.classList.add('boiling');
      heatLabel = 'Qaynoq!! 💥';
    }

    this.dom.compassText.textContent = `${targetName}: ${distTiles}m (${heatLabel})`;
  }

  // =========================================================================
  // ASOSIY SIKL: UPDATE VA DRAW
  // =========================================================================

  update(dt) {
    if (this.state === STATE.MATH_ESCAPE) {
      this.updateMathEscape(dt);
      return;
    }

    if (this.state !== STATE.PLAYING) return;

    // Bosqich taymerini kamaytirish
    this.levelTimer -= dt;
    if (this.levelTimer <= 0) {
      this.levelTimer = 0;
      this.updateTimerHUD();
      this.handleTimeUp();
      return;
    }
    if (this.levelTimer <= 7) {
      const curSec = Math.floor(this.levelTimer);
      if (curSec !== this.lastTickedSecond) {
        this.lastTickedSecond = curSec;
        this.sound.playTick();
      }
    }
    this.updateTimerHUD();

    // Qochish qobiliyatini yangilash
    if (this.escapeCooldown > 0) {
      this.escapeCooldown -= dt;
      if (this.escapeCooldown <= 0) {
        this.escapeCooldown = 0;
      }
      this.updateEscapeHUD();
    }

    // Toast bildirishnomasi vaqtini kamaytirish
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) {
        this.dom.toast.classList.add('hidden');
      }
    }

    // 1. Qahramon va Xarita yangilanishi
    this.player.update(dt, this.input, this.level);
    this.level.update(dt, this);
    this.particles.update(dt);

    // 2. Kamera qahramonni kuzatishi
    const mapWidth = this.level.cols * TILE_SIZE;
    const mapHeight = this.level.rows * TILE_SIZE;
    this.camera.update(this.player.getCenterX(), this.player.getCenterY(), mapWidth, mapHeight);

    // 3. Ishora va kompasni yangilash
    this.updateCompass();

    // 4. Dushmanlar harakati va to'qnashuvi
    const pBox = {
      x: this.player.x + 6,
      y: this.player.y + 8,
      w: this.player.width - 12,
      h: this.player.height - 10
    };

    // Tirik dushmanlarni yangilash va o'lganlarni tozalash
    this.level.enemies = this.level.enemies.filter(e => e.hp > 0);

    for (const enemy of this.level.enemies) {
      enemy.update(dt, this.player, this.level, this);

      // Faqat tirik dushman o'yinchiga zarar yetkazadi
      if (enemy.hp > 0) {
        const eBox = {
          x: enemy.x + 4,
          y: enemy.y + 4,
          w: enemy.width - 8,
          h: enemy.height - 8
        };

        if (this.checkAABB(pBox, eBox)) {
          this.takeDamage();
        }
      }
    }

    // 5. Tuzoqlar bilan to'qnashuv
    for (const trap of this.level.traps) {
      if (trap.isActive) {
        const tBox = {
          x: trap.x + 8,
          y: trap.y + 8,
          w: trap.width - 16,
          h: trap.height - 16
        };
        if (this.checkAABB(pBox, tBox)) {
          this.sound.playTrap();
          this.takeDamage(true);
        }
      }
    }

    // 5.5. Qal'a to'plaridan otilgan yadrolar bilan to'qnashuv
    for (const p of this.level.projectiles) {
      if (p.alive) {
        const dist = Math.hypot(this.player.getCenterX() - p.x, this.player.getCenterY() - p.y);
        if (dist < p.radius + 12) {
          p.alive = false;
          this.particles.burst(p.x, p.y, '#e63946', 16, 140);
          this.takeDamage();
        }
      }
    }

    // 6. Yig'iladigan narsalar bilan to'qnashuv
    for (const item of this.level.collectibles) {
      if (!item.collected) {
        const dist = Math.hypot(this.player.getCenterX() - item.x, this.player.getCenterY() - item.y);
        if (dist < item.radius + 14) {
          item.collected = true;
          if (item.type === 'coin') {
            this.score += 10;
            this.sound.playCoin();
            this.particles.burst(item.x, item.y, '#ffd700', 10, 100);
          } else if (item.type === 'gem') {
            this.score += 50;
            this.sound.playGem();
            this.particles.burst(item.x, item.y, '#2ecc71', 16, 130);
          } else if (item.type === 'heart') {
            this.score += 25;
            if (this.lives < 4) {
              this.lives++;
              this.sound.playHeal();
              this.particles.burst(item.x, item.y, '#ff2a55', 20, 140);
              this.showToast('❤️ Hayot tiklandi!', 1.8);
            }
          } else if (item.type === 'shield') {
            this.score += 50;
            this.player.shieldTimer = 6.0;
            this.sound.playShield();
            this.particles.burst(item.x, item.y, '#00d2d3', 25, 160);
            this.showToast('🛡️ 6 soniya daxlsizlik!', 2.2);
          }
          this.updateHUD();
        }
      }
    }

    // 7. Kalit bilan to'qnashuv
    if (this.level.keyItem && !this.level.keyItem.collected) {
      const dist = Math.hypot(this.player.getCenterX() - this.level.keyItem.x, this.player.getCenterY() - this.level.keyItem.y);
      if (dist < this.level.keyItem.radius + 16) {
        this.level.keyItem.collected = true;
        this.hasKey = true;
        this.score += 100;
        this.sound.playKey();
        this.particles.burst(this.level.keyItem.x, this.level.keyItem.y, '#ffd700', 24, 160);
        this.showToast('Oltin Kalit topildi! Endi Sandiqqa boring! 🔑', 3);
        this.updateHUD();
      }
    }

    // 8. Sandiq bilan to'qnashuv
    if (this.level.chest) {
      const chestBox = {
        x: this.level.chest.x + 4,
        y: this.level.chest.y + 8,
        w: this.level.chest.width - 8,
        h: this.level.chest.height - 12
      };

      if (this.checkAABB(pBox, chestBox)) {
        if (this.hasKey && !this.level.chest.isOpen) {
          this.level.chest.open();
          this.score += 300;
          this.particles.burst(
            this.level.chest.x + TILE_SIZE / 2,
            this.level.chest.y + TILE_SIZE / 2,
            '#ffd700',
            35,
            200
          );
          this.updateHUD();

          // Kichik pauzadan so'ng bosqich yakunlash yoki g'alaba ekrani
          setTimeout(() => {
            if (this.currentLevelIndex >= this.maxLevels) {
              this.triggerVictory();
            } else {
              this.triggerLevelClear();
            }
          }, 800);
        } else if (!this.hasKey && !this.level.chest.isOpen) {
          this.showToast('Sandiq qulflangan! Avval kalitni toping! 🔒', 1.5);
        }
      }
    }
  }

  // AABB to'qnashuv tekshiruvi (Axis-Aligned Bounding Box)
  checkAABB(boxA, boxB) {
    return (
      boxA.x < boxB.x + boxB.w &&
      boxA.x + boxA.w > boxB.x &&
      boxA.y < boxB.y + boxB.h &&
      boxA.y + boxA.h > boxB.y
    );
  }

  draw() {
    this.ctx.save();
    if (this.dpr && this.dpr !== 1) {
      this.ctx.scale(this.dpr, this.dpr);
    }
    this.ctx.clearRect(0, 0, this.canvas.width / (this.dpr || 1), this.canvas.height / (this.dpr || 1));

    if (this.level) {
      // Xarita va zamin
      this.level.draw(this.ctx, this.camera);

      const camX1 = this.camera.x - 48;
      const camX2 = this.camera.x + this.camera.width + 48;
      const camY1 = this.camera.y - 48;
      const camY2 = this.camera.y + this.camera.height + 48;

      // Dushmanlar (faqat ekranda ko'rinib turganlari chiziladi - 60 FPS)
      for (const enemy of this.level.enemies) {
        if (enemy.x + enemy.width >= camX1 && enemy.x <= camX2 && enemy.y + enemy.height >= camY1 && enemy.y <= camY2) {
          enemy.draw(this.ctx, this.camera);
        }
      }

      // Qahramon
      if (this.player) {
        this.player.draw(this.ctx, this.camera);
      }

      // Partikllar
      this.particles.draw(this.ctx, this.camera);
    }

    this.ctx.restore();
  }

  gameLoop(time) {
    if (!this.lastTime) this.lastTime = time;
    let dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Kuchsiz kompyuterlarda sakrashlarni oldini olish uchun dt cheklovi
    if (dt > 0.033) dt = 0.033;

    this.update(dt);
    this.draw();

    requestAnimationFrame((t) => this.gameLoop(t));
  }
}

// Sahifa to'liq yuklangandan so'ng o'yinni ishga tushirish
window.addEventListener('DOMContentLoaded', () => {
  window.treasureGame = new Game();
});

