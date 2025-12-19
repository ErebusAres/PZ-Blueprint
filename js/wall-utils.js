const OPPOSITE = { n: "s", s: "n", e: "w", w: "e" };
const DELTA = {
  n: { r: -1, c: 0 },
  s: { r: 1, c: 0 },
  e: { r: 0, c: 1 },
  w: { r: 0, c: -1 }
};

export function rotationToDir(rotation) {
  const normalized = ((rotation % 360) + 360) % 360;
  if (normalized === 90) return "e";
  if (normalized === 180) return "s";
  if (normalized === 270) return "w";
  return "n";
}

export function dirToRotation(dir) {
  if (dir === "e") return 90;
  if (dir === "s") return 180;
  if (dir === "w") return 270;
  return 0;
}

export function buildWallSet(data) {
  const wallSet = new Set();
  for (const item of data) {
    if (item.type === "wall") {
      wallSet.add(`${item.row}:${item.col}:${item.dir}`);
    }
  }
  return wallSet;
}

export function hasWall(row, col, dir, wallSet) {
  const key = `${row}:${col}:${dir}`;
  if (wallSet.has(key)) return true;
  const next = DELTA[dir];
  const neighborKey = `${row + next.r}:${col + next.c}:${OPPOSITE[dir]}`;
  return wallSet.has(neighborKey);
}

export function findWallAttachment(row, col, wallSet, preferredDir) {
  if (!wallSet || wallSet.size === 0) return null;
  if (preferredDir && hasWall(row, col, preferredDir, wallSet)) return preferredDir;
  for (const dir of ["n", "e", "s", "w"]) {
    if (hasWall(row, col, dir, wallSet)) return dir;
  }
  return null;
}
