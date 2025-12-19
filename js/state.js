export const ROWS = 50;
export const COLS = 50;

export let currentMode = "cursor";
export let currentMaterial = "sand";
export let currentFurniture = "bed";
export let currentWallType = "standard";
export let currentDoorType = "standard";
export let currentRotation = 0;
export let selectedFurnitureId = null;

export let blueprintData = [];
export let zoomLevel = 1;

export let blendMode = "none";
export let blendSecondary = "sand";
export let blendDiagonal = "slash";
export let blendQuarter = "tl";

// setters (important for shared state)
export function setBlueprintData(data) {
  blueprintData = data;
}

export function setMode(mode) {
  currentMode = mode;
}

export function setMaterial(material) {
  currentMaterial = material;
}

export function setFurniture(kind) {
  currentFurniture = kind;
}

export function setWallType(kind) {
  currentWallType = kind;
}

export function setDoorType(kind) {
  currentDoorType = kind;
}

export function setRotation(rotation) {
  currentRotation = rotation;
}

export function setSelectedFurnitureId(id) {
  selectedFurnitureId = id;
  document.dispatchEvent(new CustomEvent("furniture-selection-changed"));
}

export function setZoomLevel(level) {
  zoomLevel = level;
}

export function setBlendMode(mode) {
  blendMode = mode;
}

export function setBlendSecondary(material) {
  blendSecondary = material;
}

export function setBlendDiagonal(variant) {
  blendDiagonal = variant;
}

export function setBlendQuarter(corner) {
  blendQuarter = corner;
}
