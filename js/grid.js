import { ROWS, COLS, currentMode } from "./state.js";
import { handleFloorClick, resetFloorPaintSession } from "./floors.js";
import { handleWallClick } from "./walls.js";
import { handleFurnitureClick } from "./furniture.js";
import { startRoomDraw, updateRoomDraw, endRoomDraw } from "./rooms.js";
import { handleErase } from "./erase.js";

let activePointerId = null;
let previewWall = null; // { tile, edge }

export function initializeGrid() {
    const container = document.getElementById("grid");
    container.innerHTML = "";
    container.style.display = "grid";
    container.style.gridTemplateColumns = `repeat(${COLS}, 40px)`;
    container.style.gridTemplateRows = `repeat(${ROWS}, 40px)`;

    // Build tiles
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const tile = document.createElement("div");
            tile.className = "tile";
            tile.dataset.row = row;
            tile.dataset.col = col;
            container.appendChild(tile);
        }
    }

    // Pointer handlers on the CONTAINER, not tiles
    container.addEventListener("pointerdown", onPointerDown);
    container.addEventListener("pointermove", onPointerMove);
    container.addEventListener("pointerup", onPointerEnd);
    container.addEventListener("pointercancel", onPointerEnd);

    function onPointerDown(e) {
        clearWallPreview();

        if (e.button !== 0) return;
        if (activePointerId !== null) return;

        const tile = getTileFromEvent(e);
        if (!tile) return;

        activePointerId = e.pointerId;
        container.setPointerCapture(activePointerId);

        applyToolDown(tile, e);
    }


    function onPointerMove(e) {
        if (e.pointerId !== activePointerId && currentMode !== "wall") return;

        const tile = getTileFromEvent(e);
        if (!tile) {
            clearWallPreview();
            return;
        }

        if (currentMode === "wall") {
            const edge = getWallEdgeFromEvent(tile, e);
            if (edge) {
                showWallPreview(tile, edge);
            } else {
                clearWallPreview();
            }
            return;
        }

        // existing drag tools
        applyToolMove(tile);
    }


    function onPointerEnd(e) {
        clearWallPreview();

        if (e.pointerId !== activePointerId) return;

        activePointerId = null;

        if (currentMode === "floor") {
            resetFloorPaintSession();
        }

        if (currentMode === "room") {
            endRoomDraw();
        }
    }

    function getTileFromEvent(e) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (!el) return null;

        // If we hit a child (like .floor), walk up to .tile
        const tile = el.closest(".tile");
        if (!tile || !container.contains(tile)) return null;

        return tile;
    }

    function getWallEdgeFromEvent(tile, e) {
        const rect = tile.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const EDGE_MARGIN = 8; // px – tweak if needed

        if (y <= EDGE_MARGIN) return "N";
        if (x >= rect.width - EDGE_MARGIN) return "E";

        return null;
    }

    function clearWallPreview() {
        if (!previewWall) return;

        previewWall.tile.classList.remove(
            "wall-preview-n",
            "wall-preview-e"
        );

        previewWall = null;
    }

    function showWallPreview(tile, edge) {
        if (
            previewWall &&
            previewWall.tile === tile &&
            previewWall.edge === edge
        ) {
            return; // already previewing this edge
        }

        clearWallPreview();

        if (edge === "N") {
            tile.classList.add("wall-preview-n");
        } else if (edge === "E") {
            tile.classList.add("wall-preview-e");
        }

        previewWall = { tile, edge };
    }

    function applyToolDown(tile, e) {
        const row = Number(tile.dataset.row);
        const col = Number(tile.dataset.col);

        if (currentMode === "floor") {
            handleFloorClick(row, col);
        } else if (currentMode === "erase") {
            handleErase(row, col);
        } else if (currentMode === "wall") {
            handleWallClick(row, col, tile,e); // ✅ walls ONLY here
        } else if (currentMode === "furniture") {
            handleFurnitureClick(row, col);
        } else if (currentMode === "room") {
            startRoomDraw(row, col);
        }
    }

    function applyToolMove(tile) {
        const row = Number(tile.dataset.row);
        const col = Number(tile.dataset.col);

        if (currentMode === "floor") {
            handleFloorClick(row, col);
        } else if (currentMode === "erase") {
            handleErase(row, col);
        } else if (currentMode === "room") {
            updateRoomDraw(row, col);
        }
    }

}
