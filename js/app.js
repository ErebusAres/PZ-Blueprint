import { initializeGrid } from "./grid.js";
import {
  setMode,
  setMaterial,
  setCarpetColor,
  setCheckerColor,
  setFurniture,
  setWallType,
  setDoorType,
  setRotation,
  setZoomLevel,
  setBlendMode,
  setBlendSecondary,
  setBlendDiagonal,
  setBlendQuarter,
  setSelectedFurnitureId,
  setGridSize,
  currentMode,
  currentMaterial,
  carpetColor,
  checkerColor,
  currentFurniture,
  currentWallType,
  currentDoorType,
  currentRotation,
  selectedFurnitureId,
  zoomLevel,
  gridRows,
  gridCols,
  blendMode,
  blendSecondary,
  blendDiagonal,
  blendQuarter
} from "./state.js";
import { MATERIALS, WALL_TYPES, DOOR_TYPES, FURNITURE } from "./catalog.js";
import { dataStore } from "./datastore.js";
import { renderBlueprint } from "./render.js";
import { buildWallSet, findWallAttachment, rotationToDir } from "./wall-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  initializeGrid();

  const modeButtons = Array.from(document.querySelectorAll("[data-mode]"));
  const materialButtons = Array.from(
    document.querySelectorAll("[data-material]")
  );
  const furnitureButtons = Array.from(
    document.querySelectorAll("[data-furniture]")
  );
  const wallButtons = Array.from(document.querySelectorAll("[data-wall]"));
  const doorButtons = Array.from(document.querySelectorAll("[data-door]"));
  const blendModeButtons = Array.from(
    document.querySelectorAll("[data-blend-mode]")
  );
  const blendMaterialButtons = Array.from(
    document.querySelectorAll("[data-blend-material]")
  );
  const blendDiagonalButtons = Array.from(
    document.querySelectorAll("[data-blend-diagonal]")
  );
  const blendQuarterButtons = Array.from(
    document.querySelectorAll("[data-blend-quarter]")
  );

  const modeIndicator = document.getElementById("mode-indicator");
  const selectedName = document.getElementById("selected-name");
  const wallSection = document.getElementById("wall-section");
  const doorSection = document.getElementById("door-section");
  const materialSection = document.getElementById("material-section");
  const blendSection = document.getElementById("blend-section");
  const blendDiagonalControls = document.getElementById(
    "blend-diagonal-controls"
  );
  const blendQuarterControls = document.getElementById(
    "blend-quarter-controls"
  );
  const blendSecondarySection = document.getElementById(
    "blend-secondary-section"
  );
  const furnitureSection = document.getElementById("furniture-section");
  const rotateButton = document.getElementById("rotate-btn");
  const zoomOut = document.getElementById("zoom-out");
  const zoomIn = document.getElementById("zoom-in");
  const zoomReset = document.getElementById("zoom-reset");
  const toggleUI = document.getElementById("toggle-ui");
  const clearAll = document.getElementById("clear-all");
  const gridWrapper = document.getElementById("grid-wrapper");
  const canvasViewport = document.getElementById("canvas-viewport");
  const tileColorSection = document.getElementById("tile-color-section");
  const carpetColorInput = document.getElementById("carpet-color");
  const checkerColorInput = document.getElementById("checker-color");
  const carpetColorValue = document.getElementById("carpet-color-value");
  const checkerColorValue = document.getElementById("checker-color-value");
  const gridSizeButton = document.getElementById("grid-size");
  const gridPopover = document.getElementById("grid-size-popover");
  const gridRowsInput = document.getElementById("grid-rows");
  const gridColsInput = document.getElementById("grid-cols");
  const gridApply = document.getElementById("grid-apply");
  const gridCancel = document.getElementById("grid-cancel");
  const toggleGrid = document.getElementById("toggle-grid");
  const toggleSnap = document.getElementById("toggle-snap");
  const undoButton = document.getElementById("undo-btn");
  const redoButton = document.getElementById("redo-btn");
  const paletteSearch = document.getElementById("palette-search");
  const panelToggles = Array.from(document.querySelectorAll("[data-panel-toggle]"));
  const helpButton = document.getElementById("help-btn");
  const helpPanel = document.getElementById("help-panel");
  const helpBackdrop = document.getElementById("help-backdrop");
  const helpClose = document.getElementById("help-close");
  const statusGrid = document.getElementById("status-grid");
  const statusZoom = document.getElementById("status-zoom");
  const propertyMode = document.getElementById("property-mode");
  const propertyRotation = document.getElementById("property-rotation");
  const propertyBlend = document.getElementById("property-blend");
  const propertyGrid = document.getElementById("property-grid");
  const propertyZoom = document.getElementById("property-zoom");
  const toastStack = document.getElementById("toast-stack");
  const importButton = document.getElementById("import-btn");
  const shareButton = document.getElementById("share-btn");

  let isPanning = false;
  let panPointerId = null;
  let panStartX = 0;
  let panStartY = 0;
  let panScrollLeft = 0;
  let panScrollTop = 0;

  function formatModeLabel(mode) {
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  }

  function normalizeHex(value) {
    if (!value) return "#000000";
    return value.toLowerCase();
  }

  function getMaterialSwatchColor(material) {
    if (material === "carpet") return carpetColor;
    if (material === "checkerTile") return checkerColor;
    return MATERIALS[material]?.color ?? "#3a3f46";
  }

  function updateTileColorUI() {
    if (!tileColorSection) return;
    const shouldShow =
      currentMode === "floor" &&
      (currentMaterial === "carpet" || currentMaterial === "checkerTile");
    tileColorSection.classList.toggle("is-hidden", !shouldShow);

    if (carpetColorInput) {
      carpetColorInput.value = normalizeHex(carpetColor);
    }
    if (checkerColorInput) {
      checkerColorInput.value = normalizeHex(checkerColor);
    }
    if (carpetColorValue) {
      carpetColorValue.textContent = normalizeHex(carpetColor);
    }
    if (checkerColorValue) {
      checkerColorValue.textContent = normalizeHex(checkerColor);
    }
  }

  function updateGridSizeUI() {
    if (gridSizeButton) {
      gridSizeButton.textContent = `${gridRows} x ${gridCols}`;
    }
    if (gridRowsInput) {
      gridRowsInput.value = String(gridRows);
    }
    if (gridColsInput) {
      gridColsInput.value = String(gridCols);
    }
    updateStatusBar();
    updateProperties();
  }

  function clampGridValue(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(5, Math.min(200, parsed));
  }

  function showToast(message) {
    if (!toastStack) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastStack.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 2400);
  }

  function blendLabel() {
    if (blendMode === "none") return "None";
    const secondaryName = MATERIALS[blendSecondary]?.name ?? "Secondary";
    if (blendMode === "diag-manual") {
      return `Diag with ${secondaryName}`;
    }
    if (blendMode === "quarter-manual") {
      return `Quarter with ${secondaryName}`;
    }
    if (blendMode === "diag-auto") {
      return `Auto with ${secondaryName}`;
    }
    return "Blend";
  }

  function updateStatusBar() {
    if (statusGrid) {
      statusGrid.textContent = `Grid: ${gridRows} x ${gridCols}`;
    }
    if (statusZoom) {
      statusZoom.textContent = `Zoom: ${Math.round(zoomLevel * 100)}%`;
    }
  }

  function updateProperties() {
    if (propertyMode) {
      propertyMode.textContent = formatModeLabel(currentMode);
    }
    if (propertyRotation) {
      propertyRotation.textContent = `${currentRotation} deg`;
    }
    if (propertyBlend) {
      propertyBlend.textContent = blendLabel();
    }
    if (propertyGrid) {
      propertyGrid.textContent = `${gridRows} x ${gridCols}`;
    }
    if (propertyZoom) {
      propertyZoom.textContent = `${Math.round(zoomLevel * 100)}%`;
    }
  }

  function updateUndoRedoUI() {
    if (undoButton) {
      undoButton.disabled = !dataStore.canUndo();
      undoButton.classList.toggle("is-active", dataStore.canUndo());
    }
    if (redoButton) {
      redoButton.disabled = !dataStore.canRedo();
      redoButton.classList.toggle("is-active", dataStore.canRedo());
    }
  }

  function setPanelCollapsed(panel, collapsed) {
    if (!panel) return;
    panel.classList.toggle("is-collapsed", collapsed);
    const toggle = panel.querySelector("[data-panel-toggle]");
    if (toggle) {
      toggle.setAttribute("aria-expanded", collapsed ? "false" : "true");
      toggle.textContent = collapsed ? "+" : "-";
    }
  }

  const SHARE_BASE_URL = "https://erebusares.github.io/PZ-Blueprint/index.html";

  function base64UrlEncode(bytes) {
    let binary = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "");
  }

  function base64UrlDecode(text) {
    const base64 = text.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLength);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async function compressJson(json) {
    if (!("CompressionStream" in window)) return null;
    const stream = new CompressionStream("gzip");
    const writer = stream.writable.getWriter();
    writer.write(new TextEncoder().encode(json));
    writer.close();
    const compressed = new Uint8Array(await new Response(stream.readable).arrayBuffer());
    return base64UrlEncode(compressed);
  }

  async function decompressJson(encoded) {
    if (!("DecompressionStream" in window)) return null;
    const bytes = base64UrlDecode(encoded);
    const stream = new DecompressionStream("gzip");
    const writer = stream.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const decompressed = await new Response(stream.readable).arrayBuffer();
    return new TextDecoder().decode(decompressed);
  }

  async function encodeShareHash(payload) {
    const json = JSON.stringify(payload);
    const compressed = await compressJson(json);
    if (compressed) return `#b=${compressed}`;
    const fallback = base64UrlEncode(new TextEncoder().encode(json));
    return `#j=${fallback}`;
  }

  async function decodeShareHash(hash) {
    if (!hash) return null;
    const value = hash.startsWith("#") ? hash.slice(1) : hash;
    if (value.startsWith("b=")) {
      const encoded = value.slice(2);
      const json = await decompressJson(encoded);
      if (!json) return null;
      return JSON.parse(json);
    }
    if (value.startsWith("j=")) {
      const encoded = value.slice(2);
      const json = new TextDecoder().decode(base64UrlDecode(encoded));
      return JSON.parse(json);
    }
    return null;
  }

  function updateSelectedInfo() {
    if (!selectedName) return;

    if (currentMode === "cursor") {
      selectedName.textContent = "Cursor";
      updateProperties();
      return;
    }

    if (currentMode === "floor") {
      selectedName.textContent = `${MATERIALS[currentMaterial]?.name ?? "Floor"} Floor`;
      updateProperties();
      return;
    }

    if (currentMode === "wall") {
      selectedName.textContent = WALL_TYPES[currentWallType]?.name ?? "Wall";
      updateProperties();
      return;
    }

    if (currentMode === "door") {
      selectedName.textContent = DOOR_TYPES[currentDoorType]?.name ?? "Door";
      updateProperties();
      return;
    }

    if (currentMode === "furniture") {
      selectedName.textContent = FURNITURE[currentFurniture]?.name ?? "Furniture";
      updateProperties();
      return;
    }

    if (currentMode === "rooms") {
      const wallName = WALL_TYPES[currentWallType]?.name ?? "Wall";
      selectedName.textContent = `Room (${wallName})`;
      updateProperties();
      return;
    }

    if (currentMode === "erase") {
      selectedName.textContent = "Eraser";
    }
    updateProperties();
  }

  function updateModeUI(mode) {
    modeButtons.forEach(button => {
      button.classList.toggle("is-active", button.dataset.mode === mode);
    });

    if (modeIndicator) {
      modeIndicator.textContent = `Mode: ${formatModeLabel(mode)}`;
    }

    if (canvasViewport) {
      canvasViewport.classList.toggle("cursor-mode", mode === "cursor");
    }

    if (materialSection) {
      materialSection.classList.toggle("is-hidden", mode !== "floor");
    }

    if (blendSection) {
      blendSection.classList.toggle("is-hidden", mode !== "floor");
    }

    if (wallSection) {
      wallSection.classList.toggle(
        "is-hidden",
        mode !== "wall" && mode !== "rooms"
      );
    }

    if (doorSection) {
      doorSection.classList.toggle("is-hidden", mode !== "door");
    }

    if (furnitureSection) {
      furnitureSection.classList.toggle("is-hidden", mode !== "furniture");
    }

    if (mode === "cursor") {
      materialSection?.classList.add("is-hidden");
      blendSection?.classList.add("is-hidden");
      wallSection?.classList.add("is-hidden");
      doorSection?.classList.add("is-hidden");
      furnitureSection?.classList.add("is-hidden");
    }

    [materialSection, blendSection, wallSection, doorSection, furnitureSection]
      .filter(Boolean)
      .forEach(section => section.classList.remove("is-pinned"));

    if (mode === "floor" && materialSection) {
      materialSection.classList.add("is-pinned");
      setPanelCollapsed(materialSection, false);
    }
    if ((mode === "wall" || mode === "rooms") && wallSection) {
      wallSection.classList.add("is-pinned");
      setPanelCollapsed(wallSection, false);
    }
    if (mode === "door" && doorSection) {
      doorSection.classList.add("is-pinned");
      setPanelCollapsed(doorSection, false);
    }
    if (mode === "furniture" && furnitureSection) {
      furnitureSection.classList.add("is-pinned");
      setPanelCollapsed(furnitureSection, false);
    }

    updateSelectedInfo();
    updateTileColorUI();
  }

  function updateMaterialUI(material) {
    materialButtons.forEach(button => {
      button.classList.toggle(
        "is-active",
        button.dataset.material === material
      );
    });
    updateSelectedInfo();
    updateTileColorUI();
  }

  function updateFurnitureUI(kind) {
    furnitureButtons.forEach(button => {
      button.classList.toggle(
        "is-active",
        button.dataset.furniture === kind
      );
    });
    updateSelectedInfo();
  }

  function updateWallUI(kind) {
    wallButtons.forEach(button => {
      button.classList.toggle("is-active", button.dataset.wall === kind);
    });
    updateSelectedInfo();
  }

  function updateDoorUI(kind) {
    doorButtons.forEach(button => {
      button.classList.toggle("is-active", button.dataset.door === kind);
    });
    updateSelectedInfo();
  }

  function updateRotationButton() {
    if (!rotateButton) return;

    const labels = {
      0: "North",
      90: "East",
      180: "South",
      270: "West"
    };

    rotateButton.textContent = labels[currentRotation] ?? "North";
    updateProperties();
  }

  function updateBlendModeUI(mode) {
    blendModeButtons.forEach(button => {
      button.classList.toggle("is-active", button.dataset.blendMode === mode);
    });

    if (blendDiagonalControls) {
      blendDiagonalControls.classList.toggle(
        "is-hidden",
        mode !== "diag-manual"
      );
    }

    if (blendQuarterControls) {
      blendQuarterControls.classList.toggle(
        "is-hidden",
        mode !== "quarter-manual"
      );
    }

    if (blendSecondarySection) {
      blendSecondarySection.classList.toggle("is-hidden", mode === "none");
    }

    updateProperties();
  }

  function updateBlendSecondaryUI(material) {
    blendMaterialButtons.forEach(button => {
      button.classList.toggle(
        "is-active",
        button.dataset.blendMaterial === material
      );
    });
    updateProperties();
  }

  function updateBlendDiagonalUI(variant) {
    blendDiagonalButtons.forEach(button => {
      button.classList.toggle(
        "is-active",
        button.dataset.blendDiagonal === variant
      );
    });
  }

  function updateBlendQuarterUI(corner) {
    blendQuarterButtons.forEach(button => {
      button.classList.toggle(
        "is-active",
        button.dataset.blendQuarter === corner
      );
    });
  }

  function applySwatches() {
    materialButtons.forEach(button => {
      const swatch = button.querySelector(".swatch");
      if (!swatch) return;
      swatch.style.background = getMaterialSwatchColor(button.dataset.material);
    });

    blendMaterialButtons.forEach(button => {
      const swatch = button.querySelector(".swatch");
      if (!swatch) return;
      swatch.style.background = getMaterialSwatchColor(button.dataset.blendMaterial);
    });

    furnitureButtons.forEach(button => {
      const swatch = button.querySelector(".swatch");
      if (!swatch) return;
      swatch.style.background = FURNITURE[button.dataset.furniture]?.color ?? "#3a3f46";
    });

    wallButtons.forEach(button => {
      const swatch = button.querySelector(".swatch");
      if (!swatch) return;
      swatch.style.background = WALL_TYPES[button.dataset.wall]?.color ?? "#3a3f46";
    });

    doorButtons.forEach(button => {
      const swatch = button.querySelector(".swatch");
      if (!swatch) return;
      swatch.style.background = DOOR_TYPES[button.dataset.door]?.color ?? "#3a3f46";
    });
  }

  function setZoom(value) {
    const previous = zoomLevel;
    const next = Math.max(0.25, Math.min(3, value));
    setZoomLevel(next);

    if (gridWrapper) {
      gridWrapper.style.transform = `scale(${next})`;
    }

    if (canvasViewport && previous > 0 && previous !== next) {
      const ratio = next / previous;
      canvasViewport.scrollLeft = canvasViewport.scrollLeft * ratio;
      canvasViewport.scrollTop = canvasViewport.scrollTop * ratio;
    }

    if (zoomReset) {
      zoomReset.textContent = `${Math.round(next * 100)}%`;
    }

    updateStatusBar();
    updateProperties();
  }

  function startPan(e) {
    if (!canvasViewport) return;
    isPanning = true;
    panPointerId = e.pointerId;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panScrollLeft = canvasViewport.scrollLeft;
    panScrollTop = canvasViewport.scrollTop;
    canvasViewport.setPointerCapture(panPointerId);
    canvasViewport.classList.add("is-panning");
  }

  function updatePan(e) {
    if (!canvasViewport || !isPanning || e.pointerId !== panPointerId) return;
    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;
    canvasViewport.scrollLeft = panScrollLeft - dx;
    canvasViewport.scrollTop = panScrollTop - dy;
  }

  function endPan(e) {
    if (!canvasViewport || !isPanning || e.pointerId !== panPointerId) return;
    isPanning = false;
    canvasViewport.releasePointerCapture(panPointerId);
    canvasViewport.classList.remove("is-panning");
    panPointerId = null;
  }

  modeButtons.forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      setMode(mode);
      updateModeUI(mode);
      document.dispatchEvent(new CustomEvent("mode-changed"));
    });
  });

  materialButtons.forEach(button => {
    button.addEventListener("click", () => {
      const material = button.dataset.material;
      setMaterial(material);
      updateMaterialUI(material);
    });
  });

  furnitureButtons.forEach(button => {
    button.addEventListener("click", () => {
      const kind = button.dataset.furniture;
      setFurniture(kind);
      updateFurnitureUI(kind);
    });
  });

  wallButtons.forEach(button => {
    button.addEventListener("click", () => {
      const kind = button.dataset.wall;
      setWallType(kind);
      updateWallUI(kind);
    });
  });

  doorButtons.forEach(button => {
    button.addEventListener("click", () => {
      const kind = button.dataset.door;
      setDoorType(kind);
      updateDoorUI(kind);
    });
  });

  blendModeButtons.forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.dataset.blendMode;
      setBlendMode(mode);
      updateBlendModeUI(mode);
    });
  });

  blendDiagonalButtons.forEach(button => {
    button.addEventListener("click", () => {
      const variant = button.dataset.blendDiagonal;
      setBlendDiagonal(variant);
      updateBlendDiagonalUI(variant);
    });
  });

  blendQuarterButtons.forEach(button => {
    button.addEventListener("click", () => {
      const corner = button.dataset.blendQuarter;
      setBlendQuarter(corner);
      updateBlendQuarterUI(corner);
    });
  });

  blendMaterialButtons.forEach(button => {
    button.addEventListener("click", () => {
      const material = button.dataset.blendMaterial;
      setBlendSecondary(material);
      updateBlendSecondaryUI(material);
    });
  });

  panelToggles.forEach(toggle => {
    toggle.addEventListener("click", () => {
      const panel = toggle.closest(".panel");
      const collapsed = panel?.classList.contains("is-collapsed");
      setPanelCollapsed(panel, !collapsed);
    });
  });

  if (paletteSearch) {
    const paletteItems = Array.from(document.querySelectorAll(".palette-item"));
    paletteSearch.addEventListener("input", event => {
      const query = event.target.value.trim().toLowerCase();
      paletteItems.forEach(item => {
        const label = item.querySelector(".label")?.textContent ?? "";
        const match = label.toLowerCase().includes(query);
        item.style.display = query && !match ? "none" : "";
      });
    });
  }

  if (carpetColorInput) {
    carpetColorInput.addEventListener("input", event => {
      const value = normalizeHex(event.target.value);
      setCarpetColor(value);
      if (carpetColorValue) {
        carpetColorValue.textContent = value;
      }
      applySwatches();
      updateTileColorUI();
    });
  }

  if (checkerColorInput) {
    checkerColorInput.addEventListener("input", event => {
      const value = normalizeHex(event.target.value);
      setCheckerColor(value);
      if (checkerColorValue) {
        checkerColorValue.textContent = value;
      }
      applySwatches();
      updateTileColorUI();
    });
  }

  if (gridSizeButton && gridPopover) {
    const closeGridPopover = () => {
      gridPopover.classList.add("is-hidden");
    };
    const openGridPopover = () => {
      updateGridSizeUI();
      gridPopover.classList.remove("is-hidden");
    };

    gridSizeButton.addEventListener("click", event => {
      event.stopPropagation();
      if (gridPopover.classList.contains("is-hidden")) {
        openGridPopover();
      } else {
        closeGridPopover();
      }
    });

    gridPopover.addEventListener("click", event => {
      event.stopPropagation();
    });

    document.addEventListener("click", () => {
      if (!gridPopover.classList.contains("is-hidden")) {
        closeGridPopover();
      }
    });

    if (gridApply) {
      gridApply.addEventListener("click", () => {
        const rows = clampGridValue(gridRowsInput?.value, gridRows);
        const cols = clampGridValue(gridColsInput?.value, gridCols);
        setGridSize(rows, cols);
        initializeGrid();
        updateGridSizeUI();
        renderBlueprint(dataStore.getAll());
        showToast("Grid resized");
        closeGridPopover();
      });
    }

    if (gridCancel) {
      gridCancel.addEventListener("click", closeGridPopover);
    }
  }

  if (toggleGrid) {
    let gridVisible = true;
    const updateGridToggle = () => {
      document.body.classList.toggle("grid-hidden", !gridVisible);
      toggleGrid.classList.toggle("is-active", gridVisible);
      toggleGrid.textContent = gridVisible ? "Grid On" : "Grid Off";
    };
    updateGridToggle();
    toggleGrid.addEventListener("click", () => {
      gridVisible = !gridVisible;
      updateGridToggle();
    });
  }

  if (toggleSnap) {
    let snapEnabled = true;
    const updateSnapToggle = () => {
      toggleSnap.classList.toggle("is-active", snapEnabled);
      toggleSnap.textContent = snapEnabled ? "Snap On" : "Snap Off";
    };
    updateSnapToggle();
    toggleSnap.addEventListener("click", () => {
      snapEnabled = !snapEnabled;
      updateSnapToggle();
    });
  }

  if (undoButton) {
    undoButton.addEventListener("click", () => {
      const result = dataStore.undo();
      if (result.isOk) {
        showToast("Undo");
      }
      updateUndoRedoUI();
    });
  }

  if (redoButton) {
    redoButton.addEventListener("click", () => {
      const result = dataStore.redo();
      if (result.isOk) {
        showToast("Redo");
      }
      updateUndoRedoUI();
    });
  }

  if (importButton) {
    const importInput = document.createElement("input");
    importInput.type = "file";
    importInput.accept = "application/json";
    importInput.style.display = "none";
    document.body.appendChild(importInput);

    importInput.addEventListener("change", async () => {
      const file = importInput.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const payload = JSON.parse(text);
        const items = Array.isArray(payload) ? payload : payload.items;
        if (Array.isArray(payload?.grid)) {
          const rows = clampGridValue(payload.grid[0], gridRows);
          const cols = clampGridValue(payload.grid[1], gridCols);
          setGridSize(rows, cols);
        } else if (payload?.grid?.rows && payload?.grid?.cols) {
          const rows = clampGridValue(payload.grid.rows, gridRows);
          const cols = clampGridValue(payload.grid.cols, gridCols);
          setGridSize(rows, cols);
        }
        if (Array.isArray(items)) {
          await dataStore.replaceAll(items);
        }
        setSelectedFurnitureId(null);
        initializeGrid();
        updateGridSizeUI();
        showToast("Blueprint imported");
      } catch (error) {
        showToast("Import failed");
      } finally {
        importInput.value = "";
      }
    });

    importButton.addEventListener("click", () => {
      importInput.click();
    });
  }

  if (shareButton) {
    shareButton.addEventListener("click", async () => {
      const payload = {
        version: 1,
        grid: { rows: gridRows, cols: gridCols },
        items: dataStore.getAll()
      };
      const hash = await encodeShareHash(payload);
      const link = `${SHARE_BASE_URL}${hash}`;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(link);
          showToast("Share link copied");
        } else {
          window.prompt("Copy share link:", link);
        }
      } catch (error) {
        window.prompt("Copy share link:", link);
      }
    });
  }

  if (helpButton && helpPanel && helpBackdrop) {
    const openHelp = () => {
      helpPanel.classList.remove("is-hidden");
      helpBackdrop.classList.remove("is-hidden");
      helpButton.classList.add("is-active");
    };
    const closeHelp = () => {
      helpPanel.classList.add("is-hidden");
      helpBackdrop.classList.add("is-hidden");
      helpButton.classList.remove("is-active");
    };

    helpButton.addEventListener("click", event => {
      event.stopPropagation();
      if (helpPanel.classList.contains("is-hidden")) {
        openHelp();
      } else {
        closeHelp();
      }
    });

    helpClose?.addEventListener("click", closeHelp);
    helpBackdrop.addEventListener("click", closeHelp);
  }

  if (rotateButton) {
    rotateButton.addEventListener("click", () => {
      const next = (currentRotation + 90) % 360;
      setRotation(next);
      updateRotationButton();
      updateSelectedInfo();
    });
  }

  if (zoomIn) {
    zoomIn.addEventListener("click", () => {
      setZoom(zoomLevel + 0.25);
    });
  }

  if (zoomOut) {
    zoomOut.addEventListener("click", () => {
      setZoom(zoomLevel - 0.25);
    });
  }

  if (zoomReset) {
    zoomReset.addEventListener("click", () => {
      setZoom(1);
    });
  }

  if (canvasViewport) {
    canvasViewport.addEventListener(
      "wheel",
      event => {
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          const delta = event.deltaY > 0 ? -0.1 : 0.1;
          setZoom(zoomLevel + delta);
        }
      },
      { passive: false }
    );

    canvasViewport.addEventListener("pointerdown", event => {
      const wantsPan =
        event.button === 2 || (currentMode === "cursor" && event.button === 0);
      if (!wantsPan) return;
      event.preventDefault();
      startPan(event);
    });
    canvasViewport.addEventListener("pointermove", updatePan);
    canvasViewport.addEventListener("pointerup", endPan);
    canvasViewport.addEventListener("pointercancel", endPan);
    canvasViewport.addEventListener("contextmenu", event => event.preventDefault());
  }

  if (toggleUI) {
    toggleUI.addEventListener("click", () => {
      document.body.classList.toggle("ui-hidden");
      toggleUI.textContent = document.body.classList.contains("ui-hidden")
        ? "Show UI"
        : "Toggle UI";
    });
  }

  if (clearAll) {
    clearAll.addEventListener("click", async () => {
      if (!window.confirm("Clear entire blueprint?")) return;
      const items = dataStore.getAll();
      for (const item of items) {
        await dataStore.delete(item);
      }
      setSelectedFurnitureId(null);
    });
  }

  document.addEventListener("keydown", event => {
    if (event.repeat) return;

    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = event.key.toLowerCase();
    const hasMod = event.ctrlKey || event.metaKey;

    if (hasMod && key === "z") {
      event.preventDefault();
      const result = dataStore.undo();
      if (result.isOk) showToast("Undo");
      updateUndoRedoUI();
      return;
    }

    if (hasMod && (key === "y" || (event.shiftKey && key === "z"))) {
      event.preventDefault();
      const result = dataStore.redo();
      if (result.isOk) showToast("Redo");
      updateUndoRedoUI();
      return;
    }

    if (key === "escape" && helpPanel && helpBackdrop) {
      helpPanel.classList.add("is-hidden");
      helpBackdrop.classList.add("is-hidden");
      return;
    }

    if (key !== "r") return;

    if (selectedFurnitureId) {
      const item = dataStore.findOne(data => data.id === selectedFurnitureId);
      if (item && item.type === "furniture") {
        const nextRotation = (item.rotation + 90) % 360;
        const config = FURNITURE[item.kind];
        const payload = {
          ...item,
          rotation: nextRotation
        };

        if (config?.wallMount === "wall-only") {
          const wallSet = buildWallSet(dataStore.getAll());
          const preferred = rotationToDir(nextRotation);
          const attached =
            findWallAttachment(item.row, item.col, wallSet, preferred) ??
            findWallAttachment(item.row, item.col, wallSet, item.mountDir);
          if (attached) {
            payload.mountDir = attached;
          } else {
            delete payload.mountDir;
          }
        } else {
          delete payload.mountDir;
        }

        dataStore.upsertByKey(payload);
        return;
      }
    }
    const next = (currentRotation + 90) % 360;
    setRotation(next);
    updateRotationButton();
    updateSelectedInfo();
  });

  document.addEventListener("furniture-selection-changed", () => {
    renderBlueprint(dataStore.getAll());
    updateSelectedInfo();
  });

  document.addEventListener("blueprint-changed", () => {
    updateUndoRedoUI();
  });

  async function tryLoadShareLink() {
    if (!window.location.hash) return;
    try {
      const payload = await decodeShareHash(window.location.hash);
      if (!payload) {
        showToast("Shared link not supported in this browser");
        return;
      }
      const items = Array.isArray(payload) ? payload : payload.items;
      if (Array.isArray(payload?.grid)) {
        const rows = clampGridValue(payload.grid[0], gridRows);
        const cols = clampGridValue(payload.grid[1], gridCols);
        setGridSize(rows, cols);
      } else if (payload?.grid?.rows && payload?.grid?.cols) {
        const rows = clampGridValue(payload.grid.rows, gridRows);
        const cols = clampGridValue(payload.grid.cols, gridCols);
        setGridSize(rows, cols);
      }
      if (Array.isArray(items)) {
        await dataStore.replaceAll(items);
        setSelectedFurnitureId(null);
        initializeGrid();
        updateGridSizeUI();
        showToast("Shared blueprint loaded");
      }
    } catch (error) {
      showToast("Shared link invalid");
    }
  }

  await tryLoadShareLink();

  applySwatches();
  updateModeUI(currentMode);
  updateMaterialUI(currentMaterial);
  updateFurnitureUI(currentFurniture);
  updateWallUI(currentWallType);
  updateDoorUI(currentDoorType);
  updateRotationButton();
  updateBlendModeUI(blendMode);
  updateBlendSecondaryUI(blendSecondary);
  updateBlendDiagonalUI(blendDiagonal);
  updateBlendQuarterUI(blendQuarter);
  updateGridSizeUI();
  updateTileColorUI();
  updateUndoRedoUI();
  updateStatusBar();
  updateProperties();
  setZoom(zoomLevel);
});



