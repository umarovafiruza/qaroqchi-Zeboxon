const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'script.js');
let code = fs.readFileSync(scriptPath, 'utf8');

// 1. STATE enum
const oldState = `const STATE = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY'
};`;

const newState = `const STATE = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  MATH_ESCAPE: 'MATH_ESCAPE',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
  GAME_OVER: 'GAME_OVER',
  VICTORY: 'VICTORY'
};`;

if (!code.includes(oldState)) {
  console.error("oldState not found!");
  process.exit(1);
}
code = code.replace(oldState, newState);

// 2. SoundManager additions
const oldSoundEnd = `  // Qahramon zarba olgandagi ovoz
  playHit() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.26);
  }`;

const newSoundEnd = `  // O'yinchi zarba olgandagi ovoz
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
  }`;

if (!code.includes(oldSoundEnd)) {
  console.error("oldSoundEnd not found!");
  process.exit(1);
}
code = code.replace(oldSoundEnd, newSoundEnd);

// 3. ParticleSystem.smoke
const oldParticleClear = `  clear() {
    this.particles = [];
  }`;

const newParticleClear = `  // Tutun bombasi effekti (qochish paytidagi qalin tutun buluti)
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
  }`;

if (!code.includes(oldParticleClear)) {
  console.error("oldParticleClear not found!");
  process.exit(1);
}
code = code.replace(oldParticleClear, newParticleClear);

// 4. InputHandler additions (KeyQ, Shift, Digit1-4) and touch controls
const oldInputKeydown = `      } else if (e.code === 'KeyF') {
        this.game.toggleFullscreen();
        e.preventDefault();
      } else if (e.code === 'Space' || e.code === 'KeyJ' || e.code === 'KeyZ' || e.code === 'KeyE') {
        this.keys.attack = true;
        if (this.game.player) {
          this.game.player.attack(this.game);
        }
        e.preventDefault();
      }
    });`;

const newInputKeydown = `      } else if (e.code === 'KeyF') {
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
    });`;

if (!code.includes(oldInputKeydown)) {
  console.error("oldInputKeydown not found!");
  process.exit(1);
}
code = code.replace(oldInputKeydown, newInputKeydown);

// In setupTouchControls: add btn-escape
const oldTouchControls = `    // Mobil qilich (hujum) tugmasi
    const attackBtn = document.getElementById('btn-attack');`;

const newTouchControls = `    // Mobil qochish (matematik) tugmasi
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
    const attackBtn = document.getElementById('btn-attack');`;

if (!code.includes(oldTouchControls)) {
  console.error("oldTouchControls not found!");
  process.exit(1);
}
code = code.replace(oldTouchControls, newTouchControls);

// 5. Player: sprintTimer and speed boost
const oldPlayerCtor = `    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 0.22;
    this.attackCooldown = 0;
    this.hasHitThisSwing = new Set();
  }`;

const newPlayerCtor = `    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 0.22;
    this.attackCooldown = 0;
    this.hasHitThisSwing = new Set();

    // Tezkor sprint qochish (Matematik qochish natijasida)
    this.sprintTimer = 0;
  }`;

if (!code.includes(oldPlayerCtor)) {
  console.error("oldPlayerCtor not found!");
  process.exit(1);
}
code = code.replace(oldPlayerCtor, newPlayerCtor);

const oldPlayerMove = `    // Harakatni X va Y o'qi bo'yicha alohida tekshirish (devor bo'ylab silliq sirg'alish)
    const moveX = dx * this.speed * dt;
    const moveY = dy * this.speed * dt;`;

const newPlayerMove = `    // Tezkor sprint qochish vaqtini yangilash (+80% tezlik)
    let speedMult = 1.0;
    if (this.sprintTimer > 0) {
      this.sprintTimer -= dt;
      speedMult = 1.8;
    }
    const currentSpeed = this.speed * speedMult;

    // Harakatni X va Y o'qi bo'yicha alohida tekshirish (devor bo'ylab silliq sirg'alish)
    const moveX = dx * currentSpeed * dt;
    const moveY = dy * currentSpeed * dt;`;

if (!code.includes(oldPlayerMove)) {
  console.error("oldPlayerMove not found!");
  process.exit(1);
}
code = code.replace(oldPlayerMove, newPlayerMove);

// In Player.draw, add sprint effect
const oldPlayerDrawEnd = `      ctx.fillStyle = '#7f8c8d';
      ctx.fillRect(-15, 1, 4, 3);
    }

    ctx.restore();
  }`;

const newPlayerDrawEnd = `      ctx.fillStyle = '#7f8c8d';
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
  }`;

if (!code.includes(oldPlayerDrawEnd)) {
  console.error("oldPlayerDrawEnd not found!");
  process.exit(1);
}
code = code.replace(oldPlayerDrawEnd, newPlayerDrawEnd);

// 6. Enemy: stunTimer
const oldEnemyCtor = `    // Sezish va hujum tizimi (Detection & Alert mechanic)
    this.isAlerted = false;
    this.alertTimer = 0;
    this.alertAnimTimer = 0;`;

const newEnemyCtor = `    // Sezish va hujum tizimi (Detection & Alert mechanic)
    this.isAlerted = false;
    this.alertTimer = 0;
    this.alertAnimTimer = 0;
    this.stunTimer = 0; // Matematik qochish tufayli karaxt (stun) holati`;

if (!code.includes(oldEnemyCtor)) {
  console.error("oldEnemyCtor not found!");
  process.exit(1);
}
code = code.replace(oldEnemyCtor, newEnemyCtor);

const oldEnemyUpdate = `  update(dt, player, level, game) {
    this.animTimer += dt * (this.isAlerted ? 9 : 5);`;

const newEnemyUpdate = `  update(dt, player, level, game) {
    // Agar dushman matematik qochish tufayli karaxt (stun) holatida bo'lsa
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.isAlerted = false;
      this.alertTimer = 0;
      return; // Harakat qilmaydi va hujum qila olmaydi!
    }

    this.animTimer += dt * (this.isAlerted ? 9 : 5);`;

if (!code.includes(oldEnemyUpdate)) {
  console.error("oldEnemyUpdate not found!");
  process.exit(1);
}
code = code.replace(oldEnemyUpdate, newEnemyUpdate);

// In Enemy.draw, draw spinning stars when stunned
const oldEnemyDrawEnd = `      const ratio = this.hp / this.maxHp;
      ctx.fillStyle = this.type === 'boss' ? '#f1c40f' : '#2ecc71';
      ctx.fillRect(-barW / 2, barY, barW * ratio, barH);
    }

    ctx.restore();
  }`;

const newEnemyDrawEnd = `      const ratio = this.hp / this.maxHp;
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
  }`;

if (!code.includes(oldEnemyDrawEnd)) {
  console.error("oldEnemyDrawEnd not found!");
  process.exit(1);
}
code = code.replace(oldEnemyDrawEnd, newEnemyDrawEnd);

// 7. Game constructor additions and DOM binding
const oldGameDOM = `      btnGameOverMenu: document.getElementById('btn-game-over-menu'),
      gameOverScore: document.getElementById('game-over-score'),
      btnFullscreenToggle: document.getElementById('btn-fullscreen-toggle')
    };`;

const newGameDOM = `      btnGameOverMenu: document.getElementById('btn-game-over-menu'),
      gameOverScore: document.getElementById('game-over-score'),
      btnFullscreenToggle: document.getElementById('btn-fullscreen-toggle'),

      // Matematik Qochish elementlari
      screenMathEscape: document.getElementById('screen-math-escape'),
      mathEquation: document.getElementById('math-equation'),
      mathOptions: document.getElementById('math-options'),
      mathTimerBar: document.getElementById('math-timer-bar'),
      btnHudEscape: document.getElementById('btn-hud-escape'),
      btnEscapeMobile: document.getElementById('btn-escape')
    };

    // Matematik qochish ko'rsatkichlari
    this.escapeCooldown = 0;
    this.maxEscapeCooldown = 12; // 12 soniya cooldown
    this.mathEscapeTimer = 0;
    this.mathEscapeDuration = 5.5; // 5.5 soniya vaqt
    this.isEmergencyEscape = false;
    this.activeMathProblem = null;`;

if (!code.includes(oldGameDOM)) {
  console.error("oldGameDOM not found!");
  process.exit(1);
}
code = code.replace(oldGameDOM, newGameDOM);

// In Game.initUI, bind btnHudEscape
const oldInitUI = `    if (this.dom.btnFullscreenToggle) {
      this.dom.btnFullscreenToggle.addEventListener('click', () => {
        this.sound.init();
        this.toggleFullscreen();
      });
    }`;

const newInitUI = `    if (this.dom.btnFullscreenToggle) {
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
    }`;

if (!code.includes(oldInitUI)) {
  console.error("oldInitUI not found!");
  process.exit(1);
}
code = code.replace(oldInitUI, newInitUI);

// Update Game.hideScreens and Game.showScreen
const oldHideScreens = `  hideScreens() {
    this.dom.screenMenu.classList.add('hidden');
    if (this.dom.screenLevelSelect) this.dom.screenLevelSelect.classList.add('hidden');
    this.dom.screenInstructions.classList.add('hidden');
    this.dom.screenPause.classList.add('hidden');
    this.dom.screenLevelClear.classList.add('hidden');
    this.dom.screenVictory.classList.add('hidden');
    this.dom.screenGameOver.classList.add('hidden');
    this.dom.hud.classList.remove('hidden');
  }`;

const newHideScreens = `  hideScreens() {
    this.dom.screenMenu.classList.add('hidden');
    if (this.dom.screenLevelSelect) this.dom.screenLevelSelect.classList.add('hidden');
    this.dom.screenInstructions.classList.add('hidden');
    this.dom.screenPause.classList.add('hidden');
    this.dom.screenLevelClear.classList.add('hidden');
    this.dom.screenVictory.classList.add('hidden');
    this.dom.screenGameOver.classList.add('hidden');
    if (this.dom.screenMathEscape) this.dom.screenMathEscape.classList.add('hidden');
    this.dom.hud.classList.remove('hidden');
  }`;

if (!code.includes(oldHideScreens)) {
  console.error("oldHideScreens not found!");
  process.exit(1);
}
code = code.replace(oldHideScreens, newHideScreens);

// In Game.loadLevel: reset escape cooldown
const oldLoadLevel = `    this.level = new Level(levelIndex);
    this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);`;

const newLoadLevel = `    this.level = new Level(levelIndex);
    this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);
    this.escapeCooldown = 0;
    this.updateEscapeHUD();`;

if (!code.includes(oldLoadLevel)) {
  console.error("oldLoadLevel not found!");
  process.exit(1);
}
code = code.replace(oldLoadLevel, newLoadLevel);

// Update Game.takeDamage and add Math Escape methods
const oldTakeDamage = `  // Qahramon zararlanganda
  takeDamage() {
    if (this.player.invincibleTimer > 0 || this.player.shieldTimer > 0) return;

    this.lives--;
    this.player.invincibleTimer = this.player.invincibleDuration;
    this.sound.playHit();
    this.particles.burst(this.player.getCenterX(), this.player.getCenterY(), '#e63946', 16, 140);
    this.updateHUD();

    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }`;

const newTakeDamage = `  // Qahramon zararlanganda (dushmandan qochish imkoniyati)
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
  // MATEMATIK HISOB-KITOB ORQALI QOCHISH TIZIMI (MATH ESCAPE ENGINE)
  // =========================================================================

  generateMathProblem() {
    const level = this.currentLevelIndex || 1;
    let num1, num2, answer, question;

    if (level <= 2) {
      // 1-2 bosqich: Oson qo'shish va ayirish
      const isAdd = Math.random() > 0.45;
      if (isAdd) {
        num1 = Math.floor(Math.random() * 20) + 5;
        num2 = Math.floor(Math.random() * 18) + 4;
        answer = num1 + num2;
        question = \`\${num1} + \${num2} = ?\`;
      } else {
        num1 = Math.floor(Math.random() * 25) + 16;
        num2 = Math.floor(Math.random() * (num1 - 6)) + 4;
        answer = num1 - num2;
        question = \`\${num1} - \${num2} = ?\`;
      }
    } else if (level <= 5) {
      // 3-5 bosqich: Karra jadvali va bo'lish
      const r = Math.random();
      if (r < 0.5) {
        num1 = Math.floor(Math.random() * 8) + 2;
        num2 = Math.floor(Math.random() * 8) + 2;
        answer = num1 * num2;
        question = \`\${num1} × \${num2} = ?\`;
      } else if (r < 0.8) {
        num2 = Math.floor(Math.random() * 7) + 2;
        answer = Math.floor(Math.random() * 8) + 2;
        num1 = answer * num2;
        question = \`\${num1} ÷ \${num2} = ?\`;
      } else {
        num1 = Math.floor(Math.random() * 35) + 20;
        num2 = Math.floor(Math.random() * 25) + 10;
        answer = num1 + num2;
        question = \`\${num1} + \${num2} = ?\`;
      }
    } else {
      // 6-10 bosqich: Tezkor murakkab hisob-kitob
      const r = Math.random();
      if (r < 0.5) {
        num1 = Math.floor(Math.random() * 8) + 4;
        num2 = Math.floor(Math.random() * 8) + 3;
        answer = num1 * num2;
        question = \`\${num1} × \${num2} = ?\`;
      } else if (r < 0.8) {
        const a = Math.floor(Math.random() * 6) + 2;
        const b = Math.floor(Math.random() * 6) + 2;
        const c = Math.floor(Math.random() * 15) + 5;
        answer = a * b + c;
        question = \`(\${a} × \${b}) + \${c} = ?\`;
      } else {
        num1 = Math.floor(Math.random() * 50) + 35;
        num2 = Math.floor(Math.random() * 30) + 15;
        answer = num1 - num2;
        question = \`\${num1} - \${num2} = ?\`;
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
      question,
      options: shuffled,
      correctIndex,
      answer
    };
  }

  triggerMathEscape(isEmergency = false) {
    if (this.state !== STATE.PLAYING) return;
    if (!isEmergency && this.escapeCooldown > 0) {
      this.showToast(\`Qochish tayyor emas! (\${Math.ceil(this.escapeCooldown)}s)\`, 1.2);
      return;
    }

    this.state = STATE.MATH_ESCAPE;
    this.isEmergencyEscape = isEmergency;
    this.mathEscapeTimer = this.mathEscapeDuration;
    this.activeMathProblem = this.generateMathProblem();

    // DOM yangilash
    if (this.dom.mathEquation) {
      this.dom.mathEquation.textContent = this.activeMathProblem.question;
    }

    const descEl = document.getElementById('math-prompt-desc');
    if (descEl) {
      descEl.textContent = isEmergency
        ? "⚠️ DUSHMAN HUJUMI! Qochish uchun misolni tezda hisoblang!"
        : "💨 TEZKOR QOCHISH: Misolni yechib dushmanlarni chalg'iting!";
    }

    if (this.dom.mathOptions) {
      this.dom.mathOptions.innerHTML = '';
      this.activeMathProblem.options.forEach((val, idx) => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-math-opt';
        btn.innerHTML = \`<span class="opt-num">[\${idx + 1}]</span> <span class="opt-val">\${val}</span>\`;
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
      this.showToast("Ajoyib hisob-kitob! Tutun tarqaldi va siz dushmandan qochdingiz! 💨 ⚡", 2.6);
    } else {
      // XATO YOKI VAQT TUGADI
      this.sound.playMathFail();

      if (this.isEmergencyEscape) {
        this.executePlayerDamage();
        this.showToast("Hisob xato! Dushmandan qochib bo'lmadi! 💔", 2.0);
      } else {
        this.showToast("Hisob xato! Qochish amalga oshmadi! ⚠️", 2.0);
      }
    }
  }

  updateMathEscape(dt) {
    this.mathEscapeTimer -= dt;
    if (this.dom.mathTimerBar) {
      const pct = Math.max(0, (this.mathEscapeTimer / this.mathEscapeDuration) * 100);
      this.dom.mathTimerBar.style.width = \`\${pct}%\`;
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
        this.dom.btnHudEscape.textContent = \`⏳ \${Math.ceil(this.escapeCooldown)}s\`;
        this.dom.btnHudEscape.classList.remove('ready');
        this.dom.btnHudEscape.classList.add('cooldown');
      }
    }

    if (this.dom.btnEscapeMobile) {
      if (isReady) {
        this.dom.btnEscapeMobile.classList.remove('cooldown');
      } else {
        this.dom.btnEscapeMobile.classList.add('cooldown');
      }
    }
  }`;

if (!code.includes(oldTakeDamage)) {
  console.error("oldTakeDamage not found!");
  process.exit(1);
}
code = code.replace(oldTakeDamage, newTakeDamage);

// In Game.update: handle STATE.MATH_ESCAPE and escapeCooldown
const oldGameUpdate = `  update(dt) {
    if (this.state !== STATE.PLAYING) return;`;

const newGameUpdate = `  update(dt) {
    if (this.state === STATE.MATH_ESCAPE) {
      this.updateMathEscape(dt);
      return;
    }

    if (this.state !== STATE.PLAYING) return;

    // Qochish qobiliyatini yangilash
    if (this.escapeCooldown > 0) {
      this.escapeCooldown -= dt;
      if (this.escapeCooldown <= 0) {
        this.escapeCooldown = 0;
      }
      this.updateEscapeHUD();
    }`;

if (!code.includes(oldGameUpdate)) {
  console.error("oldGameUpdate not found!");
  process.exit(1);
}
code = code.replace(oldGameUpdate, newGameUpdate);

// In Game.update traps check: pass true to takeDamage(true)
const oldTrapDamage = `        if (this.checkAABB(pBox, tBox)) {
          this.sound.playTrap();
          this.takeDamage();
        }`;

const newTrapDamage = `        if (this.checkAABB(pBox, tBox)) {
          this.sound.playTrap();
          this.takeDamage(true);
        }`;

if (!code.includes(oldTrapDamage)) {
  console.error("oldTrapDamage not found!");
  process.exit(1);
}
code = code.replace(oldTrapDamage, newTrapDamage);

// Save back to script.js
fs.writeFileSync(scriptPath, code, 'utf8');
console.log("Successfully updated script.js with Math Escape system!");
