import { dataStore } from "./datastore.js";
import {
  currentMaterial,
  blendMode,
  blendSecondary,
  blendDiagonal,
  blendQuarter
} from "./state.js";

const painted = new Set();

export function handleFloorClick(row, col) {
  const key = `${row},${col}`;
  if (painted.has(key)) return;

  painted.add(key);

  const blend = buildBlendState();

  dataStore.upsertByKey({
    type: "floor",
    row,
    col,
    material: currentMaterial,
    ...(blend ? { blend } : {})
  });
}

function buildBlendState() {
  if (blendMode === "none") return null;
  if (!blendSecondary || blendSecondary === currentMaterial) return null;

  if (blendMode === "diag-manual") {
    return {
      mode: "diag",
      secondary: blendSecondary,
      variant: blendDiagonal
    };
  }

  if (blendMode === "quarter-manual") {
    return {
      mode: "quarter",
      secondary: blendSecondary,
      corner: blendQuarter
    };
  }

  if (blendMode === "diag-auto") {
    return {
      mode: "diag-auto",
      secondary: blendSecondary
    };
  }

  return null;
}

export function resetFloorPaintSession() {
  painted.clear();
}
