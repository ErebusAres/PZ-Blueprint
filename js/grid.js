import { gridRows, gridCols, currentMode } from "./state.js";
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
const LONG_PRESS_MS = 450;
const DRAG_THRESHOLD = 6;

let activePointerId = null;
let previewEl = null;
let listenersAttached = false;
let longPressTimer = null;
let longPressTriggered = false;
let downTile = null;
let downRow = null;
let downCol = null;
let downClientX = 0;
let downClientY = 0;
let hasDragged = false;
let lastEdge = null;

export function initializeGrid() {
  const container = document.getElementById("grid");
  const previewLayer = document.getElementById("preview-layer");

  container.innerHTML = "";
  container.style.display = "grid";
  container.style.gridTemplateColumns = `repeat(${gridCols}, 40px)`;
  container.style.gridTemplateRows = `repeat(${gridRows}, 40px)`;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.dataset.row = row;
      tile.dataset.col = col;
      container.appendChild(tile);
    }
  }

  if (!listenersAttached) {
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerEnd);
    container.addEventListener("pointercancel", onPointerEnd);
    document.addEventListener("pointerup", onPointerEnd);
    document.addEventListener("pointercancel", onPointerEnd);
    document.addEventListener("mode-changed", clearEdgePreview);
    listenersAttached = true;
  }

  function onPointerDown(e) {
    clearEdgePreview();

    if (e.button !== 0) return;
    if (activePointerId !== null) return;

    const tile = getTileFromEvent(e);
    if (!tile) return;

    activePointerId = e.pointerId;
    downTile = tile;
    downRow = Number(tile.dataset.row);
    downCol = Number(tile.dataset.col);
    downClientX = e.clientX;
    downClientY = e.clientY;
    hasDragged = false;
    longPressTriggered = false;
    lastEdge = null;

    if (currentMode !== "cursor") {
      container.setPointerCapture(activePointerId);
    }

    clearLongPressTimer();
    longPressTimer = setTimeout(() => {
      longPressTimer = null;
      longPressTriggered = true;
      clearEdgePreview();
      const edge = getEdgeFromPoint(tile, downClientX, downClientY);
      if (currentMode === "rooms") {
        endRoomDraw(null, null);
      }
      document.dispatchEvent(
        new CustomEvent("tile-long-press", {
          detail: { row: downRow, col: downCol, edge }
        })
      );
    }, LONG_PRESS_MS);
  }

  function onPointerMove(e) {
    const isActivePointer = e.pointerId === activePointerId;
    if (!isEdgeMode() && !isActivePointer) return;

    if (!longPressTriggered && isActivePointer) {
      const dx = e.clientX - downClientX;
      const dy = e.clientY - downClientY;
      if (!hasDragged && dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
        hasDragged = true;
        clearLongPressTimer();
        if (currentMode === "floor" || currentMode === "erase") {
          applyToolDown(downTile, null);
        } else if (currentMode === "rooms") {
          startRoomDraw(downRow, downCol);
        }
      }
    }

    const tile = getTileFromEvent(e);
    if (!tile) {
      if (isEdgeMode()) {
        clearEdgePreview();
      }
      return;
    }

    if (isEdgeMode()) {
      const edge = getEdgeFromEvent(tile, e);
      lastEdge = edge;
      if (edge) {
        showEdgePreview(tile, edge, currentMode);
      } else {
        clearEdgePreview();
      }
      if (!isActivePointer) return;
    }

    if (hasDragged && !longPressTriggered) {
      applyToolMove(tile);
    }
  }

  function onPointerEnd(e) {
    if (e.pointerId !== activePointerId) return;

    clearEdgePreview();
    clearLongPressTimer();

    const tile = getTileFromEvent(e) ?? downTile;
    const row = tile ? Number(tile.dataset.row) : null;
    const col = tile ? Number(tile.dataset.col) : null;

    if (longPressTriggered) {
      resetPointerState();
      return;
    }

    if (hasDragged) {
      if (currentMode === "rooms") {
        if (typeof row === "number" && typeof col === "number") {
          endRoomDraw(row, col);
        } else {
          endRoomDraw(null, null);
        }
      }
    } else if (tile) {
      const edge = isEdgeMode() ? getEdgeFromEvent(tile, e) ?? lastEdge : null;
      applyToolDown(tile, edge);
    }

    if (currentMode === "floor") {
      resetFloorPaintSession();
    }

    resetPointerState();
  }

  function getTileFromEvent(e) {
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return null;

    const tile = el.closest(".tile");
    if (!tile || !container.contains(tile)) return null;

    return tile;
  }

  function getEdgeFromEvent(tile, e) {
    return getEdgeFromPoint(tile, e.clientX, e.clientY);
  }

  function getEdgeFromPoint(tile, clientX, clientY) {
    const rect = tile.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

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

  function clearLongPressTimer() {
    if (!longPressTimer) return;
    clearTimeout(longPressTimer);
    longPressTimer = null;
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

  function applyToolDown(tile, edge) {
    const row = Number(tile.dataset.row);
    const col = Number(tile.dataset.col);

    if (currentMode === "floor") {
      handleFloorClick(row, col);
    } else if (currentMode === "erase") {
      handleErase(row, col);
    } else if (currentMode === "wall") {
      handleWallClick(row, col, edge);
    } else if (currentMode === "door") {
      handleDoorClick(row, col, edge);
    } else if (currentMode === "furniture") {
      handleFurnitureClick(row, col);
    } else if (currentMode === "rooms") {
      startRoomDraw(row, col);
      endRoomDraw(row, col);
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

  function resetPointerState() {
    activePointerId = null;
    downTile = null;
    downRow = null;
    downCol = null;
    hasDragged = false;
    longPressTriggered = false;
    lastEdge = null;
  }
}
