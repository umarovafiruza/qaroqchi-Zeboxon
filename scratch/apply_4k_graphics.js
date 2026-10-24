const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'script.js');
let code = fs.readFileSync(scriptPath, 'utf8');

// 1. Update handleResize for 4K DPR
const oldResize = `  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width;
    this.canvas.height = height;
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
  }`;

const newResize = `  handleResize() {
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
  }`;

if (!code.includes(oldResize)) {
  console.error("oldResize not found!");
  process.exit(1);
}
code = code.replace(oldResize, newResize);

// 2. Update Game.draw for 4K DPR
const oldGameDraw = `  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

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
  }`;

const newGameDraw = `  draw() {
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
  }`;

if (!code.includes(oldGameDraw)) {
  console.error("oldGameDraw not found!");
  process.exit(1);
}
code = code.replace(oldGameDraw, newGameDraw);

// 3. Update Level.draw for 4K ocean caustics, coastal foam, wildflowers
const oldLevelDraw = `        if (type === TILE.WATER) {
          // Tirik okean suvi va to'lqinlar animatsiyasi (butun ekranni qamrab oladi)
          ctx.fillStyle = '#145d82';
          ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);

          // Oq ko'pik to'lqinchalari
          ctx.fillStyle = '#4ea5cc';
          const waveOffset = Math.sin(this.waterAnimTime + c * 0.7 + r * 0.9) * 4;
          ctx.fillRect(dx + 6 + waveOffset, dy + 14, 18, 3);
          ctx.fillRect(dx + 20 - waveOffset, dy + 32, 16, 3);

          // Nozik suv yaltirashi (chuqur dengiz jilosi)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          const waveOffset2 = Math.cos(this.waterAnimTime * 0.8 + c * 0.6 + r * 1.1) * 3;
          ctx.fillRect(dx + 12 + waveOffset2, dy + 22, 12, 2);
        } else if (type === TILE.SAND || type === TILE.TREE || type === TILE.ROCK) {
          // Qum zamini
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
        } else if (type === TILE.GRASS) {
          // Yashil o'tloq zamini
          ctx.fillStyle = '#3e8938';
          ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);

          // Maysa poyachalari
          ctx.fillStyle = '#2f6d2a';
          ctx.fillRect(dx + 8, dy + 14, 2, 6);
          ctx.fillRect(dx + 10, dy + 12, 2, 8);
          ctx.fillRect(dx + 26, dy + 28, 2, 6);
          ctx.fillRect(dx + 28, dy + 26, 2, 8);
        }`;

const newLevelDraw = `        if (type === TILE.WATER) {
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
            ctx.fillStyle = \`rgba(255, 255, 255, \${sparkleAlpha.toFixed(2)})\`;
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
        }`;

if (!code.includes(oldLevelDraw)) {
  console.error("oldLevelDraw not found!");
  process.exit(1);
}
code = code.replace(oldLevelDraw, newLevelDraw);

// 4. Update Player.draw with 4K drop shadow and glowing magic shield
const oldPlayerDrawShadow = `  // Pixel-art uslubida qaroqchini chizish
  draw(ctx, camera) {
    const drawX = Math.floor(this.x - camera.x);
    const drawY = Math.floor(this.y - camera.y);

    // Miltillash effekti (shikastlanganda)
    if (this.invincibleTimer > 0) {
      if (Math.floor(this.invincibleTimer * 12) % 2 === 0) {
        return; // Ushbu kadrda ko'rinmaydi
      }
    }

    ctx.save();
    ctx.translate(drawX + this.width / 2, drawY + this.height / 2);`;

const newPlayerDrawShadow = `  // Pixel-art uslubida qaroqchini chizish
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
    ctx.translate(drawX + this.width / 2, drawY + this.height / 2);`;

if (!code.includes(oldPlayerDrawShadow)) {
  console.error("oldPlayerDrawShadow not found!");
  process.exit(1);
}
code = code.replace(oldPlayerDrawShadow, newPlayerDrawShadow);

// 5. Update Enemy.draw with 4K drop shadow
const oldEnemyDrawShadow = `  draw(ctx, camera) {
    const drawX = Math.floor(this.x - camera.x);
    const drawY = Math.floor(this.y - camera.y);

    ctx.save();
    ctx.translate(drawX + this.width / 2, drawY + this.height / 2);`;

const newEnemyDrawShadow = `  draw(ctx, camera) {
    const drawX = Math.floor(this.x - camera.x);
    const drawY = Math.floor(this.y - camera.y);

    // 4K Dushman soyasi (Ambient drop shadow)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(drawX + this.width / 2, drawY + this.height - 2, this.width / 2.2, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(drawX + this.width / 2, drawY + this.height / 2);`;

if (!code.includes(oldEnemyDrawShadow)) {
  console.error("oldEnemyDrawShadow not found!");
  process.exit(1);
}
code = code.replace(oldEnemyDrawShadow, newEnemyDrawShadow);

// 6. Update Chest.draw with 4K drop shadow and golden rays
const oldChestDraw = `    // Sandiq tagligi (yog'och)
    ctx.fillStyle = '#5c3a21';
    ctx.fillRect(6, 16, 36, 26);`;

const newChestDraw = `    // 4K Sandiq soyasi
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
    ctx.fillRect(6, 16, 36, 26);`;

if (!code.includes(oldChestDraw)) {
  console.error("oldChestDraw not found!");
  process.exit(1);
}
code = code.replace(oldChestDraw, newChestDraw);

// 7. Update Collectible.draw with 4K drop shadow and halo
const oldCollDraw = `    if (this.collected) return;

    const drawX = Math.floor(this.x - camera.x);
    const drawY = Math.floor(this.y - camera.y);

    ctx.save();
    ctx.translate(drawX, drawY);`;

const newCollDraw = `    if (this.collected) return;

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
    }`;

if (!code.includes(oldCollDraw)) {
  console.error("oldCollDraw not found!");
  process.exit(1);
}
code = code.replace(oldCollDraw, newCollDraw);

fs.writeFileSync(scriptPath, code, 'utf8');
console.log("Successfully updated script.js with 4K Ultra HD graphics engine!");
