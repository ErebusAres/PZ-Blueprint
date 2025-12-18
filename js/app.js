import { initializeGrid } from "./grid.js";
import { setMode } from "./state.js";

document.addEventListener("DOMContentLoaded", () => {
  initializeGrid();

  // Generic mode buttons (floor, wall, room, furniture)
  document.querySelectorAll("[data-mode]").forEach(button => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      setMode(mode);
      console.log("Mode set to", mode);
    });
  });

  // Erase button (explicit ID)
  document.getElementById("mode-erase").addEventListener("click", () => {
    setMode("erase");
    console.log("Mode set to erase");
  });
});
