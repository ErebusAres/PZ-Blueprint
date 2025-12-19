import { MATERIALS, WALL_TYPES, DOOR_TYPES, FURNITURE } from "./catalog.js";
import { createFurnitureIcon } from "./furniture-icons.js";
import { selectedFurnitureId } from "./state.js";

const TILE = 40;
const WALL_THICKNESS = 4;
const DOOR_THICKNESS = 4;
const DOOR_SPAN = 0.6;
const textureCache = new Map();

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
    addFurniture(furnitureLayer, item);
  }
}

function addFloor(layer, item, floorMap, wallSet, doorSet) {
  const el = document.createElement("div");
  const floorMaterial = item.material ?? "sand";
  const texture = getFloorTexture(floorMaterial, item.row, item.col);

  el.className = "floor";
  el.style.position = "absolute";
  el.style.left = `${item.col * TILE}px`;
  el.style.top = `${item.row * TILE}px`;
  el.style.width = `${TILE}px`;
  el.style.height = `${TILE}px`;
  el.style.backgroundImage = `url(${texture})`;

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
    addTriangleOverlay(el, blend.secondary, item.row, item.col, corner);
    return;
  }

  if (blend.mode === "quarter") {
    addQuarterOverlay(el, blend.secondary, item.row, item.col, blend.corner);
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
      addTriangleOverlay(el, blend.secondary, item.row, item.col, corner);
    }
  }
}

function addTriangleOverlay(el, material, row, col, corner) {
  const clipPath = triangleClipPath(corner);
  if (!clipPath) return;
  addBlendOverlay(el, material, row, col, clipPath);
}

function addQuarterOverlay(el, material, row, col, corner) {
  const clipPath = quarterClipPath(corner);
  if (!clipPath) return;
  addBlendOverlay(el, material, row, col, clipPath);
}

function addBlendOverlay(el, material, row, col, clipPath) {
  const overlay = document.createElement("div");
  overlay.style.position = "absolute";
  overlay.style.inset = "0";
  overlay.style.pointerEvents = "none";
  overlay.style.backgroundImage = `url(${getFloorTexture(material, row, col)})`;
  overlay.style.backgroundSize = "cover";
  overlay.style.backgroundPosition = "center";
  overlay.style.clipPath = clipPath;
  el.appendChild(overlay);
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

function addFurniture(layer, item) {
  const furniture = FURNITURE[item.kind];
  if (!furniture) return;

  const [baseWidth, baseHeight] = furniture.size;
  let width = baseWidth;
  let height = baseHeight;
  if (item.rotation === 90 || item.rotation === 270) {
    [width, height] = [baseHeight, baseWidth];
  }

  const el = document.createElement("div");
  el.className = "furniture";
  if (furniture.within) {
    el.classList.add("furniture-within");
  }
  if (item.id && item.id === selectedFurnitureId) {
    el.classList.add("furniture-selected");
  }

  el.style.position = "absolute";
  el.style.left = `${item.col * TILE}px`;
  el.style.top = `${item.row * TILE}px`;
  el.style.width = `${width * TILE}px`;
  el.style.height = `${height * TILE}px`;
  el.style.background = furniture.color;

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
  icon.style.transform = item.rotation
    ? `translate(-50%, -50%) rotate(${item.rotation}deg)`
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

function getFloorTexture(material, row, col) {
  const key = `${material}:${row}:${col}`;
  if (textureCache.has(key)) return textureCache.get(key);
  const texture = createFloorTexture(material, row, col);
  textureCache.set(key, texture);
  return texture;
}

function createFloorTexture(material, row, col) {
  const canvas = document.createElement("canvas");
  canvas.width = TILE;
  canvas.height = TILE;
  const ctx = canvas.getContext("2d");
  const baseColor = MATERIALS[material]?.color ?? MATERIALS.sand.color;

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, TILE, TILE);

  const random = seed => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  const seed = row * 1000 + col;

  if (material === "sand") {
    for (let i = 0; i < 28; i += 1) {
      const x = random(seed + i * 7) * TILE;
      const y = random(seed + i * 11) * TILE;
      const size = random(seed + i * 13) * 2 + 0.5;
      ctx.fillStyle = `rgba(200, 182, 120, 0.35)`;
      ctx.fillRect(x, y, size, size);
    }
  } else if (material === "grass" || material === "lushGrass" || material === "dryGrass") {
    const bladeCount = material === "lushGrass" ? 70 : material === "dryGrass" ? 30 : 50;
    for (let i = 0; i < bladeCount; i += 1) {
      const x = random(seed + i * 7) * TILE;
      const y = random(seed + i * 11) * TILE;
      const length = random(seed + i * 13) * 4 + 2;
      const angle = random(seed + i * 17) * Math.PI * 2;
      const tint =
        material === "lushGrass"
          ? `rgba(50, 110, 40, 0.5)`
          : material === "dryGrass"
            ? `rgba(150, 125, 60, 0.45)`
            : `rgba(80, 120, 50, 0.45)`;
      ctx.strokeStyle = tint;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
  } else if (material === "dirt") {
    for (let i = 0; i < 40; i += 1) {
      const x = random(seed + i * 7) * TILE;
      const y = random(seed + i * 11) * TILE;
      const size = random(seed + i * 13) * 3 + 1;
      ctx.fillStyle = `rgba(110, 90, 55, 0.35)`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (material === "hay") {
    for (let i = 0; i < 24; i += 1) {
      const x = random(seed + i * 7) * TILE;
      const y = random(seed + i * 11) * TILE;
      const length = random(seed + i * 13) * 8 + 3;
      const angle = random(seed + i * 17) * Math.PI * 2;
      ctx.strokeStyle = `rgba(200, 180, 90, 0.45)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
      ctx.stroke();
    }
  } else if (material === "water") {
    const gradient = ctx.createLinearGradient(0, 0, TILE, TILE);
    gradient.addColorStop(0, "#5AA3E8");
    gradient.addColorStop(0.5, "#4A90E2");
    gradient.addColorStop(1, "#3A7DC2");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, TILE, TILE);
    for (let i = 0; i < 5; i += 1) {
      const x = random(seed + i * 7) * TILE;
      const y = random(seed + i * 11) * TILE;
      const radius = random(seed + i * 13) * 8 + 4;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (material === "wood") {
    for (let i = 0; i < 8; i += 1) {
      const y = i * 5;
      ctx.strokeStyle = `rgba(120, 90, 60, 0.3)`;
      ctx.lineWidth = random(seed + i * 17) * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(TILE, y + random(seed + i * 19) * 4 - 2);
      ctx.stroke();
    }
  } else if (material === "concrete") {
    for (let i = 0; i < 50; i += 1) {
      const x = random(seed + i * 7) * TILE;
      const y = random(seed + i * 11) * TILE;
      const size = random(seed + i * 13) * 1.5;
      ctx.fillStyle = "rgba(190, 190, 185, 0.2)";
      ctx.fillRect(x, y, size, size);
    }
  } else if (material === "concreteBlock") {
    ctx.strokeStyle = "#a8a5a0";
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, TILE - 4, TILE - 4);
    for (let i = 0; i < 18; i += 1) {
      const x = random(seed + i * 7) * (TILE - 4) + 2;
      const y = random(seed + i * 11) * (TILE - 4) + 2;
      const size = random(seed + i * 13) * 2;
      ctx.fillStyle = "rgba(175, 170, 165, 0.3)";
      ctx.fillRect(x, y, size, size);
    }
  } else if (material === "parkingLot" || material === "asphalt") {
    for (let i = 0; i < 70; i += 1) {
      const x = random(seed + i * 7) * TILE;
      const y = random(seed + i * 11) * TILE;
      const size = random(seed + i * 13) * 1.5 + 0.5;
      ctx.fillStyle = material === "asphalt"
        ? "rgba(90, 90, 90, 0.3)"
        : "rgba(120, 115, 105, 0.3)";
      ctx.fillRect(x, y, size, size);
    }
  } else if (material === "medical" || material === "bathroom") {
    ctx.strokeStyle = material === "medical" ? "#e8eae9" : "#c5d3d8";
    ctx.lineWidth = 1;
    ctx.strokeRect(1, 1, TILE - 2, TILE - 2);
    for (let i = 0; i < 10; i += 1) {
      const x = random(seed + i * 7) * (TILE - 4) + 2;
      const y = random(seed + i * 11) * (TILE - 4) + 2;
      ctx.fillStyle = material === "medical"
        ? "rgba(235, 240, 238, 0.3)"
        : "rgba(205, 220, 228, 0.3)";
      ctx.fillRect(x, y, 2, 2);
    }
  } else if (material === "kitchen" || material === "brick") {
    for (let i = 0; i < 15; i += 1) {
      const x = random(seed + i * 7) * (TILE - 4) + 2;
      const y = random(seed + i * 11) * (TILE - 4) + 2;
      const size = random(seed + i * 13) * 2 + 1;
      ctx.fillStyle = material === "brick"
        ? "rgba(110, 90, 80, 0.35)"
        : "rgba(215, 205, 185, 0.3)";
      ctx.fillRect(x, y, size, size);
    }
  }

  return canvas.toDataURL();
}
