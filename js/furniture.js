import { dataStore, makeFurnitureKey } from "./datastore.js";
import {
  currentFurniture,
  currentRotation,
  setSelectedFurnitureId
} from "./state.js";

export async function handleFurnitureClick(row, col) {
  const key = makeFurnitureKey(row, col);
  const existing = dataStore.findByKey(key);

  if (existing) {
    if (
      existing.kind !== currentFurniture ||
      existing.rotation !== currentRotation
    ) {
      const result = await dataStore.upsertByKey({
        ...existing,
        type: "furniture",
        row,
        col,
        kind: currentFurniture,
        rotation: currentRotation
      });
      setSelectedFurnitureId(result.item.id);
      return;
    }

    setSelectedFurnitureId(existing.id);
    return;
  }

  const created = await dataStore.create({
    type: "furniture",
    row,
    col,
    kind: currentFurniture,
    rotation: currentRotation
  });
  setSelectedFurnitureId(created.item.id);
}
