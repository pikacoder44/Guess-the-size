import type { GameObject, Puzzle } from "./types";

const car: GameObject = {
  id: "car",
  name: "Hatchback car",
  actualMeasurement: 4.1,
  axis: "length",
  silhouette: {
    viewBox: { x: 8, y: 2, width: 188, height: 62 },
    Shape: () => (
      <>
        <path d="M8 44 L8 34 Q10 28 22 26 L52 22 L76 6 Q82 2 92 2 L134 2 Q144 2 152 10 L170 24 Q192 27 196 34 L196 46 Q196 50 190 50 L168 50 A16 16 0 0 0 136 50 L64 50 A16 16 0 0 0 32 50 L12 50 Q8 50 8 44 Z" />
        <circle cx="48" cy="50" r="14" />
        <circle cx="152" cy="50" r="14" />
      </>
    ),
  },
};

const bus: GameObject = {
  id: "bus",
  name: "City bus",
  actualMeasurement: 12,
  axis: "length",
  silhouette: {
    viewBox: { x: 4, y: 4, width: 234, height: 74 },
    Shape: () => (
      <>
        <path
          fillRule="evenodd"
          d="M4 10 Q4 4 10 4 L232 4 Q238 4 238 12 L238 66 L4 66 Z M14 14 L14 34 L44 34 L44 14 Z M52 14 L52 34 L82 34 L82 14 Z M90 14 L90 34 L120 34 L120 14 Z M128 14 L128 34 L158 34 L158 14 Z M166 14 L166 34 L196 34 L196 14 Z M206 14 L206 54 L228 54 L228 14 Z"
        />
        <circle cx="46" cy="66" r="12" />
        <circle cx="196" cy="66" r="12" />
      </>
    ),
  },
};

const dog: GameObject = {
  id: "dog",
  name: "Labrador",
  actualMeasurement: 0.8,
  axis: "height",
  silhouette: {
    viewBox: { x: 6, y: 4, width: 92, height: 74 },
    Shape: () => (
      <path d="M20 30 L70 30 L78 18 L76 8 L84 4 L90 10 L98 14 L96 20 L86 22 L82 34 L80 78 L74 78 L72 48 L34 48 L32 78 L26 78 L24 48 Q18 44 18 36 L6 22 L10 20 Z" />
    ),
  },
};

const horse: GameObject = {
  id: "horse",
  name: "Horse",
  actualMeasurement: 2.2,
  axis: "height",
  silhouette: {
    viewBox: { x: 4, y: 2, width: 114, height: 106 },
    Shape: () => (
      <path d="M20 40 L80 40 L92 20 L96 6 L102 2 L106 8 L118 22 L114 28 L104 22 L98 44 L96 108 L90 108 L88 66 L34 66 L30 108 L24 108 L22 66 Q14 60 16 46 L6 70 L4 66 L14 42 Z" />
    ),
  },
};

const bicycle: GameObject = {
  id: "bicycle",
  name: "Bicycle",
  actualMeasurement: 1.75,
  axis: "length",
  silhouette: {
    viewBox: { x: 1, y: 12, width: 178, height: 87 },
    Shape: () => (
      <>
        <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinejoin="round">
          <circle cx="36" cy="64" r="32" />
          <circle cx="144" cy="64" r="32" />
          <path d="M36 64 L70 26 L126 26 L144 64 M70 26 L88 64 L126 26 M88 64 L36 64 M126 26 L124 16" />
        </g>
        <path d="M58 16 L84 16 L84 22 L58 22 Z M116 12 L136 12 L136 18 L116 18 Z" />
      </>
    ),
  },
};

const motorcycle: GameObject = {
  id: "motorcycle",
  name: "Motorcycle",
  actualMeasurement: 2.1,
  axis: "length",
  silhouette: {
    viewBox: { x: 4, y: 18, width: 190, height: 84 },
    Shape: () => (
      <>
        <g fill="none" stroke="currentColor" strokeWidth="8">
          <circle cx="38" cy="68" r="30" />
          <circle cx="160" cy="68" r="30" />
        </g>
        <path d="M38 68 L60 40 L80 36 L96 30 L130 30 L140 22 L150 18 L156 22 L148 34 L160 68 L150 70 L136 42 L124 56 L84 62 L66 54 Z M60 40 L44 34 L84 30 L96 30 Z" />
      </>
    ),
  },
};

export const PUZZLES: Puzzle[] = [
  { id: "car-bus", reference: car, target: bus },
  { id: "dog-horse", reference: dog, target: horse },
  { id: "bicycle-motorcycle", reference: bicycle, target: motorcycle },
  { id: "horse-car", reference: horse, target: car },
];

export function pickRandomPuzzle(currentId?: string): Puzzle {
  const pool =
    currentId && PUZZLES.length > 1
      ? PUZZLES.filter((p) => p.id !== currentId)
      : PUZZLES;
  return pool[Math.floor(Math.random() * pool.length)] ?? PUZZLES[0]!;
}
