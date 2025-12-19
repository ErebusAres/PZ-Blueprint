import { dataStore } from "./datastore.js";
import { currentMaterial, currentWallType } from "./state.js";

const TILE = 40;
let start = null;

export function startRoomDraw(row, col) {
  start = { row, col };
  updatePreview(row, col);
}

export function updateRoomDraw(row, col) {
  if (!start) return;
  updatePreview(row, col);
}

export async function endRoomDraw(row, col) {
  if (!start) return;

  if (typeof row !== "number" || typeof col !== "number") {
    hidePreview();
    start = null;
    return;
  }

  const minRow = Math.min(start.row, row);
  const maxRow = Math.max(start.row, row);
  const minCol = Math.min(start.col, col);
  const maxCol = Math.max(start.col, col);

  hidePreview();

  for (let r = minRow; r <= maxRow; r += 1) {
    for (let c = minCol; c <= maxCol; c += 1) {
      await dataStore.upsertByKey({
        type: "floor",
        row: r,
        col: c,
        material: currentMaterial
      });
    }
  }

  for (let c = minCol; c <= maxCol; c += 1) {
    await dataStore.upsertByKey({
      type: "wall",
      row: minRow,
      col: c,
      dir: "n",
      wallType: currentWallType
    });
    await dataStore.upsertByKey({
      type: "wall",
      row: maxRow,
      col: c,
      dir: "s",
      wallType: currentWallType
    });
  }

  for (let r = minRow; r <= maxRow; r += 1) {
    await dataStore.upsertByKey({
      type: "wall",
      row: r,
      col: minCol,
      dir: "w",
      wallType: currentWallType
    });
    await dataStore.upsertByKey({
      type: "wall",
      row: r,
      col: maxCol,
      dir: "e",
      wallType: currentWallType
    });
  }

  start = null;
}

function updatePreview(endRow, endCol) {
  const preview = document.getElementById("room-preview");
  if (!preview || !start) return;

  const minRow = Math.min(start.row, endRow);
  const maxRow = Math.max(start.row, endRow);
  const minCol = Math.min(start.col, endCol);
  const maxCol = Math.max(start.col, endCol);

  preview.style.display = "block";
  preview.style.left = `${minCol * TILE}px`;
  preview.style.top = `${minRow * TILE}px`;
  preview.style.width = `${(maxCol - minCol + 1) * TILE}px`;
  preview.style.height = `${(maxRow - minRow + 1) * TILE}px`;
}

function hidePreview() {
  const preview = document.getElementById("room-preview");
  if (!preview) return;
  preview.style.display = "none";
}
