import { MATERIALS, WALL_TYPES, DOOR_TYPES, FURNITURE } from "./catalog.js";
import { createFurnitureIcon } from "./furniture-icons.js";
import { selectedFurnitureId, gridRows, gridCols } from "./state.js";
import { dirToRotation, findWallAttachment, rotationToDir } from "./wall-utils.js";

const TILE = 40;
const WALL_THICKNESS = 4;
const DOOR_THICKNESS = 4;
const DOOR_SPAN = 0.6;
const textureCache = new Map();
const PATTERN_SIZES = {
  sand: 200,
  hay: 200,
  dirt: 200,
  grass: 200,
  dryGrass: 200,
  lushGrass: 200,
  tallGrass: 200,
  carpet: 180,
  checkerTile: TILE,
  concrete: 200,
  wood: 200,
  woodPlank: 200,
  medical: 160,
  bathroom: 160,
  kitchen: 200,
  water: 320,
  concreteBlock: 200,
  parkingLot: 200,
  asphalt: 200,
  brick: 200
};

const DEFAULT_FOOTPRINT = { x: 0.9, y: 0.9 };
const FURNITURE_FOOTPRINTS = {
  bed: { x: 0.95, y: 0.95 },
  medicalBed: { x: 0.95, y: 0.95 },
  chair: { x: 0.6, y: 0.6 },
  deskChair: { x: 0.6, y: 0.6 },
  desk: { x: 0.95, y: 0.85 },
  computer: { x: 0.5, y: 0.5 },
  fileCabinet: { x: 0.75, y: 0.75 },
  sink: { x: 0.45, y: 0.45 },
  steelCounter: { x: 1, y: 0.5 },
  woodCounter: { x: 1, y: 0.5 },
  medicalCounter: { x: 1, y: 0.5 },
  miniFridge: { x: 0.75, y: 0.75 },
  largeFridge: { x: 0.85, y: 0.85 },
  stove: { x: 0.8, y: 0.8 },
  oldOven: { x: 0.8, y: 0.8 },
  washer: { x: 0.75, y: 0.75 },
  dryer: { x: 0.75, y: 0.75 },
  poolTable: { x: 0.95, y: 0.95 },
  jukebox: { x: 0.7, y: 0.7 },
  medicalTray: { x: 0.45, y: 0.45 },
  ivStand: { x: 0.45, y: 0.45 },
  storageBox: { x: 0.6, y: 0.6 },
  shelf: { x: 0.85, y: 0.6 },
  wallShelf: { x: 0.85, y: 0.35 },
  trashcan: { x: 0.55, y: 0.55 },
  waterBarrel: { x: 0.7, y: 0.7 },
  schoolLockers: { x: 0.9, y: 0.45 },
  waterTank: { x: 0.6, y: 0.6 },
  bathroomSink: { x: 0.45, y: 0.45 },
  bathroomCounter: { x: 1, y: 0.5 },
  toilet: { x: 0.65, y: 0.8 },
  shower: { x: 0.9, y: 0.9 }
};

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let result = t;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function adjustColor(hex, amount) {
  const value = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (value & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function randRange(rand, min, max) {
  return min + (max - min) * rand();
}

export function renderBlueprint(data) {
  const floorLayer = document.getElementById("floor-layer");
  const furnitureLayer = document.getElementById("furniture-layer");
  const wallLayer = document.getElementById("wall-layer");
  const doorLayer = document.getElementById("door-layer");

  if (!floorLayer || !furnitureLayer || !wallLayer || !doorLayer) {
    console.warn(
      "Missing #floor-layer, #furniture-layer, #wall-layer, or #door-layer in index.html"
    );
    return;
  }

  floorLayer.innerHTML = "";
  furnitureLayer.innerHTML = "";
  wallLayer.innerHTML = "";
  doorLayer.innerHTML = "";

  const floorMap = new Map();
  const wallSet = new Set();
  const doorSet = new Set();
  const walls = [];
  const doors = [];
  const furnitureItems = [];
  const baseMounts = new Map();

  for (const item of data) {
    if (item.type === "floor") {
      floorMap.set(`${item.row}:${item.col}`, item);
    } else if (item.type === "wall") {
      wallSet.add(`${item.row}:${item.col}:${item.dir}`);
      walls.push(item);
    } else if (item.type === "door") {
      doorSet.add(`${item.row}:${item.col}:${item.dir}`);
      doors.push(item);
    } else if (item.type === "furniture") {
      furnitureItems.push(item);
    }
  }

  for (const item of floorMap.values()) {
    addFloor(floorLayer, item, floorMap, wallSet, doorSet);
  }

  for (const item of walls) {
    addWall(wallLayer, item.row, item.col, item.dir, item.wallType);
  }

  for (const item of doors) {
    addDoor(doorLayer, item.row, item.col, item.dir, item.doorType);
  }

  for (const item of furnitureItems) {
    const config = FURNITURE[item.kind];
    if (!config || config.wallMount !== "wall-only") continue;
    const slot = item.slot ?? "base";
    if (slot !== "base") continue;
    const rotation = item.rotation ?? 0;
    const preferred = item.mountDir ?? rotationToDir(rotation);
    const mountDir = findWallAttachment(item.row, item.col, wallSet, preferred);
    if (mountDir) {
      baseMounts.set(`${item.row}:${item.col}`, mountDir);
    }
  }

  const sortedFurniture = [...furnitureItems].sort((a, b) => {
    const aLayer = getFurnitureLayer(a);
    const bLayer = getFurnitureLayer(b);
    if (aLayer !== bLayer) return aLayer - bLayer;
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  for (const item of sortedFurniture) {
    addFurniture(furnitureLayer, item, wallSet, baseMounts);
  }

  updateMinimap(data);
}

function getFurnitureLayer(item) {
  const slot = item.slot ?? "base";
  const config = FURNITURE[item.kind];
  if (config?.stackLayer) return config.stackLayer;
  return slot === "base" ? 1 : 2;
}

function getFurnitureFootprint(kind, rotation = 0) {
  const footprint = FURNITURE_FOOTPRINTS[kind] ?? DEFAULT_FOOTPRINT;
  let scaleX = footprint.x ?? DEFAULT_FOOTPRINT.x;
  let scaleY = footprint.y ?? DEFAULT_FOOTPRINT.y;
  if (rotation === 90 || rotation === 270) {
    [scaleX, scaleY] = [scaleY, scaleX];
  }
  return { scaleX, scaleY };
}

function addFloor(layer, item, floorMap, wallSet, doorSet) {
  const rotation = item.rotation ?? 0;
  const { scaleX, scaleY } = getFurnitureFootprint(item.kind, rotation);

  const el = document.createElement("div");
  const floorMaterial = item.material ?? "sand";

  el.className = "floor";
  el.style.position = "absolute";
  el.style.left = `${item.col * TILE}px`;
  el.style.top = `${item.row * TILE}px`;
  el.style.width = `${TILE}px`;
  el.style.height = `${TILE}px`;
  applyFloorTexture(el, floorMaterial, item.row, item.col, item.tint);

  if (item.blend) {
    applyFloorBlend(el, item, floorMap, wallSet, doorSet);
  }

  layer.appendChild(el);
}

function applyFloorBlend(el, item, floorMap, wallSet, doorSet) {
  const blend = item.blend;
  if (!blend || !blend.secondary) return;
  if (blend.secondary === item.material) return;

  if (blend.mode === "diag") {
    const corner = blend.variant === "backslash" ? "tr" : "tl";
    addTriangleOverlay(
      el,
      blend.secondary,
      item.row,
      item.col,
      corner,
      blend.secondaryTint
    );
    return;
  }

  if (blend.mode === "quarter") {
    addQuarterOverlay(
      el,
      blend.secondary,
      item.row,
      item.col,
      blend.corner,
      blend.secondaryTint
    );
    return;
  }

  if (blend.mode === "diag-auto") {
    const corner = resolveAutoBlendCorner(
      item.row,
      item.col,
      blend.secondary,
      floorMap,
      wallSet,
      doorSet
    );
    if (corner) {
      addTriangleOverlay(
        el,
        blend.secondary,
        item.row,
        item.col,
        corner,
        blend.secondaryTint
      );
    }
  }
}

function addTriangleOverlay(el, material, row, col, corner, tint) {
  const clipPath = triangleClipPath(corner);
  if (!clipPath) return;
  addBlendOverlay(el, material, row, col, clipPath, tint);
}

function addQuarterOverlay(el, material, row, col, corner, tint) {
  const clipPath = quarterClipPath(corner);
  if (!clipPath) return;
  addBlendOverlay(el, material, row, col, clipPath, tint);
}

function addBlendOverlay(el, material, row, col, clipPath, tint) {
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.pointerEvents = "none";
  applyFloorTexture(overlay, material, row, col, tint);
  overlay.style.clipPath = clipPath;
  el.appendChild(overlay);
}

function applyFloorTexture(el, material, row, col, tint) {
  const pattern = getFloorTexture(material, tint);
  el.style.backgroundImage = `url(${pattern.texture})`;
  el.style.backgroundSize = `${pattern.size}px ${pattern.size}px`;
  el.style.backgroundPosition = `${-col * TILE}px ${-row * TILE}px`;
  el.style.backgroundRepeat = "repeat";
}

function triangleClipPath(corner) {
  if (corner === "tl") return "polygon(0 0, 100% 0, 0 100%)";
  if (corner === "tr") return "polygon(0 0, 100% 0, 100% 100%)";
  if (corner === "bl") return "polygon(0 0, 0 100%, 100% 100%)";
  if (corner === "br") return "polygon(100% 0, 100% 100%, 0 100%)";
  return null;
}

function quarterClipPath(corner) {
  if (corner === "tl") return "polygon(0 0, 50% 0, 0 50%)";
  if (corner === "tr") return "polygon(50% 0, 100% 0, 100% 50%)";
  if (corner === "bl") return "polygon(0 50%, 50% 100%, 0 100%)";
  if (corner === "br") return "polygon(100% 50%, 100% 100%, 50% 100%)";
  return null;
}

function resolveAutoBlendCorner(row, col, secondary, floorMap, wallSet, doorSet) {
  const scores = { tl: 0, tr: 0, bl: 0, br: 0 };

  const n = hasNeighbor(row, col, -1, 0, "n", secondary, floorMap, wallSet, doorSet);
  const s = hasNeighbor(row, col, 1, 0, "s", secondary, floorMap, wallSet, doorSet);
  const w = hasNeighbor(row, col, 0, -1, "w", secondary, floorMap, wallSet, doorSet);
  const e = hasNeighbor(row, col, 0, 1, "e", secondary, floorMap, wallSet, doorSet);

  if (n) {
    scores.tl += 1;
    scores.tr += 1;
  }
  if (s) {
    scores.bl += 1;
    scores.br += 1;
  }
  if (w) {
    scores.tl += 1;
    scores.bl += 1;
  }
  if (e) {
    scores.tr += 1;
    scores.br += 1;
  }

  const nw = hasDiagonal(
    row,
    col,
    -1,
    -1,
    "n",
    "w",
    secondary,
    floorMap,
    wallSet,
    doorSet
  );
  const ne = hasDiagonal(
    row,
    col,
    -1,
    1,
    "n",
    "e",
    secondary,
    floorMap,
    wallSet,
    doorSet
  );
  const sw = hasDiagonal(
    row,
    col,
    1,
    -1,
    "s",
    "w",
    secondary,
    floorMap,
    wallSet,
    doorSet
  );
  const se = hasDiagonal(
    row,
    col,
    1,
    1,
    "s",
    "e",
    secondary,
    floorMap,
    wallSet,
    doorSet
  );

  if (nw) scores.tl += 2;
  if (ne) scores.tr += 2;
  if (sw) scores.bl += 2;
  if (se) scores.br += 2;

  let bestCorner = null;
  let bestScore = 0;

  for (const corner of ["tl", "tr", "bl", "br"]) {
    if (scores[corner] > bestScore) {
      bestScore = scores[corner];
      bestCorner = corner;
    }
  }

  return bestScore > 0 ? bestCorner : null;
}

function hasNeighbor(row, col, dr, dc, dir, secondary, floorMap, wallSet, doorSet) {
  if (edgeBlocked(row, col, dir, wallSet, doorSet)) return false;
  const neighbor = floorMap.get(`${row + dr}:${col + dc}`);
  return neighbor?.material === secondary;
}

function hasDiagonal(
  row,
  col,
  dr,
  dc,
  edgeA,
  edgeB,
  secondary,
  floorMap,
  wallSet,
  doorSet
) {
  if (edgeBlocked(row, col, edgeA, wallSet, doorSet)) return false;
  if (edgeBlocked(row, col, edgeB, wallSet, doorSet)) return false;
  const neighbor = floorMap.get(`${row + dr}:${col + dc}`);
  return neighbor?.material === secondary;
}

function edgeBlocked(row, col, dir, wallSet, doorSet) {
  const key = `${row}:${col}:${dir}`;
  if (wallSet.has(key) || doorSet.has(key)) return true;

  const opposite = { n: "s", s: "n", e: "w", w: "e" };
  const delta = {
    n: { r: -1, c: 0 },
    s: { r: 1, c: 0 },
    e: { r: 0, c: 1 },
    w: { r: 0, c: -1 }
  };

  const next = delta[dir];
  const neighborKey = `${row + next.r}:${col + next.c}:${opposite[dir]}`;
  return wallSet.has(neighborKey) || doorSet.has(neighborKey);
}

function addFurniture(layer, item, wallSet, baseMounts) {
  const furniture = FURNITURE[item.kind];
  if (!furniture) return;

  const [baseWidth, baseHeight] = furniture.size;
  let width = baseWidth;
  let height = baseHeight;
  if (item.rotation === 90 || item.rotation === 270) {
    [width, height] = [baseHeight, baseWidth];
  }

  const rotation = item.rotation ?? 0;
  const baseKey = `${item.row}:${item.col}`;
  const baseMountDir = baseMounts?.get(baseKey) ?? null;
  let displayRotation = rotation;
  let mountDir = null;

  if (furniture.wallMount === "wall-only") {
    const preferred = item.mountDir ?? rotationToDir(rotation);
    mountDir = findWallAttachment(item.row, item.col, wallSet, preferred);
    if (mountDir) {
      displayRotation = dirToRotation(mountDir);
    }
  } else if (baseMountDir) {
    mountDir = baseMountDir;
    displayRotation = dirToRotation(baseMountDir);
  }

  const { scaleX, scaleY } = getFurnitureFootprint(item.kind, displayRotation);

  const el = document.createElement("div");
  el.className = "furniture";
  const slot = item.slot ?? "base";
  if (furniture.within) {
    el.classList.add("furniture-within");
  }
  if (slot !== "base") {
    el.classList.add("furniture-stacked");
  }
  if (item.id && item.id === selectedFurnitureId) {
    el.classList.add("furniture-selected");
  }

  el.style.position = "absolute";
  el.style.zIndex = `${getFurnitureLayer(item)}`;
  el.style.left = `${item.col * TILE}px`;
  el.style.top = `${item.row * TILE}px`;
  el.style.width = `${width * TILE}px`;
  el.style.height = `${height * TILE}px`;
  el.style.backgroundColor = furniture.color;
  el.style.setProperty("--furniture-scale-x", scaleX);
  el.style.setProperty("--furniture-scale-y", scaleY);

  if (mountDir) {
    const shiftX = ((1 - scaleX) * width * TILE) / 2;
    const shiftY = ((1 - scaleY) * height * TILE) / 2;
    if (mountDir === "n") {
      el.style.setProperty("--furniture-shift-y", `${-shiftY}px`);
    } else if (mountDir === "s") {
      el.style.setProperty("--furniture-shift-y", `${shiftY}px`);
    } else if (mountDir === "w") {
      el.style.setProperty("--furniture-shift-x", `${-shiftX}px`);
    } else if (mountDir === "e") {
      el.style.setProperty("--furniture-shift-x", `${shiftX}px`);
    }
    if (furniture.wallMount === "wall-only") {
      el.classList.add("furniture-wall-mounted");
    }
  }

  const icon = createFurnitureIcon(
    item.kind,
    baseWidth,
    baseHeight,
    furniture.color
  );
  icon.style.position = "absolute";
  icon.style.left = "50%";
  icon.style.top = "50%";
  icon.style.width = `${baseWidth * TILE}px`;
  icon.style.height = `${baseHeight * TILE}px`;
  icon.style.transformOrigin = "center";
  icon.style.transform = displayRotation
    ? `translate(-50%, -50%) rotate(${displayRotation}deg)`
    : "translate(-50%, -50%)";
  el.appendChild(icon);

  layer.appendChild(el);
}

function addWall(layer, row, col, dir, wallType = "standard") {
  const wall = document.createElement("div");
  const color = WALL_TYPES[wallType]?.color ?? WALL_TYPES.standard.color;
  const half = WALL_THICKNESS / 2;

  wall.className = `wall wall-${dir}`;
  wall.style.position = "absolute";
  wall.style.background = color;

  const x0 = col * TILE;
  const y0 = row * TILE;

  if (dir === "n") {
    wall.style.left = `${x0 - half}px`;
    wall.style.top = `${y0 - half}px`;
    wall.style.width = `${TILE + WALL_THICKNESS}px`;
    wall.style.height = `${WALL_THICKNESS}px`;
  } else if (dir === "s") {
    wall.style.left = `${x0 - half}px`;
    wall.style.top = `${(row + 1) * TILE - half}px`;
    wall.style.width = `${TILE + WALL_THICKNESS}px`;
    wall.style.height = `${WALL_THICKNESS}px`;
  } else if (dir === "w") {
    wall.style.left = `${x0 - half}px`;
    wall.style.top = `${y0 - half}px`;
    wall.style.width = `${WALL_THICKNESS}px`;
    wall.style.height = `${TILE + WALL_THICKNESS}px`;
  } else if (dir === "e") {
    wall.style.left = `${(col + 1) * TILE - half}px`;
    wall.style.top = `${y0 - half}px`;
    wall.style.width = `${WALL_THICKNESS}px`;
    wall.style.height = `${TILE + WALL_THICKNESS}px`;
  }

  layer.appendChild(wall);
}

function addDoor(layer, row, col, dir, doorType = "standard") {
  const door = document.createElement("div");
  const color = DOOR_TYPES[doorType]?.color ?? DOOR_TYPES.standard.color;
  const half = DOOR_THICKNESS / 2;
  const span = TILE * DOOR_SPAN;
  const offset = (TILE - span) / 2;

  door.className = `door door-${dir}`;
  door.style.position = "absolute";
  door.style.background = color;

  const x0 = col * TILE;
  const y0 = row * TILE;

  if (dir === "n") {
    door.style.left = `${x0 + offset}px`;
    door.style.top = `${y0 - half}px`;
    door.style.width = `${span}px`;
    door.style.height = `${DOOR_THICKNESS}px`;
  } else if (dir === "s") {
    door.style.left = `${x0 + offset}px`;
    door.style.top = `${(row + 1) * TILE - half}px`;
    door.style.width = `${span}px`;
    door.style.height = `${DOOR_THICKNESS}px`;
  } else if (dir === "w") {
    door.style.left = `${x0 - half}px`;
    door.style.top = `${y0 + offset}px`;
    door.style.width = `${DOOR_THICKNESS}px`;
    door.style.height = `${span}px`;
  } else if (dir === "e") {
    door.style.left = `${(col + 1) * TILE - half}px`;
    door.style.top = `${y0 + offset}px`;
    door.style.width = `${DOOR_THICKNESS}px`;
    door.style.height = `${span}px`;
  }

  layer.appendChild(door);
}

function updateMinimap(data) {
  const canvas = document.getElementById("minimap");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const cols = Math.max(1, gridCols);
  const rows = Math.max(1, gridRows);
  const scaleX = width / cols;
  const scaleY = height / rows;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0f141b";
  ctx.fillRect(0, 0, width, height);

  const floorSizeX = Math.max(1, Math.ceil(scaleX));
  const floorSizeY = Math.max(1, Math.ceil(scaleY));

  for (const item of data) {
    if (item.type !== "floor") continue;
    const color =
      item.tint ??
      MATERIALS[item.material]?.color ??
      MATERIALS.sand.color;
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.floor(item.col * scaleX),
      Math.floor(item.row * scaleY),
      floorSizeX,
      floorSizeY
    );
  }

  ctx.lineWidth = 1;
  for (const item of data) {
    if (item.type !== "wall") continue;
    const color = WALL_TYPES[item.wallType]?.color ?? WALL_TYPES.standard.color;
    ctx.strokeStyle = color;
    const x = item.col * scaleX;
    const y = item.row * scaleY;
    if (item.dir === "n") {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + scaleX, y);
      ctx.stroke();
    } else if (item.dir === "s") {
      ctx.beginPath();
      ctx.moveTo(x, y + scaleY);
      ctx.lineTo(x + scaleX, y + scaleY);
      ctx.stroke();
    } else if (item.dir === "w") {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + scaleY);
      ctx.stroke();
    } else if (item.dir === "e") {
      ctx.beginPath();
      ctx.moveTo(x + scaleX, y);
      ctx.lineTo(x + scaleX, y + scaleY);
      ctx.stroke();
    }
  }

  for (const item of data) {
    if (item.type !== "door") continue;
    const color = DOOR_TYPES[item.doorType]?.color ?? DOOR_TYPES.standard.color;
    ctx.strokeStyle = color;
    const x = item.col * scaleX;
    const y = item.row * scaleY;
    const span = 0.6;
    if (item.dir === "n") {
      ctx.beginPath();
      ctx.moveTo(x + scaleX * 0.2, y);
      ctx.lineTo(x + scaleX * (0.2 + span), y);
      ctx.stroke();
    } else if (item.dir === "s") {
      ctx.beginPath();
      ctx.moveTo(x + scaleX * 0.2, y + scaleY);
      ctx.lineTo(x + scaleX * (0.2 + span), y + scaleY);
      ctx.stroke();
    } else if (item.dir === "w") {
      ctx.beginPath();
      ctx.moveTo(x, y + scaleY * 0.2);
      ctx.lineTo(x, y + scaleY * (0.2 + span));
      ctx.stroke();
    } else if (item.dir === "e") {
      ctx.beginPath();
      ctx.moveTo(x + scaleX, y + scaleY * 0.2);
      ctx.lineTo(x + scaleX, y + scaleY * (0.2 + span));
      ctx.stroke();
    }
  }

  for (const item of data) {
    if (item.type !== "furniture") continue;
    const config = FURNITURE[item.kind];
    if (!config) continue;
    const color = config.color;
    const widthTiles = config.size?.[0] ?? 1;
    const heightTiles = config.size?.[1] ?? 1;
    ctx.fillStyle = color;
    ctx.fillRect(
      Math.floor(item.col * scaleX),
      Math.floor(item.row * scaleY),
      Math.max(1, Math.ceil(widthTiles * scaleX)),
      Math.max(1, Math.ceil(heightTiles * scaleY))
    );
  }

  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);
}

function getFloorTexture(material, tint) {
  const size = PATTERN_SIZES[material] ?? 200;
  const cacheKey = tint ? `${material}:${tint}` : material;
  const cached = textureCache.get(cacheKey);
  if (cached && cached.size === size) return cached;
  const texture = createFloorTexture(material, size, tint);
  const payload = { texture, size };
  textureCache.set(cacheKey, payload);
  return payload;
}

function createFloorTexture(material, size, tint) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const baseColor = tint ?? MATERIALS[material]?.color ?? MATERIALS.sand.color;
  const rand = mulberry32(hashString(material));
  const area = size * size;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, size, size);

  if (material === "sand") {
    const speckleCount = Math.round(area / 60);
    for (let i = 0; i < speckleCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const dot = randRange(rand, 0.6, 2.2);
      ctx.fillStyle = rand() > 0.5
        ? "rgba(210, 192, 130, 0.35)"
        : "rgba(190, 172, 110, 0.35)";
      ctx.fillRect(x, y, dot, dot);
    }
    for (let i = 0; i < 10; i += 1) {
      const y = rand() * size;
      ctx.strokeStyle = "rgba(230, 210, 150, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y + randRange(rand, -6, 6));
      ctx.stroke();
    }
  } else if (
    material === "grass" ||
    material === "lushGrass" ||
    material === "dryGrass" ||
    material === "tallGrass"
  ) {
    const baseRand = mulberry32(hashString("grass-base"));
    const baseBladeCount = Math.round(area / 75);
    const baseTint = material === "dryGrass"
      ? "rgba(150, 125, 80, 0.28)"
      : "rgba(70, 110, 60, 0.3)";
    ctx.lineCap = "round";
    for (let i = 0; i < baseBladeCount; i += 1) {
      const x = baseRand() * size;
      const y = baseRand() * size;
      const length = randRange(baseRand, 3, 7);
      const angle = randRange(baseRand, 0, Math.PI * 2);
      ctx.strokeStyle = baseTint;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }

    let bladeCount = Math.round(area / 65);
    let tint = "rgba(80, 120, 50, 0.45)";
    let lengthMin = 3;
    let lengthMax = 8;
    let lineWidth = 0.6;
    let flowerCount = 0;

    if (material === "lushGrass") {
      bladeCount = Math.round(area / 40);
      tint = "rgba(45, 115, 40, 0.55)";
      lengthMin = 4;
      lengthMax = 10;
      lineWidth = 0.7;
    } else if (material === "dryGrass") {
      bladeCount = Math.round(area / 85);
      tint = "rgba(160, 130, 70, 0.5)";
      lengthMin = 3;
      lengthMax = 7;
      lineWidth = 0.55;
    } else if (material === "tallGrass") {
      bladeCount = Math.round(area / 32);
      tint = "rgba(50, 120, 45, 0.55)";
      lengthMin = 6;
      lengthMax = 14;
      lineWidth = 0.8;
      flowerCount = Math.max(4, Math.round(area / 8000));
    }

    for (let i = 0; i < bladeCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const length = randRange(rand, lengthMin, lengthMax);
      const angle = randRange(rand, 0, Math.PI * 2);
      ctx.strokeStyle = tint;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }

    if (flowerCount > 0) {
      const flowerColors = [
        "rgba(245, 183, 196, 0.7)",
        "rgba(247, 216, 122, 0.7)",
        "rgba(242, 242, 236, 0.7)"
      ];
      for (let i = 0; i < flowerCount; i += 1) {
        const x = rand() * size;
        const y = rand() * size;
        const radius = randRange(rand, 1.2, 2.4);
        ctx.fillStyle = flowerColors[Math.floor(rand() * flowerColors.length)];
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (material === "carpet") {
    const base = baseColor;
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);
    const fiberCount = Math.round(area / 35);
    for (let i = 0; i < fiberCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const length = randRange(rand, 2, 6);
      const angle = randRange(rand, 0, Math.PI * 2);
      const shade = rand() > 0.5 ? 10 : -10;
      ctx.strokeStyle = adjustColor(base, shade);
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
    const speckleCount = Math.round(area / 70);
    for (let i = 0; i < speckleCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const dot = randRange(rand, 0.6, 1.8);
      const shade = rand() > 0.5 ? 14 : -14;
      ctx.fillStyle = adjustColor(base, shade);
      ctx.fillRect(x, y, dot, dot);
    }
  } else if (material === "checkerTile") {
    const primary = baseColor;
    const white = "#f2f2ee";
    const half = size / 2;
    ctx.fillStyle = white;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = primary;
    ctx.fillRect(0, 0, half, half);
    ctx.fillRect(half, half, half, half);

    ctx.strokeStyle = "rgba(170, 170, 165, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(half, 0);
    ctx.lineTo(half, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, half);
    ctx.lineTo(size, half);
    ctx.stroke();

    ctx.strokeStyle = "rgba(160, 160, 155, 0.4)";
    ctx.strokeRect(0.5, 0.5, size - 1, size - 1);
  } else if (material === "dirt") {
    const pebbleCount = Math.round(area / 75);
    for (let i = 0; i < pebbleCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const dot = randRange(rand, 1, 3.2);
      ctx.fillStyle = rand() > 0.5
        ? "rgba(120, 95, 60, 0.4)"
        : "rgba(90, 70, 45, 0.35)";
      ctx.beginPath();
      ctx.arc(x, y, dot, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 18; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const radius = randRange(rand, 4, 10);
      ctx.fillStyle = "rgba(70, 50, 30, 0.15)";
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (material === "hay") {
    const strawCount = Math.round(area / 90);
    for (let i = 0; i < strawCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const length = randRange(rand, 6, 18);
      const angle = randRange(rand, -0.4, 0.4);
      ctx.strokeStyle = rand() > 0.5
        ? "rgba(205, 178, 92, 0.5)"
        : "rgba(190, 162, 80, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
  } else if (material === "water") {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    const wrapOffsets = [0, -size, size];
    const drawWrappedCircle = (x, y, radius, color) => {
      ctx.fillStyle = color;
      for (const dx of wrapOffsets) {
        for (const dy of wrapOffsets) {
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawWrappedWave = (baseY, amplitude, frequency, phase, color, width) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      for (const offset of wrapOffsets) {
        ctx.beginPath();
        for (let x = 0; x <= size; x += 8) {
          const y = baseY
            + offset
            + Math.sin((x / size) * Math.PI * 2 * frequency + phase)
              * amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    };

    const hazeCount = Math.round(area / 9000);
    for (let i = 0; i < hazeCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const radius = randRange(rand, 18, 40);
      const color = rand() > 0.5
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.04)";
      drawWrappedCircle(x, y, radius, color);
    }

    const waveCount = 12;
    for (let i = 0; i < waveCount; i += 1) {
      const baseY = rand() * size;
      const amplitude = randRange(rand, 2, 6);
      const frequency = Math.floor(randRange(rand, 1, 3));
      const phase = randRange(rand, 0, Math.PI * 2);
      const width = randRange(rand, 0.6, 1.1);
      drawWrappedWave(
        baseY,
        amplitude,
        frequency,
        phase,
        "rgba(255, 255, 255, 0.08)",
        width
      );
    }
    const shimmerCount = Math.round(area / 1100);
    for (let i = 0; i < shimmerCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const w = randRange(rand, 6, 14);
      const h = randRange(rand, 1, 3);
      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      for (const dx of wrapOffsets) {
        for (const dy of wrapOffsets) {
          ctx.fillRect(x + dx, y + dy, w, h);
        }
      }
    }
  } else if (material === "wood") {
    let y = 0;
    while (y < size) {
      const plankHeight = Math.round(randRange(rand, 14, 26));
      const shade = Math.round(randRange(rand, -24, 8));
      ctx.fillStyle = adjustColor(baseColor, shade);
      ctx.fillRect(0, y, size, plankHeight);
      ctx.strokeStyle = "rgba(70, 50, 30, 0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(size, y + randRange(rand, -3, 3));
      ctx.stroke();

      const knotCount = Math.round(randRange(rand, 1, 3));
      for (let i = 0; i < knotCount; i += 1) {
        const knotX = rand() * size;
        const knotY = y + randRange(rand, 4, Math.max(6, plankHeight - 4));
        const knotRadius = randRange(rand, 2, 4);
        ctx.strokeStyle = "rgba(85, 60, 40, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(knotX, knotY, knotRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      y += plankHeight;
    }
    for (let i = 0; i < 45; i += 1) {
      const x = rand() * size;
      const yScratch = rand() * size;
      const length = randRange(rand, 12, 35);
      ctx.strokeStyle = "rgba(95, 70, 45, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, yScratch);
      ctx.lineTo(x + length, yScratch + randRange(rand, -3, 3));
      ctx.stroke();
    }
  } else if (material === "woodPlank") {
    const plankHeight = 20;
    for (let y = 0; y < size; y += plankHeight) {
      const shade = Math.round(randRange(rand, -8, 10));
      ctx.fillStyle = adjustColor(baseColor, shade);
      ctx.fillRect(0, y, size, plankHeight);
      ctx.strokeStyle = "rgba(85, 60, 40, 0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(size, y + 0.5);
      ctx.stroke();

      for (let x = 14; x < size; x += 40) {
        ctx.fillStyle = "rgba(70, 50, 35, 0.5)";
        ctx.beginPath();
        ctx.arc(x, y + 6, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y + plankHeight - 6, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (let i = 0; i < 30; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const length = randRange(rand, 16, 30);
      ctx.strokeStyle = "rgba(105, 80, 55, 0.18)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + length, y + randRange(rand, -1.5, 1.5));
      ctx.stroke();
    }
  } else if (material === "concrete") {
    const speckleCount = Math.round(area / 45);
    for (let i = 0; i < speckleCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const dot = randRange(rand, 0.5, 2.6);
      ctx.fillStyle = rand() > 0.5
        ? "rgba(190, 190, 185, 0.25)"
        : "rgba(160, 160, 155, 0.2)";
      ctx.fillRect(x, y, dot, dot);
    }
    for (let i = 0; i < 8; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      ctx.strokeStyle = "rgba(120, 120, 115, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + randRange(rand, -40, 40), y + randRange(rand, -40, 40));
      ctx.stroke();
    }
  } else if (material === "concreteBlock") {
    const slab = TILE;
    ctx.lineWidth = 1;
    for (let y = 0; y < size; y += slab) {
      for (let x = 0; x < size; x += slab) {
        const shade = Math.round(randRange(rand, -8, 8));
        ctx.fillStyle = adjustColor(baseColor, shade);
        ctx.fillRect(x, y, slab, slab);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.28)";
        ctx.beginPath();
        ctx.moveTo(x + 1, y + 1);
        ctx.lineTo(x + slab - 1, y + 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 1, y + 1);
        ctx.lineTo(x + 1, y + slab - 1);
        ctx.stroke();

        ctx.strokeStyle = "rgba(125, 125, 120, 0.45)";
        ctx.beginPath();
        ctx.moveTo(x + slab - 1, y + 1);
        ctx.lineTo(x + slab - 1, y + slab - 1);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 1, y + slab - 1);
        ctx.lineTo(x + slab - 1, y + slab - 1);
        ctx.stroke();

        if (rand() > 0.7) {
          const crackX = x + randRange(rand, 6, slab - 6);
          const crackY = y + randRange(rand, 6, slab - 6);
          const crackLen = randRange(rand, 8, 18);
          const crackAngle = randRange(rand, -0.5, 0.5);
          ctx.strokeStyle = "rgba(110, 110, 105, 0.35)";
          ctx.beginPath();
          ctx.moveTo(crackX, crackY);
          ctx.lineTo(
            crackX + Math.cos(crackAngle) * crackLen,
            crackY + Math.sin(crackAngle) * crackLen
          );
          ctx.stroke();
        }
      }
    }
    const gritCount = Math.round(area / 55);
    for (let i = 0; i < gritCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const dot = randRange(rand, 0.6, 1.8);
      ctx.fillStyle = "rgba(175, 170, 160, 0.28)";
      ctx.fillRect(x, y, dot, dot);
    }
  } else if (material === "parkingLot" || material === "asphalt") {
    const aggregateCount = Math.round(
      area / (material === "asphalt" ? 35 : 45)
    );
    for (let i = 0; i < aggregateCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const dot = randRange(rand, 0.6, 2.4);
      ctx.fillStyle = material === "asphalt"
        ? "rgba(90, 90, 90, 0.32)"
        : "rgba(120, 115, 105, 0.32)";
      ctx.fillRect(x, y, dot, dot);
    }
    for (let i = 0; i < 10; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      ctx.strokeStyle = "rgba(80, 75, 70, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + randRange(rand, -50, 50), y + randRange(rand, -50, 50));
      ctx.stroke();
    }
  } else if (material === "medical") {
    const tile = 20;
    ctx.strokeStyle = "rgba(210, 215, 214, 0.9)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= size; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += tile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    const highlightCount = Math.round(area / 200);
    for (let i = 0; i < highlightCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const dim = randRange(rand, 3, 6);
      ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
      ctx.fillRect(x, y, dim, dim);
    }
  } else if (material === "bathroom") {
    const tile = 16;
    ctx.strokeStyle = "rgba(190, 205, 214, 0.9)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= size; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += tile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    const fleckCount = Math.round(area / 220);
    for (let i = 0; i < fleckCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const dim = randRange(rand, 2, 4);
      ctx.fillStyle = "rgba(225, 235, 240, 0.18)";
      ctx.fillRect(x, y, dim, dim);
    }
  } else if (material === "kitchen") {
    const tile = 40;
    ctx.strokeStyle = "rgba(205, 195, 180, 0.6)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= size; x += tile) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }
    for (let y = 0; y <= size; y += tile) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    const speckleCount = Math.round(area / 55);
    const fleckColors = [
      "rgba(220, 205, 180, 0.35)",
      "rgba(190, 175, 150, 0.3)",
      "rgba(160, 150, 130, 0.25)"
    ];
    for (let i = 0; i < speckleCount; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const dot = randRange(rand, 0.6, 2.2);
      ctx.fillStyle = fleckColors[Math.floor(rand() * fleckColors.length)];
      ctx.fillRect(x, y, dot, dot);
    }
  } else if (material === "brick") {
    const brickW = 40;
    const brickH = 20;
    const mortar = adjustColor(baseColor, 30);
    ctx.fillStyle = mortar;
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += brickH) {
      const offset = ((y / brickH) % 2) * (brickW / 2);
      for (let x = -offset; x < size; x += brickW) {
        const shade = Math.round(randRange(rand, -18, 12));
        ctx.fillStyle = adjustColor(baseColor, shade);
        ctx.fillRect(x + 1, y + 1, brickW - 2, brickH - 2);
      }
    }
  }

  return canvas.toDataURL();
}





