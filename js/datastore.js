import { renderBlueprint } from "./render.js";
import { setBlueprintData } from "./state.js";

const store = [];
const history = [JSON.stringify(store)];
const future = [];
let isRestoring = false;

// ---- internal helpers ----
function sync() {
  setBlueprintData([...store]);
  renderBlueprint(store);
  if (!isRestoring) {
    history.push(JSON.stringify(store));
    if (history.length > 60) {
      history.shift();
    }
    future.length = 0;
  }
  document.dispatchEvent(new CustomEvent("blueprint-changed"));
}

function keyOf(item) {
  if (item.type === "wall") return `wall:${item.row}:${item.col}:${item.dir}`;
  if (item.type === "door") return `door:${item.row}:${item.col}:${item.dir}`;
  if (item.type === "floor") return `floor:${item.row}:${item.col}`;
  if (item.type === "furniture") {
    const slot = item.slot ?? "base";
    return `furniture:${item.row}:${item.col}:${slot}`;
  }
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
  },

  replaceAll(items) {
    store.length = 0;
    for (const item of items) {
      store.push(item);
    }
    history.length = 0;
    history.push(JSON.stringify(store));
    future.length = 0;
    isRestoring = true;
    sync();
    isRestoring = false;
    return Promise.resolve({ isOk: true, count: store.length });
  },

  canUndo() {
    return history.length > 1;
  },

  canRedo() {
    return future.length > 0;
  },

  undo() {
    if (history.length <= 1) {
      return { isOk: false };
    }
    const current = history.pop();
    future.push(current);
    const previous = history[history.length - 1];
    isRestoring = true;
    store.length = 0;
    for (const item of JSON.parse(previous)) {
      store.push(item);
    }
    sync();
    isRestoring = false;
    return { isOk: true };
  },

  redo() {
    if (future.length === 0) {
      return { isOk: false };
    }
    const next = future.pop();
    history.push(next);
    isRestoring = true;
    store.length = 0;
    for (const item of JSON.parse(next)) {
      store.push(item);
    }
    sync();
    isRestoring = false;
    return { isOk: true };
  }
};

export function makeWallKey(row, col, dir) {
  return `wall:${row}:${col}:${dir}`;
}

export function makeDoorKey(row, col, dir) {
  return `door:${row}:${col}:${dir}`;
}

export function makeFurnitureKey(row, col, slot = "base") {
  return `furniture:${row}:${col}:${slot}`;
}
