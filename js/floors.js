import { dataStore } from "./datastore.js";

const painted = new Set();

export function handleFloorClick(row, col) {
  const key = `${row},${col}`;
  if (painted.has(key)) return;

  painted.add(key);

  dataStore.create({
    type: "floor",
    row,
    col
  });
}

export function resetFloorPaintSession() {
  painted.clear();
}
