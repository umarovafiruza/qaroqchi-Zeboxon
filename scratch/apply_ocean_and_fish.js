const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'script.js');
let code = fs.readFileSync(scriptPath, 'utf8');

// 1. Update Camera.update
const oldCameraUpdate = `  update(targetX, targetY, mapWidth, mapHeight) {
    // Kameraning markazga intilishi
    const targetCamX = targetX - this.width / 2;
    const targetCamY = targetY - this.height / 2;

    // Silliq siljish (lerp)
    this.x += (targetCamX - this.x) * this.lerpSpeed;
    this.y += (targetCamY - this.y) * this.lerpSpeed;

    // Xarita chegaralaridan chiqib ketmaslik
    const maxCamX = Math.max(0, mapWidth - this.width);
    const maxCamY = Math.max(0, mapHeight - this.height);

    this.x = Math.max(0, Math.min(this.x, maxCamX));
    this.y = Math.max(0, Math.min(this.y, maxCamY));
  }`;

const newCameraUpdate = `  update(targetX, targetY, mapWidth, mapHeight) {
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
  }`;

if (!code.includes(oldCameraUpdate)) {
  console.error("oldCameraUpdate not found!");
  process.exit(1);
}
code = code.replace(oldCameraUpdate, newCameraUpdate);

// 2. Add Fish class right before ParticleSystem
const fishClassCode = `/* ============================================================================
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
      ctx.fillStyle = \`rgba(255, 255, 255, \${Math.max(0, b.alpha)})\`;
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
   ============================================================================ */`;

const particleAnchor = `/* ============================================================================
   5. PARTIKLLAR TIZIMI (UCHQUNLAR VA EFFEKTLAR)
   ============================================================================ */`;

if (!code.includes(particleAnchor)) {
  console.error("particleAnchor not found!");
  process.exit(1);
}
code = code.replace(particleAnchor, fishClassCode);

// 3. Update Level constructor and add initFishes, isWaterTile
const oldLevelCtor = `    this.projectiles = [];

    this.waterAnimTime = 0;
    this.loadLevelData(levelNumber);`;

const newLevelCtor = `    this.projectiles = [];
    this.fishes = [];

    this.waterAnimTime = 0;
    this.loadLevelData(levelNumber);`;

if (!code.includes(oldLevelCtor)) {
  console.error("oldLevelCtor not found!");
  process.exit(1);
}
code = code.replace(oldLevelCtor, newLevelCtor);

// In Level.loadLevelData, add initFishes
const oldLoadEnd = `    // Qal'a to'plari
    if (config.cannons) {
      for (const c of config.cannons) {
        this.cannons.push(new Cannon(c.tileX, c.tileY, c.dir, c.interval, c.delay));
      }
    }
  }`;

const newLoadEnd = `    // Qal'a to'plari
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
  }`;

if (!code.includes(oldLoadEnd)) {
  console.error("oldLoadEnd not found!");
  process.exit(1);
}
code = code.replace(oldLoadEnd, newLoadEnd);

// In Level.update, update fishes
const oldLevelUpdate = `  update(dt, game) {
    this.waterAnimTime += dt * 2.5;

    // Tuzoqlarni yangilash`;

const newLevelUpdate = `  update(dt, game) {
    this.waterAnimTime += dt * 2.5;

    // Baliqlarni yangilash
    for (const fish of this.fishes) {
      fish.update(dt, this, game ? game.player : null);
    }

    // Tuzoqlarni yangilash`;

if (!code.includes(oldLevelUpdate)) {
  console.error("oldLevelUpdate not found!");
  process.exit(1);
}
code = code.replace(oldLevelUpdate, newLevelUpdate);

// In Level.draw, infinite ocean & fish rendering & safe obstacle loop
const oldLevelDraw = `  draw(ctx, camera) {
    const startCol = Math.max(0, Math.floor(camera.x / TILE_SIZE));
    const endCol = Math.min(this.cols - 1, Math.floor((camera.x + camera.width) / TILE_SIZE) + 1);
    const startRow = Math.max(0, Math.floor(camera.y / TILE_SIZE));
    const endRow = Math.min(this.rows - 1, Math.floor((camera.y + camera.height) / TILE_SIZE) + 1);

    // 1. ZAMINNI CHIZISH (Ground & Water)
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        const type = this.tiles[r][c];
        const dx = Math.floor(c * TILE_SIZE - camera.x);
        const dy = Math.floor(r * TILE_SIZE - camera.y);

        if (type === TILE.WATER) {
          // Dengiz suvi va animatsiyali to'lqinlar
          ctx.fillStyle = '#145d82';
          ctx.fillRect(dx, dy, TILE_SIZE, TILE_SIZE);

          // Oq ko'pik to'lqinchalari
          ctx.fillStyle = '#4ea5cc';
          const waveOffset = Math.sin(this.waterAnimTime + c * 0.7 + r * 0.9) * 4;
          ctx.fillRect(dx + 6 + waveOffset, dy + 14, 18, 3);
          ctx.fillRect(dx + 20 - waveOffset, dy + 32, 16, 3);
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
        }
      }
    }

    const camX1 = camera.x - 48;
    const camX2 = camera.x + camera.width + 48;
    const camY1 = camera.y - 48;
    const camY2 = camera.y + camera.height + 48;

    // 2. TUZOQLARNI CHIZISH (Kamera ichidagilar)
    for (const trap of this.traps) {
      if (trap.x + trap.width >= camX1 && trap.x <= camX2 && trap.y + trap.height >= camY1 && trap.y <= camY2) {
        trap.draw(ctx, camera);
      }
    }

    // 3. TO'SIQLAR (DARAXT VA QOYALAR) CHIZILISHI
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {`;

const newLevelDraw = `  draw(ctx, camera) {
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
      for (let c = islandStartCol; c <= islandEndCol; c++) {`;

if (!code.includes(oldLevelDraw)) {
  console.error("oldLevelDraw not found!");
  process.exit(1);
}
code = code.replace(oldLevelDraw, newLevelDraw);

// 4. Update Game.loadLevel camera centering
const oldGameLoadLevel = `    // Kamera boshlang'ich pozitsiyasiga darhol keltirish
    this.camera.x = this.player.x - this.camera.width / 2;
    this.camera.y = this.player.y - this.camera.height / 2;`;

const newGameLoadLevel = `    // Kamera boshlang'ich pozitsiyasiga darhol keltirish (Orol markaziga to'g'irlash)
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
    }`;

if (!code.includes(oldGameLoadLevel)) {
  console.error("oldGameLoadLevel not found!");
  process.exit(1);
}
code = code.replace(oldGameLoadLevel, newGameLoadLevel);

// 5. Update Game.handleResize to center island if viewport is larger than map
const oldHandleResize = `  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = false;
    this.camera.resize(width, height);
  }`;

const newHandleResize = `  handleResize() {
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

if (!code.includes(oldHandleResize)) {
  console.error("oldHandleResize not found!");
  process.exit(1);
}
code = code.replace(oldHandleResize, newHandleResize);

// Save back
fs.writeFileSync(scriptPath, code, 'utf8');
console.log("Successfully updated script.js with ocean, fish, and centered island!");
