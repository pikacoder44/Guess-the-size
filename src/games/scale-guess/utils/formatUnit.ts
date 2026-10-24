/**
 * Dynamic Unit Formatter for ScaleGuess.
 * Formats physical world measurements (metres) dynamically across all scale tiers:
 * - < 0.01 cm (< 100 µm): Micrometers (e.g. 70 µm)
 * - < 1 cm (< 10 mm): Millimeters (e.g. 0.5 mm)
 * - < 100 cm: Centimeters (e.g. 16 cm)
 * - >= 1 m and < 1000 m: Meters (e.g. 1.75 m)
 * - >= 1000 m: Kilometers (e.g. 384,400 km)
 */

export function formatUnit(meters: number): string {
  if (meters <= 0 || !Number.isFinite(meters)) return "0 m";
  const cm = meters * 100;

  // < 0.01 cm (< 100 µm): Format in micrometers (e.g. 70 µm)
  if (cm < 0.01) {
    const um = meters * 1e6;
    let formatted: string;
    if (um < 0.01) {
      formatted = Number(um.toPrecision(2)).toString();
    } else if (um >= 10) {
      formatted = Math.round(um).toString();
    } else {
      formatted = Number(um.toFixed(2)).toString();
    }
    return `${formatted} µm`;
  }

  // < 1 cm (< 10 mm): Format in millimeters (e.g. 0.5 mm)
  if (cm < 1) {
    const mm = meters * 1000;
    const formatted = mm >= 10 ? Math.round(mm).toString() : Number(mm.toFixed(1)).toString();
    return `${formatted} mm`;
  }

  // < 100 cm: Format in centimeters (e.g. 16 cm)
  if (cm < 100) {
    const formatted = cm >= 10 ? Math.round(cm).toString() : Number(cm.toFixed(1)).toString();
    return `${formatted} cm`;
  }

  // >= 1 m and < 1000 m: Format in meters (e.g. 1.75 m)
  if (meters < 1000) {
    const formatted =
      meters >= 100
        ? Math.round(meters).toString()
        : Number(meters.toFixed(2)).toString();
    return `${formatted} m`;
  }

  // >= 1000 m: Format in kilometers (e.g. 384,400 km)
  const km = meters / 1000;
  if (km >= 100) {
    return `${Math.round(km).toLocaleString("en-US")} km`;
  }
  return `${Number(km.toFixed(1)).toLocaleString("en-US")} km`;
}

/** Canonical alias used across platform components and legacy hooks */
export const formatMeasurement = formatUnit;
export default formatUnit;
