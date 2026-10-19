export type ItemCategory = "micro" | "everyday" | "macro" | "cosmic";

export type ItemAxis = "height" | "length" | "diameter";

export interface PuzzleItem {
  id: string;
  name: string;
  category: ItemCategory;
  actualMeasurementMeters: number;
  axis: ItemAxis;
  svgUrl: string; // Path to public SVG, e.g. "/silhouettes/blue_whale.svg"
  source: string; // e.g. "Wikidata (Q42196)"
}
