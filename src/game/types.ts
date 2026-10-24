import type { ComponentType } from "react";
import type { ItemCategory, PuzzleItem, ItemAxis } from "@/types/puzzle";

export type MeasurementAxis = "height" | "length" | "width" | "diameter";
export type { PuzzleItem, ItemCategory, ItemAxis };

/** A resolution-independent silhouette. Paths must touch all four viewBox edges. */
export type Silhouette = {
  viewBox: { x: number; y: number; width: number; height: number };
  Shape?: ComponentType;
  svgUrl?: string;
};

export type GameObject = {
  id: string;
  name: string;
  silhouette: Silhouette;
  /** Real-world measurement in metres along `axis` or `primaryDimension`. */
  actualMeasurement: number;
  axis: MeasurementAxis;
  primaryDimension?: MeasurementAxis;
  valueInMeters?: number;
  description?: string;
  category?: ItemCategory;
  svgUrl?: string;
  source?: string;
};


export type Puzzle = {
  id: string;
  reference: GameObject;
  target: GameObject;
  category?: ItemCategory;
};

export type GamePhase = "PLAYING" | "RESULT" | "FINISHED";

export type RoundRecord = {
  round: number;
  puzzle: Puzzle;
  guessScale: number;
  actualMeasurement: number;
  errorPercent: number;
  score: number;
};
