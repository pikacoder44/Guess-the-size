import { useState, useCallback, useMemo } from "react";

export interface BoundingBox {
  x: number;
  y: number; // distance from ground baseline
  width: number;
  height: number;
}

export interface UseCameraOptions {
  canvasWidth: number;
  canvasHeight: number;
  groundY: number;
  referenceBounds: BoundingBox;
  targetBounds: BoundingBox;
  extraResultBounds?: BoundingBox; // e.g. for overlaid result
}

export function useCamera({
  canvasWidth,
  canvasHeight,
  groundY,
  referenceBounds,
  targetBounds,
  extraResultBounds,
}: UseCameraOptions) {
  const [zoom, setZoom] = useState<number>(1.0);

  // Compute enclosing bounding box of all objects in the scene
  const sceneBounds = useMemo(() => {
    const boxes = [referenceBounds, targetBounds];
    if (extraResultBounds) {
      boxes.push(extraResultBounds);
    }

    const minX = Math.min(...boxes.map((b) => b.x));
    const maxX = Math.max(...boxes.map((b) => b.x + b.width));
    const maxY = Math.max(...boxes.map((b) => b.y + b.height));

    const contentWidth = Math.max(20, maxX - minX);
    const contentHeight = Math.max(20, maxY);
    const centerX = (minX + maxX) / 2;

    return {
      minX,
      maxX,
      maxY,
      contentWidth,
      contentHeight,
      centerX,
    };
  }, [referenceBounds, targetBounds, extraResultBounds]);

  // Available visible viewport dimensions (with safe margins)
  const availableWidth = Math.max(100, canvasWidth - 60);
  const availableHeight = Math.max(100, canvasHeight - groundY - 50);

  // Intelligent Zoom Limits:
  // Max Zoom In: Both objects must still be completely visible inside canvas
  const maxZoom = useMemo(() => {
    const byWidth = availableWidth / sceneBounds.contentWidth;
    const byHeight = availableHeight / sceneBounds.contentHeight;
    // Cap at 2.2x to prevent extreme pixelation, but never let objects leave canvas
    return Math.max(1.0, Math.min(2.2, Math.min(byWidth, byHeight)));
  }, [availableWidth, availableHeight, sceneBounds.contentWidth, sceneBounds.contentHeight]);

  // Min Zoom Out: Never shrink into an unusable tiny point or allow disappearing
  const minZoom = useMemo(() => {
    const idealFit = Math.min(
      availableWidth / sceneBounds.contentWidth,
      availableHeight / sceneBounds.contentHeight
    );
    return Math.max(0.4, Math.min(0.9, idealFit * 0.7));
  }, [availableWidth, availableHeight, sceneBounds.contentWidth, sceneBounds.contentHeight]);

  // Current effective clamped zoom
  const currentZoom = Math.min(maxZoom, Math.max(minZoom, zoom));

  const canZoomIn = currentZoom < maxZoom - 0.02;
  const canZoomOut = currentZoom > minZoom + 0.02;

  const zoomIn = useCallback(() => {
    setZoom((prev) => Math.min(maxZoom, prev * 1.18));
  }, [maxZoom]);

  const zoomOut = useCallback(() => {
    setZoom((prev) => Math.max(minZoom, prev / 1.18));
  }, [minZoom]);

  const resetZoom = useCallback(() => {
    setZoom(1.0);
  }, []);

  // "Fit Both" Camera action:
  // Automatically scales and positions scene so BOTH objects are completely visible and centered
  const fitBoth = useCallback(() => {
    const fitW = (canvasWidth - 80) / sceneBounds.contentWidth;
    const fitH = (canvasHeight - groundY - 60) / sceneBounds.contentHeight;
    const bestZoom = Math.max(minZoom, Math.min(maxZoom, Math.min(fitW, fitH, 1.25)));
    setZoom(bestZoom);
  }, [canvasWidth, canvasHeight, groundY, sceneBounds.contentWidth, sceneBounds.contentHeight, minZoom, maxZoom]);

  return {
    zoom: currentZoom,
    maxZoom,
    minZoom,
    canZoomIn,
    canZoomOut,
    zoomIn,
    zoomOut,
    resetZoom,
    fitBoth,
    cameraTransform: {
      transformOrigin: `${sceneBounds.centerX}px calc(100% - ${groundY}px)`,
      transform: `scale(${currentZoom})`,
      transition: "transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
    },
  };
}
