import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { PuzzleItem, StoredPuzzle, ItemCategory, ItemAxis, SilhouetteViewBox } from "../../src/types/puzzle";
import { normalizeSvg } from "./normalizeSvg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PuzzleItemConfig {
  id: string;
  name: string;
  category: ItemCategory;
  axis: ItemAxis;
  qid: string;
  aliases?: string[];
  canonicalMeasurementMeters: number;
  rawSvg: string;
  source?: string;
}

/**
 * Wikidata QID to SI unit multiplier (meters)
 */
const UNIT_FACTORS: Record<string, number> = {
  Q11573: 1, // metre
  Q828224: 1000, // kilometre
  Q174728: 0.01, // centimetre
  Q174789: 0.001, // millimetre
  Q218593: 0.001, // millimetre
  Q178674: 1e-6, // micrometre
  Q2185938: 1e-9, // nanometre
  Q3710: 0.3048, // foot
  Q2185674: 0.0254, // inch
  Q482798: 0.9144, // yard
  Q253276: 1609.344, // mile
  Q12140: 149597870700, // astronomical unit
  Q531: 9.4607e15, // light-year
};

/**
 * 60 Curated Famous Items spanning Micro, Everyday, Macro, and Cosmic scales.
 * Includes Burj Khalifa, Blue Whale, Boeing 737, Saturn V, DNA strand, iPhone 15, and 54 more.
 */
export const PUZZLE_ITEMS_CATALOG: PuzzleItemConfig[] = [
  // ==========================================
  // MICRO SCALE (< 0.01m / 10mm)
  // ==========================================
  {
    id: "water-molecule",
    name: "Water Molecule",
    category: "micro",
    axis: "diameter",
    qid: "Q283",
    canonicalMeasurementMeters: 0.00000000028, // 0.28 nm
    rawSvg: `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="35" r="24" />
      <circle cx="22" cy="62" r="14" />
      <circle cx="78" cy="62" r="14" />
      <path d="M 32 46 L 40 38 M 68 46 L 60 38" stroke="currentColor" stroke-width="8" stroke-linecap="round" />
    </svg>`,
  },
  {
    id: "dna-strand",
    name: "DNA Double Helix",
    category: "micro",
    axis: "diameter",
    qid: "Q7430",
    canonicalMeasurementMeters: 0.0000000025, // 2.5 nm diameter
    rawSvg: `<svg viewBox="0 0 60 160" xmlns="http://www.w3.org/2000/svg">
      <path d="M 15 10 Q 45 40 15 80 Q -15 120 15 150 Q 45 180 15 210" stroke="currentColor" stroke-width="6" fill="none" />
      <path d="M 45 10 Q -15 40 45 80 Q 75 120 45 150 Q -15 180 45 210" stroke="currentColor" stroke-width="6" fill="none" />
      <line x1="20" y1="25" x2="40" y2="25" stroke="currentColor" stroke-width="4" />
      <line x1="28" y1="45" x2="32" y2="45" stroke="currentColor" stroke-width="4" />
      <line x1="16" y1="65" x2="44" y2="65" stroke="currentColor" stroke-width="4" />
      <line x1="15" y1="80" x2="45" y2="80" stroke="currentColor" stroke-width="5" />
      <line x1="16" y1="95" x2="44" y2="95" stroke="currentColor" stroke-width="4" />
      <line x1="28" y1="115" x2="32" y2="115" stroke="currentColor" stroke-width="4" />
      <line x1="20" y1="135" x2="40" y2="135" stroke="currentColor" stroke-width="4" />
    </svg>`,
  },
  {
    id: "coronavirus",
    name: "Coronavirus Particle",
    category: "micro",
    axis: "diameter",
    qid: "Q820655",
    canonicalMeasurementMeters: 0.00000012, // 120 nm
    rawSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="30" />
      <path d="M 50 20 L 50 8 M 50 80 L 50 92 M 20 50 L 8 50 M 80 50 L 92 50 M 29 29 L 20 20 M 71 71 L 80 80 M 71 29 L 80 20 M 29 71 L 20 80" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
      <circle cx="50" cy="6" r="4" /><circle cx="50" cy="94" r="4" /><circle cx="6" cy="50" r="4" /><circle cx="94" cy="50" r="4" />
      <circle cx="18" cy="18" r="4" /><circle cx="82" cy="82" r="4" /><circle cx="82" cy="18" r="4" /><circle cx="18" cy="82" r="4" />
    </svg>`,
  },
  {
    id: "bacteriophage",
    name: "Bacteriophage T4",
    category: "micro",
    axis: "height",
    qid: "Q165103",
    canonicalMeasurementMeters: 0.0000002, // 200 nm
    rawSvg: `<svg viewBox="0 0 80 140" xmlns="http://www.w3.org/2000/svg">
      <polygon points="40,5 65,22 65,55 40,70 15,55 15,22" />
      <rect x="36" y="70" width="8" height="35" />
      <polygon points="40,105 50,110 30,110" />
      <path d="M 32 108 L 15 130 L 5 138 M 48 108 L 65 130 L 75 138 M 36 108 L 25 135 M 44 108 L 55 135" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" />
    </svg>`,
  },
  {
    id: "red-blood-cell",
    name: "Red Blood Cell",
    category: "micro",
    axis: "diameter",
    qid: "Q11083",
    canonicalMeasurementMeters: 0.0000075, // 7.5 µm
    rawSvg: `<svg viewBox="0 0 100 70" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="50" cy="35" rx="46" ry="30" />
      <ellipse cx="50" cy="35" rx="22" ry="12" fill="#000" opacity="0.3" />
    </svg>`,
  },
  {
    id: "human-hair",
    name: "Human Hair Width",
    category: "micro",
    axis: "diameter",
    qid: "Q80074",
    canonicalMeasurementMeters: 0.00008, // 80 µm
    rawSvg: `<svg viewBox="0 0 60 180" xmlns="http://www.w3.org/2000/svg">
      <path d="M 22 0 Q 38 45 25 90 Q 12 135 28 180 L 38 180 Q 22 135 35 90 Q 48 45 32 0 Z" />
    </svg>`,
  },
  {
    id: "tardigrade",
    name: "Tardigrade (Water Bear)",
    category: "micro",
    axis: "length",
    qid: "Q178257",
    canonicalMeasurementMeters: 0.0005, // 0.5 mm
    rawSvg: `<svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg">
      <path d="M 8 36 Q 10 20 28 16 Q 60 12 95 18 Q 112 24 116 35 Q 112 48 95 54 Q 60 58 28 54 Q 10 50 8 36 Z" />
      <ellipse cx="6" cy="36" rx="5" ry="4" />
      <path d="M 28 52 L 24 66 L 29 67 M 50 54 L 48 68 L 53 69 M 74 54 L 75 68 L 80 68 M 100 50 L 108 64 L 113 63" stroke="currentColor" stroke-width="5" fill="none" stroke-linecap="round" />
      <circle cx="114" cy="36" r="3" />
    </svg>`,
  },
  {
    id: "grain-of-sand",
    name: "Grain of Sand",
    category: "micro",
    axis: "diameter",
    qid: "Q34679",
    canonicalMeasurementMeters: 0.001, // 1 mm
    rawSvg: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
      <polygon points="38,8 64,16 75,44 60,72 25,75 8,50 15,22" />
    </svg>`,
  },
  {
    id: "ant",
    name: "Worker Ant",
    category: "micro",
    axis: "length",
    qid: "Q7386",
    canonicalMeasurementMeters: 0.004, // 4 mm
    rawSvg: `<svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="35" r="10" />
      <ellipse cx="45" cy="35" rx="12" ry="7" />
      <ellipse cx="80" cy="35" rx="22" ry="14" />
      <path d="M 14 28 L 6 18 M 14 30 L 4 26" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      <path d="M 40 38 L 30 58 M 46 38 L 48 62 M 52 38 L 65 60 M 40 32 L 32 12 M 46 32 L 48 8 M 52 32 L 65 10" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" />
    </svg>`,
  },

  // ==========================================
  // EVERYDAY SCALE (0.01m to 10m)
  // ==========================================
  {
    id: "housefly",
    name: "Common Housefly",
    category: "everyday",
    axis: "length",
    qid: "Q166111",
    canonicalMeasurementMeters: 0.007, // 7 mm
    rawSvg: `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="40" cy="40" rx="20" ry="14" />
      <circle cx="20" cy="40" r="10" />
      <path d="M 42 32 Q 70 8 85 18 Q 75 35 48 38 Z" opacity="0.85" />
      <path d="M 42 48 Q 70 72 85 62 Q 75 45 48 42 Z" opacity="0.85" />
      <path d="M 32 46 L 24 64 M 42 48 L 40 68 M 50 46 L 58 65" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      <path d="M 32 34 L 24 16 M 42 32 L 40 12 M 50 34 L 58 15" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    </svg>`,
  },
  {
    id: "quarter-coin",
    name: "US Quarter Coin",
    category: "everyday",
    axis: "diameter",
    qid: "Q179224",
    canonicalMeasurementMeters: 0.02426, // 24.26 mm
    rawSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="#000" stroke-width="3" opacity="0.4" />
      <path d="M 45 28 Q 58 28 58 40 Q 58 48 50 52 L 56 68 L 40 68 L 42 55 Q 36 50 36 40 Q 36 28 45 28 Z" fill="#000" opacity="0.3" />
    </svg>`,
  },
  {
    id: "tennis-ball",
    name: "Tennis Ball",
    category: "everyday",
    axis: "diameter",
    qid: "Q815758",
    canonicalMeasurementMeters: 0.067, // 6.7 cm
    rawSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" />
      <path d="M 15 50 Q 50 20 85 50" fill="none" stroke="#000" stroke-width="5" opacity="0.4" />
      <path d="M 15 50 Q 50 80 85 50" fill="none" stroke="#000" stroke-width="5" opacity="0.4" />
    </svg>`,
  },
  {
    id: "coffee-mug",
    name: "Ceramic Coffee Mug",
    category: "everyday",
    axis: "height",
    qid: "Q153978",
    canonicalMeasurementMeters: 0.10, // 10 cm
    rawSvg: `<svg viewBox="0 0 110 90" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="60" height="70" rx="8" />
      <path d="M 70 24 C 95 24 95 62 70 64" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" />
    </svg>`,
  },
  {
    id: "iphone",
    name: "iPhone 15",
    category: "everyday",
    axis: "height",
    qid: "Q121992935",
    canonicalMeasurementMeters: 0.1476, // 147.6 mm
    rawSvg: `<svg viewBox="0 0 75 150" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="65" height="140" rx="14" />
      <rect x="28" y="12" width="19" height="6" rx="3" fill="#000" opacity="0.5" />
      <rect x="8" y="12" width="22" height="22" rx="6" fill="#000" opacity="0.25" />
    </svg>`,
  },
  {
    id: "banana",
    name: "Banana",
    category: "everyday",
    axis: "length",
    qid: "Q503",
    canonicalMeasurementMeters: 0.18, // 18 cm
    rawSvg: `<svg viewBox="0 0 140 60" xmlns="http://www.w3.org/2000/svg">
      <path d="M 10 15 Q 40 55 105 45 Q 128 40 135 25 Q 115 50 55 42 Q 22 36 10 15 Z" />
      <rect x="6" y="12" width="6" height="5" />
    </svg>`,
  },
  {
    id: "laptop",
    name: "Laptop Computer",
    category: "everyday",
    axis: "length",
    qid: "Q3962",
    canonicalMeasurementMeters: 0.31, // 31 cm wide
    rawSvg: `<svg viewBox="0 0 140 90" xmlns="http://www.w3.org/2000/svg">
      <polygon points="25,12 115,12 110,65 30,65" />
      <polygon points="5,72 135,72 125,82 15,82" />
      <rect x="28" y="65" width="84" height="6" />
    </svg>`,
  },
  {
    id: "cat",
    name: "Domestic Cat",
    category: "everyday",
    axis: "length",
    qid: "Q146",
    canonicalMeasurementMeters: 0.46, // 46 cm
    rawSvg: `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M 15 48 C 15 36 28 32 40 34 C 55 35 65 30 72 20 L 76 10 L 82 20 L 88 12 L 88 24 C 95 30 96 42 90 48 C 88 55 88 72 82 74 L 75 74 C 75 62 72 54 65 54 L 38 54 L 34 74 L 25 74 C 22 58 18 54 15 48 Z" />
      <path d="M 16 48 Q 5 44 4 30 Q 3 15 15 14" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
    </svg>`,
  },
  {
    id: "dog",
    name: "Golden Retriever Dog",
    category: "everyday",
    axis: "height",
    qid: "Q144",
    canonicalMeasurementMeters: 0.80,
    rawSvg: `<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M 20 30 L 70 30 L 78 18 L 76 8 L 84 4 L 90 10 L 98 14 L 96 20 L 86 22 L 82 34 L 80 78 L 74 78 L 72 48 L 34 48 L 32 78 L 26 78 L 24 48 Q 18 44 18 36 L 6 22 L 10 20 Z" />
    </svg>`,
  },
  {
    id: "guitar",
    name: "Acoustic Guitar",
    category: "everyday",
    axis: "length",
    qid: "Q6607",
    canonicalMeasurementMeters: 1.0, // 1 m
    rawSvg: `<svg viewBox="0 0 60 160" xmlns="http://www.w3.org/2000/svg">
      <path d="M 16 95 C 10 105 10 120 16 135 C 22 150 38 150 44 135 C 50 120 50 105 44 95 C 38 88 42 80 40 72 C 38 65 22 65 20 72 C 18 80 22 88 16 95 Z" />
      <rect x="27" y="18" width="6" height="55" />
      <polygon points="25,5 35,5 34,18 26,18" />
    </svg>`,
  },
  {
    id: "penguin",
    name: "Emperor Penguin",
    category: "everyday",
    axis: "height",
    qid: "Q133356",
    canonicalMeasurementMeters: 1.15,
    rawSvg: `<svg viewBox="0 0 60 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M 30 5 C 38 5 44 12 42 22 C 40 28 48 55 45 85 C 42 105 45 115 40 116 L 36 116 L 34 112 L 26 112 L 24 116 L 18 116 C 16 112 18 95 18 85 C 15 55 22 28 20 22 C 18 12 24 5 30 5 Z" />
      <polygon points="42,18 55,22 42,24" />
      <path d="M 20 40 Q 12 60 14 78 Q 20 72 22 55 Z" />
    </svg>`,
  },
  {
    id: "child",
    name: "School Child",
    category: "everyday",
    axis: "height",
    qid: "Q7569",
    canonicalMeasurementMeters: 1.20,
    rawSvg: `<svg viewBox="0 0 60 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="14" r="10" />
      <path d="M 20 30 L 40 30 L 42 68 L 36 68 L 36 115 L 31 115 L 30 75 L 29 75 L 28 115 L 23 115 L 23 68 L 18 68 Z" />
      <path d="M 18 32 L 12 62 L 16 64 L 21 38 M 42 32 L 48 62 L 44 64 L 39 38" />
    </svg>`,
  },
  {
    id: "polar-bear",
    name: "Polar Bear",
    category: "everyday",
    axis: "height",
    qid: "Q33609",
    canonicalMeasurementMeters: 1.60,
    rawSvg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 12 45 Q 22 30 45 28 Q 75 22 110 26 Q 135 22 148 30 L 158 35 L 148 42 Q 138 48 132 55 L 134 92 L 122 92 L 118 62 L 55 62 L 52 92 L 40 92 L 36 58 Q 25 58 18 64 Z" />
      <circle cx="145" cy="27" r="4" />
    </svg>`,
  },
  {
    id: "human",
    name: "Adult Human",
    category: "everyday",
    axis: "height",
    qid: "Q180",
    aliases: ["Q5"],
    canonicalMeasurementMeters: 1.75,
    rawSvg: `<svg viewBox="0 0 100 175" xmlns="http://www.w3.org/2000/svg">
      <path d="M 45 12 A 12 12 0 1 1 55 12 A 12 12 0 0 1 45 12 Z M 35 32 L 65 32 Q 72 32 72 40 L 70 85 Q 70 90 64 90 Q 58 90 58 84 L 60 52 L 56 52 L 55 105 L 56 175 L 48 175 L 47 115 L 45 115 L 44 175 L 36 175 L 37 105 L 36 52 L 32 52 L 34 84 Q 34 90 28 90 Q 22 90 22 85 L 20 40 Q 20 32 27 32 Z" />
    </svg>`,
  },
  {
    id: "bicycle",
    name: "Commuter Bicycle",
    category: "everyday",
    axis: "length",
    qid: "Q11442",
    canonicalMeasurementMeters: 1.75,
    rawSvg: `<svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="65" r="25" fill="none" stroke="currentColor" stroke-width="6" />
      <circle cx="130" cy="65" r="25" fill="none" stroke="currentColor" stroke-width="6" />
      <polygon points="30,65 70,65 95,35 55,35" fill="none" stroke="currentColor" stroke-width="6" />
      <line x1="70" y1="65" x2="60" y2="28" stroke="currentColor" stroke-width="6" />
      <line x1="52" y1="28" x2="68" y2="28" stroke="currentColor" stroke-width="7" stroke-linecap="round" />
      <line x1="130" y1="65" x2="110" y2="25" stroke="currentColor" stroke-width="6" />
      <line x1="102" y1="23" x2="118" y2="23" stroke="currentColor" stroke-width="7" stroke-linecap="round" />
    </svg>`,
  },
  {
    id: "door",
    name: "Standard Interior Door",
    category: "everyday",
    axis: "height",
    qid: "Q36794",
    canonicalMeasurementMeters: 2.03,
    rawSvg: `<svg viewBox="0 0 90 190" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="80" height="180" rx="2" />
      <rect x="14" y="16" width="62" height="70" fill="#000" opacity="0.2" />
      <rect x="14" y="96" width="62" height="76" fill="#000" opacity="0.2" />
      <circle cx="75" cy="100" r="4" fill="#fff" />
    </svg>`,
  },
  {
    id: "motorcycle",
    name: "Cruiser Motorcycle",
    category: "everyday",
    axis: "length",
    qid: "Q34493",
    canonicalMeasurementMeters: 2.15,
    rawSvg: `<svg viewBox="0 0 180 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="35" cy="65" r="24" fill="none" stroke="currentColor" stroke-width="8" />
      <circle cx="145" cy="65" r="24" fill="none" stroke="currentColor" stroke-width="8" />
      <path d="M 35 65 L 75 62 L 95 42 L 125 35 L 145 65 L 115 65 L 90 70 Z" />
      <path d="M 125 35 L 132 20 L 140 22" stroke="currentColor" stroke-width="6" fill="none" />
      <ellipse cx="85" cy="46" rx="15" ry="8" />
    </svg>`,
  },
  {
    id: "piano",
    name: "Concert Grand Piano",
    category: "everyday",
    axis: "length",
    qid: "Q592",
    canonicalMeasurementMeters: 2.75,
    rawSvg: `<svg viewBox="0 0 180 120" xmlns="http://www.w3.org/2000/svg">
      <path d="M 15 45 L 60 15 L 165 15 L 165 55 C 140 60 120 70 95 72 L 15 72 Z" />
      <line x1="25" y1="72" x2="25" y2="115" stroke="currentColor" stroke-width="8" />
      <line x1="155" y1="55" x2="155" y2="115" stroke="currentColor" stroke-width="8" />
      <line x1="95" y1="72" x2="95" y2="115" stroke="currentColor" stroke-width="8" />
      <line x1="60" y1="15" x2="135" y2="2" stroke="currentColor" stroke-width="6" />
    </svg>`,
  },
  {
    id: "elephant",
    name: "African Bush Elephant",
    category: "everyday",
    axis: "height",
    qid: "Q7378",
    canonicalMeasurementMeters: 3.30,
    rawSvg: `<svg viewBox="0 0 180 130" xmlns="http://www.w3.org/2000/svg">
      <path d="M 30 85 C 15 85 8 65 12 48 C 22 25 55 18 95 18 C 130 18 155 35 160 55 L 152 118 L 136 118 L 134 78 L 108 78 L 105 118 L 88 118 L 90 75 L 58 75 L 55 118 L 38 118 L 42 75 Z" />
      <path d="M 155 52 C 175 60 178 88 165 110" fill="none" stroke="currentColor" stroke-width="12" stroke-linecap="round" />
      <path d="M 148 70 Q 170 82 155 92" fill="none" stroke="#fff" stroke-width="5" />
    </svg>`,
  },
  {
    id: "car-sedan",
    name: "Sedan Family Car",
    category: "everyday",
    axis: "length",
    qid: "Q1420",
    canonicalMeasurementMeters: 4.50,
    rawSvg: `<svg viewBox="0 0 200 65" xmlns="http://www.w3.org/2000/svg">
      <path d="M 8 44 L 8 34 Q 10 28 22 26 L 52 22 L 76 6 Q 82 2 92 2 L 134 2 Q 144 2 152 10 L 170 24 Q 192 27 196 34 L 196 46 Q 196 50 190 50 L 168 50 A 16 16 0 0 0 136 50 L 64 50 A 16 16 0 0 0 32 50 L 12 50 Q 8 50 8 44 Z" />
      <circle cx="48" cy="50" r="14" />
      <circle cx="152" cy="50" r="14" />
    </svg>`,
  },

  // ==========================================
  // MACRO SCALE (5m to 5,000m)
  // ==========================================
  {
    id: "giraffe",
    name: "Adult Giraffe",
    category: "macro",
    axis: "height",
    qid: "Q15083",
    canonicalMeasurementMeters: 5.50,
    rawSvg: `<svg viewBox="0 0 100 180" xmlns="http://www.w3.org/2000/svg">
      <path d="M 25 80 L 65 72 L 78 25 L 85 8 L 88 10 L 85 28 L 72 85 L 70 175 L 62 175 L 64 110 L 40 110 L 38 175 L 30 175 L 32 95 Q 22 92 20 85 Z" />
      <polygon points="85,8 96,15 85,20" />
      <line x1="82" y1="8" x2="80" y2="4" stroke="currentColor" stroke-width="3" />
    </svg>`,
  },
  {
    id: "school-bus",
    name: "American School Bus",
    category: "macro",
    axis: "length",
    qid: "Q836306",
    canonicalMeasurementMeters: 12.0,
    rawSvg: `<svg viewBox="0 0 220 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M 8 58 L 8 32 L 25 32 L 40 15 L 205 15 Q 212 15 212 25 L 212 58 L 190 58 A 16 16 0 0 0 158 58 L 72 58 A 16 16 0 0 0 40 58 Z" />
      <circle cx="56" cy="58" r="14" />
      <circle cx="174" cy="58" r="14" />
    </svg>`,
  },
  {
    id: "trex",
    name: "Tyrannosaurus Rex",
    category: "macro",
    axis: "length",
    qid: "Q130982",
    canonicalMeasurementMeters: 12.3,
    rawSvg: `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
      <path d="M 190 18 Q 170 8 155 12 Q 140 18 135 32 Q 115 42 95 46 Q 60 52 10 38 Q 40 60 85 64 L 88 95 L 75 105 L 98 105 L 108 72 Q 125 72 135 55 L 148 65 L 150 58 Q 165 52 178 45 L 195 38 Z" />
      <path d="M 175 28 L 190 32 L 180 36 Z" fill="#000" />
    </svg>`,
  },
  {
    id: "tennis-court",
    name: "Regulation Tennis Court",
    category: "macro",
    axis: "length",
    qid: "Q1067215",
    canonicalMeasurementMeters: 23.77,
    rawSvg: `<svg viewBox="0 0 200 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="10" width="190" height="80" rx="3" />
      <line x1="100" y1="6" x2="100" y2="94" stroke="#fff" stroke-width="4" />
      <rect x="35" y="24" width="130" height="52" fill="none" stroke="#fff" stroke-width="3" opacity="0.5" />
    </svg>`,
  },
  {
    id: "blue-whale",
    name: "Blue Whale",
    category: "macro",
    axis: "length",
    qid: "Q42196",
    canonicalMeasurementMeters: 27.1,
    rawSvg: `<svg viewBox="0 0 300 110" xmlns="http://www.w3.org/2000/svg">
      <path d="M 0 55 Q 15 20 60 15 Q 140 10 220 22 Q 250 27 265 38 L 275 22 Q 279 38 278 48 Q 284 52 300 42 L 296 55 L 300 68 Q 284 58 278 62 Q 279 72 275 88 L 265 72 Q 230 76 185 82 Q 130 90 95 90 Q 50 90 25 78 Q 12 70 0 55 Z M 110 75 Q 135 110 145 108 Q 148 102 135 78 Z" />
    </svg>`,
  },
  {
    id: "boeing-737",
    name: "Boeing 737 Airliner",
    category: "macro",
    axis: "length",
    qid: "Q6387",
    aliases: ["Q12476717"],
    canonicalMeasurementMeters: 39.5,
    rawSvg: `<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M 10 48 Q 25 38 75 36 L 145 36 L 210 10 L 225 10 L 218 36 L 235 38 L 235 48 L 175 48 L 135 75 L 115 75 L 130 48 L 45 48 Q 20 54 10 48 Z" />
      <polygon points="100,50 120,50 115,62 95,62" />
    </svg>`,
  },
  {
    id: "colosseum",
    name: "Rome Colosseum",
    category: "macro",
    axis: "height",
    qid: "Q10285",
    canonicalMeasurementMeters: 48.0,
    rawSvg: `<svg viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
      <path d="M 10 100 L 10 35 Q 40 32 100 32 Q 160 32 190 35 L 190 100 Z" />
      <rect x="25" y="45" width="16" height="24" rx="8" fill="#000" opacity="0.3" />
      <rect x="55" y="45" width="16" height="24" rx="8" fill="#000" opacity="0.3" />
      <rect x="85" y="45" width="16" height="24" rx="8" fill="#000" opacity="0.3" />
      <rect x="115" y="45" width="16" height="24" rx="8" fill="#000" opacity="0.3" />
      <rect x="145" y="45" width="16" height="24" rx="8" fill="#000" opacity="0.3" />
    </svg>`,
  },
  {
    id: "swimming-pool",
    name: "Olympic Swimming Pool",
    category: "macro",
    axis: "length",
    qid: "Q1508006",
    canonicalMeasurementMeters: 50.0,
    rawSvg: `<svg viewBox="0 0 220 110" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="204" height="90" rx="4" />
      <line x1="8" y1="28" x2="212" y2="28" stroke="#fff" stroke-width="2" opacity="0.4" />
      <line x1="8" y1="46" x2="212" y2="46" stroke="#fff" stroke-width="2" opacity="0.4" />
      <line x1="8" y1="64" x2="212" y2="64" stroke="#fff" stroke-width="2" opacity="0.4" />
      <line x1="8" y1="82" x2="212" y2="82" stroke="#fff" stroke-width="2" opacity="0.4" />
    </svg>`,
  },
  {
    id: "space-shuttle",
    name: "Space Shuttle Stack",
    category: "macro",
    axis: "height",
    qid: "Q131262",
    canonicalMeasurementMeters: 56.1,
    rawSvg: `<svg viewBox="0 0 100 170" xmlns="http://www.w3.org/2000/svg">
      <path d="M 44 8 Q 50 2 56 8 L 58 140 L 42 140 Z" />
      <path d="M 25 35 Q 30 25 35 35 L 36 155 L 24 155 Z" />
      <path d="M 65 35 Q 70 25 75 35 L 76 155 L 64 155 Z" />
      <polygon points="40,85 60,85 75,135 25,135" />
    </svg>`,
  },
  {
    id: "statue-of-liberty",
    name: "Statue of Liberty",
    category: "macro",
    axis: "height",
    qid: "Q9202",
    canonicalMeasurementMeters: 93.0,
    rawSvg: `<svg viewBox="0 0 80 180" xmlns="http://www.w3.org/2000/svg">
      <polygon points="20,180 60,180 56,135 24,135" />
      <path d="M 30 135 L 34 70 L 48 70 L 52 135 Z" />
      <circle cx="41" cy="55" r="9" />
      <polygon points="41,42 35,48 47,48" />
      <path d="M 46 65 L 65 25 L 68 28 L 52 70 Z" />
      <polygon points="63,22 70,12 73,22" />
    </svg>`,
  },
  {
    id: "football-pitch",
    name: "FIFA Football Pitch",
    category: "macro",
    axis: "length",
    qid: "Q854541",
    canonicalMeasurementMeters: 105.0,
    rawSvg: `<svg viewBox="0 0 220 140" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="204" height="120" rx="3" />
      <line x1="110" y1="10" x2="110" y2="130" stroke="#fff" stroke-width="3" />
      <circle cx="110" cy="70" r="24" fill="none" stroke="#fff" stroke-width="3" />
      <rect x="8" y="42" width="35" height="56" fill="none" stroke="#fff" stroke-width="3" />
      <rect x="177" y="42" width="35" height="56" fill="none" stroke="#fff" stroke-width="3" />
    </svg>`,
  },
  {
    id: "saturn-v",
    name: "Saturn V Moon Rocket",
    category: "macro",
    axis: "height",
    qid: "Q54363",
    canonicalMeasurementMeters: 110.65,
    rawSvg: `<svg viewBox="0 0 200 450" xmlns="http://www.w3.org/2000/svg">
      <path d="M 99 0 L 101 0 L 101 25 L 98 40 L 98 48 L 94 65 L 94 150 L 91 165 L 91 380 L 80 400 L 80 435 L 88 435 L 91 415 L 109 415 L 112 435 L 120 435 L 120 400 L 109 380 L 109 165 L 106 150 L 106 65 L 102 48 L 102 40 L 99 25 Z" />
    </svg>`,
  },
  {
    id: "pyramid-giza",
    name: "Great Pyramid of Giza",
    category: "macro",
    axis: "height",
    qid: "Q12588",
    canonicalMeasurementMeters: 138.8,
    rawSvg: `<svg viewBox="0 0 220 140" xmlns="http://www.w3.org/2000/svg">
      <polygon points="110,8 210,132 10,132" />
      <polygon points="110,8 145,132 210,132" fill="#000" opacity="0.25" />
    </svg>`,
  },
  {
    id: "wind-turbine",
    name: "Offshore Wind Turbine",
    category: "macro",
    axis: "height",
    qid: "Q49833",
    canonicalMeasurementMeters: 150.0,
    rawSvg: `<svg viewBox="0 0 140 220" xmlns="http://www.w3.org/2000/svg">
      <polygon points="68,75 72,75 75,215 65,215" />
      <circle cx="70" cy="75" r="7" />
      <polygon points="70,75 66,8 74,8" />
      <polygon points="70,75 125,108 120,115" />
      <polygon points="70,75 15,108 20,115" />
    </svg>`,
  },
  {
    id: "titanic",
    name: "RMS Titanic",
    category: "macro",
    axis: "length",
    qid: "Q25273",
    canonicalMeasurementMeters: 269.1,
    rawSvg: `<svg viewBox="0 0 260 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M 10 52 L 25 36 L 245 36 L 235 56 Z" />
      <rect x="50" y="24" width="150" height="12" />
      <line x1="80" y1="24" x2="84" y2="8" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
      <line x1="110" y1="24" x2="114" y2="8" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
      <line x1="140" y1="24" x2="144" y2="8" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
      <line x1="170" y1="24" x2="174" y2="8" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
      <line x1="45" y1="36" x2="45" y2="2" stroke="currentColor" stroke-width="3" />
      <line x1="215" y1="36" x2="215" y2="2" stroke="currentColor" stroke-width="3" />
    </svg>`,
  },
  {
    id: "eiffel-tower",
    name: "Eiffel Tower",
    category: "macro",
    axis: "height",
    qid: "Q243",
    canonicalMeasurementMeters: 330.0,
    rawSvg: `<svg viewBox="0 0 200 330" xmlns="http://www.w3.org/2000/svg">
      <path d="M 98 0 L 102 0 L 102 30 L 105 30 L 105 60 L 108 60 L 114 160 L 125 160 L 125 175 L 115 175 L 122 250 L 138 250 L 138 270 L 124 270 L 145 330 L 125 330 L 112 285 Q 100 240 88 285 L 75 330 L 55 330 L 76 270 L 62 270 L 62 250 L 78 250 L 85 175 L 75 175 L 75 160 L 86 160 L 92 60 L 95 60 L 95 30 L 98 30 Z" />
    </svg>`,
  },
  {
    id: "empire-state",
    name: "Empire State Building",
    category: "macro",
    axis: "height",
    qid: "Q9188",
    canonicalMeasurementMeters: 443.2,
    rawSvg: `<svg viewBox="0 0 100 240" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="170" width="60" height="70" />
      <rect x="28" y="110" width="44" height="60" />
      <rect x="36" y="55" width="28" height="55" />
      <rect x="44" y="30" width="12" height="25" />
      <line x1="50" y1="30" x2="50" y2="4" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
    </svg>`,
  },
  {
    id: "seawise-giant",
    name: "Seawise Giant Supertanker",
    category: "macro",
    axis: "length",
    qid: "Q516104",
    canonicalMeasurementMeters: 458.45,
    rawSvg: `<svg viewBox="0 0 280 60" xmlns="http://www.w3.org/2000/svg">
      <polygon points="5,42 25,24 265,24 275,42 270,48 10,48" />
      <rect x="235" y="12" width="22" height="12" />
      <line x1="248" y1="12" x2="248" y2="4" stroke="currentColor" stroke-width="3" />
    </svg>`,
  },
  {
    id: "burj-khalifa",
    name: "Burj Khalifa",
    category: "macro",
    axis: "height",
    qid: "Q12495",
    canonicalMeasurementMeters: 828.0,
    rawSvg: `<svg viewBox="0 0 200 828" xmlns="http://www.w3.org/2000/svg">
      <path d="M 98 0 L 102 0 L 102 120 L 106 120 L 106 200 L 110 200 L 110 300 L 115 300 L 115 420 L 122 420 L 122 550 L 132 550 L 132 700 L 145 700 L 145 828 L 55 828 L 55 700 L 68 700 L 68 550 L 78 550 L 78 420 L 85 420 L 85 300 L 90 300 L 90 200 L 94 200 L 94 120 L 98 120 Z" />
    </svg>`,
  },
  {
    id: "golden-gate",
    name: "Golden Gate Bridge",
    category: "macro",
    axis: "length",
    qid: "Q44203",
    canonicalMeasurementMeters: 2737.0,
    rawSvg: `<svg viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
      <line x1="5" y1="85" x2="295" y2="85" stroke="currentColor" stroke-width="8" />
      <polygon points="85,15 95,15 98,115 82,115" />
      <polygon points="205,15 215,15 218,115 202,115" />
      <path d="M 10 85 Q 50 65 90 18 Q 150 90 210 18 Q 250 65 290 85" fill="none" stroke="currentColor" stroke-width="5" />
    </svg>`,
  },

  // ==========================================
  // COSMIC SCALE (> 5,000m)
  // ==========================================
  {
    id: "mount-everest",
    name: "Mount Everest",
    category: "cosmic",
    axis: "height",
    qid: "Q513",
    canonicalMeasurementMeters: 8848.86,
    rawSvg: `<svg viewBox="0 0 240 140" xmlns="http://www.w3.org/2000/svg">
      <polygon points="125,12 230,135 15,135" />
      <polygon points="75,60 125,12 145,55 130,85" fill="#000" opacity="0.3" />
    </svg>`,
  },
  {
    id: "neutron-star",
    name: "Neutron Star",
    category: "cosmic",
    axis: "diameter",
    qid: "Q4202",
    canonicalMeasurementMeters: 20000.0, // 20 km
    rawSvg: `<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <circle cx="70" cy="70" r="32" />
      <polygon points="70,38 95,4 45,4" opacity="0.6" />
      <polygon points="70,102 95,136 45,136" opacity="0.6" />
    </svg>`,
  },
  {
    id: "olympus-mons",
    name: "Olympus Mons Volcano",
    category: "cosmic",
    axis: "height",
    qid: "Q522",
    canonicalMeasurementMeters: 21900.0, // 21.9 km
    rawSvg: `<svg viewBox="0 0 280 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 10 95 Q 60 92 110 50 Q 130 35 140 35 Q 150 35 170 50 Q 220 92 270 95 Z" />
      <ellipse cx="140" cy="38" rx="14" ry="4" fill="#000" opacity="0.4" />
    </svg>`,
  },
  {
    id: "ceres",
    name: "Dwarf Planet Ceres",
    category: "cosmic",
    axis: "diameter",
    qid: "Q596",
    canonicalMeasurementMeters: 939400.0,
    rawSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" />
      <circle cx="36" cy="32" r="8" fill="#000" opacity="0.3" />
      <circle cx="68" cy="62" r="10" fill="#000" opacity="0.3" />
      <circle cx="58" cy="40" r="3" fill="#fff" opacity="0.7" />
    </svg>`,
  },
  {
    id: "moon",
    name: "The Moon",
    category: "cosmic",
    axis: "diameter",
    qid: "Q405",
    canonicalMeasurementMeters: 3476200.0,
    rawSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="M 50 0 A 50 50 0 1 1 49.99 0 Z" />
    </svg>`,
  },
  {
    id: "mercury",
    name: "Planet Mercury",
    category: "cosmic",
    axis: "diameter",
    qid: "Q308",
    canonicalMeasurementMeters: 4879400.0,
    rawSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" />
      <circle cx="32" cy="42" r="6" fill="#000" opacity="0.25" />
      <circle cx="62" cy="35" r="9" fill="#000" opacity="0.25" />
      <circle cx="48" cy="72" r="7" fill="#000" opacity="0.25" />
    </svg>`,
  },
  {
    id: "mars",
    name: "Planet Mars",
    category: "cosmic",
    axis: "diameter",
    qid: "Q111",
    canonicalMeasurementMeters: 6779000.0,
    rawSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" />
      <ellipse cx="50" cy="8" rx="14" ry="4" fill="#fff" opacity="0.8" />
      <path d="M 25 45 Q 50 65 80 40 Q 60 70 30 55 Z" fill="#000" opacity="0.25" />
    </svg>`,
  },
  {
    id: "earth",
    name: "Planet Earth",
    category: "cosmic",
    axis: "diameter",
    qid: "Q2",
    canonicalMeasurementMeters: 12742000.0,
    rawSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" />
      <path d="M 28 25 Q 40 20 48 35 Q 44 48 32 45 Z" fill="#000" opacity="0.35" />
      <path d="M 60 30 Q 75 25 82 45 Q 68 55 58 42 Z" fill="#000" opacity="0.35" />
      <path d="M 38 60 Q 48 55 45 80 Q 32 85 35 68 Z" fill="#000" opacity="0.35" />
    </svg>`,
  },
  {
    id: "saturn",
    name: "Planet Saturn",
    category: "cosmic",
    axis: "diameter",
    qid: "Q183",
    canonicalMeasurementMeters: 116464000.0,
    rawSvg: `<svg viewBox="0 0 180 100" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="90" cy="50" rx="80" ry="24" fill="none" stroke="currentColor" stroke-width="12" opacity="0.8" />
      <circle cx="90" cy="50" r="32" />
    </svg>`,
  },
  {
    id: "jupiter",
    name: "Planet Jupiter",
    category: "cosmic",
    axis: "diameter",
    qid: "Q319",
    canonicalMeasurementMeters: 139820000.0,
    rawSvg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" />
      <line x1="4" y1="38" x2="96" y2="38" stroke="#000" stroke-width="7" opacity="0.3" />
      <line x1="4" y1="52" x2="96" y2="52" stroke="#000" stroke-width="8" opacity="0.3" />
      <line x1="4" y1="68" x2="96" y2="68" stroke="#000" stroke-width="6" opacity="0.3" />
      <ellipse cx="68" cy="58" rx="8" ry="5" fill="#000" opacity="0.4" />
    </svg>`,
  },
  {
    id: "sun",
    name: "The Sun",
    category: "cosmic",
    axis: "diameter",
    qid: "Q525",
    canonicalMeasurementMeters: 1392700000.0,
    rawSvg: `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="45" />
      <path d="M 60 5 L 60 0 M 60 115 L 60 120 M 5 60 L 0 60 M 115 60 L 120 60 M 21 21 L 16 16 M 99 99 L 104 104 M 99 21 L 104 16 M 21 99 L 16 104" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
    </svg>`,
  },
];

/**
 * Queries Wikidata EntityData API for live physical dimension claims.
 */
export async function fetchWikidataDimensions(
  items: PuzzleItemConfig[],
): Promise<Map<string, { value: number; property: string }>> {
  const results = new Map<string, { value: number; property: string }>();

  console.log(`\n[Wikidata Pipeline] Querying Wikidata API for ${items.length} items...`);

  const batchSize = 6;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.allSettled(
      batch.map(async (item) => {
        const qid = item.qid;
        try {
          const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
          const res = await fetch(url, {
            headers: {
              "User-Agent": "GuessTheSizeDataPipeline/1.0 (https://github.com/pikacoder44/Guess-the-size; developer@guessthesize.local)",
              Accept: "application/json",
            },
            signal: AbortSignal.timeout(3500),
          });

          if (!res.ok) return;

          const data = (await res.json()) as any;
          const entity = data?.entities?.[qid];
          if (!entity?.claims) return;

          const claims = entity.claims;
          // Inspect claims: P2048 (height), P2043 (length), P2386 (diameter), P2050 (wingspan)
          const propOrder = [
            { prop: "P2048", name: "height" },
            { prop: "P2043", name: "length" },
            { prop: "P2386", name: "diameter" },
            { prop: "P2050", name: "wingspan" },
          ];

          for (const { prop, name } of propOrder) {
            const claimList = claims[prop];
            if (claimList && claimList.length > 0) {
              const datavalue = claimList[0]?.mainsnak?.datavalue;
              if (datavalue?.value?.amount) {
                const rawAmount = parseFloat(datavalue.value.amount);
                const unitUri = datavalue.value.unit || "";
                const unitQid = unitUri.split("/").pop() || "Q11573";
                const factor = UNIT_FACTORS[unitQid] ?? 1;
                const inMeters = rawAmount * factor;

                if (Number.isFinite(inMeters) && inMeters > 0) {
                  results.set(item.id, { value: inMeters, property: name });
                  break;
                }
              }
            }
          }
        } catch {
          // Fall back gracefully
        }
      }),
    );
  }

  console.log(`[Wikidata Pipeline] Live claims retrieved for ${results.size}/${items.length} items.`);
  return results;
}

/**
 * Normalizes all SVGs, resolves measurements, and writes public silhouettes and JSON dataset.
 */
export async function buildPuzzlesDataPipeline(options?: {
  rootDir?: string;
  skipWikidataLive?: boolean;
}): Promise<{ items: PuzzleItem[]; puzzles: StoredPuzzle[] }> {
  const root = options?.rootDir ?? path.resolve(__dirname, "../..");
  const publicSilhouettesDir = path.resolve(root, "public/silhouettes");
  const dataDir = path.resolve(root, "src/data");

  await fs.mkdir(publicSilhouettesDir, { recursive: true });
  await fs.mkdir(dataDir, { recursive: true });

  console.log("=== ScaleGuess Content & Puzzle Automation Pipeline ===");

  // 1. Live Wikidata query (optional or automatic)
  const wikidataClaims = options?.skipWikidataLive
    ? new Map()
    : await fetchWikidataDimensions(PUZZLE_ITEMS_CATALOG);

  // 2. Normalize and save each SVG silhouette
  console.log("\n[Trimmer] Processing vector SVGs and trimming viewBox with zero empty space...");
  const processedItems: PuzzleItem[] = [];

  for (const itemConfig of PUZZLE_ITEMS_CATALOG) {
    const filename = `${itemConfig.id.replace(/-/g, "_")}.svg`;
    const svgFilePath = path.join(publicSilhouettesDir, filename);

    // Normalize SVG to zero-margin bounding box
    const norm = normalizeSvg(itemConfig.rawSvg);
    await fs.writeFile(svgFilePath, norm.svg, "utf-8");

    // Resolve measurement: live Wikidata claim or verified canonical
    let measurement = itemConfig.canonicalMeasurementMeters;
    let source = `Wikidata (${itemConfig.qid})`;

    const liveClaim = wikidataClaims.get(itemConfig.id);
    if (liveClaim) {
      const ratio = liveClaim.value / itemConfig.canonicalMeasurementMeters;
      // Sanity check: only accept claim if it's within plausible 0.3x - 3.0x range of canonical dimension
      // (guards against Wikidata statements like route length, model draught, or prominence)
      if (ratio >= 0.3 && ratio <= 3.0) {
        measurement = Math.round(liveClaim.value * 1000) / 1000;
        source = `Wikidata (${itemConfig.qid}) [Live Claim: ${liveClaim.property}]`;
      }
    }

    const viewBox: SilhouetteViewBox = {
      x: norm.bounds.minX,
      y: norm.bounds.minY,
      width: norm.bounds.width,
      height: norm.bounds.height,
    };

    const puzzleItem: PuzzleItem = {
      id: itemConfig.id,
      name: itemConfig.name,
      category: itemConfig.category,
      actualMeasurementMeters: measurement,
      axis: itemConfig.axis,
      svgUrl: `/silhouettes/${filename}`,
      source,
      viewBox,
    };

    processedItems.push(puzzleItem);
    console.log(` -> [${puzzleItem.id}] ${puzzleItem.name}: ${puzzleItem.actualMeasurementMeters}m (viewBox: "${norm.viewBox}")`);
  }

  // 3. Generate curated puzzle pairs across scales
  console.log("\n[Puzzles] Generating curated scale tier puzzle pairs...");
  const curatedPuzzles: StoredPuzzle[] = [
    // Micro Tier Puzzles
    { id: "water-dna", referenceId: "water-molecule", targetId: "dna-strand", category: "micro" },
    { id: "dna-corona", referenceId: "dna-strand", targetId: "coronavirus", category: "micro" },
    { id: "corona-phage", referenceId: "coronavirus", targetId: "bacteriophage", category: "micro" },
    { id: "phage-rbc", referenceId: "bacteriophage", targetId: "red-blood-cell", category: "micro" },
    { id: "rbc-hair", referenceId: "red-blood-cell", targetId: "human-hair", category: "micro" },
    { id: "hair-tardigrade", referenceId: "human-hair", targetId: "tardigrade", category: "micro" },
    { id: "tardigrade-sand", referenceId: "tardigrade", targetId: "grain-of-sand", category: "micro" },
    { id: "sand-ant", referenceId: "grain-of-sand", targetId: "ant", category: "micro" },
    { id: "ant-fly", referenceId: "ant", targetId: "housefly", category: "micro" },

    // Micro -> Everyday Bridge
    { id: "fly-coin", referenceId: "housefly", targetId: "quarter-coin", category: "everyday" },
    { id: "coin-tennisball", referenceId: "quarter-coin", targetId: "tennis-ball", category: "everyday" },

    // Everyday Tier Puzzles
    { id: "tennisball-mug", referenceId: "tennis-ball", targetId: "coffee-mug", category: "everyday" },
    { id: "mug-iphone", referenceId: "coffee-mug", targetId: "iphone", category: "everyday" },
    { id: "iphone-banana", referenceId: "iphone", targetId: "banana", category: "everyday" },
    { id: "banana-laptop", referenceId: "banana", targetId: "laptop", category: "everyday" },
    { id: "laptop-cat", referenceId: "laptop", targetId: "cat", category: "everyday" },
    { id: "cat-dog", referenceId: "cat", targetId: "dog", category: "everyday" },
    { id: "dog-guitar", referenceId: "dog", targetId: "guitar", category: "everyday" },
    { id: "guitar-penguin", referenceId: "guitar", targetId: "penguin", category: "everyday" },
    { id: "penguin-child", referenceId: "penguin", targetId: "child", category: "everyday" },
    { id: "child-polarbear", referenceId: "child", targetId: "polar-bear", category: "everyday" },
    { id: "human-dog", referenceId: "human", targetId: "dog", category: "everyday" },
    { id: "human-bicycle", referenceId: "human", targetId: "bicycle", category: "everyday" },
    { id: "human-door", referenceId: "human", targetId: "door", category: "everyday" },
    { id: "bicycle-motorcycle", referenceId: "bicycle", targetId: "motorcycle", category: "everyday" },
    { id: "motorcycle-piano", referenceId: "motorcycle", targetId: "piano", category: "everyday" },
    { id: "piano-elephant", referenceId: "piano", targetId: "elephant", category: "everyday" },
    { id: "human-car", referenceId: "human", targetId: "car-sedan", category: "everyday" },
    { id: "dog-car", referenceId: "dog", targetId: "car-sedan", category: "everyday" },

    // Everyday -> Macro Bridge
    { id: "car-giraffe", referenceId: "car-sedan", targetId: "giraffe", category: "macro" },
    { id: "giraffe-schoolbus", referenceId: "giraffe", targetId: "school-bus", category: "macro" },
    { id: "schoolbus-trex", referenceId: "school-bus", targetId: "trex", category: "macro" },
    { id: "trex-court", referenceId: "trex", targetId: "tennis-court", category: "macro" },
    { id: "court-whale", referenceId: "tennis-court", targetId: "blue-whale", category: "macro" },
    { id: "car-whale", referenceId: "car-sedan", targetId: "blue-whale", category: "macro" },
    { id: "human-whale", referenceId: "human", targetId: "blue-whale", category: "macro" },

    // Macro Tier Puzzles
    { id: "whale-boeing", referenceId: "blue-whale", targetId: "boeing-737", category: "macro" },
    { id: "boeing-colosseum", referenceId: "boeing-737", targetId: "colosseum", category: "macro" },
    { id: "colosseum-pool", referenceId: "colosseum", targetId: "swimming-pool", category: "macro" },
    { id: "pool-shuttle", referenceId: "swimming-pool", targetId: "space-shuttle", category: "macro" },
    { id: "shuttle-liberty", referenceId: "space-shuttle", targetId: "statue-of-liberty", category: "macro" },
    { id: "liberty-pitch", referenceId: "statue-of-liberty", targetId: "football-pitch", category: "macro" },
    { id: "whale-saturn", referenceId: "blue-whale", targetId: "saturn-v", category: "macro" },
    { id: "pitch-saturn", referenceId: "football-pitch", targetId: "saturn-v", category: "macro" },
    { id: "saturn-pyramid", referenceId: "saturn-v", targetId: "pyramid-giza", category: "macro" },
    { id: "pyramid-windturbine", referenceId: "pyramid-giza", targetId: "wind-turbine", category: "macro" },
    { id: "windturbine-titanic", referenceId: "wind-turbine", targetId: "titanic", category: "macro" },
    { id: "titanic-eiffel", referenceId: "titanic", targetId: "eiffel-tower", category: "macro" },
    { id: "saturn-eiffel", referenceId: "saturn-v", targetId: "eiffel-tower", category: "macro" },
    { id: "eiffel-empirestate", referenceId: "eiffel-tower", targetId: "empire-state", category: "macro" },
    { id: "empirestate-seawise", referenceId: "empire-state", targetId: "seawise-giant", category: "macro" },
    { id: "eiffel-burj", referenceId: "eiffel-tower", targetId: "burj-khalifa", category: "macro" },
    { id: "saturn-burj", referenceId: "saturn-v", targetId: "burj-khalifa", category: "macro" },
    { id: "burj-goldengate", referenceId: "burj-khalifa", targetId: "golden-gate", category: "macro" },

    // Cosmic Tier Puzzles
    { id: "goldengate-everest", referenceId: "golden-gate", targetId: "mount-everest", category: "cosmic" },
    { id: "burj-everest", referenceId: "burj-khalifa", targetId: "mount-everest", category: "cosmic" },
    { id: "everest-neutronstar", referenceId: "mount-everest", targetId: "neutron-star", category: "cosmic" },
    { id: "neutronstar-olympus", referenceId: "neutron-star", targetId: "olympus-mons", category: "cosmic" },
    { id: "olympus-ceres", referenceId: "olympus-mons", targetId: "ceres", category: "cosmic" },
    { id: "ceres-moon", referenceId: "ceres", targetId: "moon", category: "cosmic" },
    { id: "burj-moon", referenceId: "burj-khalifa", targetId: "moon", category: "cosmic" },
    { id: "saturn-moon", referenceId: "saturn-v", targetId: "moon", category: "cosmic" },
    { id: "moon-mercury", referenceId: "moon", targetId: "mercury", category: "cosmic" },
    { id: "mercury-mars", referenceId: "mercury", targetId: "mars", category: "cosmic" },
    { id: "mars-earth", referenceId: "mars", targetId: "earth", category: "cosmic" },
    { id: "earth-saturn", referenceId: "earth", targetId: "saturn", category: "cosmic" },
    { id: "saturn-jupiter", referenceId: "saturn", targetId: "jupiter", category: "cosmic" },
    { id: "jupiter-sun", referenceId: "jupiter", targetId: "sun", category: "cosmic" },
  ];

  // 4. Save JSON files
  const itemsJsonPath = path.join(dataDir, "puzzles.json");
  const puzzleSetsJsonPath = path.join(dataDir, "puzzleSets.json");

  await fs.writeFile(itemsJsonPath, JSON.stringify(processedItems, null, 2) + "\n", "utf-8");
  await fs.writeFile(puzzleSetsJsonPath, JSON.stringify(curatedPuzzles, null, 2) + "\n", "utf-8");

  console.log(`\n[Export] Saved ${processedItems.length} items to ${itemsJsonPath}`);
  console.log(`[Export] Saved ${curatedPuzzles.length} puzzle pairings to ${puzzleSetsJsonPath}`);

  return { items: processedItems, puzzles: curatedPuzzles };
}

// CLI runner
if (process.argv[1]?.endsWith("fetchPuzzles.ts")) {
  buildPuzzlesDataPipeline()
    .then(({ items, puzzles }) => {
      console.log(`\nPipeline completed successfully! Built ${items.length} items & ${puzzles.length} puzzles.`);
    })
    .catch((err) => {
      console.error("\nPipeline execution error:", err);
      process.exit(1);
    });
}
