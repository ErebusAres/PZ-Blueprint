import { initializeGrid } from "./grid.js";
import {
  setMode,
  setMaterial,
  setCustomColorA,
  setCustomColorB,
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
  setBlueprintTitle,
  setBlueprintVersion,
  currentMode,
  currentMaterial,
  customColorA,
  customColorB,
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
  blendQuarter,
  blueprintTitle,
  blueprintVersion
} from "./state.js";
import { MATERIALS, WALL_TYPES, DOOR_TYPES, FURNITURE } from "./catalog.js";
import { dataStore } from "./datastore.js";
import { renderBlueprint, renderBlueprintToCanvas } from "./render.js";
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
  const projectTitle = document.getElementById("project-title");
  const projectVersion = document.getElementById("project-version");
  const projectVersionInc = document.getElementById("project-version-inc");
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
  const customColorAInput = document.getElementById("custom-color-a");
  const customColorBInput = document.getElementById("custom-color-b");
  const customColorAValue = document.getElementById("custom-color-a-value");
  const customColorBValue = document.getElementById("custom-color-b-value");
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
  const exportButton = document.getElementById("export-btn");
  const exportPopover = document.getElementById("export-popover");
  const optionsButton = document.getElementById("options-btn");
  const optionsPopover = document.getElementById("options-popover");
  const resetButton = document.getElementById("reset-btn");
  const toggleDrawer = document.getElementById("toggle-drawer");
  const drawer = document.getElementById("tool-drawer");
  const drawerPopover = document.getElementById("drawer-popover");
  const drawerSelection = document.getElementById("drawer-selection");
  const drawerSearch = document.getElementById("drawer-search");
  const drawerSearchInput = document.getElementById("drawer-search-input");
  const drawerSearchResults = document.getElementById("drawer-search-results");
  const drawerUndo = document.getElementById("drawer-undo");
  const drawerRedo = document.getElementById("drawer-redo");
  const drawerToolButtons = Array.from(
    document.querySelectorAll("[data-drawer-tool]")
  );
  const drawerCategories = document.getElementById("drawer-categories");

  let isPanning = false;
  let panCandidate = false;
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

  const PROJECT_TITLE_KEY = "pz-blueprint:title";
  const PROJECT_VERSION_KEY = "pz-blueprint:version";
  const AUTOSAVE_KEY = "pz-blueprint:autosave";
  const DEFAULT_GRID_ROWS = 20;
  const DEFAULT_GRID_COLS = 20;
  const DEFAULT_TITLE = "My Blueprint";
  const DEFAULT_VERSION = 1;

  const DEFAULT_CARPET_COLOR = "#b0372f";
  const DEFAULT_CHECKER_A = "#3b6ed8";
  const DEFAULT_CHECKER_B = "#f2f2ee";
  const TOOL_ICONS = {
    cursor:
      '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M5 4l6.5 15 1.8-5.2 5.2-1.8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg>',
    floor:
      '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" /><path d="M12 4v16M4 12h16" fill="none" stroke="currentColor" stroke-width="1.4" /></svg>',
    wall:
      '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><rect x="4" y="6" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6" /><path d="M4 12h16M9 6v6M15 12v6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg>',
    door:
      '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><rect x="6" y="4" width="12" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6" /><circle cx="14" cy="12" r="1" fill="currentColor" /></svg>',
    furniture:
      '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><rect x="5" y="10" width="14" height="6" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" /><path d="M7 10V8h10v2M7 16v2M17 16v2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>',
    rooms:
      '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><rect x="5" y="5" width="14" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 2" /></svg>',
    erase:
      '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M5 15l6-6 6 6-4 4H9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /><path d="M13 19h6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>'
  };
  const CATEGORY_ICONS = {
    floor: {
      nature:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M6 14c5-8 12-8 12-8-1 7-6 11-12 8z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /><path d="M6 14c3 1 6 3 8 6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>',
      flooring:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><rect x="4" y="6" width="16" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.6" /><rect x="4" y="14" width="16" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>',
      industrial:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M4 18h16v-6l-4 2v-2l-4 2v-2l-4 2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /><rect x="6" y="6" width="4" height="6" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>',
      custom:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M12 4a8 8 0 1 0 0 16c2 0 2-1 2-2s-1-1-2-1h-1a2 2 0 0 1 0-4h3a2 2 0 0 0 0-4h-1a2 2 0 0 1 0-4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg>'
    },
    wall: {
      walls:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><rect x="4" y="6" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6" /><path d="M4 12h16M9 6v6M15 12v6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" /></svg>',
      fences:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M5 18V8l2-2 2 2v10M11 18V8l2-2 2 2v10M17 18V8l2-2 2 2v10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>'
    },
    door: {
      doors:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><rect x="6" y="4" width="12" height="16" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.6" /><circle cx="14" cy="12" r="1" fill="currentColor" /></svg>',
      gates:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M4 18h16M6 18V8l2-2 2 2v10M14 18V8l2-2 2 2v10" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>'
    },
    furniture: {
      home:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M4 12l8-7 8 7v7H4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg>',
      kitchen:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><rect x="5" y="6" width="14" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" /><circle cx="9" cy="11" r="1.5" fill="none" stroke="currentColor" stroke-width="1.4" /><circle cx="15" cy="11" r="1.5" fill="none" stroke="currentColor" stroke-width="1.4" /></svg>',
      bath:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M12 4c3 4 5 7 5 9a5 5 0 1 1-10 0c0-2 2-5 5-9z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /></svg>',
      office:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><rect x="4" y="8" width="16" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6" /><path d="M9 8V6h6v2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>',
      medical:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M11 6h2v4h4v2h-4v4h-2v-4H7v-2h4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>',
      utility:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.6" /><path d="M12 4v3M12 17v3M4 12h3M17 12h3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>',
      recreation:
        '<svg viewBox="0 0 24 24" role="presentation" focusable="false"><path d="M9 18c6 0 8-2 8-6V6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /><circle cx="8" cy="18" r="2" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>'
    }
  };
  const FLOOR_CATEGORIES = {
    nature: {
      label: "Nature",
      materials: [
        "sand",
        "dirt",
        "mud",
        "gravel",
        "leafLitter",
        "grass",
        "lushGrass",
        "dryGrass",
        "tallGrass",
        "water",
        "hay"
      ]
    },
    flooring: {
      label: "Flooring",
      materials: [
        "wood",
        "woodPlank",
        "woodParquet",
        "brick",
        "bathroom",
        "kitchen",
        "medical",
        "tileTerracotta",
        "tileSlate"
      ]
    },
    industrial: {
      label: "Industrial",
      materials: [
        "concrete",
        "concreteCracked",
        "concreteBlock",
        "cobblestone",
        "asphalt",
        "parkingLot"
      ]
    },
    custom: {
      label: "Custom",
      materials: ["carpet", "checkerTile"],
      custom: true
    }
  };
  const WALL_CATEGORIES = {
    walls: {
      label: "Walls",
      items: [
        "standard",
        "plasterWall",
        "brickWall",
        "concreteWall",
        "metalWall",
        "logWall",
        "stallWall"
      ]
    },
    fences: {
      label: "Fences",
      items: ["picketFence", "chainLinkFence", "woodenFence"]
    }
  };
  const DOOR_CATEGORIES = {
    doors: {
      label: "Doors",
      items: ["standard", "metalDoor", "glassDoor", "garageDoor", "stallDoor"]
    },
    gates: {
      label: "Gates",
      items: ["logGate", "fenceGate", "chainGate"]
    }
  };
  const FURNITURE_CATEGORIES = {
    home: {
      label: "Home",
      items: [
        "bed",
        "chair",
        "couch",
        "armchair",
        "coffeeTable",
        "nightstand",
        "dresser",
        "wardrobe",
        "bookcase",
        "tvStand",
        "shelf",
        "wallShelf",
        "storageBox",
        "trashcan"
      ]
    },
    kitchen: {
      label: "Kitchen",
      items: [
        "sink",
        "steelCounter",
        "woodCounter",
        "miniFridge",
        "largeFridge",
        "freezer",
        "stove",
        "oldOven",
        "microwave",
        "dishwasher",
        "kitchenTable",
        "diningTable",
        "kitchenIsland",
        "waterTank"
      ]
    },
    bath: {
      label: "Bath",
      items: [
        "bathroomSink",
        "bathroomCounter",
        "toilet",
        "shower",
        "bathtub",
        "towelRack"
      ]
    },
    office: {
      label: "Office",
      items: [
        "desk",
        "officeTable",
        "deskChair",
        "computer",
        "fileCabinet",
        "schoolLockers",
        "whiteboard"
      ]
    },
    medical: {
      label: "Medical",
      items: [
        "medicalBed",
        "gurney",
        "medicalTray",
        "ivStand",
        "medicalCounter",
        "medCabinet"
      ]
    },
    utility: {
      label: "Utility",
      items: ["washer", "dryer", "waterBarrel", "generator", "metalShelf", "toolCabinet"]
    },
    recreation: {
      label: "Recreation",
      items: ["poolTable", "jukebox", "arcadeMachine"]
    }
  };
  const MATERIAL_CATEGORY_LOOKUP = {};
  const WALL_CATEGORY_LOOKUP = {};
  const DOOR_CATEGORY_LOOKUP = {};
  const FURNITURE_CATEGORY_LOOKUP = {};
  Object.entries(FLOOR_CATEGORIES).forEach(([category, config]) => {
    config.materials.forEach(material => {
      MATERIAL_CATEGORY_LOOKUP[material] = category;
    });
  });
  Object.entries(WALL_CATEGORIES).forEach(([category, config]) => {
    config.items.forEach(item => {
      WALL_CATEGORY_LOOKUP[item] = category;
    });
  });
  Object.entries(DOOR_CATEGORIES).forEach(([category, config]) => {
    config.items.forEach(item => {
      DOOR_CATEGORY_LOOKUP[item] = category;
    });
  });
  Object.entries(FURNITURE_CATEGORIES).forEach(([category, config]) => {
    config.items.forEach(item => {
      FURNITURE_CATEGORY_LOOKUP[item] = category;
    });
  });
  const activeCategoryByMode = {
    floor: MATERIAL_CATEGORY_LOOKUP[currentMaterial] ?? "nature",
    wall: WALL_CATEGORY_LOOKUP[currentWallType] ?? "walls",
    door: DOOR_CATEGORY_LOOKUP[currentDoorType] ?? "doors",
    furniture: FURNITURE_CATEGORY_LOOKUP[currentFurniture] ?? "home"
  };
  let activeDrawerCategory = null;

  function getMaterialSwatchColor(material) {
    if (material === "carpet") return customColorA;
    if (material === "checkerTile") return customColorA;
    return MATERIALS[material]?.color ?? "#3a3f46";
  }

  function updateTileColorUI() {
    if (!tileColorSection) return;
    const shouldShow =
      currentMode === "floor" &&
      (currentMaterial === "carpet" || currentMaterial === "checkerTile");
    tileColorSection.classList.toggle("is-hidden", !shouldShow);

    if (customColorAInput) {
      customColorAInput.value = normalizeHex(customColorA);
    }
    if (customColorBInput) {
      customColorBInput.value = normalizeHex(customColorB);
    }
    if (customColorAValue) {
      customColorAValue.textContent = normalizeHex(customColorA);
    }
    if (customColorBValue) {
      customColorBValue.textContent = normalizeHex(customColorB);
    }
    updateDrawerColorControls();
    updateDrawerSwatches();
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

  function updateProjectMetaUI() {
    if (projectTitle) {
      projectTitle.textContent = blueprintTitle;
    }
    if (projectVersion) {
      projectVersion.textContent = `v${blueprintVersion}`;
    }
    document.title = blueprintTitle ? `${blueprintTitle} | PZ Blueprint` : "PZ Blueprint";
  }

  function persistProjectMeta() {
    try {
      localStorage.setItem(PROJECT_TITLE_KEY, blueprintTitle);
      localStorage.setItem(PROJECT_VERSION_KEY, String(blueprintVersion));
      saveAutosave();
    } catch (error) {
      // Ignore storage failures in private mode.
    }
  }

  function loadProjectMeta() {
    try {
      const storedTitle = localStorage.getItem(PROJECT_TITLE_KEY);
      const storedVersion = localStorage.getItem(PROJECT_VERSION_KEY);
      if (storedTitle) {
        setBlueprintTitle(storedTitle);
      }
      if (storedVersion) {
        const parsed = Number.parseInt(storedVersion, 10);
        if (Number.isFinite(parsed) && parsed > 0) {
          setBlueprintVersion(parsed);
        }
      }
    } catch (error) {
      // Ignore storage failures in private mode.
    }
  }

  function buildAutosavePayload() {
    return {
      schema: 2,
      grid: { rows: gridRows, cols: gridCols },
      meta: { title: blueprintTitle, version: blueprintVersion },
      state: {
        material: currentMaterial,
        wallType: currentWallType,
        doorType: currentDoorType,
        furniture: currentFurniture,
        rotation: currentRotation,
        customColorA,
        customColorB,
        blendMode,
        blendSecondary,
        blendDiagonal,
        blendQuarter
      },
      items: dataStore.getAll()
    };
  }

  function saveAutosave() {
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(buildAutosavePayload()));
    } catch (error) {
      // Ignore storage failures in private mode.
    }
  }

  async function loadAutosave() {
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY);
      if (!raw) return false;
      const payload = JSON.parse(raw);
      const items = Array.isArray(payload) ? payload : payload.items;
      const metaTitle = payload?.meta?.title ?? payload?.title ?? payload?.name;
      const metaVersion = payload?.meta?.version ?? payload?.blueprintVersion;
      if (metaTitle) {
        setBlueprintTitle(metaTitle);
      }
      if (Number.isFinite(metaVersion) && metaVersion > 0) {
        setBlueprintVersion(metaVersion);
      }
      if (payload?.state) {
        if (payload.state.customColorA) {
          setCustomColorA(payload.state.customColorA);
        }
        if (payload.state.customColorB) {
          setCustomColorB(payload.state.customColorB);
        }
        if (payload.state.material) {
          setMaterial(payload.state.material);
        }
        if (payload.state.wallType) {
          setWallType(payload.state.wallType);
        }
        if (payload.state.doorType) {
          setDoorType(payload.state.doorType);
        }
        if (payload.state.furniture) {
          setFurniture(payload.state.furniture);
        }
        if (Number.isFinite(payload.state.rotation)) {
          setRotation(payload.state.rotation);
        }
        if (payload.state.blendMode) {
          setBlendMode(payload.state.blendMode);
        }
        if (payload.state.blendSecondary) {
          setBlendSecondary(payload.state.blendSecondary);
        }
        if (payload.state.blendDiagonal) {
          setBlendDiagonal(payload.state.blendDiagonal);
        }
        if (payload.state.blendQuarter) {
          setBlendQuarter(payload.state.blendQuarter);
        }
      }
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
      updateProjectMetaUI();
      persistProjectMeta();
      initializeGrid();
      updateGridSizeUI();
      return true;
    } catch (error) {
      return false;
    }
  }

  function editProjectTitle() {
    const next = window.prompt("Rename blueprint:", blueprintTitle);
    if (next === null) return;
    const trimmed = next.trim();
    if (!trimmed) return;
    setBlueprintTitle(trimmed);
    updateProjectMetaUI();
    persistProjectMeta();
    showToast("Blueprint renamed");
  }

  function editProjectVersion() {
    const next = window.prompt("Set version number:", String(blueprintVersion));
    if (next === null) return;
    const parsed = Number.parseInt(next, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      showToast("Version must be 1 or higher");
      return;
    }
    setBlueprintVersion(parsed);
    updateProjectMetaUI();
    persistProjectMeta();
    showToast(`Version set to v${parsed}`);
  }

  function incrementProjectVersion() {
    const next = blueprintVersion + 1;
    setBlueprintVersion(next);
    updateProjectMetaUI();
    persistProjectMeta();
    showToast(`Version set to v${next}`);
  }

  async function resetBlueprint() {
    const confirmed = window.confirm(
      "This will erase your current blueprint and restore defaults. Continue?"
    );
    if (!confirmed) return;
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
      localStorage.removeItem(PROJECT_TITLE_KEY);
      localStorage.removeItem(PROJECT_VERSION_KEY);
    } catch (error) {
      // Ignore storage failures in private mode.
    }
    setMode("cursor");
    setMaterial("sand");
    setWallType("standard");
    setDoorType("standard");
    setFurniture("bed");
    setRotation(0);
    setBlendMode("none");
    setBlendSecondary("sand");
    setBlendDiagonal("slash");
    setBlendQuarter("tl");
    setCustomColorA(DEFAULT_CARPET_COLOR);
    setCustomColorB(DEFAULT_CHECKER_B);
    setGridSize(DEFAULT_GRID_ROWS, DEFAULT_GRID_COLS);
    setBlueprintTitle(DEFAULT_TITLE);
    setBlueprintVersion(DEFAULT_VERSION);
    await dataStore.replaceAll([]);
    setSelectedFurnitureId(null);
    initializeGrid();
    updateModeUI("cursor");
    updateMaterialUI("sand");
    updateWallUI("standard");
    updateDoorUI("standard");
    updateFurnitureUI("bed");
    updateRotationButton();
    updateBlendModeUI(blendMode);
    updateBlendSecondaryUI(blendSecondary);
    updateBlendDiagonalUI(blendDiagonal);
    updateBlendQuarterUI(blendQuarter);
    updateGridSizeUI();
    updateTileColorUI();
    updateProjectMetaUI();
    updateUndoRedoUI();
    updateStatusBar();
    updateProperties();
    setZoom(1);
    showToast("Blueprint reset");
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

  function sanitizeFileName(value) {
    const safe = value.trim().replace(/[^a-z0-9_-]+/gi, "-");
    return safe.replace(/^-+|-+$/g, "");
  }

  async function exportBlueprintImage(includeGrid) {
    const items = dataStore.getAll();
    let canvas = null;
    try {
      canvas = await renderBlueprintToCanvas(items, { includeGrid });
    } catch (error) {
      showToast("Export failed");
      return;
    }
    if (!canvas) {
      showToast("Nothing to export yet");
      return;
    }
    const title = sanitizeFileName(blueprintTitle || "blueprint") || "blueprint";
    const suffix = includeGrid ? "grid" : "clean";
    const filename = `${title}-v${blueprintVersion}-${suffix}.png`;
    canvas.toBlob(blob => {
      if (!blob) {
        showToast("Export failed");
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast("Export ready");
    });
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
    if (drawerUndo) {
      drawerUndo.disabled = !dataStore.canUndo();
      drawerUndo.classList.toggle("is-active", dataStore.canUndo());
    }
    if (drawerRedo) {
      drawerRedo.disabled = !dataStore.canRedo();
      drawerRedo.classList.toggle("is-active", dataStore.canRedo());
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
      updateDrawerSelection();
      return;
    }

    if (currentMode === "floor") {
      selectedName.textContent = `${MATERIALS[currentMaterial]?.name ?? "Floor"} Floor`;
      updateProperties();
      updateDrawerSelection();
      return;
    }

    if (currentMode === "wall") {
      selectedName.textContent = WALL_TYPES[currentWallType]?.name ?? "Wall";
      updateProperties();
      updateDrawerSelection();
      return;
    }

    if (currentMode === "door") {
      selectedName.textContent = DOOR_TYPES[currentDoorType]?.name ?? "Door";
      updateProperties();
      updateDrawerSelection();
      return;
    }

    if (currentMode === "furniture") {
      selectedName.textContent = FURNITURE[currentFurniture]?.name ?? "Furniture";
      updateProperties();
      updateDrawerSelection();
      return;
    }

    if (currentMode === "rooms") {
      const wallName = WALL_TYPES[currentWallType]?.name ?? "Wall";
      selectedName.textContent = `Room (${wallName})`;
      updateProperties();
      updateDrawerSelection();
      return;
    }

    if (currentMode === "erase") {
      selectedName.textContent = "Eraser";
    }
    updateProperties();
    updateDrawerSelection();
  }

  function setDrawerSelection(iconKey, label) {
    if (!drawerSelection) return;
    const icon = drawerSelection.querySelector(".drawer-selection-icon");
    const text = drawerSelection.querySelector(".drawer-selection-text");
    if (icon) {
      icon.innerHTML = TOOL_ICONS[iconKey] ?? TOOL_ICONS.cursor;
    }
    if (text) {
      text.textContent = label;
    }
  }

  function updateDrawerSelection() {
    if (currentMode === "cursor") {
      setDrawerSelection("cursor", "Cursor");
      return;
    }
    if (currentMode === "floor") {
      setDrawerSelection(
        "floor",
        `Floor: ${MATERIALS[currentMaterial]?.name ?? "Floor"}`
      );
      return;
    }
    if (currentMode === "wall") {
      setDrawerSelection(
        "wall",
        `Wall: ${WALL_TYPES[currentWallType]?.name ?? "Wall"}`
      );
      return;
    }
    if (currentMode === "door") {
      setDrawerSelection(
        "door",
        `Door: ${DOOR_TYPES[currentDoorType]?.name ?? "Door"}`
      );
      return;
    }
    if (currentMode === "furniture") {
      setDrawerSelection(
        "furniture",
        `Furniture: ${FURNITURE[currentFurniture]?.name ?? "Furniture"}`
      );
      return;
    }
    if (currentMode === "rooms") {
      setDrawerSelection("rooms", "Room Tool");
      return;
    }
    if (currentMode === "erase") {
      setDrawerSelection("erase", "Erase");
      return;
    }
    setDrawerSelection("cursor", "Selection");
  }

  function getCategoryConfig(mode) {
    if (mode === "floor") return FLOOR_CATEGORIES;
    if (mode === "wall") return WALL_CATEGORIES;
    if (mode === "door") return DOOR_CATEGORIES;
    if (mode === "furniture") return FURNITURE_CATEGORIES;
    return null;
  }

  function filterExistingItems(mode, items) {
    if (!Array.isArray(items)) return [];
    if (mode === "floor") return items.filter(item => MATERIALS[item]);
    if (mode === "wall") return items.filter(item => WALL_TYPES[item]);
    if (mode === "door") return items.filter(item => DOOR_TYPES[item]);
    if (mode === "furniture") return items.filter(item => FURNITURE[item]);
    return [];
  }

  function getCategoryItems(mode, categoryId) {
    const config = getCategoryConfig(mode)?.[categoryId];
    if (!config) return [];
    const items = mode === "floor" ? config.materials : config.items;
    return filterExistingItems(mode, items);
  }

  function getCategoryList(mode) {
    const config = getCategoryConfig(mode);
    if (!config) return [];
    return Object.keys(config)
      .map(key => ({
        id: key,
        label: config[key].label ?? key,
        icon: CATEGORY_ICONS[mode]?.[key] ?? TOOL_ICONS.floor
      }))
      .filter(category => getCategoryItems(mode, category.id).length > 0);
  }

  function setActiveCategory(mode, categoryId) {
    if (!mode || !categoryId) return;
    activeCategoryByMode[mode] = categoryId;
    if (mode === currentMode) {
      renderDrawerCategories(mode);
    }
  }

  function renderDrawerCategories(mode) {
    if (!drawerCategories) return;
    const categories = getCategoryList(mode);
    drawerCategories.innerHTML = "";
    if (!categories.length) {
      drawerCategories.classList.add("is-hidden");
      return;
    }
    drawerCategories.classList.remove("is-hidden");
    const stored = activeCategoryByMode[mode];
    const current = categories.some(category => category.id === stored)
      ? stored
      : categories[0].id;
    activeCategoryByMode[mode] = current;
    categories.forEach(category => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "drawer-btn";
      button.dataset.drawerCategory = category.id;
      button.dataset.drawerCategoryMode = mode;
      button.dataset.tooltip = category.label;
      button.setAttribute("aria-label", category.label);
      button.innerHTML = category.icon;
      button.classList.toggle("is-active", category.id === current);
      button.addEventListener("click", event => {
        event.stopPropagation();
        if (isDrawerCategoryOpen(mode, category.id)) {
          closeDrawerPopover();
          return;
        }
        selectMode(mode);
        openDrawerCategoryPopover(mode, category.id);
      });
      drawerCategories.appendChild(button);
    });
  }

  function resolveCategory(mode, categoryId) {
    const categories = getCategoryList(mode);
    if (!categories.length) return null;
    if (categoryId && categories.some(category => category.id === categoryId)) {
      return categoryId;
    }
    return categories[0].id;
  }

  function isDrawerCategoryOpen(mode, categoryId) {
    if (!drawerPopover || drawerPopover.classList.contains("is-hidden")) return false;
    return (
      activeDrawerCategory?.mode === mode &&
      activeDrawerCategory?.category === categoryId
    );
  }

  function openDrawerCategoryPopover(mode, categoryId) {
    const resolved = resolveCategory(mode, categoryId);
    if (!resolved) return;
    setActiveCategory(mode, resolved);
    if (mode === "floor") {
      renderDrawerFloorCategory(resolved);
      return;
    }
    if (mode === "wall") {
      renderDrawerWallCategory(resolved);
      return;
    }
    if (mode === "door") {
      renderDrawerDoorCategory(resolved);
      return;
    }
    if (mode === "furniture") {
      renderDrawerFurnitureCategory(resolved);
    }
  }

  function updateModeUI(mode) {
    modeButtons.forEach(button => {
      button.classList.toggle("is-active", button.dataset.mode === mode);
    });
    drawerToolButtons.forEach(button => {
      button.classList.toggle("is-active", button.dataset.mode === mode);
    });

    if (modeIndicator) {
      modeIndicator.textContent = `Mode: ${formatModeLabel(mode)}`;
    }

    if (canvasViewport) {
      canvasViewport.classList.toggle("cursor-mode", mode === "cursor");
    }

    renderDrawerCategories(mode);

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

  function selectMode(mode) {
    setMode(mode);
    updateModeUI(mode);
    document.dispatchEvent(new CustomEvent("mode-changed"));
  }

  function updateMaterialUI(material) {
    if (material === "checkerTile") {
      const a = normalizeHex(customColorA);
      const b = normalizeHex(customColorB);
      if (a === DEFAULT_CARPET_COLOR && b === DEFAULT_CHECKER_B) {
        setCustomColorA(DEFAULT_CHECKER_A);
        setCustomColorB(DEFAULT_CHECKER_B);
      }
    }
    if (material === "carpet") {
      const a = normalizeHex(customColorA);
      const b = normalizeHex(customColorB);
      if (a === DEFAULT_CHECKER_A && b === DEFAULT_CHECKER_B) {
        setCustomColorA(DEFAULT_CARPET_COLOR);
        setCustomColorB(DEFAULT_CHECKER_B);
      }
    }
    materialButtons.forEach(button => {
      button.classList.toggle(
        "is-active",
        button.dataset.material === material
      );
    });
    const category = MATERIAL_CATEGORY_LOOKUP[material];
    if (category) {
      setActiveCategory("floor", category);
    }
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
    const category = FURNITURE_CATEGORY_LOOKUP[kind];
    if (category) {
      setActiveCategory("furniture", category);
    }
    updateSelectedInfo();
  }

  function updateWallUI(kind) {
    wallButtons.forEach(button => {
      button.classList.toggle("is-active", button.dataset.wall === kind);
    });
    const category = WALL_CATEGORY_LOOKUP[kind];
    if (category) {
      setActiveCategory("wall", category);
    }
    updateSelectedInfo();
  }

  function updateDoorUI(kind) {
    doorButtons.forEach(button => {
      button.classList.toggle("is-active", button.dataset.door === kind);
    });
    const category = DOOR_CATEGORY_LOOKUP[kind];
    if (category) {
      setActiveCategory("door", category);
    }
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

  function updateDrawerSwatches() {
    if (drawerPopover) {
      drawerPopover
        .querySelectorAll("[data-drawer-material]")
        .forEach(button => {
          const swatch = button.querySelector(".swatch");
          if (!swatch) return;
          swatch.style.background = getMaterialSwatchColor(
            button.dataset.drawerMaterial
          );
        });
    }
    if (drawerSearchResults) {
      drawerSearchResults
        .querySelectorAll("[data-drawer-material]")
        .forEach(button => {
          const swatch = button.querySelector(".swatch");
          if (!swatch) return;
          swatch.style.background = getMaterialSwatchColor(
            button.dataset.drawerMaterial
          );
        });
    }
  }

  function updateDrawerColorControls() {
    if (!drawerPopover) return;
    const inputA = drawerPopover.querySelector("[data-drawer-color='a']");
    const inputB = drawerPopover.querySelector("[data-drawer-color='b']");
    const valueA = drawerPopover.querySelector("[data-drawer-color-value='a']");
    const valueB = drawerPopover.querySelector("[data-drawer-color-value='b']");
    if (inputA) inputA.value = normalizeHex(customColorA);
    if (inputB) inputB.value = normalizeHex(customColorB);
    if (valueA) valueA.textContent = normalizeHex(customColorA);
    if (valueB) valueB.textContent = normalizeHex(customColorB);
  }

  function closeDrawerPopover() {
    if (!drawerPopover) return;
    drawerPopover.classList.add("is-hidden");
    drawerPopover.innerHTML = "";
    activeDrawerCategory = null;
  }

  function openDrawerPopover(content, meta) {
    if (!drawerPopover) return;
    drawerPopover.innerHTML = "";
    drawerPopover.appendChild(content);
    drawerPopover.classList.remove("is-hidden");
    activeDrawerCategory = meta ?? null;
    updateDrawerColorControls();
  }

  function buildDrawerHeader(title) {
    const header = document.createElement("div");
    header.className = "drawer-popover-header";
    const heading = document.createElement("div");
    heading.className = "drawer-popover-title";
    heading.textContent = title;
    const close = document.createElement("button");
    close.type = "button";
    close.className = "drawer-popover-close";
    close.textContent = "Close";
    close.dataset.drawerClose = "true";
    header.append(heading, close);
    return header;
  }

  function createDrawerItemButton({ label, swatch, dataset, isActive }) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "drawer-item";
    if (isActive) {
      button.classList.add("is-active");
    }
    Object.entries(dataset).forEach(([key, value]) => {
      button.dataset[key] = value;
    });
    const swatchEl = document.createElement("span");
    swatchEl.className = "swatch";
    swatchEl.style.background = swatch;
    const text = document.createElement("span");
    text.className = "label";
    text.textContent = label;
    button.append(swatchEl, text);
    return button;
  }

  function buildDrawerColorControl(label, value, key, note) {
    const wrapper = document.createElement("div");
    wrapper.className = "color-control";
    const name = document.createElement("div");
    name.className = "color-label";
    name.textContent = label;
    const row = document.createElement("div");
    row.className = "color-input-row";
    const input = document.createElement("input");
    input.type = "color";
    input.value = normalizeHex(value);
    input.dataset.drawerColor = key;
    const valueText = document.createElement("span");
    valueText.className = "color-value";
    valueText.dataset.drawerColorValue = key;
    valueText.textContent = normalizeHex(value);
    row.append(input, valueText);
    wrapper.append(name, row);
    if (note) {
      const noteEl = document.createElement("div");
      noteEl.className = "color-note";
      noteEl.textContent = note;
      wrapper.appendChild(noteEl);
    }
    return wrapper;
  }

  function renderDrawerFloorCategory(categoryKey) {
    closeDrawerSearch();
    const resolvedKey = resolveCategory("floor", categoryKey);
    if (!resolvedKey) return;
    const category = FLOOR_CATEGORIES[resolvedKey];

    const panel = document.createElement("div");
    panel.appendChild(buildDrawerHeader(`${category.label} Floors`));

    if (category.custom) {
      const controls = document.createElement("div");
      controls.className = "drawer-color-controls";
      controls.appendChild(
        buildDrawerColorControl("Color A", customColorA, "a", null)
      );
      controls.appendChild(
        buildDrawerColorControl(
          "Color B",
          customColorB,
          "b",
          "Used by checker tiles."
        )
      );
      panel.appendChild(controls);
    }

    const grid = document.createElement("div");
    grid.className = "drawer-grid";
    getCategoryItems("floor", resolvedKey)
      .slice()
      .sort((a, b) => {
        const nameA = MATERIALS[a]?.name ?? a;
        const nameB = MATERIALS[b]?.name ?? b;
        return nameA.localeCompare(nameB);
      })
      .forEach(material => {
        const info = MATERIALS[material];
        if (!info) return;
        grid.appendChild(
          createDrawerItemButton({
            label: info.name ?? material,
            swatch: getMaterialSwatchColor(material),
            dataset: { drawerMaterial: material },
            isActive: material === currentMaterial
          })
        );
      });
    panel.appendChild(grid);
    openDrawerPopover(panel, { mode: "floor", category: resolvedKey });
  }

  function renderDrawerWallCategory(categoryKey) {
    closeDrawerSearch();
    const resolvedKey = resolveCategory("wall", categoryKey);
    if (!resolvedKey) return;
    const category = WALL_CATEGORIES[resolvedKey];
    const panel = document.createElement("div");
    panel.appendChild(buildDrawerHeader(category.label));
    const grid = document.createElement("div");
    grid.className = "drawer-grid";
    getCategoryItems("wall", resolvedKey)
      .slice()
      .sort((a, b) => {
        const nameA = WALL_TYPES[a]?.name ?? a;
        const nameB = WALL_TYPES[b]?.name ?? b;
        return nameA.localeCompare(nameB);
      })
      .forEach(key => {
        const config = WALL_TYPES[key];
        if (!config) return;
        grid.appendChild(
          createDrawerItemButton({
            label: config.name ?? key,
            swatch: config.color ?? "#3a3f46",
            dataset: { drawerWall: key },
            isActive: key === currentWallType
          })
        );
      });
    panel.appendChild(grid);
    openDrawerPopover(panel, { mode: "wall", category: resolvedKey });
  }

  function renderDrawerDoorCategory(categoryKey) {
    closeDrawerSearch();
    const resolvedKey = resolveCategory("door", categoryKey);
    if (!resolvedKey) return;
    const category = DOOR_CATEGORIES[resolvedKey];
    const panel = document.createElement("div");
    panel.appendChild(buildDrawerHeader(category.label));
    const grid = document.createElement("div");
    grid.className = "drawer-grid";
    getCategoryItems("door", resolvedKey)
      .slice()
      .sort((a, b) => {
        const nameA = DOOR_TYPES[a]?.name ?? a;
        const nameB = DOOR_TYPES[b]?.name ?? b;
        return nameA.localeCompare(nameB);
      })
      .forEach(key => {
        const config = DOOR_TYPES[key];
        if (!config) return;
        grid.appendChild(
          createDrawerItemButton({
            label: config.name ?? key,
            swatch: config.color ?? "#3a3f46",
            dataset: { drawerDoor: key },
            isActive: key === currentDoorType
          })
        );
      });
    panel.appendChild(grid);
    openDrawerPopover(panel, { mode: "door", category: resolvedKey });
  }

  function renderDrawerFurnitureCategory(categoryKey) {
    closeDrawerSearch();
    const resolvedKey = resolveCategory("furniture", categoryKey);
    if (!resolvedKey) return;
    const category = FURNITURE_CATEGORIES[resolvedKey];
    const panel = document.createElement("div");
    panel.appendChild(buildDrawerHeader(category.label));
    const grid = document.createElement("div");
    grid.className = "drawer-grid";
    getCategoryItems("furniture", resolvedKey)
      .slice()
      .sort((a, b) => {
        const nameA = FURNITURE[a]?.name ?? a;
        const nameB = FURNITURE[b]?.name ?? b;
        return nameA.localeCompare(nameB);
      })
      .forEach(item => {
        const config = FURNITURE[item];
        if (!config) return;
        grid.appendChild(
          createDrawerItemButton({
            label: config.name ?? item,
            swatch: config.color ?? "#3a3f46",
            dataset: { drawerFurniture: item },
            isActive: item === currentFurniture
          })
        );
      });
    panel.appendChild(grid);
    openDrawerPopover(panel, { mode: "furniture", category: resolvedKey });
  }

  const drawerSearchIndex = [
    ...Object.entries(MATERIALS).map(([key, config]) => ({
      type: "floor",
      key,
      label: config.name ?? key
    })),
    ...Object.entries(WALL_TYPES).map(([key, config]) => ({
      type: "wall",
      key,
      label: config.name ?? key
    })),
    ...Object.entries(DOOR_TYPES).map(([key, config]) => ({
      type: "door",
      key,
      label: config.name ?? key
    })),
    ...Object.entries(FURNITURE).map(([key, config]) => ({
      type: "furniture",
      key,
      label: config.name ?? key
    }))
  ];

  function renderDrawerSearchResults(query) {
    if (!drawerSearchResults) return;
    const trimmed = query.trim().toLowerCase();
    drawerSearchResults.innerHTML = "";
    if (!trimmed) return;

    const results = drawerSearchIndex
      .filter(item => item.label.toLowerCase().includes(trimmed))
      .sort((a, b) => a.label.localeCompare(b.label));

    if (!results.length) {
      const empty = document.createElement("div");
      empty.className = "drawer-search-empty";
      empty.textContent = "No matches";
      drawerSearchResults.appendChild(empty);
      return;
    }

    results.slice(0, 30).forEach(item => {
      if (item.type === "floor") {
        drawerSearchResults.appendChild(
          createDrawerItemButton({
            label: `Floor: ${item.label}`,
            swatch: getMaterialSwatchColor(item.key),
            dataset: { drawerMaterial: item.key },
            isActive: item.key === currentMaterial
          })
        );
        return;
      }
      if (item.type === "wall") {
        drawerSearchResults.appendChild(
          createDrawerItemButton({
            label: `Wall: ${item.label}`,
            swatch: WALL_TYPES[item.key]?.color ?? "#3a3f46",
            dataset: { drawerWall: item.key },
            isActive: item.key === currentWallType
          })
        );
        return;
      }
      if (item.type === "door") {
        drawerSearchResults.appendChild(
          createDrawerItemButton({
            label: `Door: ${item.label}`,
            swatch: DOOR_TYPES[item.key]?.color ?? "#3a3f46",
            dataset: { drawerDoor: item.key },
            isActive: item.key === currentDoorType
          })
        );
        return;
      }
      drawerSearchResults.appendChild(
        createDrawerItemButton({
          label: `Furniture: ${item.label}`,
          swatch: FURNITURE[item.key]?.color ?? "#3a3f46",
          dataset: { drawerFurniture: item.key },
          isActive: item.key === currentFurniture
        })
      );
    });
  }

  function openDrawerSearch() {
    if (!drawerSearch || !drawerSearchInput) return;
    closeDrawerPopover();
    drawerSearch.classList.remove("is-hidden");
    drawerSearchInput.focus();
    drawerSearchInput.select();
  }

  function closeDrawerSearch() {
    if (!drawerSearch || !drawerSearchInput) return;
    drawerSearch.classList.add("is-hidden");
    drawerSearchInput.value = "";
    if (drawerSearchResults) {
      drawerSearchResults.innerHTML = "";
    }
  }

  function applyDrawerSelection(kind, value) {
    if (!value) return;
    if (kind === "material") {
      selectMode("floor");
      setMaterial(value);
      updateMaterialUI(value);
      closeDrawerPopover();
      closeDrawerSearch();
      return;
    }
    if (kind === "wall") {
      selectMode("wall");
      setWallType(value);
      updateWallUI(value);
      closeDrawerPopover();
      closeDrawerSearch();
      return;
    }
    if (kind === "door") {
      selectMode("door");
      setDoorType(value);
      updateDoorUI(value);
      closeDrawerPopover();
      closeDrawerSearch();
      return;
    }
    if (kind === "furniture") {
      selectMode("furniture");
      setFurniture(value);
      updateFurnitureUI(value);
      closeDrawerPopover();
      closeDrawerSearch();
    }
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

    updateDrawerSwatches();
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
    panCandidate = true;
    panPointerId = e.pointerId;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panScrollLeft = canvasViewport.scrollLeft;
    panScrollTop = canvasViewport.scrollTop;
  }

  function activatePan() {
    if (!canvasViewport || panPointerId === null) return;
    isPanning = true;
    canvasViewport.setPointerCapture(panPointerId);
    canvasViewport.classList.add("is-panning");
  }

  function updatePan(e) {
    if (!canvasViewport || e.pointerId !== panPointerId) return;
    if (panCandidate && !isPanning) {
      const dx = e.clientX - panStartX;
      const dy = e.clientY - panStartY;
      if (dx * dx + dy * dy < 36) return;
      activatePan();
    }
    if (!isPanning) return;
    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;
    canvasViewport.scrollLeft = panScrollLeft - dx;
    canvasViewport.scrollTop = panScrollTop - dy;
  }

  function endPan(e) {
    if (!canvasViewport || e.pointerId !== panPointerId) return;
    if (isPanning) {
      canvasViewport.releasePointerCapture(panPointerId);
      canvasViewport.classList.remove("is-panning");
    }
    isPanning = false;
    panCandidate = false;
    panPointerId = null;
  }

  modeButtons.forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      selectMode(mode);
    });
  });

  if (projectTitle) {
    projectTitle.addEventListener("click", editProjectTitle);
    projectTitle.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        editProjectTitle();
      }
    });
  }

  if (projectVersion) {
    projectVersion.addEventListener("click", editProjectVersion);
  }

  if (projectVersionInc) {
    projectVersionInc.addEventListener("click", incrementProjectVersion);
  }

  drawerToolButtons.forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      if (!mode) return;
      selectMode(mode);

      if (["floor", "wall", "door", "furniture"].includes(mode)) {
        openDrawerCategoryPopover(mode, activeCategoryByMode[mode]);
        return;
      }

      closeDrawerPopover();
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

  if (drawerPopover) {
    drawerPopover.addEventListener("click", event => {
      const closeButton = event.target.closest("[data-drawer-close]");
      if (closeButton) {
        closeDrawerPopover();
        return;
      }
      const materialButton = event.target.closest("[data-drawer-material]");
      if (materialButton) {
        applyDrawerSelection("material", materialButton.dataset.drawerMaterial);
        return;
      }
      const wallButton = event.target.closest("[data-drawer-wall]");
      if (wallButton) {
        applyDrawerSelection("wall", wallButton.dataset.drawerWall);
        return;
      }
      const doorButton = event.target.closest("[data-drawer-door]");
      if (doorButton) {
        applyDrawerSelection("door", doorButton.dataset.drawerDoor);
        return;
      }
      const furnitureButton = event.target.closest("[data-drawer-furniture]");
      if (furnitureButton) {
        applyDrawerSelection(
          "furniture",
          furnitureButton.dataset.drawerFurniture
        );
      }
    });

    drawerPopover.addEventListener("input", event => {
      const input = event.target;
      if (!input.matches("[data-drawer-color]")) return;
      const value = normalizeHex(input.value);
      if (input.dataset.drawerColor === "a") {
        setCustomColorA(value);
      } else {
        setCustomColorB(value);
      }
      const container = input.closest(".color-control");
      const display = container?.querySelector(".color-value");
      if (display) display.textContent = value;
      applySwatches();
      updateTileColorUI();
      saveAutosave();
    });
  }

  if (drawerSearchInput) {
    drawerSearchInput.addEventListener("input", event => {
      renderDrawerSearchResults(event.target.value);
      updateDrawerSwatches();
    });
  }

  if (drawerSearchResults) {
    drawerSearchResults.addEventListener("click", event => {
      const materialButton = event.target.closest("[data-drawer-material]");
      if (materialButton) {
        applyDrawerSelection("material", materialButton.dataset.drawerMaterial);
        return;
      }
      const wallButton = event.target.closest("[data-drawer-wall]");
      if (wallButton) {
        applyDrawerSelection("wall", wallButton.dataset.drawerWall);
        return;
      }
      const doorButton = event.target.closest("[data-drawer-door]");
      if (doorButton) {
        applyDrawerSelection("door", doorButton.dataset.drawerDoor);
        return;
      }
      const furnitureButton = event.target.closest("[data-drawer-furniture]");
      if (furnitureButton) {
        applyDrawerSelection(
          "furniture",
          furnitureButton.dataset.drawerFurniture
        );
      }
    });
  }

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

  if (customColorAInput) {
    customColorAInput.addEventListener("input", event => {
      const value = normalizeHex(event.target.value);
      setCustomColorA(value);
      if (customColorAValue) {
        customColorAValue.textContent = value;
      }
      applySwatches();
      updateTileColorUI();
      saveAutosave();
    });
  }

  if (customColorBInput) {
    customColorBInput.addEventListener("input", event => {
      const value = normalizeHex(event.target.value);
      setCustomColorB(value);
      if (customColorBValue) {
        customColorBValue.textContent = value;
      }
      applySwatches();
      updateTileColorUI();
      saveAutosave();
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
        saveAutosave();
        showToast("Grid resized");
        closeGridPopover();
      });
    }

    if (gridCancel) {
      gridCancel.addEventListener("click", closeGridPopover);
    }
  }

  if (optionsButton && optionsPopover) {
    const closeOptionsPopover = () => {
      optionsPopover.classList.add("is-hidden");
      if (gridPopover && !gridPopover.classList.contains("is-hidden")) {
        gridPopover.classList.add("is-hidden");
      }
    };
    const openOptionsPopover = () => {
      optionsPopover.classList.remove("is-hidden");
    };

    optionsButton.addEventListener("click", event => {
      event.stopPropagation();
      if (optionsPopover.classList.contains("is-hidden")) {
        openOptionsPopover();
      } else {
        closeOptionsPopover();
      }
    });

    optionsPopover.addEventListener("click", event => {
      event.stopPropagation();
    });

    document.addEventListener("click", event => {
      if (!optionsPopover.classList.contains("is-hidden")) {
        if (!optionsPopover.contains(event.target) && event.target !== optionsButton) {
          closeOptionsPopover();
        }
      }
    });
  }

  if (exportButton && exportPopover) {
    const closeExportPopover = () => {
      exportPopover.classList.add("is-hidden");
    };
    const openExportPopover = () => {
      exportPopover.classList.remove("is-hidden");
    };

    exportButton.addEventListener("click", event => {
      event.stopPropagation();
      if (exportPopover.classList.contains("is-hidden")) {
        openExportPopover();
      } else {
        closeExportPopover();
      }
    });

    exportPopover.addEventListener("click", event => {
      event.stopPropagation();
      const button = event.target.closest("[data-export]");
      if (!button) return;
      const mode = button.dataset.export;
      exportBlueprintImage(mode === "grid");
      closeExportPopover();
    });

    document.addEventListener("click", () => {
      if (!exportPopover.classList.contains("is-hidden")) {
        closeExportPopover();
      }
    });
  }

  document.addEventListener("click", event => {
    if (drawerPopover && !drawerPopover.classList.contains("is-hidden")) {
      if (!drawer?.contains(event.target)) {
        closeDrawerPopover();
      }
    }
    if (drawerSearch && !drawerSearch.classList.contains("is-hidden")) {
      if (!drawer?.contains(event.target)) {
        closeDrawerSearch();
      }
    }
  });

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

  if (drawerUndo) {
    drawerUndo.addEventListener("click", () => {
      const result = dataStore.undo();
      if (result.isOk) {
        showToast("Undo");
      }
      updateUndoRedoUI();
    });
  }

  if (drawerRedo) {
    drawerRedo.addEventListener("click", () => {
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
        if (payload && !Array.isArray(payload)) {
          const metaTitle = payload?.meta?.title ?? payload?.title ?? payload?.name;
          const metaVersion = payload?.meta?.version ?? payload?.blueprintVersion;
          if (metaTitle) {
            setBlueprintTitle(metaTitle);
          }
          if (Number.isFinite(metaVersion) && metaVersion > 0) {
            setBlueprintVersion(metaVersion);
          }
          updateProjectMetaUI();
          persistProjectMeta();
        }
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
        schema: 2,
        grid: { rows: gridRows, cols: gridCols },
        meta: { title: blueprintTitle, version: blueprintVersion },
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
      closeDrawerPopover();
      closeDrawerSearch();
    });
  }

  if (toggleDrawer) {
    const updateDrawerToggle = () => {
      toggleDrawer.textContent = document.body.classList.contains("drawer-mode")
        ? "Panels"
        : "Drawer";
    };
    updateDrawerToggle();
    toggleDrawer.addEventListener("click", () => {
      document.body.classList.toggle("drawer-mode");
      updateDrawerToggle();
      closeDrawerPopover();
      closeDrawerSearch();
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      resetBlueprint();
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

    if (key === "/" && !hasMod && document.body.classList.contains("drawer-mode")) {
      event.preventDefault();
      openDrawerSearch();
      return;
    }

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

    if (key === "escape") {
      if (drawerSearch && !drawerSearch.classList.contains("is-hidden")) {
        closeDrawerSearch();
        closeDrawerPopover();
        return;
      }
      if (drawerPopover && !drawerPopover.classList.contains("is-hidden")) {
        closeDrawerPopover();
        return;
      }
      if (helpPanel && helpBackdrop) {
        helpPanel.classList.add("is-hidden");
        helpBackdrop.classList.add("is-hidden");
        return;
      }
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

  function getFurnitureStackRank(item) {
    const config = FURNITURE[item.kind];
    if (config?.stackLayer) return config.stackLayer;
    const slot = item.slot ?? "base";
    return slot === "base" ? 1 : 2;
  }

  function matchesFurnitureTile(item, row, col) {
    const config = FURNITURE[item.kind];
    if (!config?.size) return false;
    let [width, height] = config.size;
    const rotation = item.rotation ?? 0;
    if (rotation === 90 || rotation === 270) {
      [width, height] = [height, width];
    }
    return (
      row >= item.row &&
      row < item.row + height &&
      col >= item.col &&
      col < item.col + width
    );
  }

  document.addEventListener("tile-long-press", event => {
    const detail = event.detail ?? {};
    const row = detail.row;
    const col = detail.col;
    if (typeof row !== "number" || typeof col !== "number") return;

    const items = dataStore.getAll();
    const furnitureMatches = items.filter(
      item => item.type === "furniture" && matchesFurnitureTile(item, row, col)
    );
    if (furnitureMatches.length) {
      const selected = furnitureMatches.sort(
        (a, b) => getFurnitureStackRank(b) - getFurnitureStackRank(a)
      )[0];
      selectMode("furniture");
      setFurniture(selected.kind);
      setRotation(selected.rotation ?? 0);
      updateFurnitureUI(selected.kind);
      updateRotationButton();
      setSelectedFurnitureId(selected.id ?? null);
      return;
    }

    const edge = detail.edge;
    if (edge) {
      const door = items.find(
        item =>
          item.type === "door" &&
          item.row === row &&
          item.col === col &&
          item.dir === edge
      );
      if (door) {
        selectMode("door");
        setDoorType(door.doorType ?? "standard");
        updateDoorUI(door.doorType ?? "standard");
        return;
      }

      const wall = items.find(
        item =>
          item.type === "wall" &&
          item.row === row &&
          item.col === col &&
          item.dir === edge
      );
      if (wall) {
        selectMode("wall");
        setWallType(wall.wallType ?? "standard");
        updateWallUI(wall.wallType ?? "standard");
        return;
      }
    }

    const floor = items.find(
      item => item.type === "floor" && item.row === row && item.col === col
    );
    if (floor) {
      selectMode("floor");
      const material = floor.material ?? "sand";
      setMaterial(material);
      if (floor.tint) {
        setCustomColorA(normalizeHex(floor.tint));
      }
      if (floor.tintSecondary) {
        setCustomColorB(normalizeHex(floor.tintSecondary));
      }
      applySwatches();

      if (floor.blend?.secondary) {
        setBlendSecondary(floor.blend.secondary);
        if (floor.blend.mode === "diag") {
          setBlendMode("diag-manual");
          setBlendDiagonal(floor.blend.variant ?? "slash");
        } else if (floor.blend.mode === "quarter") {
          setBlendMode("quarter-manual");
          setBlendQuarter(floor.blend.corner ?? "tl");
        } else if (floor.blend.mode === "diag-auto") {
          setBlendMode("diag-auto");
        }
      } else {
        setBlendMode("none");
      }

      updateMaterialUI(material);
      updateBlendModeUI(blendMode);
      updateBlendSecondaryUI(blendSecondary);
      updateBlendDiagonalUI(blendDiagonal);
      updateBlendQuarterUI(blendQuarter);
      return;
    }

    selectMode("erase");
  });

  document.addEventListener("blueprint-changed", () => {
    updateUndoRedoUI();
    saveAutosave();
  });

  async function tryLoadShareLink() {
    if (!window.location.hash) return false;
    try {
      const payload = await decodeShareHash(window.location.hash);
      if (!payload) {
        showToast("Shared link not supported in this browser");
        return false;
      }
      if (payload && !Array.isArray(payload)) {
        const metaTitle = payload?.meta?.title ?? payload?.title ?? payload?.name;
        const metaVersion = payload?.meta?.version ?? payload?.blueprintVersion;
        if (metaTitle) {
          setBlueprintTitle(metaTitle);
        }
        if (Number.isFinite(metaVersion) && metaVersion > 0) {
          setBlueprintVersion(metaVersion);
        }
        updateProjectMetaUI();
        persistProjectMeta();
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
      return true;
    } catch (error) {
      showToast("Shared link invalid");
      return false;
    }
  }

  loadProjectMeta();
  updateProjectMetaUI();

  const loadedFromShare = await tryLoadShareLink();
  if (!loadedFromShare) {
    await loadAutosave();
  }

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



