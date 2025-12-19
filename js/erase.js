import { dataStore } from "./datastore.js";

export function handleErase(row, col) {
  const all = dataStore.getAll();

  const targets = all.filter(item =>
    item.row === row &&
    item.col === col
  );

  for (const item of targets) {
    dataStore.delete(item);
  }
}
