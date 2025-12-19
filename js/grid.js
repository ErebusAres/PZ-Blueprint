import { ROWS, COLS, currentMode } from "./state.js";
import { handleFloorClick, resetFloorPaintSession } from "./floors.js";
import { handleWallClick } from "./walls.js";
import { handleDoorClick } from "./doors.js";
import { handleFurnitureClick } from "./furniture.js";
import { startRoomDraw, updateRoomDraw, endRoomDraw } from "./rooms.js";
import { handleErase } from "./erase.js";

const TILE = 40;
const WALL_THICKNESS = 4;
const DOOR_THICKNESS = 4;
const DOOR_SPAN = 0.6;

let activePointerId = null;
let previewEl = null;

export function initializeGrid() {
  const container = document.getElementById("grid");
  const previewLayer = document.getElementById("preview-layer");

  container.innerHTML = "";
  container.style.display = "grid";
  container.style.gridTemplateColumns = `repeat(${COLS}, 40px)`;
  container.style.gridTemplateRows = `repeat(${ROWS}, 40px)`;

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.row = row;
      tile.dataset.col = col;
      container.appendChild(tile);
    }
  }

  container.addEventListener("pointerdown", onPointerDown);
  container.addEventListener("pointermove", onPointerMove);
  container.addEventListener("pointerup", onPointerEnd);
  container.addEventListener("pointercancel", onPointerEnd);
  document.addEventListener("mode-changed", clearEdgePreview);

  function onPointerDown(e) {
    clearEdgePreview();

    if (currentMode === "cursor") return;
    if (e.button !== 0) return;
    if (activePointerId !== null) return;

    const tile = getTileFromEvent(e);
    if (!tile) return;

    activePointerId = e.pointerId;
    container.setPointerCapture(activePointerId);

    applyToolDown(tile, e);
  }

  function onPointerMove(e) {
    if (!isEdgeMode() && e.pointerId !== activePointerId) return;

    const tile = getTileFromEvent(e);
    if (!tile) {
      clearEdgePreview();
      return;
    }

    if (isEdgeMode()) {
      const edge = getEdgeFromEvent(tile, e);
      if (edge) {
        showEdgePreview(tile, edge, currentMode);
      } else {
        clearEdgePreview();
      }
      return;
    }

    applyToolMove(tile);
  }

  function onPointerEnd(e) {
    clearEdgePreview();

    if (e.pointerId !== activePointerId) return;

    activePointerId = null;

    if (currentMode === "floor") {
      resetFloorPaintSession();
    }

    if (currentMode === "rooms") {
      const tile = getTileFromEvent(e);
      if (tile) {
        const row = Number(tile.dataset.row);
        const col = Number(tile.dataset.col);
        endRoomDraw(row, col);
      } else {
        endRoomDraw(null, null);
      }
    }
  }

  function getTileFromEvent(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return null;

    const tile = el.closest(".tile");
    if (!tile || !container.contains(tile)) return null;

    return tile;
  }

  function getEdgeFromEvent(tile, e) {
    const rect = tile.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const distN = y;
    const distS = rect.height - y;
    const distW = x;
    const distE = rect.width - x;

    const min = Math.min(distN, distS, distW, distE);

    if (min === distN) return "n";
    if (min === distS) return "s";
    if (min === distW) return "w";
    return "e";
  }

  function isEdgeMode() {
    return currentMode === "wall" || currentMode === "door";
  }

  function clearEdgePreview() {
    if (!previewEl) return;
    previewEl.remove();
    previewEl = null;
  }

  function showEdgePreview(tile, edge, mode) {
    if (!previewLayer) return;

    if (!previewEl) {
      previewEl = document.createElement("div");
      previewLayer.appendChild(previewEl);
    }

    previewEl.className = `edge-preview ${mode}`;

    const row = Number(tile.dataset.row);
    const col = Number(tile.dataset.col);
    const x0 = col * TILE;
    const y0 = row * TILE;

    if (mode === "wall") {
      const half = WALL_THICKNESS / 2;
      if (edge === "n") {
        previewEl.style.left = `${x0 - half}px`;
        previewEl.style.top = `${y0 - half}px`;
        previewEl.style.width = `${TILE + WALL_THICKNESS}px`;
        previewEl.style.height = `${WALL_THICKNESS}px`;
      } else if (edge === "s") {
        previewEl.style.left = `${x0 - half}px`;
        previewEl.style.top = `${(row + 1) * TILE - half}px`;
        previewEl.style.width = `${TILE + WALL_THICKNESS}px`;
        previewEl.style.height = `${WALL_THICKNESS}px`;
      } else if (edge === "w") {
        previewEl.style.left = `${x0 - half}px`;
        previewEl.style.top = `${y0 - half}px`;
        previewEl.style.width = `${WALL_THICKNESS}px`;
        previewEl.style.height = `${TILE + WALL_THICKNESS}px`;
      } else if (edge === "e") {
        previewEl.style.left = `${(col + 1) * TILE - half}px`;
        previewEl.style.top = `${y0 - half}px`;
        previewEl.style.width = `${WALL_THICKNESS}px`;
        previewEl.style.height = `${TILE + WALL_THICKNESS}px`;
      }
      return;
    }

    const half = DOOR_THICKNESS / 2;
    const span = TILE * DOOR_SPAN;
    const offset = (TILE - span) / 2;

    if (edge === "n") {
      previewEl.style.left = `${x0 + offset}px`;
      previewEl.style.top = `${y0 - half}px`;
      previewEl.style.width = `${span}px`;
      previewEl.style.height = `${DOOR_THICKNESS}px`;
    } else if (edge === "s") {
      previewEl.style.left = `${x0 + offset}px`;
      previewEl.style.top = `${(row + 1) * TILE - half}px`;
      previewEl.style.width = `${span}px`;
      previewEl.style.height = `${DOOR_THICKNESS}px`;
    } else if (edge === "w") {
      previewEl.style.left = `${x0 - half}px`;
      previewEl.style.top = `${y0 + offset}px`;
      previewEl.style.width = `${DOOR_THICKNESS}px`;
      previewEl.style.height = `${span}px`;
    } else if (edge === "e") {
      previewEl.style.left = `${(col + 1) * TILE - half}px`;
      previewEl.style.top = `${y0 + offset}px`;
      previewEl.style.width = `${DOOR_THICKNESS}px`;
      previewEl.style.height = `${span}px`;
    }
  }

  function applyToolDown(tile, e) {
    const row = Number(tile.dataset.row);
    const col = Number(tile.dataset.col);

    if (currentMode === "floor") {
      handleFloorClick(row, col);
    } else if (currentMode === "erase") {
      handleErase(row, col);
    } else if (currentMode === "wall") {
      handleWallClick(row, col, e);
    } else if (currentMode === "door") {
      handleDoorClick(row, col, e);
    } else if (currentMode === "furniture") {
      handleFurnitureClick(row, col);
    } else if (currentMode === "rooms") {
      startRoomDraw(row, col);
    }
  }

  function applyToolMove(tile) {
    const row = Number(tile.dataset.row);
    const col = Number(tile.dataset.col);

    if (currentMode === "floor") {
      handleFloorClick(row, col);
    } else if (currentMode === "erase") {
      handleErase(row, col);
    } else if (currentMode === "rooms") {
      updateRoomDraw(row, col);
    }
  }
}
