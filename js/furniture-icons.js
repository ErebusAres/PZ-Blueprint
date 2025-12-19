const SVG_NS = "http://www.w3.org/2000/svg";

function adjustColor(hex, amount) {
  const value = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (value & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function createSvg(width, height) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("fill", "none");
  return svg;
}

function rect(svg, x, y, width, height, fill, stroke, strokeWidth = 2, rx = 2) {
  const el = document.createElementNS(SVG_NS, "rect");
  el.setAttribute("x", x);
  el.setAttribute("y", y);
  el.setAttribute("width", width);
  el.setAttribute("height", height);
  el.setAttribute("rx", rx);
  el.setAttribute("fill", fill);
  if (stroke) {
    el.setAttribute("stroke", stroke);
    el.setAttribute("stroke-width", strokeWidth);
  }
  svg.appendChild(el);
  return el;
}

function circle(svg, cx, cy, r, fill, stroke, strokeWidth = 2) {
  const el = document.createElementNS(SVG_NS, "circle");
  el.setAttribute("cx", cx);
  el.setAttribute("cy", cy);
  el.setAttribute("r", r);
  el.setAttribute("fill", fill);
  if (stroke) {
    el.setAttribute("stroke", stroke);
    el.setAttribute("stroke-width", strokeWidth);
  }
  svg.appendChild(el);
  return el;
}

function line(svg, x1, y1, x2, y2, stroke, strokeWidth = 2) {
  const el = document.createElementNS(SVG_NS, "line");
  el.setAttribute("x1", x1);
  el.setAttribute("y1", y1);
  el.setAttribute("x2", x2);
  el.setAttribute("y2", y2);
  el.setAttribute("stroke", stroke);
  el.setAttribute("stroke-width", strokeWidth);
  svg.appendChild(el);
  return el;
}

export function createFurnitureIcon(type, widthTiles, heightTiles, color) {
  const width = widthTiles * 40;
  const height = heightTiles * 40;
  const darker = adjustColor(color, -30);
  const lighter = adjustColor(color, 30);
  const mid = adjustColor(color, -10);
  const svg = createSvg(width, height);

  switch (type) {
    case "bed":
    case "medicalBed":
    case "gurney": {
      rect(svg, 3, 3, width - 6, height - 6, color, darker, 2, 4);
      rect(svg, 4, 4, width - 8, 6, darker, null, 0, 3);
      rect(svg, 6, 8, width - 12, Math.min(16, height / 3), lighter, darker, 1, 3);
      rect(svg, 6, height * 0.35, width - 12, height * 0.55, mid, darker, 1, 3);
      rect(svg, 8, height * 0.55, width - 16, height * 0.32, lighter, null, 0, 3);
      if (type === "medicalBed") {
        rect(svg, width / 2 - 2, height - 22, 4, 14, "#d33", null, 0, 1);
        rect(svg, width / 2 - 8, height - 16, 16, 4, "#d33", null, 0, 1);
      }
      break;
    }
    case "chair":
    case "deskChair": {
      rect(svg, 10, height - 20, width - 20, 10, color, darker, 2, 3);
      rect(svg, 12, 8, width - 24, height - 30, lighter, darker, 2, 3);
      line(svg, 12, height - 10, 12, height - 4, darker, 2);
      line(svg, width - 12, height - 10, width - 12, height - 4, darker, 2);
      line(svg, 12, height - 4, width - 12, height - 4, darker, 2);
      if (type === "deskChair") {
        rect(svg, width / 2 - 2, height - 16, 4, 8, darker, null, 0, 2);
        circle(svg, width * 0.35, height - 6, 3, "#333");
        circle(svg, width * 0.65, height - 6, 3, "#333");
      }
      break;
    }
    case "armchair": {
      rect(svg, 6, height - 20, width - 12, 12, color, darker, 2, 4);
      rect(svg, 8, 8, width - 16, height - 30, lighter, darker, 2, 4);
      rect(svg, 4, 12, 6, height - 28, mid, darker, 2, 3);
      rect(svg, width - 10, 12, 6, height - 28, mid, darker, 2, 3);
      break;
    }
    case "couch": {
      rect(svg, 4, height - 20, width - 8, 12, color, darker, 2, 4);
      rect(svg, 6, 10, width - 12, height - 28, lighter, darker, 2, 4);
      rect(svg, 8, 12, width / 2 - 10, height - 32, mid, darker, 1, 3);
      rect(svg, width / 2 + 2, 12, width / 2 - 10, height - 32, mid, darker, 1, 3);
      rect(svg, 4, 10, 6, height - 28, mid, darker, 2, 3);
      rect(svg, width - 10, 10, 6, height - 28, mid, darker, 2, 3);
      break;
    }
    case "desk":
    case "officeTable": {
      rect(svg, 2, 6, width - 4, height - 12, color, darker, 2, 4);
      rect(svg, 5, 9, width - 10, height - 18, lighter, null, 0, 3);
      rect(svg, width * 0.62, height * 0.18, width * 0.3, height * 0.58, mid, darker, 2, 2);
      line(svg, width * 0.64, height * 0.42, width * 0.9, height * 0.42, darker, 1);
      line(svg, width * 0.64, height * 0.56, width * 0.9, height * 0.56, darker, 1);
      rect(svg, width * 0.72, height * 0.32, 6, 2, "#333", null, 0, 1);
      rect(svg, width * 0.72, height * 0.48, 6, 2, "#333", null, 0, 1);
      circle(svg, width * 0.25, height * 0.3, 2.5, "#2b1b0f");
      break;
    }
    case "diningTable":
    case "kitchenTable":
    case "kitchenIsland":
    case "tvStand": {
      rect(svg, 4, 6, width - 8, height - 12, color, darker, 2, 4);
      rect(svg, 6, 8, width - 12, height - 16, lighter, null, 0, 3);
      line(svg, width / 2, 8, width / 2, height - 8, darker, 1);
      line(svg, 8, height / 2, width - 8, height / 2, darker, 1);
      break;
    }
    case "coffeeTable": {
      rect(svg, 8, 10, width - 16, height - 20, color, darker, 2, 4);
      rect(svg, 10, 12, width - 20, height - 24, lighter, null, 0, 3);
      line(svg, width / 2, 12, width / 2, height - 12, darker, 1);
      break;
    }
    case "computer": {
      rect(svg, 8, 8, width - 16, height * 0.42, color, darker, 2, 2);
      rect(svg, 12, 12, width - 24, height * 0.28, "#123", null, 0, 2);
      rect(svg, width * 0.42, height * 0.54, width * 0.16, height * 0.14, darker, null, 0, 2);
      rect(svg, 8, height * 0.72, width - 16, height * 0.12, mid, darker, 1, 2);
      rect(svg, 10, height * 0.75, width - 20, height * 0.06, lighter, null, 0, 1);
      break;
    }
    case "fileCabinet": {
      rect(svg, 10, 6, width - 20, height - 12, color, darker, 2, 2);
      rect(svg, 12, 12, width - 24, 8, darker, "#000", 1, 1);
      rect(svg, 12, height / 2 - 4, width - 24, 8, darker, "#000", 1, 1);
      rect(svg, 12, height - 20, width - 24, 8, darker, "#000", 1, 1);
      rect(svg, width / 2 - 6, 15, 12, 2, "#666", null, 0, 1);
      rect(svg, width / 2 - 6, height / 2 - 1, 12, 2, "#666", null, 0, 1);
      rect(svg, width / 2 - 6, height - 17, 12, 2, "#666", null, 0, 1);
      break;
    }
    case "sink":
    case "bathroomSink": {
      rect(svg, 6, 8, width - 12, height - 16, color, darker, 2, 4);
      rect(svg, 8, 12, width - 16, height * 0.22, lighter, null, 0, 3);
      circle(svg, width / 2, height * 0.62, Math.min(width, height) * 0.22, lighter, darker, 2);
      circle(svg, width / 2, height * 0.62, 3, "#888", null, 0);
      line(svg, width / 2, 6, width / 2, 14, "#888", 3);
      line(svg, width / 2, 14, width / 2 + 8, 14, "#888", 3);
      circle(svg, width / 2 - 6, 10, 2, "#777", null, 0);
      circle(svg, width / 2 + 6, 10, 2, "#777", null, 0);
      break;
    }
    case "steelCounter":
    case "woodCounter":
    case "medicalCounter":
    case "bathroomCounter": {
      rect(svg, 4, 4, width - 8, height - 8, color, darker, 2, 3);
      rect(svg, 4, 4, width - 8, 4, darker, null, 0, 2);
      rect(svg, 6, 6, width - 12, 6, lighter, null, 0, 2);
      rect(svg, 8, 16, width - 16, height * 0.5, mid, darker, 1, 2);
      line(svg, width / 2, 18, width / 2, height * 0.64, darker, 1);
      rect(svg, width / 2 - 12, height * 0.45, 6, 2, "#666", null, 0, 1);
      rect(svg, width / 2 + 6, height * 0.45, 6, 2, "#666", null, 0, 1);
      break;
    }
    case "miniFridge":
    case "largeFridge":
    case "freezer": {
      rect(svg, 8, 6, width - 16, height - 12, color, darker, 2, 3);
      rect(svg, 10, 8, width - 20, height * 0.38, mid, darker, 1, 2);
      line(svg, 10, height * 0.45, width - 10, height * 0.45, darker, 1);
      rect(svg, width - 14, height * 0.2, 3, height * 0.18, "#333", null, 0, 1);
      rect(svg, width - 14, height * 0.55, 3, height * 0.22, "#333", null, 0, 1);
      break;
    }
    case "stove":
    case "oldOven": {
      rect(svg, 6, 6, width - 12, height - 12, color, darker, 2, 3);
      circle(svg, width * 0.35, height * 0.35, 5, "#222");
      circle(svg, width * 0.65, height * 0.35, 5, "#222");
      rect(svg, 10, height * 0.5, width - 20, height * 0.3, "#222", "#111", 1, 2);
      rect(svg, 12, height * 0.54, width - 24, height * 0.2, "#444", null, 0, 2);
      circle(svg, width * 0.3, height * 0.18, 2, "#555");
      circle(svg, width * 0.5, height * 0.18, 2, "#555");
      circle(svg, width * 0.7, height * 0.18, 2, "#555");
      break;
    }
    case "washer":
    case "dryer":
    case "dishwasher": {
      rect(svg, 6, 6, width - 12, height - 12, color, darker, 2, 3);
      rect(svg, 10, 10, width - 20, 6, lighter, null, 0, 2);
      rect(svg, width - 18, 12, 6, 3, "#666", null, 0, 1);
      circle(svg, width / 2, height / 2 + 4, Math.min(width, height) * 0.2, lighter, darker, 2);
      circle(svg, width / 2, height / 2 + 4, Math.min(width, height) * 0.1, "#555", null, 0);
      break;
    }
    case "microwave": {
      rect(svg, 8, 10, width - 16, height - 20, color, darker, 2, 3);
      rect(svg, 12, 14, width - 24, height * 0.35, "#233", null, 0, 2);
      rect(svg, width - 14, 14, 3, height * 0.35, "#444", null, 0, 1);
      rect(svg, 10, height * 0.65, width - 20, 4, lighter, null, 0, 2);
      break;
    }
    case "poolTable": {
      rect(svg, 2, 2, width - 4, height - 4, color, darker, 2, 3);
      rect(svg, 6, 6, width - 12, height - 12, adjustColor(color, -20), null, 0, 2);
      circle(svg, 8, 8, 3, "#222");
      circle(svg, width - 8, 8, 3, "#222");
      circle(svg, 8, height - 8, 3, "#222");
      circle(svg, width - 8, height - 8, 3, "#222");
      break;
    }
    case "jukebox":
    case "arcadeMachine": {
      rect(svg, 8, 4, width - 16, height - 8, color, darker, 2, 6);
      circle(svg, width / 2, height * 0.55, Math.min(width, height) * 0.2, lighter, darker, 2);
      rect(svg, 12, 10, width - 24, 6, lighter, null, 0, 2);
      rect(svg, 14, height * 0.72, width - 28, 6, darker, null, 0, 2);
      break;
    }
    case "medicalTray": {
      rect(svg, 8, 8, width - 16, height - 16, color, darker, 2, 2);
      rect(svg, width / 2 - 6, height / 2 - 2, 12, 4, "#c33", null, 0, 1);
      rect(svg, width / 2 - 2, height / 2 - 6, 4, 12, "#c33", null, 0, 1);
      rect(svg, width / 2 - 2, height - 10, 4, 6, darker, null, 0, 1);
      circle(svg, width / 2 - 6, height - 6, 2, "#333");
      circle(svg, width / 2 + 6, height - 6, 2, "#333");
      break;
    }
    case "ivStand": {
      rect(svg, width / 2 - 2, 6, 4, height - 12, color, darker, 2, 1);
      circle(svg, width / 2, 10, 4, lighter, darker, 2);
      line(svg, width / 2, 10, width / 2 - 6, 14, darker, 2);
      line(svg, width / 2, 10, width / 2 + 6, 14, darker, 2);
      line(svg, width / 2, height - 8, width / 2 - 10, height - 4, darker, 2);
      line(svg, width / 2, height - 8, width / 2 + 10, height - 4, darker, 2);
      break;
    }
    case "storageBox":
    case "shelf":
    case "bookcase":
    case "dresser":
    case "wardrobe":
    case "metalShelf":
    case "toolCabinet": {
      rect(svg, 6, 10, width - 12, height - 20, color, darker, 2, 2);
      line(svg, 8, height / 2, width - 8, height / 2, darker, 2);
      line(svg, 8, height / 2 + 8, width - 8, height / 2 + 8, darker, 1);
      line(svg, 8, height / 2 - 8, width - 8, height / 2 - 8, darker, 1);
      break;
    }
    case "wallShelf":
    case "whiteboard":
    case "medCabinet":
    case "towelRack": {
      rect(svg, 6, height * 0.2, width - 12, height * 0.6, color, darker, 2, 2);
      rect(svg, 8, height * 0.28, width - 16, height * 0.2, lighter, null, 0, 2);
      line(svg, 10, height * 0.55, width - 10, height * 0.55, darker, 1);
      break;
    }
    case "trashcan": {
      rect(svg, 12, 10, width - 24, height - 18, color, darker, 2, 3);
      rect(svg, 10, 6, width - 20, 6, darker, null, 0, 2);
      line(svg, 14, 16, 14, height - 12, darker, 1);
      line(svg, width - 14, 16, width - 14, height - 12, darker, 1);
      break;
    }
    case "waterBarrel": {
      rect(svg, 10, 6, width - 20, height - 12, color, darker, 2, 6);
      rect(svg, 10, height / 2, width - 20, 4, darker, null, 0, 2);
      rect(svg, 12, 10, width - 24, 4, lighter, null, 0, 2);
      break;
    }
    case "generator": {
      rect(svg, 6, 8, width - 12, height - 16, color, darker, 2, 4);
      rect(svg, 10, 12, width - 20, height - 24, mid, darker, 1, 3);
      line(svg, 12, height / 2, width - 12, height / 2, darker, 1);
      circle(svg, width * 0.3, height * 0.3, 3, "#222");
      circle(svg, width * 0.7, height * 0.3, 3, "#222");
      break;
    }
    case "waterTank": {
      rect(svg, 8, 14, width - 16, height - 20, color, darker, 2, 4);
      rect(svg, 10, 18, width - 20, 6, lighter, null, 0, 3);
      rect(svg, width * 0.32, height * 0.55, width * 0.36, height * 0.14, mid, darker, 1, 2);
      rect(svg, width / 2 - 4, height * 0.45, 8, 6, "#444", null, 0, 2);
      circle(svg, width / 2, 10, 9, "#5aa3e8", "#3d6ea5", 2);
      circle(svg, width / 2, 10, 4, "rgba(255, 255, 255, 0.35)", null, 0);
      break;
    }
    case "schoolLockers": {
      rect(svg, 8, 6, width - 16, height - 12, color, darker, 2, 2);
      line(svg, width / 2, 8, width / 2, height - 8, darker, 2);
      rect(svg, width * 0.25, height * 0.35, 6, 2, "#667", null, 0, 1);
      rect(svg, width * 0.65, height * 0.35, 6, 2, "#667", null, 0, 1);
      rect(svg, width * 0.25, height * 0.6, 6, 2, "#667", null, 0, 1);
      rect(svg, width * 0.65, height * 0.6, 6, 2, "#667", null, 0, 1);
      break;
    }
    case "toilet": {
      rect(svg, width * 0.3, 6, width * 0.4, height * 0.2, color, darker, 2, 4);
      rect(svg, 12, height * 0.38, width - 24, height * 0.36, color, darker, 2, 6);
      circle(svg, width / 2, height * 0.38, Math.min(width, height) * 0.18, lighter, darker, 2);
      rect(svg, width / 2 - 6, height * 0.3, 12, 4, lighter, null, 0, 2);
      break;
    }
    case "shower": {
      rect(svg, 4, 4, width - 8, height - 8, color, darker, 2, 4);
      circle(svg, width - 10, 10, 4, lighter, darker, 2);
      line(svg, width - 10, 14, width - 10, 20, lighter, 2);
      circle(svg, width / 2, height - 12, 4, "#999", null, 0);
      break;
    }
    case "bathtub": {
      rect(svg, 4, 8, width - 8, height - 16, color, darker, 2, 10);
      rect(svg, 8, 12, width - 16, height - 24, lighter, null, 0, 10);
      circle(svg, width * 0.3, height * 0.35, 3, "#999");
      circle(svg, width * 0.7, height * 0.35, 3, "#999");
      break;
    }

    default: {
      rect(svg, 6, 6, width - 12, height - 12, color, darker, 2, 3);
    }
  }

  return svg;
}

