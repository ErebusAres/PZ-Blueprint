import { dataStore, makeFurnitureKey } from "./datastore.js";
import { FURNITURE } from "./catalog.js";
import { buildWallSet, findWallAttachment, rotationToDir } from "./wall-utils.js";
import {
  currentFurniture,
  currentRotation,
  setSelectedFurnitureId
} from "./state.js";

export async function handleFurnitureClick(row, col) {
  const furniture = FURNITURE[currentFurniture];
  const slot = furniture?.stackSlot ?? "base";
  const wallRule = furniture?.wallMount ?? false;
  const key = makeFurnitureKey(row, col, slot);
  const existing = dataStore.findByKey(key);

  let mountDir = null;
  if (wallRule === "wall-only") {
    const wallSet = buildWallSet(dataStore.getAll());
    const preferred = rotationToDir(currentRotation);
    mountDir = findWallAttachment(row, col, wallSet, preferred);
    if (!mountDir) {
      return;
    }
  }

  if (existing) {
    if (
      existing.kind !== currentFurniture ||
      existing.rotation !== currentRotation
    ) {
      const payload = {
        ...existing,
        type: "furniture",
        row,
        col,
        kind: currentFurniture,
        rotation: currentRotation,
        slot
      };
      if (wallRule === "wall-only") {
        payload.mountDir = mountDir;
      } else {
        delete payload.mountDir;
      }
      const result = await dataStore.upsertByKey(payload);
      setSelectedFurnitureId(result.item.id);
      return;
    }

    setSelectedFurnitureId(existing.id);
    return;
  }

  const payload = {
    type: "furniture",
    row,
    col,
    kind: currentFurniture,
    rotation: currentRotation,
    slot
  };
  if (wallRule === "wall-only") {
    payload.mountDir = mountDir;
  }
  const created = await dataStore.create(payload);
  setSelectedFurnitureId(created.item.id);
}
