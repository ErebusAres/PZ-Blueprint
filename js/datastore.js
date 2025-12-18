import { renderBlueprint } from "./render.js";
import { setBlueprintData } from "./state.js";

const store = [];

export const dataStore = {
  create(item) {
    item.id = crypto.randomUUID();
    store.push(item);
    setBlueprintData([...store]);
    renderBlueprint(store);
    return Promise.resolve({ isOk: true });
  },

  delete(item) {
    const i = store.findIndex(d => d.id === item.id);
    if (i !== -1) store.splice(i, 1);
    setBlueprintData([...store]);
    renderBlueprint(store);
    return Promise.resolve({ isOk: true });
  },

  update(item) {
    const i = store.findIndex(d => d.id === item.id);
    if (i !== -1) store[i] = item;
    setBlueprintData([...store]);
    renderBlueprint(store);
    return Promise.resolve({ isOk: true });
  }
};

export async function deleteAt(row, col) {
  const matches = store.filter(
    item => item.row === row && item.col === col
  );

  for (const item of matches) {
    await dataStore.delete(item);
  }
}

export function getAll() {
  return [...store];
}

