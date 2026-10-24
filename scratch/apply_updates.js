const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'script.js');
let code = fs.readFileSync(scriptPath, 'utf8');

// 1. Update LEVEL_CONFIGS: remove levels 10 to 14, and rename Level 15 to Level 10
// Locate "// LEVEL 10: Lavali Vulqon" and "// LEVEL 15: Qora Soqol Qasri"
const l10Index = code.indexOf("// LEVEL 10: Lavali Vulqon");
const l15Index = code.indexOf("// LEVEL 15: Qora Soqol Qasri");

if (l10Index === -1 || l15Index === -1) {
  console.error("Could not find Level 10 or Level 15 in script.js");
  process.exit(1);
}

// Slice out between l10Index and l15Index
const beforeL10 = code.substring(0, l10Index);
const fromL15 = code.substring(l15Index);

// Replace "num: 15" with "num: 10" and name with "Qora Soqol Qasri"
let updatedL15 = fromL15.replace("// LEVEL 15: Qora Soqol Qasri - Ajal Jangi (FINAL BOSS)", "// LEVEL 10: Qora Soqol Qasri - Ajal Jangi (FINAL BOSS)");
updatedL15 = updatedL15.replace("num: 15,", "num: 10,");
updatedL15 = updatedL15.replace('name: "Qora Soqol Qasri - Ajal Jangi",', 'name: "Qora Soqol Qasri",');
updatedL15 = updatedL15.replace('subtitle: "AFSONAVIY QAROQCHILAR QIROLI BILAN JANG!",', 'subtitle: "FINAL BOSS: Afsonaviy Qora Soqol bilan hal qiluvchi jang!",');

code = beforeL10 + updatedL15;

// 2. Frustum Culling in Level.draw
const oldLevelDraw = `    // 2. TUZOQLARNI CHIZISH
    for (const trap of this.traps) {
      trap.draw(ctx, camera);
    }

    // 3. TO'SIQLAR (DARAXT VA QOYALAR) CHIZILISHI`;

const newLevelDraw = `    const camX1 = camera.x - 48;
    const camX2 = camera.x + camera.width + 48;
    const camY1 = camera.y - 48;
    const camY2 = camera.y + camera.height + 48;

    // 2. TUZOQLARNI CHIZISH (Kamera ichidagilar)
    for (const trap of this.traps) {
      if (trap.x + trap.width >= camX1 && trap.x <= camX2 && trap.y + trap.height >= camY1 && trap.y <= camY2) {
        trap.draw(ctx, camera);
      }
    }

    // 3. TO'SIQLAR (DARAXT VA QOYALAR) CHIZILISHI`;

if (code.includes(oldLevelDraw)) {
  code = code.replace(oldLevelDraw, newLevelDraw);
} else {
  console.warn("oldLevelDraw not matched directly, checking normalized...");
}

const oldEntitiesDraw = `    // 3.5. TO'PLARDAN OTILGAN YADROLARNI CHIZISH
    for (const p of this.projectiles) {
      p.draw(ctx, camera);
    }

    // 3.6. QAL'A TO'PLARINI CHIZISH
    for (const cannon of this.cannons) {
      cannon.draw(ctx, camera);
    }

    // 4. BUYUMLARNI CHIZISH (Tangalar, javohirlar, eliksirlar, qalqon, kalit va sandiq)
    for (const item of this.collectibles) {
      item.draw(ctx, camera);
    }
    if (this.keyItem) {
      this.keyItem.draw(ctx, camera);
    }
    if (this.chest) {
      this.chest.draw(ctx, camera);
    }`;

const newEntitiesDraw = `    // 3.5. TO'PLARDAN OTILGAN YADROLARNI CHIZISH
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
    }`;

if (code.includes(oldEntitiesDraw)) {
  code = code.replace(oldEntitiesDraw, newEntitiesDraw);
}

// 3. Game.constructor: maxLevels = 10, btnFullscreenToggle
code = code.replace("this.maxLevels = 15;", "this.maxLevels = 10;");
code = code.replace("gameOverScore: document.getElementById('game-over-score')", "gameOverScore: document.getElementById('game-over-score'),\n      btnFullscreenToggle: document.getElementById('btn-fullscreen-toggle')");

// 4. Game.handleResize: full window resize & crisp pixel smoothing
const oldResize = `  handleResize() {
    const container = document.getElementById('game-container');
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    this.canvas.width = width;
    this.canvas.height = height;
    this.camera.resize(width, height);
  }`;

const newResize = `  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.imageSmoothingEnabled = false;
    this.camera.resize(width, height);
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
  }`;

if (code.includes(oldResize)) {
  code = code.replace(oldResize, newResize);
}

// 5. Game.initUI: bind fullscreen toggle and fullscreenchange listener
const oldInitUI = `    this.updateSoundBtn();
    this.initLevelSelectUI();`;

const newInitUI = `    this.updateSoundBtn();
    this.initLevelSelectUI();

    if (this.dom.btnFullscreenToggle) {
      this.dom.btnFullscreenToggle.addEventListener('click', () => {
        this.sound.init();
        this.toggleFullscreen();
      });
    }

    document.addEventListener('fullscreenchange', () => {
      if (this.dom.btnFullscreenToggle) {
        this.dom.btnFullscreenToggle.textContent = document.fullscreenElement ? '🗗' : '⛶';
      }
      this.handleResize();
    });`;

if (code.includes(oldInitUI)) {
  code = code.replace(oldInitUI, newInitUI);
}

// 6. Badges in initLevelSelectUI: 10 levels
const oldBadges = `    const badges = [
      { text: 'Oson', class: 'badge-easy' },         // L1
      { text: 'Oson', class: 'badge-easy' },         // L2
      { text: "O'rta", class: 'badge-medium' },       // L3
      { text: "O'rta", class: 'badge-medium' },       // L4
      { text: "O'rta", class: 'badge-medium' },       // L5
      { text: 'Qiyin', class: 'badge-hard' },         // L6
      { text: 'Qiyin', class: 'badge-hard' },         // L7
      { text: 'Qiyin', class: 'badge-hard' },         // L8
      { text: 'Juda Qiyin', class: 'badge-veryhard' }, // L9
      { text: 'Juda Qiyin', class: 'badge-veryhard' }, // L10
      { text: 'Juda Qiyin', class: 'badge-veryhard' }, // L11
      { text: 'Ekstremal', class: 'badge-nightmare' }, // L12
      { text: 'Ekstremal', class: 'badge-nightmare' }, // L13
      { text: 'Ekstremal', class: 'badge-nightmare' }, // L14
      { text: 'FINAL BOSS', class: 'badge-boss' }      // L15
    ];`;

const newBadges = `    const badges = [
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
    ];`;

if (code.includes(oldBadges)) {
  code = code.replace(oldBadges, newBadges);
}

// 7. Frustum culling in Game.draw for enemies
const oldGameDraw = `      // Dushmanlar
      for (const enemy of this.level.enemies) {
        enemy.draw(this.ctx, this.camera);
      }`;

const newGameDraw = `      const camX1 = this.camera.x - 48;
      const camX2 = this.camera.x + this.camera.width + 48;
      const camY1 = this.camera.y - 48;
      const camY2 = this.camera.y + this.camera.height + 48;

      // Dushmanlar (faqat ekranda ko'rinib turganlari chiziladi - 60 FPS)
      for (const enemy of this.level.enemies) {
        if (enemy.x + enemy.width >= camX1 && enemy.x <= camX2 && enemy.y + enemy.height >= camY1 && enemy.y <= camY2) {
          enemy.draw(this.ctx, this.camera);
        }
      }`;

if (code.includes(oldGameDraw)) {
  code = code.replace(oldGameDraw, newGameDraw);
}

// 8. Game.gameLoop clamp dt
const oldLoop = `    // Sahifani fon rejimiga qo'yganda yoki sakrashlarda vaqtni cheklash
    if (dt > 0.1) dt = 0.1;`;

const newLoop = `    // Kuchsiz kompyuterlarda sakrashlarni oldini olish uchun dt cheklovi
    if (dt > 0.033) dt = 0.033;`;

if (code.includes(oldLoop)) {
  code = code.replace(oldLoop, newLoop);
}

fs.writeFileSync(scriptPath, code, 'utf8');
console.log("Successfully updated script.js!");
