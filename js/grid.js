import {
  ROWS,
  COLS,
  currentMode
} from "./state.js";

import { handleFloorClick } from "./floors.js";
import { handleWallClick } from "./walls.js";
import { handleFurnitureClick } from "./furniture.js";
import { startRoomDraw, updateRoomDraw, endRoomDraw } from "./rooms.js";

let isMouseDown = false;

export function initializeGrid() {
  const container = document.getElementById("grid");
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

      tile.addEventListener("mousedown", e => onMouseDown(e, row, col));
      tile.addEventListener("mouseenter", e => onMouseEnter(e, row, col));
      tile.addEventListener("mouseup", e => onMouseUp(e, row, col));

      container.appendChild(tile);
    }
  }

  document.addEventListener("mouseup", () => {
    isMouseDown = false;
    if (currentMode === "room") endRoomDraw();
  });
}

function onMouseDown(e, row, col) {
  isMouseDown = true;

  if (currentMode === "floor") {
    handleFloorClick(row, col);
  }

  if (currentMode === "wall") {
    handleWallClick(row, col, e);
  }

  if (currentMode === "furniture") {
    handleFurnitureClick(row, col);
  }

  if (currentMode === "room") {
    startRoomDraw(row, col);
  }
}

function onMouseEnter(e, row, col) {
  if (!isMouseDown) return;

  if (currentMode === "floor") {
    handleFloorClick(row, col);
  }

  if (currentMode === "room") {
    updateRoomDraw(row, col);
  }
}

function onMouseUp(e, row, col) {
  isMouseDown = false;

  if (currentMode === "room") {
    endRoomDraw(row, col);
  }
}
