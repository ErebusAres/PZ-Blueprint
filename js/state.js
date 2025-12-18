export const ROWS = 50;
export const COLS = 50;

export let currentMode = 'floor';
export let currentMaterial = 'sand';
export let currentFurniture = 'bed';
export let currentWallType = 'standard';
export let currentDoorType = 'standard';
export let currentRotation = 0;

export let blueprintData = [];
export let zoomLevel = 1;

// setters (important for shared state)
export function setBlueprintData(data) {
  blueprintData = data;
}

export function setMode(mode) {
  currentMode = mode;
}
