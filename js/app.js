import { initializeGrid } from "./grid.js";
import {
  setMode,
  setMaterial,
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
  currentMode,
  currentMaterial,
  currentFurniture,
  currentWallType,
  currentDoorType,
  currentRotation,
  selectedFurnitureId,
  zoomLevel,
  blendMode,
  blendSecondary,
  blendDiagonal,
  blendQuarter
} from "./state.js";
import { MATERIALS, WALL_TYPES, DOOR_TYPES, FURNITURE } from "./catalog.js";
import { dataStore } from "./datastore.js";
import { renderBlueprint } from "./render.js";

document.addEventListener("DOMContentLoaded", () => {
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

  let isPanning = false;
  let panPointerId = null;
  let panStartX = 0;
  let panStartY = 0;
  let panScrollLeft = 0;
  let panScrollTop = 0;

  function formatModeLabel(mode) {
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  }

  function updateSelectedInfo() {
    if (!selectedName) return;

    if (currentMode === "cursor") {
      selectedName.textContent = "Cursor";
      return;
    }

    if (currentMode === "floor") {
      selectedName.textContent = `${MATERIALS[currentMaterial]?.name ?? "Floor"} Floor`;
      return;
    }

    if (currentMode === "wall") {
      selectedName.textContent = WALL_TYPES[currentWallType]?.name ?? "Wall";
      return;
    }

    if (currentMode === "door") {
      selectedName.textContent = DOOR_TYPES[currentDoorType]?.name ?? "Door";
      return;
    }

    if (currentMode === "furniture") {
      selectedName.textContent = FURNITURE[currentFurniture]?.name ?? "Furniture";
      return;
    }

    if (currentMode === "rooms") {
      const wallName = WALL_TYPES[currentWallType]?.name ?? "Wall";
      selectedName.textContent = `Room (${wallName})`;
      return;
    }

    if (currentMode === "erase") {
      selectedName.textContent = "Eraser";
    }
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

    updateSelectedInfo();
  }

  function updateMaterialUI(material) {
    materialButtons.forEach(button => {
      button.classList.toggle(
        "is-active",
        button.dataset.material === material
      );
    });
    updateSelectedInfo();
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
  }

  function updateBlendSecondaryUI(material) {
    blendMaterialButtons.forEach(button => {
      button.classList.toggle(
        "is-active",
        button.dataset.blendMaterial === material
      );
    });
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
      swatch.style.background = MATERIALS[button.dataset.material]?.color ?? "#3a3f46";
    });

    blendMaterialButtons.forEach(button => {
      const swatch = button.querySelector(".swatch");
      if (!swatch) return;
      swatch.style.background =
        MATERIALS[button.dataset.blendMaterial]?.color ?? "#3a3f46";
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
    if (event.key.toLowerCase() !== "r") return;
    if (event.repeat) return;

    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      return;
    }

    if (selectedFurnitureId) {
      const item = dataStore.findOne(data => data.id === selectedFurnitureId);
      if (item && item.type === "furniture") {
        const nextRotation = (item.rotation + 90) % 360;
        dataStore.upsertByKey({
          ...item,
          rotation: nextRotation
        });
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
  setZoom(zoomLevel);
});
