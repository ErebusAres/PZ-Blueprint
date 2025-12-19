import { dataStore, makeWallKey } from "./datastore.js";
import { currentWallType } from "./state.js";

function pickEdgeFromPointerEvent(e) {
  if (!e) return "n";
  const tile = e.target instanceof Element
    ? e.target.closest(".tile")
    : null;

  if (!tile) return "n";

  const rect = tile.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const distN = y;
  const distS = rect.height - y;
  const distW = x;
  const distE = rect.width - x;

  const min = Math.min(distN, distS, distW, distE);

  if (min === distN) return "n";
  if (min === distS) return "s";
  if (min === distW) return "w";
  return "e";
}

export async function handleWallClick(row, col, edgeOrEvent) {
  const dir =
    typeof edgeOrEvent === "string"
      ? edgeOrEvent
      : pickEdgeFromPointerEvent(edgeOrEvent);
  const key = makeWallKey(row, col, dir);
  const existing = dataStore.findByKey(key);

  if (existing) {
    if (existing.wallType !== currentWallType) {
      await dataStore.upsertByKey({
        ...existing,
        type: "wall",
        row,
        col,
        dir,
        wallType: currentWallType
      });
      return;
    }

    await dataStore.delete(existing);
    return;
  }

  await dataStore.create({
    type: "wall",
    row,
    col,
    dir,
    wallType: currentWallType
  });
}
