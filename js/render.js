const TILE_SIZE = 40;

export function renderBlueprint(data) {
    const grid = document.getElementById("grid");
    const wallLayer = document.getElementById("wall-layer");

    // Sync wall layer size to grid size
    wallLayer.style.width = `${grid.offsetWidth}px`;
    wallLayer.style.height = `${grid.offsetHeight}px`;

    // Clear floors
    document.querySelectorAll(".floor").forEach(el => el.remove());

    // Clear walls
    wallLayer.innerHTML = "";

    // Build fast lookup for walls
    const wallSet = new Set(
        data
            .filter(i => i.type === "wall")
            .map(i => `${i.row},${i.col},${i.edge}`)
    );

    function hasWall(r, c, edge) {
        return wallSet.has(`${r},${c},${edge}`);
    }

    // ---- FLOORS ----
    for (const item of data) {
        if (item.type !== "floor") continue;

        const tile = document.querySelector(
            `.tile[data-row="${item.row}"][data-col="${item.col}"]`
        );
        if (!tile) continue;

        const floor = document.createElement("div");
        floor.className = "floor";
        tile.appendChild(floor);
    }

    // ---- WALLS (GLOBAL, IMPLIED EDGES) ----
    const tiles = Array.from(document.querySelectorAll(".tile"));

    // PASS 1 — horizontal
    for (const tile of tiles) {
        const r = Number(tile.dataset.row);
        const c = Number(tile.dataset.col);

        if (hasWall(r, c, "N")) {
            addWall(wallLayer, r, c, "n");
        }
        if (hasWall(r + 1, c, "N")) {
            addWall(wallLayer, r, c, "s");
        }
    }

    // PASS 2 — vertical (drawn last, seals corners)
    for (const tile of tiles) {
        const r = Number(tile.dataset.row);
        const c = Number(tile.dataset.col);

        if (hasWall(r, c, "E")) {
            addWall(wallLayer, r, c, "e");
        }
        if (hasWall(r, c - 1, "E")) {
            addWall(wallLayer, r, c, "w");
        }
    }
}

function addWall(layer, row, col, dir) {
    const wall = document.createElement("div");
    wall.className = `wall wall-${dir}`;

    if (dir === "n") {
        wall.style.left = `${col * TILE_SIZE}px`;
        wall.style.top = `${row * TILE_SIZE}px`;
    }

    if (dir === "e") {
        wall.style.left = `${(col + 1) * TILE_SIZE}px`;
        wall.style.top = `${row * TILE_SIZE}px`;
    }

    if (dir === "s") {
        wall.style.left = `${col * TILE_SIZE}px`;
        wall.style.top = `${(row + 1) * TILE_SIZE}px`;
    }

    if (dir === "w") {
        wall.style.left = `${col * TILE_SIZE}px`;
        wall.style.top = `${row * TILE_SIZE}px`;
    }

    layer.appendChild(wall);
}
