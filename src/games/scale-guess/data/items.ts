import type { GameObject, Puzzle } from "../../../game/types";
import type { ItemCategory, StoredPuzzle } from "../../../types/puzzle";
import rawPuzzleSets from "../../../data/puzzleSets.json";
import { sizeFor } from "../../../game/geometry";

export type ScaleTier = "micro" | "everyday" | "macro" | "cosmic";

export interface ScaleItem {
  id: string;
  name: string;
  category: "micro" | "everyday" | "macro" | "cosmic";
  valueInMeters: number; // Ground truth in meters
  primaryDimension: "height" | "length" | "width" | "diameter";
  svgViewBox: { x?: number; y?: number; width: number; height: number };
  description: string;
}

/**
 * Authoritative, fully audited ground-truth item dataset.
 * Every item includes exact 2D SVG viewBox dimensions, verified real-world metric ground truth,
 * calibrated metric axis, and descriptive contextual notes.
 */
export const SCALE_ITEM_LIST: ScaleItem[] = [
  // ── MICRO TIER (< 0.01 m / < 1 cm) ──────────────────────────────────────────
  {
    id: "water-molecule",
    name: "Water Molecule",
    category: "micro",
    valueInMeters: 2.8e-10,
    primaryDimension: "diameter",
    svgViewBox: { x: -8.4, y: -6.5, width: 100.8, height: 78 },
    description: "Water molecule (H₂O) van der Waals diameter (~0.28 nm)",
  },
  {
    id: "dna-strand",
    name: "DNA Double Helix",
    category: "micro",
    valueInMeters: 2.5e-9,
    primaryDimension: "width",
    svgViewBox: { x: -6, y: -20, width: 72, height: 240 },
    description: "Width of a canonical B-form DNA double helix (~2.5 nm)",
  },
  {
    id: "coronavirus",
    name: "Coronavirus Particle",
    category: "micro",
    valueInMeters: 1.2e-7,
    primaryDimension: "diameter",
    svgViewBox: { x: -9.6, y: -9.6, width: 115.2, height: 115.2 },
    description: "SARS-CoV-2 spherical viral capsid diameter (~120 nm)",
  },
  {
    id: "bacteriophage",
    name: "Bacteriophage T4",
    category: "micro",
    valueInMeters: 2.0e-7,
    primaryDimension: "height",
    svgViewBox: { x: -7, y: -13.3, width: 84, height: 159.6 },
    description: "T4 bacteriophage virus total vertical height (~200 nm)",
  },
  {
    id: "red-blood-cell",
    name: "Red Blood Cell",
    category: "micro",
    valueInMeters: 7.5e-6,
    primaryDimension: "diameter",
    svgViewBox: { x: -9.2, y: -6, width: 110.4, height: 72 },
    description: "Human erythrocyte biconcave disc diameter (~7.5 µm)",
  },
  {
    id: "human-hair",
    name: "Human Hair Width",
    category: "micro",
    valueInMeters: 0.00008,
    primaryDimension: "width",
    svgViewBox: { x: -2.17, y: -18, width: 26, height: 216 },
    description: "Average thickness of a human hair strand (~80 µm)",
  },
  {
    id: "tardigrade",
    name: "Tardigrade (Water Bear)",
    category: "micro",
    valueInMeters: 0.0005,
    primaryDimension: "length",
    svgViewBox: { x: -11.6, y: -5.46, width: 139.2, height: 65.52 },
    description: "Microscopic eight-legged water bear body length (~0.5 mm)",
  },
  {
    id: "grain-of-sand",
    name: "Grain of Sand",
    category: "micro",
    valueInMeters: 0.001,
    primaryDimension: "diameter",
    svgViewBox: { x: -6.7, y: -6.7, width: 80.4, height: 80.4 },
    description: "Coarse sand grain average diameter (~1 mm)",
  },
  {
    id: "ant",
    name: "Worker Ant",
    category: "micro",
    valueInMeters: 0.004,
    primaryDimension: "length",
    svgViewBox: { x: -9.8, y: -5.4, width: 117.6, height: 64.8 },
    description: "Common black garden worker ant body length (~4 mm)",
  },

  // ── EVERYDAY / HUMAN TIER (0.01 m to 10 m) ──────────────────────────────────
  {
    id: "housefly",
    name: "Common Housefly",
    category: "everyday",
    valueInMeters: 0.007,
    primaryDimension: "length",
    svgViewBox: { x: -7.5, y: -5.6, width: 90, height: 67.2 },
    description: "Adult Musca domestica housefly body length (~7 mm)",
  },
  {
    id: "quarter-coin",
    name: "US Quarter Coin",
    category: "everyday",
    valueInMeters: 0.02426,
    primaryDimension: "diameter",
    svgViewBox: { x: -9.6, y: -9.6, width: 115.2, height: 115.2 },
    description: "Official United States quarter dollar diameter (24.26 mm)",
  },
  {
    id: "tennis-ball",
    name: "Tennis Ball",
    category: "everyday",
    valueInMeters: 0.067,
    primaryDimension: "diameter",
    svgViewBox: { x: -9.6, y: -9.6, width: 115.2, height: 115.2 },
    description: "ITF regulation tennis ball diameter (6.7 cm)",
  },
  {
    id: "coffee-mug",
    name: "Ceramic Coffee Mug",
    category: "everyday",
    valueInMeters: 0.1,
    primaryDimension: "height",
    svgViewBox: { x: -7.88, y: -7, width: 94.51, height: 84 },
    description: "Standard kitchen ceramic mug vertical height (10 cm)",
  },
  {
    id: "iphone",
    name: "iPhone 15",
    category: "everyday",
    valueInMeters: 0.1476,
    primaryDimension: "height",
    svgViewBox: { x: -6.5, y: -14, width: 78, height: 168 },
    description: "Apple iPhone 15 standard smartphone vertical height (14.76 cm)",
  },
  {
    id: "banana",
    name: "Banana",
    category: "everyday",
    valueInMeters: 0.18,
    primaryDimension: "length",
    svgViewBox: { x: -12.9, y: -3.5, width: 154.8, height: 42 },
    description: "Medium Cavendish banana horizontal tip-to-stem length (18 cm)",
  },
  {
    id: "laptop",
    name: "Laptop Computer",
    category: "everyday",
    valueInMeters: 0.31,
    primaryDimension: "width",
    svgViewBox: { x: -13, y: -7, width: 156, height: 84 },
    description: "13-inch modern laptop computer horizontal width (31 cm)",
  },
  {
    id: "cat",
    name: "Domestic Cat",
    category: "everyday",
    valueInMeters: 0.46,
    primaryDimension: "length",
    svgViewBox: { x: -9, y: -6.4, width: 108.02, height: 76.8 },
    description: "Average adult domestic cat head-and-body length (46 cm)",
  },
  {
    id: "dog",
    name: "Golden Retriever Dog",
    category: "everyday",
    valueInMeters: 0.8,
    primaryDimension: "length",
    svgViewBox: { x: -9.2, y: -7.4, width: 110.4, height: 88.8 },
    description: "Adult Golden Retriever nose-to-rump body length (80 cm)",
  },
  {
    id: "guitar",
    name: "Acoustic Guitar",
    category: "everyday",
    valueInMeters: 1.0,
    primaryDimension: "height",
    svgViewBox: { x: -3.7, y: -14.13, width: 44.4, height: 169.51 },
    description: "Full-size standard acoustic guitar total vertical height (100 cm)",
  },
  {
    id: "penguin",
    name: "Emperor Penguin",
    category: "everyday",
    valueInMeters: 1.15,
    primaryDimension: "height",
    svgViewBox: { x: -4.14, y: -11.1, width: 49.68, height: 133.2 },
    description: "Adult Emperor penguin upright standing height (1.15 m)",
  },
  {
    id: "child",
    name: "School Child",
    category: "everyday",
    valueInMeters: 1.2,
    primaryDimension: "height",
    svgViewBox: { x: -3.6, y: -11.1, width: 43.2, height: 133.2 },
    description: "Average 7-year-old child upright standing height (1.20 m)",
  },
  {
    id: "polar-bear",
    name: "Polar Bear",
    category: "everyday",
    valueInMeters: 2.5,
    primaryDimension: "length",
    svgViewBox: { x: -14.6, y: -6.9, width: 175.2, height: 82.8 },
    description: "Adult male polar bear quadrupedal body length (2.50 m)",
  },
  {
    id: "human",
    name: "Adult Human",
    category: "everyday",
    valueInMeters: 1.75,
    primaryDimension: "height",
    svgViewBox: { x: -5.2, y: -18.59, width: 62.4, height: 223.09 },
    description: "Global average adult human standing height (1.75 m)",
  },
  {
    id: "bicycle",
    name: "Commuter Bicycle",
    category: "everyday",
    valueInMeters: 1.75,
    primaryDimension: "length",
    svgViewBox: { x: -15, y: -6.7, width: 180, height: 80.4 },
    description: "Standard adult commuter bicycle wheel-to-wheel length (1.75 m)",
  },
  {
    id: "door",
    name: "Standard Interior Door",
    category: "everyday",
    valueInMeters: 2.03,
    primaryDimension: "height",
    svgViewBox: { x: -8, y: -18, width: 96, height: 216 },
    description: "Standard architectural interior door vertical height (2.03 m)",
  },
  {
    id: "motorcycle",
    name: "Cruiser Motorcycle",
    category: "everyday",
    valueInMeters: 2.15,
    primaryDimension: "length",
    svgViewBox: { x: -15.8, y: -6.9, width: 189.6, height: 82.8 },
    description: "Standard cruiser motorcycle bumper-to-bumper length (2.15 m)",
  },
  {
    id: "piano",
    name: "Concert Grand Piano",
    category: "everyday",
    valueInMeters: 2.75,
    primaryDimension: "length",
    svgViewBox: { x: -15, y: -11.3, width: 180, height: 135.6 },
    description: "Concert grand piano lengthwise casing dimension (2.75 m)",
  },
  {
    id: "elephant",
    name: "African Bush Elephant",
    category: "everyday",
    valueInMeters: 3.3,
    primaryDimension: "height",
    svgViewBox: { x: -16.2, y: -10, width: 194.37, height: 120 },
    description: "Adult African bush elephant shoulder height (3.30 m)",
  },
  {
    id: "car-sedan",
    name: "Sedan Family Car",
    category: "everyday",
    valueInMeters: 4.5,
    primaryDimension: "length",
    svgViewBox: { x: -18.8, y: -6.2, width: 225.6, height: 74.4 },
    description: "Mid-size family passenger sedan bumper-to-bumper length (4.50 m)",
  },

  // ── MACRO TIER (10 m to 3000 m) ─────────────────────────────────────────────
  {
    id: "giraffe",
    name: "Adult Giraffe",
    category: "macro",
    valueInMeters: 5.5,
    primaryDimension: "height",
    svgViewBox: { x: -7.6, y: -17.1, width: 91.2, height: 205.2 },
    description: "Adult bull giraffe total vertical height to ossicones (5.50 m)",
  },
  {
    id: "school-bus",
    name: "American School Bus",
    category: "macro",
    valueInMeters: 12.0,
    primaryDimension: "length",
    svgViewBox: { x: -20.4, y: -5.7, width: 244.8, height: 68.4 },
    description: "Full-size American school bus overall length (12.0 m)",
  },
  {
    id: "trex",
    name: "Tyrannosaurus Rex",
    category: "macro",
    valueInMeters: 12.3,
    primaryDimension: "length",
    svgViewBox: { x: -18.5, y: -9.41, width: 222, height: 112.96 },
    description: "Adult Tyrannosaurus rex skeleton snout-to-tail length (12.3 m)",
  },
  {
    id: "tennis-court",
    name: "Regulation Tennis Court",
    category: "macro",
    valueInMeters: 23.77,
    primaryDimension: "length",
    svgViewBox: { x: -19, y: -8.8, width: 228, height: 105.6 },
    description: "ITF official regulation tennis court baseline length (23.77 m)",
  },
  {
    id: "blue-whale",
    name: "Blue Whale",
    category: "macro",
    valueInMeters: 27.1,
    primaryDimension: "length",
    svgViewBox: { x: -30, y: -9.46, width: 360, height: 113.5 },
    description: "Adult blue whale rostrum-to-fluke total body length (27.1 m)",
  },
  {
    id: "boeing-737",
    name: "Boeing 737 Airliner",
    category: "macro",
    valueInMeters: 35.5,
    primaryDimension: "length",
    svgViewBox: { x: -22.5, y: -6.5, width: 270, height: 78 },
    description: "Commercial Boeing 737 twin-jet fuselage length (35.5 m)",
  },
  {
    id: "statue-of-liberty",
    name: "Statue of Liberty",
    category: "macro",
    valueInMeters: 46.0,
    primaryDimension: "height",
    svgViewBox: { x: -5.3, y: -16.8, width: 63.6, height: 201.6 },
    description: "Statue height from heel to the tip of the torch (46.0 m)",
  },
  {
    id: "colosseum",
    name: "Rome Colosseum",
    category: "macro",
    valueInMeters: 48.0,
    primaryDimension: "height",
    svgViewBox: { x: -18, y: -6.8, width: 216, height: 81.6 },
    description: "Flavian Amphitheatre exterior travertine wall height (48.0 m)",
  },
  {
    id: "swimming-pool",
    name: "Olympic Swimming Pool",
    category: "macro",
    valueInMeters: 50.0,
    primaryDimension: "length",
    svgViewBox: { x: -20.4, y: -9, width: 244.8, height: 108 },
    description: "World Aquatics official Olympic competition pool length (50.0 m)",
  },
  {
    id: "space-shuttle",
    name: "Space Shuttle Stack",
    category: "macro",
    valueInMeters: 56.1,
    primaryDimension: "height",
    svgViewBox: { x: -5.2, y: -15, width: 62.4, height: 180 },
    description: "NASA Space Shuttle launch vehicle stack total height (56.1 m)",
  },
  {
    id: "football-pitch",
    name: "FIFA Football Pitch",
    category: "macro",
    valueInMeters: 105.0,
    primaryDimension: "length",
    svgViewBox: { x: -20.4, y: -12, width: 244.8, height: 144 },
    description: "FIFA standard international soccer pitch touchline length (105 m)",
  },
  {
    id: "saturn-v",
    name: "Saturn V Moon Rocket",
    category: "macro",
    valueInMeters: 110.65,
    primaryDimension: "height",
    svgViewBox: { x: -4, y: -43.5, width: 48, height: 522 },
    description: "Apollo program Saturn V three-stage rocket total height (110.65 m)",
  },
  {
    id: "pyramid-giza",
    name: "Great Pyramid of Giza",
    category: "macro",
    valueInMeters: 138.8,
    primaryDimension: "height",
    svgViewBox: { x: -20, y: -12.4, width: 240, height: 148.8 },
    description: "Ancient Egyptian Great Pyramid present-day height (138.8 m)",
  },
  {
    id: "wind-turbine",
    name: "Offshore Wind Turbine",
    category: "macro",
    valueInMeters: 150.0,
    primaryDimension: "height",
    svgViewBox: { x: -11, y: -20.7, width: 132, height: 248.4 },
    description: "Commercial offshore wind turbine tip height (150 m)",
  },
  {
    id: "titanic",
    name: "RMS Titanic",
    category: "macro",
    valueInMeters: 269.1,
    primaryDimension: "length",
    svgViewBox: { x: -23.5, y: -5.4, width: 282, height: 64.8 },
    description: "Olympic-class ocean liner total length overall (269.1 m)",
  },
  {
    id: "eiffel-tower",
    name: "Eiffel Tower",
    category: "macro",
    valueInMeters: 324.0,
    primaryDimension: "height",
    svgViewBox: { x: -9, y: -33, width: 108, height: 396 },
    description: "Paris wrought-iron lattice landmark total architectural height (324 m)",
  },
  {
    id: "empire-state",
    name: "Empire State Building",
    category: "macro",
    valueInMeters: 443.2,
    primaryDimension: "height",
    svgViewBox: { x: -6, y: -23.6, width: 72, height: 283.2 },
    description: "Manhattan Art Deco skyscraper height to spire tip (443.2 m)",
  },
  {
    id: "seawise-giant",
    name: "Seawise Giant Supertanker",
    category: "macro",
    valueInMeters: 458.45,
    primaryDimension: "length",
    svgViewBox: { x: -27, y: -4.4, width: 324, height: 52.8 },
    description: "Longest self-propelled ship ever built length overall (458.45 m)",
  },
  {
    id: "burj-khalifa",
    name: "Burj Khalifa",
    category: "macro",
    valueInMeters: 828.0,
    primaryDimension: "height",
    svgViewBox: { x: -9, y: -82.8, width: 108, height: 993.6 },
    description: "World's tallest artificial structure total architectural height (828 m)",
  },
  {
    id: "golden-gate",
    name: "Golden Gate Bridge",
    category: "macro",
    valueInMeters: 2737.0,
    primaryDimension: "length",
    svgViewBox: { x: -29, y: -10, width: 348, height: 120 },
    description: "San Francisco suspension bridge total length (2,737 m)",
  },

  // ── COSMIC TIER (> 3000 m) ──────────────────────────────────────────────────
  {
    id: "mount-everest",
    name: "Mount Everest",
    category: "cosmic",
    valueInMeters: 8849.0,
    primaryDimension: "height",
    svgViewBox: { x: -21.5, y: -12.3, width: 258, height: 147.6 },
    description: "Earth's highest mountain peak elevation above sea level (8,849 m)",
  },
  {
    id: "neutron-star",
    name: "Neutron Star",
    category: "cosmic",
    valueInMeters: 20000.0,
    primaryDimension: "diameter",
    svgViewBox: { x: -6.4, y: -13.2, width: 76.8, height: 158.4 },
    description: "Dense collapsed stellar core typical diameter (20 km)",
  },
  {
    id: "olympus-mons",
    name: "Olympus Mons Volcano",
    category: "cosmic",
    valueInMeters: 21900.0,
    primaryDimension: "height",
    svgViewBox: { x: -26, y: -6.1, width: 312, height: 73.2 },
    description: "Martian shield volcano peak height above datum (21.9 km)",
  },
  {
    id: "ceres",
    name: "Dwarf Planet Ceres",
    category: "cosmic",
    valueInMeters: 939400.0,
    primaryDimension: "diameter",
    svgViewBox: { x: -9.6, y: -9.6, width: 115.2, height: 115.2 },
    description: "Asteroid belt dwarf planet mean spherical diameter (939.4 km)",
  },
  {
    id: "moon",
    name: "The Moon",
    category: "cosmic",
    valueInMeters: 3474800.0,
    primaryDimension: "diameter",
    svgViewBox: { x: -10, y: -10, width: 120, height: 120 },
    description: "Earth's natural satellite equatorial diameter (3,474.8 km)",
  },
  {
    id: "mercury",
    name: "Planet Mercury",
    category: "cosmic",
    valueInMeters: 4879400.0,
    primaryDimension: "diameter",
    svgViewBox: { x: -9.6, y: -9.6, width: 115.2, height: 115.2 },
    description: "Innermost terrestrial planet equatorial diameter (4,879.4 km)",
  },
  {
    id: "mars",
    name: "Planet Mars",
    category: "cosmic",
    valueInMeters: 6779000.0,
    primaryDimension: "diameter",
    svgViewBox: { x: -9.6, y: -9.6, width: 115.2, height: 115.2 },
    description: "Red planet equatorial diameter (6,779 km)",
  },
  {
    id: "earth",
    name: "Planet Earth",
    category: "cosmic",
    valueInMeters: 12742000.0,
    primaryDimension: "diameter",
    svgViewBox: { x: -9.6, y: -9.6, width: 115.2, height: 115.2 },
    description: "Earth mean spherical diameter (12,742 km)",
  },
  {
    id: "saturn",
    name: "Planet Saturn",
    category: "cosmic",
    valueInMeters: 116464000.0,
    primaryDimension: "diameter",
    svgViewBox: { x: -16, y: -6.4, width: 192, height: 76.8 },
    description: "Ringed gas giant planetary equatorial diameter (116,464 km)",
  },
  {
    id: "jupiter",
    name: "Planet Jupiter",
    category: "cosmic",
    valueInMeters: 139820000.0,
    primaryDimension: "diameter",
    svgViewBox: { x: -9.6, y: -9.6, width: 115.2, height: 115.2 },
    description: "Largest Solar System planet equatorial diameter (139,820 km)",
  },
  {
    id: "sun",
    name: "The Sun",
    category: "cosmic",
    valueInMeters: 1392700000.0,
    primaryDimension: "diameter",
    svgViewBox: { x: -12, y: -12, width: 144, height: 144 },
    description: "Central G-type main-sequence star solar diameter (1,392,700 km)",
  },
];

export const SCALE_ITEMS: Record<string, ScaleItem> = Object.fromEntries(
  SCALE_ITEM_LIST.map((item) => [item.id, item]),
);

/**
 * Converts a calibrated ScaleItem into a platform-compatible GameObject model.
 */
export function scaleItemToGameObject(item: ScaleItem): GameObject {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    actualMeasurement: item.valueInMeters,
    valueInMeters: item.valueInMeters,
    axis: item.primaryDimension,
    primaryDimension: item.primaryDimension,
    description: item.description,
    svgUrl: `/silhouettes/${item.id.replace(/-/g, "_")}.svg`,
    source: "Calibrated Ground Truth",
    silhouette: {
      viewBox: {
        x: item.svgViewBox.x ?? 0,
        y: item.svgViewBox.y ?? 0,
        width: item.svgViewBox.width,
        height: item.svgViewBox.height,
      },
      svgUrl: `/silhouettes/${item.id.replace(/-/g, "_")}.svg`,
    },
  };
}

export const SCALE_GUESS_ITEMS: Record<string, GameObject> = Object.fromEntries(
  SCALE_ITEM_LIST.map((item) => [item.id, scaleItemToGameObject(item)]),
);

/**
 * Categorizes an item's real-world measurement into its authoritative scale tier:
 * - micro: < 0.01 m (< 1 cm, sub-centimeter, microscopic)
 * - everyday: 0.01 m to 10 m (human and tabletop objects)
 * - macro: 10 m to 3000 m (vehicles, trees, architecture, structures)
 * - cosmic: > 3000 m (mountains, planets, celestial bodies, cosmic distances)
 */
export function getScaleTier(measurementMeters: number, category?: string): ScaleTier {
  if (category === "micro" || category === "everyday" || category === "macro" || category === "cosmic") {
    return category;
  }
  if (measurementMeters < 0.01) return "micro";
  if (measurementMeters <= 10) return "everyday";
  if (measurementMeters <= 3000) return "macro";
  return "cosmic";
}

/**
 * Validates whether two items can be paired in a game round:
 * - Microscopic items (< 1 cm / sub-millimeter) MUST only pair with other micro items.
 * - Cosmic items (> 3 km) MUST only pair with other cosmic items.
 * - Everyday/Human items MUST pair with everyday/human items (or smoothly adjacent macro with ratio <= 10).
 * - Maximum scale ratio between reference and target is capped to prevent absurd 10,000x gaps.
 */
export function isCompatiblePair(
  refMeasurement: number,
  refCategory: string | undefined,
  targetMeasurement: number,
  targetCategory: string | undefined,
): boolean {
  if (refMeasurement <= 0 || targetMeasurement <= 0) return false;

  const refTier = getScaleTier(refMeasurement, refCategory);
  const targetTier = getScaleTier(targetMeasurement, targetCategory);

  // 1. Strict Micro Isolation: Sub-millimeter items never pair with macro/cosmic items
  if (refTier === "micro" && targetTier !== "micro") return false;
  if (targetTier === "micro" && refTier !== "micro") return false;

  // 2. Strict Cosmic Isolation: Celestial/planetary items never pair with human or micro items
  if (refTier === "cosmic" && targetTier !== "cosmic") return false;
  if (targetTier === "cosmic" && refTier !== "cosmic") return false;

  const ratio = Math.max(
    refMeasurement / targetMeasurement,
    targetMeasurement / refMeasurement,
  );

  // 3. Same scale tier: allow calibrated comparisons (ratio <= 50)
  if (refTier === targetTier) {
    return ratio <= 50;
  }

  // 4. Smooth transitional boundary: everyday vs small macro (ratio <= 10)
  if (
    (refTier === "everyday" && targetTier === "macro") ||
    (refTier === "macro" && targetTier === "everyday")
  ) {
    return ratio <= 10;
  }

  return false;
}

/**
 * Calculates a calibrated initial guess scale for a puzzle round.
 * Prevents pairing a sub-millimeter item with macro human-scale default guesses.
 */
export function initialGuessScaleFor(
  reference: GameObject | ScaleItem,
  target: GameObject | ScaleItem,
): number {
  const refMeasurement =
    "actualMeasurement" in reference
      ? reference.actualMeasurement
      : reference.valueInMeters;
  const refSize = sizeFor(reference, refMeasurement);
  const targetDim = "primaryDimension" in target && target.primaryDimension ? target.primaryDimension : (target.axis ?? "height");
  const targetVb = "svgViewBox" in target ? target.svgViewBox : target.silhouette.viewBox;
  const targetAspect = targetVb.width / Math.max(1e-9, targetVb.height);

  if (targetDim === "height") {
    return refSize.h;
  }

  if (targetDim === "length" || targetDim === "width") {
    return refSize.h * targetAspect;
  }

  // diameter: if distinctly vertical strand/cross-section, diameter is width
  if (targetVb.height > targetVb.width * 1.5) {
    return refSize.h * targetAspect;
  }

  return refSize.h;
}

/**
 * Curated list of verified, category-bounded puzzle pairings
 */
export const SMART_PUZZLES: Puzzle[] = (rawPuzzleSets as StoredPuzzle[])
  .map((p): Puzzle | null => {
    const ref = SCALE_GUESS_ITEMS[p.referenceId];
    const target = SCALE_GUESS_ITEMS[p.targetId];
    if (!ref || !target) return null;

    if (
      !isCompatiblePair(
        ref.actualMeasurement,
        ref.category,
        target.actualMeasurement,
        target.category,
      )
    ) {
      return null;
    }

    return {
      id: p.id,
      reference: ref,
      target: target,
      category: p.category,
    };
  })
  .filter((p): p is Puzzle => p !== null);

/**
 * Filter smart puzzles by category
 */
export function getSmartPuzzlesByCategory(category?: ItemCategory): Puzzle[] {
  if (!category) return SMART_PUZZLES;
  return SMART_PUZZLES.filter(
    (p) =>
      p.category === category ||
      getScaleTier(p.reference.actualMeasurement, p.reference.category) === category,
  );
}

/**
 * Generates a session of unique compatible puzzles with smart scale bounds.
 */
export function generateSmartSession(options?: {
  count?: number;
  category?: ItemCategory;
  excludeIds?: string[];
}): Puzzle[] {
  const count = options?.count ?? 5;
  const excludeSet = new Set(options?.excludeIds || []);
  const pool = options?.category
    ? getSmartPuzzlesByCategory(options.category)
    : SMART_PUZZLES;

  const shuffled = [...pool]
    .filter((p) => !excludeSet.has(p.id))
    .sort(() => Math.random() - 0.5);

  const session: Puzzle[] = [];
  const usedTargetIds = new Set<string>();

  // Pass 1: Unique target items within compatible bounds
  for (const p of shuffled) {
    if (session.length >= count) break;
    if (!usedTargetIds.has(p.target.id)) {
      usedTargetIds.add(p.target.id);
      session.push(p);
    }
  }

  // Pass 2: Fill remaining if needed
  if (session.length < count) {
    for (const p of shuffled) {
      if (session.length >= count) break;
      if (!session.some((s) => s.id === p.id)) {
        session.push(p);
      }
    }
  }

  // Fallback to all SMART_PUZZLES
  if (session.length < count) {
    for (const p of SMART_PUZZLES) {
      if (session.length >= count) break;
      if (!session.some((s) => s.id === p.id)) {
        session.push(p);
      }
    }
  }

  return session;
}
