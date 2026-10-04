import type { ComponentType } from "react";

export type MeasurementAxis = "height" | "length";

/** A resolution-independent silhouette. Paths must touch all four viewBox edges. */
export type Silhouette = {
  viewBox: { x: number; y: number; width: number; height: number };
  Shape: ComponentType;
};

export type GameObject = {
  id: string;
  name: string;
  silhouette: Silhouette;
  /** Real-world measurement in metres along `axis`. */
  actualMeasurement: number;
  axis: MeasurementAxis;
};

export type Puzzle = {
  id: string;
  reference: GameObject;
  target: GameObject;
};

export type GamePhase = "PLAYING" | "RESULT";
