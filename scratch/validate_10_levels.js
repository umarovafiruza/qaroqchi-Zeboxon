const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'script.js');
const code = fs.readFileSync(scriptPath, 'utf8');

// Extract LEVEL_CONFIGS
const startMarker = "const LEVEL_CONFIGS = [";
const endMarker = "class Level {";

const sIdx = code.indexOf(startMarker);
const eIdx = code.indexOf(endMarker);

if (sIdx === -1 || eIdx === -1) {
  console.error("Marker not found");
  process.exit(1);
}

const configsCode = code.substring(sIdx + startMarker.length - 1, eIdx).trim().replace(/;$/, '');
const LEVEL_CONFIGS = eval(configsCode);

console.log(`Total levels loaded: ${LEVEL_CONFIGS.length}`);

if (LEVEL_CONFIGS.length !== 10) {
  console.error(`Expected 10 levels, found ${LEVEL_CONFIGS.length}`);
  process.exit(1);
}

// Simple BFS pathfinder
function canReach(map, cols, rows, start, goal) {
  const isSolid = (c, r) => {
    if (c < 0 || c >= cols || r < 0 || r >= rows) return true;
    const t = parseInt(map[r][c], 10);
    return t === 0 || t === 3 || t === 4;
  };

  if (isSolid(start.x, start.y) || isSolid(goal.x, goal.y)) return false;

  const queue = [{ x: start.x, y: start.y }];
  const visited = new Set([`${start.x},${start.y}`]);

  while (queue.length > 0) {
    const cur = queue.shift();
    if (cur.x === goal.x && cur.y === goal.y) return true;

    const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
    for (const [dx, dy] of dirs) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const key = `${nx},${ny}`;
      if (!visited.has(key) && !isSolid(nx, ny)) {
        visited.add(key);
        queue.push({ x: nx, y: ny });
      }
    }
  }
  return false;
}

LEVEL_CONFIGS.forEach((lvl, i) => {
  const expectedNum = i + 1;
  if (lvl.num !== expectedNum) {
    console.error(`Level index ${i} has num ${lvl.num}, expected ${expectedNum}`);
    process.exit(1);
  }

  const pToKey = canReach(lvl.map, lvl.cols, lvl.rows, lvl.playerStart, lvl.key);
  const keyToChest = canReach(lvl.map, lvl.cols, lvl.rows, lvl.key, lvl.chest);

  if (!pToKey) {
    console.error(`Level ${lvl.num} (${lvl.name}): Path to KEY blocked!`);
    process.exit(1);
  }
  if (!keyToChest) {
    console.error(`Level ${lvl.num} (${lvl.name}): Path from KEY to CHEST blocked!`);
    process.exit(1);
  }

  console.log(`✓ Level ${lvl.num}: "${lvl.name}" (${lvl.cols}x${lvl.rows}) - Enemies: ${lvl.enemies.length}, Cannons: ${lvl.cannons.length}, Traps: ${lvl.traps.length} - Path OK`);
});

console.log("\nALL 10 LEVELS VERIFIED AND PERFECT!");
