// walls.js
import { dataStore, getAll } from "./datastore.js";

/**
 * Determines which edge of the tile was clicked
 */
function getEdgeFromClick(tile, e) {
    const rect = tile.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const margin = 8;
    if (y <= margin) return "N";
    if (x >= rect.width - margin) return "E";
    return null;
}

export async function handleWallClick(row, col, tile, e) {
const edge = getEdgeFromClick(tile, e);
    if (!edge) return;

    const existing = getAll().find(item =>
        item.type === "wall" &&
        item.row === row &&
        item.col === col &&
        item.edge === edge
    );

    // Toggle behavior
    if (existing) {
        await dataStore.delete(existing);
        return;
    }

    await dataStore.create({
        type: "wall",
        row,
        col,
        edge
    });
}
