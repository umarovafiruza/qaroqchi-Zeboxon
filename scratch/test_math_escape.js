const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock browser globals
global.window = {
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: () => {}
};
global.document = {
  getElementById: (id) => ({
    id,
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    style: {},
    appendChild: () => {},
    innerHTML: '',
    textContent: '',
    getContext: () => ({
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      fillRect: () => {},
      beginPath: () => {},
      arc: () => {},
      ellipse: () => {},
      roundRect: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      fill: () => {},
      stroke: () => {},
      save: () => {},
      restore: () => {},
      translate: () => {},
      rotate: () => {},
      scale: () => {},
      clearRect: () => {}
    })
  }),
  createElement: (tag) => ({
    tag,
    className: '',
    innerHTML: '',
    addEventListener: () => {}
  }),
  addEventListener: () => {},
  documentElement: {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.AudioContext = class {
  createGain() { return { gain: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} }, connect: () => {} }; }
  createOscillator() { return { start: () => {}, stop: () => {}, connect: () => {}, frequency: { setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} } }; }
};
global.requestAnimationFrame = () => {};

// Load script.js in VM context
const scriptPath = path.join(__dirname, '..', 'script.js');
const code = fs.readFileSync(scriptPath, 'utf8');

vm.runInThisContext(code);

console.log("=== TEST 1: Math Problem Generation ===");
const game = new Game();
game.currentLevelIndex = 1;

for (let i = 0; i < 20; i++) {
  const prob = game.generateMathProblem();
  if (!prob.question || !prob.options || prob.options.length !== 4) {
    throw new Error(`Invalid problem generated: ${JSON.stringify(prob)}`);
  }
  if (prob.options[prob.correctIndex] !== prob.answer) {
    throw new Error(`Correct index mismatch! ${prob.options[prob.correctIndex]} vs ${prob.answer}`);
  }
  const unique = new Set(prob.options);
  if (unique.size !== 4) {
    throw new Error(`Options not unique: ${prob.options}`);
  }
}
console.log("✓ generateMathProblem verified for multiple difficulty levels!");

console.log("\n=== TEST 2: Math Escape Mechanics ===");
game.startNewGame();
console.log(`Initial game state: ${game.state}, lives: ${game.lives}`);

// Trigger math escape manually
game.triggerMathEscape(false);
if (game.state !== STATE.MATH_ESCAPE) {
  throw new Error(`Expected STATE.MATH_ESCAPE, got ${game.state}`);
}
console.log("✓ triggerMathEscape correctly paused into STATE.MATH_ESCAPE");

// Correct answer
const correctIdx = game.activeMathProblem.correctIndex;
const preScore = game.score;
game.handleMathAnswer(correctIdx);

if (game.state !== STATE.PLAYING) {
  throw new Error(`Expected STATE.PLAYING after answer, got ${game.state}`);
}
if (game.player.sprintTimer <= 0) {
  throw new Error("Sprint boost not applied!");
}
if (game.player.invincibleTimer <= 0) {
  throw new Error("Invincibility not applied!");
}
if (game.score !== preScore + 100) {
  throw new Error(`Score bonus not added! Expected ${preScore + 100}, got ${game.score}`);
}

// Check enemies stunned
let stunnedCount = 0;
game.level.enemies.forEach(e => {
  if (e.stunTimer > 0) stunnedCount++;
});
console.log(`Enemies stunned: ${stunnedCount}/${game.level.enemies.length}`);
if (stunnedCount !== game.level.enemies.length) {
  throw new Error("Not all enemies were stunned!");
}

console.log("✓ Success escape rewards (Stun, Sprint, Shield, Smoke, Score) verified!");

console.log("\n=== TEST 3: Stunned Enemy Immobilization ===");
const enemy = game.level.enemies[0];
const ex = enemy.x;
const ey = enemy.y;
enemy.update(0.1, game.player, game.level, game);
if (enemy.x !== ex || enemy.y !== ey) {
  throw new Error("Stunned enemy moved!");
}
console.log("✓ Stunned enemy remains completely immobilized!");

console.log("\n=== TEST 4: Emergency Math Escape on Enemy Hit ===");
// Reset cooldown and invincibility
game.escapeCooldown = 0;
game.player.invincibleTimer = 0;
game.player.shieldTimer = 0;
const initialLives = game.lives;

// Enemy hits player
game.takeDamage(); // Should trigger emergency escape because escapeCooldown == 0
if (game.state !== STATE.MATH_ESCAPE) {
  throw new Error("Enemy hit did not trigger emergency math escape!");
}
if (!game.isEmergencyEscape) {
  throw new Error("isEmergencyEscape flag not set!");
}
console.log("✓ Enemy hit triggered emergency math escape!");

// Player answers correctly -> damage is NEGATED!
game.handleMathAnswer(game.activeMathProblem.correctIndex);
if (game.lives !== initialLives) {
  throw new Error(`Damage should have been negated on correct answer! Expected ${initialLives}, got ${game.lives}`);
}
console.log(`✓ Damage successfully negated by quick math escape! Lives: ${game.lives}/${initialLives}`);

console.log("\n=== TEST 5: Failed Math Escape Takes Damage ===");
game.escapeCooldown = 0;
game.player.invincibleTimer = 0;
game.player.shieldTimer = 0;

// Enemy hits player again
game.takeDamage();
// Incorrect answer (-1)
game.handleMathAnswer(-1);
if (game.lives !== initialLives - 1) {
  throw new Error(`Failed escape should take 1 damage! Expected ${initialLives - 1}, got ${game.lives}`);
}
console.log(`✓ Failed escape takes damage as expected! Lives: ${game.lives}`);

console.log("\nALL MATHEMATICAL ESCAPE TESTS PASSED! 🚀🎯");
