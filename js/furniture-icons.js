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
  const svg = createSvg(width, height);

  switch (type) {
    case "bed":
    case "medicalBed": {
      rect(svg, 3, 3, width - 6, height - 6, color, darker, 2, 3);
      rect(svg, 6, 6, width - 12, Math.min(18, height / 2), lighter, darker, 1, 2);
      if (type === "medicalBed") {
        rect(svg, width / 2 - 2, height - 22, 4, 14, "#d33", null, 0, 1);
        rect(svg, width / 2 - 8, height - 16, 16, 4, "#d33", null, 0, 1);
      }
      break;
    }
    case "chair":
    case "deskChair": {
      rect(svg, 10, height - 18, width - 20, 12, color, darker, 2, 3);
      rect(svg, 12, 8, width - 24, height - 28, lighter, darker, 2, 3);
      if (type === "deskChair") {
        circle(svg, width * 0.35, height - 6, 3, "#333");
        circle(svg, width * 0.65, height - 6, 3, "#333");
      }
      break;
    }
    case "desk": {
      rect(svg, 2, 2, width - 4, height - 4, color, darker, 2, 3);
      rect(svg, width * 0.2, height * 0.3, width * 0.6, height * 0.35, darker, "#000", 1, 2);
      rect(svg, width * 0.45, height * 0.45, width * 0.1, height * 0.05, "#333", null, 0, 1);
      break;
    }
    case "computer": {
      rect(svg, 8, 8, width - 16, height * 0.45, color, darker, 2, 2);
      rect(svg, 12, 12, width - 24, height * 0.32, "#133", null, 0, 2);
      rect(svg, width * 0.4, height * 0.6, width * 0.2, height * 0.2, darker, null, 0, 2);
      break;
    }
    case "fileCabinet": {
      rect(svg, 10, 6, width - 20, height - 12, color, darker, 2, 2);
      rect(svg, 12, 12, width - 24, 8, darker, "#000", 1, 1);
      rect(svg, 12, height / 2 - 4, width - 24, 8, darker, "#000", 1, 1);
      rect(svg, 12, height - 20, width - 24, 8, darker, "#000", 1, 1);
      break;
    }
    case "sink":
    case "bathroomSink": {
      rect(svg, 8, 10, width - 16, height - 18, color, darker, 2, 4);
      circle(svg, width / 2, height * 0.6, Math.min(width, height) * 0.2, lighter, darker, 2);
      line(svg, width / 2, 8, width / 2, 16, "#888", 3);
      break;
    }
    case "steelCounter":
    case "woodCounter":
    case "medicalCounter":
    case "bathroomCounter": {
      rect(svg, 4, 4, width - 8, height - 8, color, darker, 2, 3);
      rect(svg, 8, 8, width - 16, 6, lighter, null, 0, 2);
      break;
    }
    case "miniFridge":
    case "largeFridge": {
      rect(svg, 8, 6, width - 16, height - 12, color, darker, 2, 3);
      rect(svg, width - 14, height * 0.35, 3, height * 0.2, "#333", null, 0, 1);
      break;
    }
    case "stove":
    case "oldOven": {
      rect(svg, 6, 6, width - 12, height - 12, color, darker, 2, 3);
      circle(svg, width * 0.35, height * 0.35, 5, "#222");
      circle(svg, width * 0.65, height * 0.35, 5, "#222");
      break;
    }
    case "washer":
    case "dryer": {
      rect(svg, 6, 6, width - 12, height - 12, color, darker, 2, 3);
      circle(svg, width / 2, height / 2 + 4, Math.min(width, height) * 0.2, lighter, darker, 2);
      break;
    }
    case "poolTable": {
      rect(svg, 2, 2, width - 4, height - 4, color, darker, 2, 3);
      rect(svg, 6, 6, width - 12, height - 12, adjustColor(color, -20), null, 0, 2);
      break;
    }
    case "jukebox": {
      rect(svg, 8, 4, width - 16, height - 8, color, darker, 2, 6);
      circle(svg, width / 2, height * 0.55, Math.min(width, height) * 0.2, lighter, darker, 2);
      break;
    }
    case "medicalTray": {
      rect(svg, 8, 8, width - 16, height - 16, color, darker, 2, 2);
      rect(svg, width / 2 - 6, height / 2 - 2, 12, 4, "#c33", null, 0, 1);
      rect(svg, width / 2 - 2, height / 2 - 6, 4, 12, "#c33", null, 0, 1);
      break;
    }
    case "ivStand": {
      rect(svg, width / 2 - 2, 6, 4, height - 12, color, darker, 2, 1);
      circle(svg, width / 2, 10, 4, lighter, darker, 2);
      break;
    }
    case "storageBox":
    case "shelf":
    case "wallShelf": {
      rect(svg, 6, 10, width - 12, height - 20, color, darker, 2, 2);
      line(svg, 8, height / 2, width - 8, height / 2, darker, 2);
      break;
    }
    case "trashcan": {
      rect(svg, 12, 10, width - 24, height - 18, color, darker, 2, 3);
      rect(svg, 10, 6, width - 20, 6, darker, null, 0, 2);
      break;
    }
    case "waterBarrel":
    case "waterTank": {
      rect(svg, 10, 6, width - 20, height - 12, color, darker, 2, 6);
      rect(svg, 10, height / 2, width - 20, 4, darker, null, 0, 2);
      break;
    }
    case "schoolLockers": {
      rect(svg, 8, 6, width - 16, height - 12, color, darker, 2, 2);
      line(svg, width / 2, 8, width / 2, height - 8, darker, 2);
      break;
    }
    case "toilet": {
      rect(svg, 12, height * 0.35, width - 24, height * 0.4, color, darker, 2, 6);
      circle(svg, width / 2, height * 0.35, Math.min(width, height) * 0.18, lighter, darker, 2);
      break;
    }
    case "shower": {
      rect(svg, 4, 4, width - 8, height - 8, color, darker, 2, 4);
      circle(svg, width - 10, 10, 4, lighter, darker, 2);
      break;
    }
    case "stallWall": {
      rect(svg, 6, 6, width - 12, height - 12, color, darker, 2, 2);
      break;
    }
    default: {
      rect(svg, 6, 6, width - 12, height - 12, color, darker, 2, 3);
    }
  }

  return svg;
}
