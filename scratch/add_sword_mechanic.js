const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'script.js');
let code = fs.readFileSync(scriptPath, 'utf8');

// 1. Add sword sounds to SoundManager
const alertSoundEnd = `    osc.start(now);
    osc.stop(now + 0.22);
  }
}`;

const swordSounds = `    osc.start(now);
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
}`;

code = code.replace(alertSoundEnd, swordSounds);

// 2. InputHandler attack key support
const oldKeydown = `      } else if (e.code === 'KeyF') {
        this.game.toggleFullscreen();
        e.preventDefault();
      }
    });`;

const newKeydown = `      } else if (e.code === 'KeyF') {
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

code = code.replace(oldKeydown, newKeydown);

// InputHandler touch & canvas click
const oldTouchControls = `    bindBtn('btn-up', 'up');
    bindBtn('btn-down', 'down');
    bindBtn('btn-left', 'left');
    bindBtn('btn-right', 'right');
  }`;

const newTouchControls = `    bindBtn('btn-up', 'up');
    bindBtn('btn-down', 'down');
    bindBtn('btn-left', 'left');
    bindBtn('btn-right', 'right');

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
      const handleRelease = (e) => {
        e.preventDefault();
        attackBtn.classList.remove('pressed');
      };
      attackBtn.addEventListener('touchstart', handleAttack, { passive: false });
      attackBtn.addEventListener('touchend', handleRelease, { passive: false });
      attackBtn.addEventListener('mousedown', handleAttack);
      attackBtn.addEventListener('mouseup', handleRelease);
      attackBtn.addEventListener('mouseleave', handleRelease);
    }

    // Sichqoncha bilan bosilganda ham qilich zarbasi
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
  }`;

code = code.replace(oldTouchControls, newTouchControls);

// 3. Player class updates
const oldPlayerCtor = `    // Sehrli qalqon (Shield)
    this.shieldTimer = 0;
    this.shieldAnimTimer = 0;
  }`;

const newPlayerCtor = `    // Sehrli qalqon (Shield)
    this.shieldTimer = 0;
    this.shieldAnimTimer = 0;

    // Qilich bilan himoyalanish va hujum (Sword Slash)
    this.isAttacking = false;
    this.attackTimer = 0;
    this.attackDuration = 0.22;
    this.attackCooldown = 0;
    this.hasHitThisSwing = new Set();
  }`;

code = code.replace(oldPlayerCtor, newPlayerCtor);

// Player.update attack timers
const oldPlayerUpdate = `    // Sehrli qalqon vaqtini yangilash
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      this.shieldAnimTimer += dt;
    }
  }`;

const newPlayerUpdate = `    // Sehrli qalqon vaqtini yangilash
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
  }`;

code = code.replace(oldPlayerUpdate, newPlayerUpdate);

// Player.draw cutlass
const oldPlayerDrawEnd = `      for (let i = 0; i < 4; i++) {
        const angle = this.shieldAnimTimer * 4 + (i * Math.PI) / 2;
        const sx = Math.cos(angle) * 25;
        const sy = Math.sin(angle) * 25;
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(sx - 2, sy - 2, 4, 4);
      }
    }

    ctx.restore();
  }`;

const newPlayerDrawEnd = `      for (let i = 0; i < 4; i++) {
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
      ctx.strokeStyle = \`rgba(255, 255, 255, \${0.85 - progress * 0.4})\`;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, 36, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();

      ctx.strokeStyle = \`rgba(0, 210, 255, \${0.7 - progress * 0.4})\`;
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

    ctx.restore();
  }`;

code = code.replace(oldPlayerDrawEnd, newPlayerDrawEnd);

// 4. Enemy class updates (HP, takeDamage, flash and HP bar)
const oldEnemyCtor = `    } else {
      // skeleton
      this.width = 32;
      this.height = 32;
      this.baseSpeed = speed || 90;
      this.baseDetection = 160;
    }
    this.speed = this.baseSpeed;
  }`;

const newEnemyCtor = `    } else {
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
  }`;

code = code.replace(oldEnemyCtor, newEnemyCtor);

// Enemy.update hitFlashTimer
const oldEnemyUpdateStart = `  update(dt, player, level, game) {
    this.animTimer += dt * (this.isAlerted ? 9 : 5);
    if (this.alertAnimTimer > 0) {
      this.alertAnimTimer -= dt;
    }`;

const newEnemyUpdateStart = `  update(dt, player, level, game) {
    this.animTimer += dt * (this.isAlerted ? 9 : 5);
    if (this.alertAnimTimer > 0) {
      this.alertAnimTimer -= dt;
    }
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }`;

code = code.replace(oldEnemyUpdateStart, newEnemyUpdateStart);

// Add takeDamage to Enemy class
const oldEnemyCheckSolid = `  checkSolid(nx, ny, level) {`;
const newEnemyTakeDamage = `  takeDamage(amount, fromX, fromY, game) {
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
        game.showToast('🦀 Qisqichbaqa qilich bilan yengildi! (+20)', 1.2);
        if (game.particles) game.particles.burst(enemyCx, enemyCy, '#e63946', 15, 140);
      } else if (this.type === 'bat') {
        game.score += 30;
        game.showToast('🦇 Ko\'rshapalak qilich bilan urib tushirildi! (+30)', 1.2);
        if (game.particles) game.particles.burst(enemyCx, enemyCy, '#3b1236', 15, 140);
      } else if (this.type === 'skeleton') {
        game.score += 50;
        game.showToast('💀 Skelet qilich zarbasidan parchalandi! (+50)', 1.2);
        if (game.particles) game.particles.burst(enemyCx, enemyCy, '#eaeaea', 18, 150);
      } else if (this.type === 'ghost') {
        game.score += 60;
        game.showToast('👻 Arvoh qilich nuri bilan haydildi! (+60)', 1.2);
        if (game.particles) game.particles.burst(enemyCx, enemyCy, '#48dbfb', 18, 150);
      } else if (this.type === 'boss') {
        game.score += 500;
        if (game.sound) game.sound.playChest();
        game.showToast('👑 QORA SOQOL QILICH JANGIDA MAG\\'LUB ETILDI!! (+500)', 3.5);
        if (game.particles) {
          game.particles.burst(enemyCx, enemyCy, '#e74c3c', 35, 200);
          game.particles.burst(enemyCx, enemyCy, '#ffd700', 35, 200);
        }
      }
      game.updateHUD();
    }
  }

  checkSolid(nx, ny, level) {`;

code = code.replace(oldEnemyCheckSolid, newEnemyTakeDamage);

// Enemy.draw hit flash and health bar
const oldEnemyDrawEnd = `    // 3. SEZIB QOLGANDAGI OGOHLANTIRISH / HUJUM BELGISI (!)
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
    }

    ctx.restore();
  }`;

const newEnemyDrawEnd = `    // 3. SEZIB QOLGANDAGI OGOHLANTIRISH / HUJUM BELGISI (!)
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

    ctx.restore();
  }`;

code = code.replace(oldEnemyDrawEnd, newEnemyDrawEnd);

// 5. Game.update: clean dead enemies
const oldGameEnemyUpdate = `    for (const enemy of this.level.enemies) {
      enemy.update(dt, this.player, this.level, this);

      // O'yinchi bilan to'qnashuvni tekshirish
      const eBox = {
        x: enemy.x + 4,
        y: enemy.y + 4,
        w: enemy.width - 8,
        h: enemy.height - 8
      };

      if (this.checkAABB(pBox, eBox)) {
        this.takeDamage();
      }
    }`;

const newGameEnemyUpdate = `    // Tirik dushmanlarni yangilash va o'lganlarni tozalash
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
    }`;

code = code.replace(oldGameEnemyUpdate, newGameEnemyUpdate);

fs.writeFileSync(scriptPath, code, 'utf8');
console.log("Successfully added Sword Defense & Attack mechanic to script.js!");
