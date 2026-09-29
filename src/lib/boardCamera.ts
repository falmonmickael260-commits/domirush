import type { PlacedTile } from "@/game-engine";

/**
 * Pure geometry for the board's "dynamic camera": lays every placed domino out
 * in a fixed-size world-space coordinate system, computes the real bounding
 * box of the whole chain, and derives the zoom level needed to fit that box
 * in a given viewport. No DOM, no React — fully unit-testable.
 */

export interface LaidOutTile {
  id: string;
  left: number;
  right: number;
  /** Center position in world-space (unscaled) pixels. */
  cx: number;
  cy: number;
  width: number;
  height: number;
  rotationDeg: 0 | -90;
  isDouble: boolean;
}

export interface ChainBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

export interface ChainLayout {
  tiles: LaidOutTile[];
  bounds: ChainBounds;
}

const GAP_RATIO = 0.12;

/**
 * Lays the chain out left to right in world space. Non-doubles run along the
 * chain axis (rotated -90°, footprint 2x1 tile-widths); doubles sit crosswise
 * like a real spinner (footprint 1x2), exactly like the physical game.
 *
 * The layout is re-centered around the chain's own midpoint on every call, so
 * `bounds.centerX` is always ~0 regardless of whether the chain grew on the
 * left or the right end. This is what makes the camera's pan target stable:
 * it never needs to "chase" one edge, because the coordinate system itself
 * is defined relative to the chain's true center. A tile already on the
 * board only ever shifts by half of the newly-added tile's footprint — a
 * small, symmetric nudge — never a jump back toward the opposite edge.
 */
export function computeChainLayout(board: PlacedTile[], worldTileSize: number): ChainLayout {
  const gap = worldTileSize * GAP_RATIO;
  let cursor = 0;
  const raw = board.map((placed) => {
    const isDouble = placed.tile.a === placed.tile.b;
    const width = isDouble ? worldTileSize : worldTileSize * 2;
    const height = isDouble ? worldTileSize * 2 : worldTileSize;
    const rawCx = cursor + width / 2;
    cursor += width + gap;
    return {
      id: placed.tile.id,
      left: placed.left,
      right: placed.right,
      rawCx,
      cy: 0,
      width,
      height,
      rotationDeg: (isDouble ? 0 : -90) as 0 | -90,
      isDouble,
    };
  });

  const totalWidth = raw.length > 0 ? cursor - gap : 0;
  const offset = totalWidth / 2;
  const tiles: LaidOutTile[] = raw.map(({ rawCx, ...rest }) => ({ ...rest, cx: rawCx - offset }));

  return { tiles, bounds: computeBoundsFromTiles(tiles, worldTileSize) };
}

export function computeBoundsFromTiles(tiles: LaidOutTile[], worldTileSize: number): ChainBounds {
  if (tiles.length === 0) {
    const half = worldTileSize;
    return {
      minX: -half,
      maxX: half,
      minY: -half,
      maxY: half,
      width: half * 2,
      height: half * 2,
      centerX: 0,
      centerY: 0,
    };
  }

  const minX = tiles[0].cx - tiles[0].width / 2;
  const last = tiles[tiles.length - 1];
  const maxX = last.cx + last.width / 2;
  const maxHalfHeight = Math.max(...tiles.map((t) => t.height / 2));
  const minY = -maxHalfHeight;
  const maxY = maxHalfHeight;

  return {
    minX,
    maxX,
    minY,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

export interface Viewport {
  width: number;
  height: number;
}

export const CAMERA_MIN_ZOOM = 0.36;
export const CAMERA_MAX_ZOOM = 1;
/** Fraction of the viewport actually usable for the chain (the rest is safety margin). */
const USABLE_RATIO = 0.78;

/**
 * Picks the "world" (unzoomed) tile size from the real, measured viewport
 * width. This isn't about the camera zoom (that still does the heavy
 * lifting) — it's about giving a narrow phone screen a smaller natural unit
 * to work with, so the same minimum zoom can fit a longer chain before
 * hitting the readability floor. Desktop simply gets the larger natural size.
 */
export function pickWorldTileSize(viewportWidth: number): number {
  if (!viewportWidth) return 42;
  return Math.max(24, Math.min(44, viewportWidth * 0.1));
}

/**
 * Computes the zoom level needed to fit the chain's bounding box inside the
 * viewport, with a safety margin, clamped to a sensible readability range.
 * Works identically regardless of device — it only ever looks at real pixel
 * dimensions, so mobile portrait, tablet and desktop each get the framing
 * their actual available space allows.
 */
export function calculateOptimalZoom(
  bounds: ChainBounds,
  viewport: Viewport,
  options?: { minZoom?: number; maxZoom?: number; usableRatio?: number }
): number {
  const minZoom = options?.minZoom ?? CAMERA_MIN_ZOOM;
  const maxZoom = options?.maxZoom ?? CAMERA_MAX_ZOOM;
  const usableRatio = options?.usableRatio ?? USABLE_RATIO;

  if (!viewport.width || !viewport.height) return maxZoom;

  const usableWidth = viewport.width * usableRatio;
  const usableHeight = viewport.height * usableRatio;

  const zoomX = bounds.width > 0 ? usableWidth / bounds.width : maxZoom;
  const zoomY = bounds.height > 0 ? usableHeight / bounds.height : maxZoom;

  const zoom = Math.min(zoomX, zoomY, maxZoom);
  return Math.max(minZoom, zoom);
}
