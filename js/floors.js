import { dataStore } from "./datastore.js";
import {
  currentMaterial,
  carpetColor,
  checkerColor,
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
  const tint = resolveTint(currentMaterial);

  dataStore.upsertByKey({
    type: "floor",
    row,
    col,
    material: currentMaterial,
    ...(tint ? { tint } : {}),
    ...(blend ? { blend } : {})
  });
}

function resolveTint(material) {
  if (material === "carpet") return carpetColor;
  if (material === "checkerTile") return checkerColor;
  return null;
}

function buildBlendState() {
  if (blendMode === "none") return null;
  if (!blendSecondary || blendSecondary === currentMaterial) return null;
  const secondaryTint = resolveTint(blendSecondary);

  if (blendMode === "diag-manual") {
    return {
      mode: "diag",
      secondary: blendSecondary,
      variant: blendDiagonal,
      ...(secondaryTint ? { secondaryTint } : {})
    };
  }

  if (blendMode === "quarter-manual") {
    return {
      mode: "quarter",
      secondary: blendSecondary,
      corner: blendQuarter,
      ...(secondaryTint ? { secondaryTint } : {})
    };
  }

  if (blendMode === "diag-auto") {
    return {
      mode: "diag-auto",
      secondary: blendSecondary,
      ...(secondaryTint ? { secondaryTint } : {})
    };
  }

  return null;
}

export function resetFloorPaintSession() {
  painted.clear();
}
