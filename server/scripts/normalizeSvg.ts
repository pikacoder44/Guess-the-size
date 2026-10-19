import fs from "node:fs/promises";
import path from "node:path";

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface NormalizationResult {
  svg: string;
  viewBox: string;
  bounds: BoundingBox;
}

/**
 * Solves quadratic equation a*t^2 + b*t + c = 0 for t in (0, 1)
 */
function solveQuadraticRoots(a: number, b: number, c: number): number[] {
  const roots: number[] = [];
  if (Math.abs(a) < 1e-9) {
    if (Math.abs(b) > 1e-9) {
      const t = -c / b;
      if (t > 0 && t < 1) roots.push(t);
    }
    return roots;
  }
  const disc = b * b - 4 * a * c;
  if (disc < 0) return roots;
  const sqrtDisc = Math.sqrt(disc);
  const t1 = (-b + sqrtDisc) / (2 * a);
  const t2 = (-b - sqrtDisc) / (2 * a);
  if (t1 > 0 && t1 < 1) roots.push(t1);
  if (t2 > 0 && t2 < 1 && Math.abs(t2 - t1) > 1e-9) roots.push(t2);
  return roots;
}

function evaluateCubic(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function evaluateQuadratic(p0: number, p1: number, p2: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
}

/**
 * Calculates bounding box for an SVG path 'd' attribute
 */
export function calculatePathBoundingBox(d: string): BoundingBox {
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  function includePoint(x: number, y: number) {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  // Tokenize SVG path
  const tokens: string[] = [];
  const tokenRegex = /([a-df-z])|(-?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/gi;
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(d)) !== null) {
    tokens.push(match[0]);
  }

  let i = 0;
  let curX = 0;
  let curY = 0;
  let startX = 0;
  let startY = 0;
  let lastControlX = 0;
  let lastControlY = 0;
  let lastCommand = "";

  while (i < tokens.length) {
    const token = tokens[i]!;
    if (/^[a-df-z]$/i.test(token)) {
      lastCommand = token;
      i++;
    }

    const cmd = lastCommand;
    const isRel = cmd === cmd.toLowerCase();
    const type = cmd.toUpperCase();

    if (type === "M") {
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");
      curX = isRel ? curX + x : x;
      curY = isRel ? curY + y : y;
      startX = curX;
      startY = curY;
      lastControlX = curX;
      lastControlY = curY;
      includePoint(curX, curY);
      // Subsequent coordinate pairs after M/m are treated as L/l
      lastCommand = isRel ? "l" : "L";
    } else if (type === "L") {
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");
      curX = isRel ? curX + x : x;
      curY = isRel ? curY + y : y;
      lastControlX = curX;
      lastControlY = curY;
      includePoint(curX, curY);
    } else if (type === "H") {
      const x = parseFloat(tokens[i++] || "0");
      curX = isRel ? curX + x : x;
      lastControlX = curX;
      includePoint(curX, curY);
    } else if (type === "V") {
      const y = parseFloat(tokens[i++] || "0");
      curY = isRel ? curY + y : y;
      lastControlY = curY;
      includePoint(curX, curY);
    } else if (type === "C") {
      const x1 = parseFloat(tokens[i++] || "0");
      const y1 = parseFloat(tokens[i++] || "0");
      const x2 = parseFloat(tokens[i++] || "0");
      const y2 = parseFloat(tokens[i++] || "0");
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");

      const cp1X = isRel ? curX + x1 : x1;
      const cp1Y = isRel ? curY + y1 : y1;
      const cp2X = isRel ? curX + x2 : x2;
      const cp2Y = isRel ? curY + y2 : y2;
      const endX = isRel ? curX + x : x;
      const endY = isRel ? curY + y : y;

      includePoint(endX, endY);

      // Extrema in X
      const ax = -curX + 3 * cp1X - 3 * cp2X + endX;
      const bx = 2 * (curX - 2 * cp1X + cp2X);
      const cx = cp1X - curX;
      for (const t of solveQuadraticRoots(ax, bx, cx)) {
        includePoint(evaluateCubic(curX, cp1X, cp2X, endX, t), evaluateCubic(curY, cp1Y, cp2Y, endY, t));
      }

      // Extrema in Y
      const ay = -curY + 3 * cp1Y - 3 * cp2Y + endY;
      const by = 2 * (curY - 2 * cp1Y + cp2Y);
      const cy = cp1Y - curY;
      for (const t of solveQuadraticRoots(ay, by, cy)) {
        includePoint(evaluateCubic(curX, cp1X, cp2X, endX, t), evaluateCubic(curY, cp1Y, cp2Y, endY, t));
      }

      lastControlX = cp2X;
      lastControlY = cp2Y;
      curX = endX;
      curY = endY;
    } else if (type === "S") {
      const x2 = parseFloat(tokens[i++] || "0");
      const y2 = parseFloat(tokens[i++] || "0");
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");

      const cp1X = lastCommand.toUpperCase() === "C" || lastCommand.toUpperCase() === "S"
        ? 2 * curX - lastControlX
        : curX;
      const cp1Y = lastCommand.toUpperCase() === "C" || lastCommand.toUpperCase() === "S"
        ? 2 * curY - lastControlY
        : curY;
      const cp2X = isRel ? curX + x2 : x2;
      const cp2Y = isRel ? curY + y2 : y2;
      const endX = isRel ? curX + x : x;
      const endY = isRel ? curY + y : y;

      includePoint(endX, endY);

      const ax = -curX + 3 * cp1X - 3 * cp2X + endX;
      const bx = 2 * (curX - 2 * cp1X + cp2X);
      const cx = cp1X - curX;
      for (const t of solveQuadraticRoots(ax, bx, cx)) {
        includePoint(evaluateCubic(curX, cp1X, cp2X, endX, t), evaluateCubic(curY, cp1Y, cp2Y, endY, t));
      }

      const ay = -curY + 3 * cp1Y - 3 * cp2Y + endY;
      const by = 2 * (curY - 2 * cp1Y + cp2Y);
      const cy = cp1Y - curY;
      for (const t of solveQuadraticRoots(ay, by, cy)) {
        includePoint(evaluateCubic(curX, cp1X, cp2X, endX, t), evaluateCubic(curY, cp1Y, cp2Y, endY, t));
      }

      lastControlX = cp2X;
      lastControlY = cp2Y;
      curX = endX;
      curY = endY;
    } else if (type === "Q") {
      const x1 = parseFloat(tokens[i++] || "0");
      const y1 = parseFloat(tokens[i++] || "0");
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");

      const cpX = isRel ? curX + x1 : x1;
      const cpY = isRel ? curY + y1 : y1;
      const endX = isRel ? curX + x : x;
      const endY = isRel ? curY + y : y;

      includePoint(endX, endY);

      // Quadratic extrema
      const denomX = curX - 2 * cpX + endX;
      if (Math.abs(denomX) > 1e-9) {
        const tx = (curX - cpX) / denomX;
        if (tx > 0 && tx < 1) {
          includePoint(evaluateQuadratic(curX, cpX, endX, tx), evaluateQuadratic(curY, cpY, endY, tx));
        }
      }

      const denomY = curY - 2 * cpY + endY;
      if (Math.abs(denomY) > 1e-9) {
        const ty = (curY - cpY) / denomY;
        if (ty > 0 && ty < 1) {
          includePoint(evaluateQuadratic(curX, cpX, endX, ty), evaluateQuadratic(curY, cpY, endY, ty));
        }
      }

      lastControlX = cpX;
      lastControlY = cpY;
      curX = endX;
      curY = endY;
    } else if (type === "T") {
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");
      const cpX = lastCommand.toUpperCase() === "Q" || lastCommand.toUpperCase() === "T"
        ? 2 * curX - lastControlX
        : curX;
      const cpY = lastCommand.toUpperCase() === "Q" || lastCommand.toUpperCase() === "T"
        ? 2 * curY - lastControlY
        : curY;
      const endX = isRel ? curX + x : x;
      const endY = isRel ? curY + y : y;

      includePoint(endX, endY);
      const denomX = curX - 2 * cpX + endX;
      if (Math.abs(denomX) > 1e-9) {
        const tx = (curX - cpX) / denomX;
        if (tx > 0 && tx < 1) {
          includePoint(evaluateQuadratic(curX, cpX, endX, tx), evaluateQuadratic(curY, cpY, endY, tx));
        }
      }
      const denomY = curY - 2 * cpY + endY;
      if (Math.abs(denomY) > 1e-9) {
        const ty = (curY - cpY) / denomY;
        if (ty > 0 && ty < 1) {
          includePoint(evaluateQuadratic(curX, cpX, endX, ty), evaluateQuadratic(curY, cpY, endY, ty));
        }
      }

      lastControlX = cpX;
      lastControlY = cpY;
      curX = endX;
      curY = endY;
    } else if (type === "A") {
      const rxVal = Math.abs(parseFloat(tokens[i++] || "0"));
      const ryVal = Math.abs(parseFloat(tokens[i++] || "0"));
      const rot = (parseFloat(tokens[i++] || "0") * Math.PI) / 180;
      const largeArc = parseFloat(tokens[i++] || "0") !== 0;
      const sweep = parseFloat(tokens[i++] || "0") !== 0;
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");

      const endX = isRel ? curX + x : x;
      const endY = isRel ? curY + y : y;
      includePoint(endX, endY);

      if (rxVal > 1e-6 && ryVal > 1e-6) {
        // SVG Implementation Notes: Endpoint to Center Parameterization (SVG Spec F.6)
        const dx2 = (curX - endX) / 2.0;
        const dy2 = (curY - endY) / 2.0;
        const cosPhi = Math.cos(rot);
        const sinPhi = Math.sin(rot);

        const x1p = cosPhi * dx2 + sinPhi * dy2;
        const y1p = -sinPhi * dx2 + cosPhi * dy2;

        let rx = rxVal;
        let ry = ryVal;
        const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
        if (lambda > 1) {
          const sqrtLambda = Math.sqrt(lambda);
          rx *= sqrtLambda;
          ry *= sqrtLambda;
        }

        const sign = largeArc === sweep ? -1 : 1;
        const num = Math.max(0, rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p);
        const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
        const coef = den > 1e-9 ? sign * Math.sqrt(num / den) : 0;
        const cxp = coef * ((rx * y1p) / ry);
        const cyp = coef * (-(ry * x1p) / rx);

        const cx = cosPhi * cxp - sinPhi * cyp + (curX + endX) / 2.0;
        const cy = sinPhi * cxp + cosPhi * cyp + (curY + endY) / 2.0;

        function angle(ux: number, uy: number, vx: number, vy: number): number {
          const dot = ux * vx + uy * vy;
          const len = Math.sqrt(ux * ux + uy * uy) * Math.sqrt(vx * vx + vy * vy);
          let ang = Math.acos(Math.max(-1, Math.min(1, dot / (len || 1))));
          if (ux * vy - uy * vx < 0) ang = -ang;
          return ang;
        }

        const theta1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
        let deltaTheta = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
        if (!sweep && deltaTheta > 0) deltaTheta -= 2 * Math.PI;
        if (sweep && deltaTheta < 0) deltaTheta += 2 * Math.PI;

        const numSteps = 32;
        for (let step = 1; step <= numSteps; step++) {
          const ang = theta1 + (deltaTheta * step) / numSteps;
          const px = cosPhi * rx * Math.cos(ang) - sinPhi * ry * Math.sin(ang) + cx;
          const py = sinPhi * rx * Math.cos(ang) + cosPhi * ry * Math.sin(ang) + cy;
          includePoint(px, py);
        }
      }

      lastControlX = endX;
      lastControlY = endY;
      curX = endX;
      curY = endY;
    } else if (type === "Z") {
      curX = startX;
      curY = startY;
      lastControlX = curX;
      lastControlY = curY;
    } else {
      i++;
    }
  }

  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Translates an SVG path 'd' attribute by dx and dy
 */
export function translatePathD(d: string, dx: number, dy: number): string {
  const tokenRegex = /([a-df-z])|(-?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?)/gi;
  const tokens: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(d)) !== null) {
    tokens.push(match[0]);
  }

  let i = 0;
  let lastCommand = "";
  const output: string[] = [];

  function formatNum(n: number): string {
    const rounded = Math.round(n * 1000) / 1000;
    return rounded.toString();
  }

  while (i < tokens.length) {
    const token = tokens[i]!;
    if (/^[a-df-z]$/i.test(token)) {
      lastCommand = token;
      output.push(token);
      i++;
    }

    const cmd = lastCommand;
    const isRel = cmd === cmd.toLowerCase();
    const type = cmd.toUpperCase();

    if (type === "M") {
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");
      output.push(isRel ? formatNum(x) : formatNum(x + dx));
      output.push(isRel ? formatNum(y) : formatNum(y + dy));
      lastCommand = isRel ? "l" : "L";
    } else if (type === "L") {
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");
      output.push(isRel ? formatNum(x) : formatNum(x + dx));
      output.push(isRel ? formatNum(y) : formatNum(y + dy));
    } else if (type === "H") {
      const x = parseFloat(tokens[i++] || "0");
      output.push(isRel ? formatNum(x) : formatNum(x + dx));
    } else if (type === "V") {
      const y = parseFloat(tokens[i++] || "0");
      output.push(isRel ? formatNum(y) : formatNum(y + dy));
    } else if (type === "C") {
      const x1 = parseFloat(tokens[i++] || "0");
      const y1 = parseFloat(tokens[i++] || "0");
      const x2 = parseFloat(tokens[i++] || "0");
      const y2 = parseFloat(tokens[i++] || "0");
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");

      output.push(isRel ? formatNum(x1) : formatNum(x1 + dx));
      output.push(isRel ? formatNum(y1) : formatNum(y1 + dy));
      output.push(isRel ? formatNum(x2) : formatNum(x2 + dx));
      output.push(isRel ? formatNum(y2) : formatNum(y2 + dy));
      output.push(isRel ? formatNum(x) : formatNum(x + dx));
      output.push(isRel ? formatNum(y) : formatNum(y + dy));
    } else if (type === "S") {
      const x2 = parseFloat(tokens[i++] || "0");
      const y2 = parseFloat(tokens[i++] || "0");
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");

      output.push(isRel ? formatNum(x2) : formatNum(x2 + dx));
      output.push(isRel ? formatNum(y2) : formatNum(y2 + dy));
      output.push(isRel ? formatNum(x) : formatNum(x + dx));
      output.push(isRel ? formatNum(y) : formatNum(y + dy));
    } else if (type === "Q") {
      const x1 = parseFloat(tokens[i++] || "0");
      const y1 = parseFloat(tokens[i++] || "0");
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");

      output.push(isRel ? formatNum(x1) : formatNum(x1 + dx));
      output.push(isRel ? formatNum(y1) : formatNum(y1 + dy));
      output.push(isRel ? formatNum(x) : formatNum(x + dx));
      output.push(isRel ? formatNum(y) : formatNum(y + dy));
    } else if (type === "T") {
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");
      output.push(isRel ? formatNum(x) : formatNum(x + dx));
      output.push(isRel ? formatNum(y) : formatNum(y + dy));
    } else if (type === "A") {
      const rx = parseFloat(tokens[i++] || "0");
      const ry = parseFloat(tokens[i++] || "0");
      const rot = parseFloat(tokens[i++] || "0");
      const large = parseFloat(tokens[i++] || "0");
      const sweep = parseFloat(tokens[i++] || "0");
      const x = parseFloat(tokens[i++] || "0");
      const y = parseFloat(tokens[i++] || "0");

      output.push(formatNum(rx));
      output.push(formatNum(ry));
      output.push(formatNum(rot));
      output.push(formatNum(large));
      output.push(formatNum(sweep));
      output.push(isRel ? formatNum(x) : formatNum(x + dx));
      output.push(isRel ? formatNum(y) : formatNum(y + dy));
    } else if (type === "Z") {
      // no coords
    } else {
      output.push(tokens[i++] || "");
    }
  }

  return output.join(" ");
}

/**
 * Strips background fills, unnecessary group transformations,
 * and normalizes viewBox to strictly "0 0 W H" with zero padding.
 */
export function normalizeSvg(rawSvg: string): NormalizationResult {
  let cleaned = rawSvg;

  // 1. Remove comments and doctype
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");
  cleaned = cleaned.replace(/<\?xml[\s\S]*?\?>/i, "");
  cleaned = cleaned.replace(/<!DOCTYPE[\s\S]*?>/i, "");

  // 2. Strip background rects (e.g., width="100%", fill="#fff", fill="white", id="background")
  cleaned = cleaned.replace(
    /<rect\b[^>]*(?:width\s*=\s*["']100%["']|fill\s*=\s*["'](?:#fff(?:fff)?|white|none)["']|id\s*=\s*["'][^"']*(?:bg|background)[^"']*["'])[^>]*\/?>/gi,
    ""
  );

  // 3. Strip empty groups <g></g> or <g/>
  cleaned = cleaned.replace(/<g\b[^>]*>\s*<\/g>/gi, "");
  cleaned = cleaned.replace(/<g\b[^>]*\/>/gi, "");

  // 4. Extract all shapes: paths, circles, ellipses, polygons
  const pathMatches = Array.from(cleaned.matchAll(/<path\b[^>]*?\bd\s*=\s*["']([^"']+)["'][^>]*\/?>/gi));
  const circleMatches = Array.from(cleaned.matchAll(/<circle\b[^>]*?\/?>/gi));
  const ellipseMatches = Array.from(cleaned.matchAll(/<ellipse\b[^>]*?\/?>/gi));
  const polygonMatches = Array.from(cleaned.matchAll(/<polygon\b[^>]*?\bpoints\s*=\s*["']([^"']+)["'][^>]*\/?>/gi));

  if (pathMatches.length === 0 && circleMatches.length === 0 && ellipseMatches.length === 0 && polygonMatches.length === 0) {
    // If no vector geometry is found, check if there is an existing viewBox
    const vbMatch = cleaned.match(/viewBox\s*=\s*["']([0-9.\s-]+)["']/i);
    if (vbMatch) {
      const parts = vbMatch[1]!.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2]! > 0 && parts[3]! > 0) {
        const bounds: BoundingBox = {
          minX: 0,
          minY: 0,
          maxX: parts[2]!,
          maxY: parts[3]!,
          width: parts[2]!,
          height: parts[3]!,
        };
        return {
          svg: cleaned,
          viewBox: `0 0 ${parts[2]} ${parts[3]}`,
          bounds,
        };
      }
    }
    const defaultBounds = { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
    return {
      svg: cleaned,
      viewBox: "0 0 100 100",
      bounds: defaultBounds,
    };
  }

  // Calculate overall bounding box across all shapes
  let globalMinX = Number.POSITIVE_INFINITY;
  let globalMinY = Number.POSITIVE_INFINITY;
  let globalMaxX = Number.NEGATIVE_INFINITY;
  let globalMaxY = Number.NEGATIVE_INFINITY;

  for (const pMatch of pathMatches) {
    const d = pMatch[1]!;
    const bbox = calculatePathBoundingBox(d);
    if (bbox.minX < globalMinX) globalMinX = bbox.minX;
    if (bbox.minY < globalMinY) globalMinY = bbox.minY;
    if (bbox.maxX > globalMaxX) globalMaxX = bbox.maxX;
    if (bbox.maxY > globalMaxY) globalMaxY = bbox.maxY;
  }

  for (const cMatch of circleMatches) {
    const tag = cMatch[0];
    const cxMatch = tag.match(/\bcx\s*=\s*["']([0-9.-]+)["']/i);
    const cyMatch = tag.match(/\bcy\s*=\s*["']([0-9.-]+)["']/i);
    const rMatch = tag.match(/\br\s*=\s*["']([0-9.-]+)["']/i);
    if (cxMatch && cyMatch && rMatch) {
      const cx = parseFloat(cxMatch[1]!);
      const cy = parseFloat(cyMatch[1]!);
      const r = parseFloat(rMatch[1]!);
      globalMinX = Math.min(globalMinX, cx - r);
      globalMinY = Math.min(globalMinY, cy - r);
      globalMaxX = Math.max(globalMaxX, cx + r);
      globalMaxY = Math.max(globalMaxY, cy + r);
    }
  }

  for (const eMatch of ellipseMatches) {
    const tag = eMatch[0];
    const cxMatch = tag.match(/\bcx\s*=\s*["']([0-9.-]+)["']/i);
    const cyMatch = tag.match(/\bcy\s*=\s*["']([0-9.-]+)["']/i);
    const rxMatch = tag.match(/\brx\s*=\s*["']([0-9.-]+)["']/i);
    const ryMatch = tag.match(/\bry\s*=\s*["']([0-9.-]+)["']/i);
    if (cxMatch && cyMatch && rxMatch && ryMatch) {
      const cx = parseFloat(cxMatch[1]!);
      const cy = parseFloat(cyMatch[1]!);
      const rx = parseFloat(rxMatch[1]!);
      const ry = parseFloat(ryMatch[1]!);
      globalMinX = Math.min(globalMinX, cx - rx);
      globalMinY = Math.min(globalMinY, cy - ry);
      globalMaxX = Math.max(globalMaxX, cx + rx);
      globalMaxY = Math.max(globalMaxY, cy + ry);
    }
  }

  for (const polyMatch of polygonMatches) {
    const pointsStr = polyMatch[1]!;
    const numbers = pointsStr.trim().split(/[\s,]+/).map(Number);
    for (let p = 0; p < numbers.length; p += 2) {
      const px = numbers[p]!;
      const py = numbers[p + 1]!;
      if (Number.isFinite(px) && Number.isFinite(py)) {
        globalMinX = Math.min(globalMinX, px);
        globalMinY = Math.min(globalMinY, py);
        globalMaxX = Math.max(globalMaxX, px);
        globalMaxY = Math.max(globalMaxY, py);
      }
    }
  }

  const width = Math.max(0.1, globalMaxX - globalMinX);
  const height = Math.max(0.1, globalMaxY - globalMinY);

  const dx = -globalMinX;
  const dy = -globalMinY;

  // Translate all paths and shapes so bounding box touches (0, 0) strictly
  let normalizedBody = cleaned;

  // Strip outer <svg ...> and </svg> to rewrap cleanly
  normalizedBody = normalizedBody.replace(/<svg\b[^>]*>/i, "");
  normalizedBody = normalizedBody.replace(/<\/svg>/i, "");

  // Update each path d attribute
  for (const pMatch of pathMatches) {
    const fullTag = pMatch[0];
    const originalD = pMatch[1]!;
    const translatedD = translatePathD(originalD, dx, dy);
    const updatedTag = fullTag.replace(originalD, translatedD);
    normalizedBody = normalizedBody.replace(fullTag, updatedTag);
  }

  // Update circles
  for (const cMatch of circleMatches) {
    const tag = cMatch[0];
    const cxMatch = tag.match(/\bcx\s*=\s*["']([0-9.-]+)["']/i);
    const cyMatch = tag.match(/\bcy\s*=\s*["']([0-9.-]+)["']/i);
    if (cxMatch && cyMatch) {
      const cx = parseFloat(cxMatch[1]!);
      const cy = parseFloat(cyMatch[1]!);
      const newCx = Math.round((cx + dx) * 1000) / 1000;
      const newCy = Math.round((cy + dy) * 1000) / 1000;
      let updatedTag = tag.replace(cxMatch[0], `cx="${newCx}"`);
      updatedTag = updatedTag.replace(cyMatch[0], `cy="${newCy}"`);
      normalizedBody = normalizedBody.replace(tag, updatedTag);
    }
  }

  // Update ellipses
  for (const eMatch of ellipseMatches) {
    const tag = eMatch[0];
    const cxMatch = tag.match(/\bcx\s*=\s*["']([0-9.-]+)["']/i);
    const cyMatch = tag.match(/\bcy\s*=\s*["']([0-9.-]+)["']/i);
    if (cxMatch && cyMatch) {
      const cx = parseFloat(cxMatch[1]!);
      const cy = parseFloat(cyMatch[1]!);
      const newCx = Math.round((cx + dx) * 1000) / 1000;
      const newCy = Math.round((cy + dy) * 1000) / 1000;
      let updatedTag = tag.replace(cxMatch[0], `cx="${newCx}"`);
      updatedTag = updatedTag.replace(cyMatch[0], `cy="${newCy}"`);
      normalizedBody = normalizedBody.replace(tag, updatedTag);
    }
  }

  // Update polygons
  for (const polyMatch of polygonMatches) {
    const tag = polyMatch[0];
    const pointsStr = polyMatch[1]!;
    const numbers = pointsStr.trim().split(/[\s,]+/).map(Number);
    const newPoints: string[] = [];
    for (let p = 0; p < numbers.length; p += 2) {
      const px = numbers[p]!;
      const py = numbers[p + 1]!;
      const npx = Math.round((px + dx) * 1000) / 1000;
      const npy = Math.round((py + dy) * 1000) / 1000;
      newPoints.push(`${npx},${npy}`);
    }
    const updatedTag = tag.replace(pointsStr, newPoints.join(" "));
    normalizedBody = normalizedBody.replace(tag, updatedTag);
  }

  const roundedW = Math.round(width * 100) / 100;
  const roundedH = Math.round(height * 100) / 100;
  const viewBoxStr = `0 0 ${roundedW} ${roundedH}`;

  const finalSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxStr}" fill="currentColor">\n${normalizedBody.trim()}\n</svg>\n`;

  return {
    svg: finalSvg,
    viewBox: viewBoxStr,
    bounds: {
      minX: 0,
      minY: 0,
      maxX: roundedW,
      maxY: roundedH,
      width: roundedW,
      height: roundedH,
    },
  };
}

/**
 * Normalizes an SVG file and writes it to outputPath
 */
export async function normalizeSvgFile(inputPath: string, outputPath?: string): Promise<NormalizationResult> {
  const content = await fs.readFile(inputPath, "utf-8");
  const result = normalizeSvg(content);
  const target = outputPath || inputPath;
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, result.svg, "utf-8");
  return result;
}
