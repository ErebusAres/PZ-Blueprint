import { renderBlueprint } from "./render.js";
import { setBlueprintData } from "./state.js";

const store = [];

// ---- internal helpers ----
function sync() {
  setBlueprintData([...store]);
  renderBlueprint(store);
}

function keyOf(item) {
  if (item.type === "wall") return `wall:${item.row}:${item.col}:${item.dir}`;
  if (item.type === "door") return `door:${item.row}:${item.col}:${item.dir}`;
  if (item.type === "floor") return `floor:${item.row}:${item.col}`;
  if (item.type === "furniture") return `furniture:${item.row}:${item.col}`;
  return `${item.type}:${item.row}:${item.col}:${item.id ?? ""}`;
}

export const dataStore = {
  getAll() {
    return [...store];
  },

  findOne(predicate) {
    return store.find(predicate) ?? null;
  },

  findByKey(key) {
    return store.find(d => keyOf(d) === key) ?? null;
  },

  create(item) {
    item.id = item.id ?? crypto.randomUUID();
    store.push(item);
    sync();
    return Promise.resolve({ isOk: true, item });
  },

  delete(item) {
    const i = store.findIndex(d => d.id === item.id);
    if (i !== -1) store.splice(i, 1);
    sync();
    return Promise.resolve({ isOk: true });
  },

  deleteByKey(key) {
    const i = store.findIndex(d => keyOf(d) === key);
    if (i !== -1) store.splice(i, 1);
    sync();
    return Promise.resolve({ isOk: true });
  },

  upsertByKey(item) {
    const key = keyOf(item);
    const existingIndex = store.findIndex(d => keyOf(d) === key);

    if (existingIndex !== -1) {
      item.id = store[existingIndex].id;
      store[existingIndex] = item;
    } else {
      item.id = item.id ?? crypto.randomUUID();
      store.push(item);
    }

    sync();
    return Promise.resolve({ isOk: true, item });
  }
};

export function makeWallKey(row, col, dir) {
  return `wall:${row}:${col}:${dir}`;
}

export function makeDoorKey(row, col, dir) {
  return `door:${row}:${col}:${dir}`;
}

export function makeFurnitureKey(row, col) {
  return `furniture:${row}:${col}`;
}
