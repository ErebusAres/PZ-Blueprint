export const MATERIALS = {
  sand: { name: "Sand", color: "#D8C58A" },
  hay: { name: "Hay", color: "#CDB86A" },
  dirt: { name: "Dirt", color: "#8A6E3E" },
  grass: { name: "Grass: Manicured", color: "#6F7E3B" },
  dryGrass: { name: "Grass: Dry", color: "#A58A4A" },
  lushGrass: { name: "Grass: Lush", color: "#4F7A2C" },
  tallGrass: { name: "Grass: Tall", color: "#4F7A2C" },
  concrete: { name: "Concrete", color: "#C9C6BC" },
  wood: { name: "Wood: Basic", color: "#A37C4A" },
  woodPlank: { name: "Wood: Plank", color: "#9C7B4E" },
  medical: { name: "Medical", color: "#F2F4F3" },
  bathroom: { name: "Bathroom", color: "#D9E1E4" },
  kitchen: { name: "Kitchen", color: "#E4DAC6" },
  water: { name: "Water", color: "#4A90E2" },
  concreteBlock: { name: "Sidewalk", color: "#BCB9B3" },
  parkingLot: { name: "Parking Lot", color: "#84807A" },
  asphalt: { name: "Asphalt", color: "#656565" },
  brick: { name: "Brick", color: "#73574B" }
};

export const WALL_TYPES = {
  standard: { name: "Standard Wall", color: "#E6E0D2" },
  picketFence: { name: "Picket Fence", color: "#C1C1AF" },
  woodenFence: { name: "Wood Fence", color: "#553B24" },
  logWall: { name: "Log Wall", color: "#463827" },
  stallWall: { name: "Stall Wall", color: "#5E6183" }
};

export const DOOR_TYPES = {
  standard: { name: "Standard Door", color: "#8B6A45" },
  logGate: { name: "Log Gate", color: "#463827" },
  fenceGate: { name: "Fence Gate", color: "#553B24" },
  stallDoor: { name: "Stall Door", color: "#6E6F88" }
};

export const FURNITURE = {
  bed: { name: "Bed", size: [1, 2], color: "#8B7355", wallMount: false },
  medicalBed: { name: "Medical Bed", size: [1, 2], color: "#E8E8E8", wallMount: false },
  chair: { name: "Chair", size: [1, 1], color: "#654321", wallMount: false },
  deskChair: { name: "Desk Chair", size: [1, 1], color: "#2C3E50", wallMount: false },
  desk: { name: "Desk", size: [2, 1], color: "#8B4513", wallMount: false },
  computer: { name: "CRT Computer", size: [1, 1], color: "#C0C0C0", wallMount: false, within: true },
  fileCabinet: { name: "File Cabinet", size: [1, 1], color: "#708090", wallMount: false, within: true },
  sink: {
    name: "Sink",
    size: [1, 1],
    color: "#B0C4DE",
    wallMount: true,
    within: true,
    stackSlot: "surface",
    stackLayer: 2
  },
  steelCounter: { name: "Steel Counter", size: [1, 1], color: "#A9A9A9", wallMount: "wall-only", within: true },
  woodCounter: { name: "Wood Counter", size: [1, 1], color: "#8B7355", wallMount: "wall-only", within: true },
  medicalCounter: { name: "Medical Counter", size: [1, 1], color: "#E8E8E8", wallMount: "wall-only", within: true },
  miniFridge: { name: "Mini Fridge", size: [1, 1], color: "#4682B4", wallMount: true, within: true },
  largeFridge: { name: "Large Fridge", size: [1, 1], color: "#708090", wallMount: true, within: true },
  stove: { name: "Stove", size: [1, 1], color: "#2F4F4F", wallMount: true, within: true },
  oldOven: { name: "Old Oven", size: [1, 1], color: "#8B4513", wallMount: true, within: true },
  washer: { name: "Washing Machine", size: [1, 1], color: "#4682B4", wallMount: true, within: true },
  dryer: { name: "Dryer", size: [1, 1], color: "#696969", wallMount: true, within: true },
  poolTable: { name: "Pool Table", size: [1, 2], color: "#228B22", wallMount: false },
  jukebox: { name: "Jukebox", size: [1, 1], color: "#FF6347", wallMount: false },
  medicalTray: { name: "Medical Tray", size: [1, 1], color: "#C0C0C0", wallMount: false, within: true },
  ivStand: { name: "IV Stand", size: [1, 1], color: "#A9A9A9", wallMount: false, within: true },
  storageBox: { name: "Storage Box", size: [1, 1], color: "#8B7355", wallMount: false },
  shelf: { name: "Open Shelf", size: [1, 1], color: "#654321", wallMount: false },
  wallShelf: { name: "Wall Shelf", size: [1, 1], color: "#8B4513", wallMount: "wall-only" },
  trashcan: { name: "Trash Can", size: [1, 1], color: "#4A4A4A", wallMount: false, within: true },
  waterBarrel: { name: "Water Barrel", size: [1, 1], color: "#8B6F47", wallMount: false, within: true },
  schoolLockers: { name: "School Lockers", size: [1, 1], color: "#2F487B", wallMount: "wall-only" },
  waterTank: { name: "Water Cooler", size: [1, 1], color: "#4682B4", wallMount: false, within: true },
  bathroomSink: {
    name: "Bathroom Sink",
    size: [1, 1],
    color: "#FFFFFF",
    wallMount: false,
    within: true,
    stackSlot: "surface",
    stackLayer: 2
  },
  bathroomCounter: { name: "Bathroom Counter", size: [1, 1], color: "#D4D4D4", wallMount: "wall-only", within: true },
  toilet: { name: "Toilet", size: [1, 1], color: "#FFFFFF", wallMount: false, within: true },
  shower: { name: "Shower", size: [1, 1], color: "#C0C0C0", wallMount: false, within: true }
};


