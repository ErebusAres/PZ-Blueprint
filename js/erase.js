import { deleteAt } from "./datastore.js";

export async function handleErase(row, col) {
  await deleteAt(row, col);
}
