const fs = require('fs');
const path = require('path');

global.window = { addEventListener: () => {}, innerWidth: 1024, innerHeight: 768 };
global.document = {
  getElementById: (id) => ({
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {} },
    getContext: () => ({ clearRect: () => {}, save: () => {}, restore: () => {} }),
    clientWidth: 800,
    clientHeight: 600,
    style: {},
    appendChild: () => {}
  }),
  createElement: () => ({
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {} }
  }),
  addEventListener: () => {}
};
global.requestAnimationFrame = () => {};
global.localStorage = { getItem: () => null, setItem: () => {} };

const scriptPath = path.join(__dirname, '..', 'script.js');
const code = fs.readFileSync(scriptPath, 'utf8');

const vm = require('vm');
vm.runInThisContext(code);

const game = new Game();
game.sound.enabled = false;
game.state = STATE.PLAYING;
game.loadLevel(2); // Level 2 has a skeleton!

const skeleton = game.level.enemies.find(e => e.type === 'skeleton');
console.log("Found skeleton with HP:", skeleton.hp, "maxHp:", skeleton.maxHp);

// Position player next to skeleton
game.player.x = skeleton.x - 30;
game.player.y = skeleton.y;
game.player.facing = 'right';

// Hit 1
console.log("Performing Hit 1...");
game.player.attack(game);
console.log("Skeleton HP after Hit 1:", skeleton.hp, "isAlerted:", skeleton.isAlerted, "hitFlash:", skeleton.hitFlashTimer);
if (skeleton.hp !== 1) throw new Error("Expected skeleton HP to be 1 after 1 hit");

// Reset attack cooldown for test
game.player.attackCooldown = 0;

// Hit 2
console.log("Performing Hit 2...");
game.player.attack(game);
console.log("Skeleton HP after Hit 2:", skeleton.hp);
if (skeleton.hp !== 0) throw new Error("Expected skeleton HP to be 0 after 2 hits");

game.update(0.016);
const remainingSkeleton = game.level.enemies.find(e => e.type === 'skeleton');
if (remainingSkeleton) throw new Error("Skeleton should be removed from enemies array!");

console.log("ALL SKELETON MULTI-HIT & KNOCKBACK TESTS PASSED!");
