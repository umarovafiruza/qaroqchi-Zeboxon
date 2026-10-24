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
  getElementById: () => ({
    addEventListener: () => {},
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    style: {},
    appendChild: () => {},
    innerHTML: '',
    textContent: ''
  }),
  addEventListener: () => {},
  documentElement: {}
};
global.localStorage = {
  getItem: () => null,
  setItem: () => {}
};
global.AudioContext = class {
  createGain() { return { gain: { value: 0 }, connect: () => {} }; }
  createOscillator() { return { start: () => {}, stop: () => {}, connect: () => {} }; }
};
global.requestAnimationFrame = () => {};

// Load script.js in VM context
const scriptPath = path.join(__dirname, '..', 'script.js');
const code = fs.readFileSync(scriptPath, 'utf8');

vm.runInThisContext(code);

console.log("=== TEST 1: Camera Centering ===");
const cam = new Camera(1920, 1080);
const mapW = 20 * 48; // 960
const mapH = 15 * 48; // 720

// Test update with screen larger than map
cam.update(100, 100, mapW, mapH);
console.log(`Camera dimensions: ${cam.width}x${cam.height}, Map: ${mapW}x${mapH}`);
console.log(`Camera position: x=${cam.x}, y=${cam.y}`);

const expectedX = (mapW - 1920) / 2; // -480
const expectedY = (mapH - 1080) / 2; // -180
if (cam.x !== expectedX || cam.y !== expectedY) {
  throw new Error(`Camera not centered! Expected (${expectedX}, ${expectedY}), got (${cam.x}, ${cam.y})`);
}

const islandScreenCenterX = (mapW / 2) - cam.x;
const islandScreenCenterY = (mapH / 2) - cam.y;
console.log(`Island center on screen: (${islandScreenCenterX}, ${islandScreenCenterY}) (Screen center is ${1920/2}, ${1080/2})`);
if (islandScreenCenterX !== 1920 / 2 || islandScreenCenterY !== 1080 / 2) {
  throw new Error("Island center does not match screen center!");
}
console.log("✓ Camera Centering passed!");

console.log("\n=== TEST 2: Level Infinite Ocean and Fish ===");
const level = new Level(1);
console.log(`Level 1 loaded: cols=${level.cols}, rows=${level.rows}, fishes=${level.fishes.length}`);

if (level.fishes.length < 20) {
  throw new Error(`Expected at least 20 fishes, got ${level.fishes.length}`);
}

// Test isWaterTile
if (!level.isWaterTile(-2, -2)) throw new Error("(-2, -2) outside map should be water!");
if (!level.isWaterTile(level.cols + 5, level.rows + 5)) throw new Error("Outside map should be water!");
console.log("✓ isWaterTile correctly identifies ocean!");

// Test Fish movement & update
const player = new Player(level.playerStart.x, level.playerStart.y);
const initialFishPos = level.fishes.map(f => ({ x: f.x, y: f.y }));

for (let step = 0; step < 60; step++) {
  level.update(0.016, { player: player });
}

let movedCount = 0;
level.fishes.forEach((f, idx) => {
  const init = initialFishPos[idx];
  if (Math.hypot(f.x - init.x, f.y - init.y) > 0.1) {
    movedCount++;
  }
});

console.log(`${movedCount}/${level.fishes.length} fishes actively swimming`);
if (movedCount === 0) throw new Error("Fish are not moving!");
console.log("✓ Fish movement and AI passed!");

// Test mock draw
const mockCtx = {
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
  scale: () => {}
};

level.draw(mockCtx, cam);
console.log("✓ Level.draw executed successfully across infinite ocean viewport!");

console.log("\nALL TESTS PASSED SUCCESSFULLY! 🚀");
