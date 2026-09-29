"use client";

import { useSpring, useTransform } from "framer-motion";
import { calculateOptimalZoom, type ChainBounds, type Viewport } from "@/lib/boardCamera";

/** Soft, physical-feeling motion — no overshoot bounce, no jitter on rapid target changes. */
const CAMERA_SPRING = { stiffness: 110, damping: 26, mass: 1 };

/**
 * Drives the board's "dynamic camera": given the chain's current bounding box
 * and the real measured viewport, it computes the zoom needed to fit the
 * whole chain with a safety margin, and smoothly springs the pan/zoom toward
 * that target whenever the chain (or the viewport size) changes.
 *
 * The camera always targets the chain's true geometric center — never the
 * last tile played — so playing on the left never yanks the view back right.
 */
export function useBoardCamera(bounds: ChainBounds, viewport: Viewport) {
  const targetZoom = calculateOptimalZoom(bounds, viewport);

  const zoom = useSpring(targetZoom, CAMERA_SPRING);
  const centerX = useSpring(bounds.centerX, CAMERA_SPRING);
  const centerY = useSpring(bounds.centerY, CAMERA_SPRING);

  const x = useTransform(() => -centerX.get() * zoom.get());
  const y = useTransform(() => -centerY.get() * zoom.get());

  return { x, y, scale: zoom, zoomValue: zoom };
}
