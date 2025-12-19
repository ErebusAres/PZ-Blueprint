import { dataStore } from "./datastore.js";
import {
  currentMaterial,
  customColorA,
  customColorB,
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
  const tintData = resolveTint(currentMaterial);

  dataStore.upsertByKey({
    type: "floor",
    row,
    col,
    material: currentMaterial,
    ...(tintData?.tint ? { tint: tintData.tint } : {}),
    ...(tintData?.tintSecondary ? { tintSecondary: tintData.tintSecondary } : {}),
    ...(blend ? { blend } : {})
  });
}

function resolveTint(material) {
  if (material === "carpet") {
    return { tint: customColorA };
  }
  if (material === "checkerTile") {
    return { tint: customColorA, tintSecondary: customColorB };
  }
  return null;
}

function buildBlendState() {
  if (blendMode === "none") return null;
  if (!blendSecondary || blendSecondary === currentMaterial) return null;
  const secondaryTint = resolveTint(blendSecondary);
  const secondaryTintPayload = secondaryTint
    ? {
        secondaryTint: secondaryTint.tint,
        ...(secondaryTint.tintSecondary
          ? { secondaryTintSecondary: secondaryTint.tintSecondary }
          : {})
      }
    : null;

  if (blendMode === "diag-manual") {
    return {
      mode: "diag",
      secondary: blendSecondary,
      variant: blendDiagonal,
      ...(secondaryTintPayload ?? {})
    };
  }

  if (blendMode === "quarter-manual") {
    return {
      mode: "quarter",
      secondary: blendSecondary,
      corner: blendQuarter,
      ...(secondaryTintPayload ?? {})
    };
  }

  if (blendMode === "diag-auto") {
    return {
      mode: "diag-auto",
      secondary: blendSecondary,
      ...(secondaryTintPayload ?? {})
    };
  }

  return null;
}

export function resetFloorPaintSession() {
  painted.clear();
}
