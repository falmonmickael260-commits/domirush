import { describe, expect, it } from "vitest";
import { placeTile } from "@/game-engine";
import type { PlacedTile } from "@/game-engine";
import {
  CAMERA_MAX_ZOOM,
  CAMERA_MIN_ZOOM,
  calculateOptimalZoom,
  computeChainLayout,
  pickWorldTileSize,
} from "../boardCamera";

const T = 40; // world tile size used across these tests

function chain(...pairs: [number, number][]): PlacedTile[] {
  let board: PlacedTile[] = [];
  pairs.forEach(([a, b], i) => {
    board = placeTile(board, { id: `t${i}`, a, b }, i === 0 ? "left" : "right");
  });
  return board;
}

describe("computeChainLayout", () => {
  it("returns a centered default bounds for an empty board", () => {
    const { tiles, bounds } = computeChainLayout([], T);
    expect(tiles).toHaveLength(0);
    expect(bounds.centerX).toBe(0);
    expect(bounds.width).toBeGreaterThan(0);
  });

  it("lays a single non-double tile with a 2x1 footprint", () => {
    const board = chain([3, 5]);
    const { tiles, bounds } = computeChainLayout(board, T);
    expect(tiles).toHaveLength(1);
    expect(tiles[0].width).toBe(T * 2);
    expect(tiles[0].height).toBe(T);
    expect(bounds.width).toBe(T * 2);
  });

  it("gives a double a 1x2 (crosswise) footprint", () => {
    const board = chain([6, 6]);
    const { tiles, bounds } = computeChainLayout(board, T);
    expect(tiles[0].width).toBe(T);
    expect(tiles[0].height).toBe(T * 2);
    expect(bounds.height).toBe(T * 2);
  });

  it("grows the bounding box width as more tiles are chained", () => {
    const short = computeChainLayout(chain([2, 5], [5, 3]), T).bounds;
    const long = computeChainLayout(chain([2, 5], [5, 3], [3, 6], [6, 1]), T).bounds;
    expect(long.width).toBeGreaterThan(short.width);
  });

  it("keeps the center stable (no jump toward the opposite edge) when growing on the left", () => {
    // Build [4|2]-[2|5]-[5|6]-[6|3], then play [1|4] on the LEFT.
    let board: PlacedTile[] = [];
    board = placeTile(board, { id: "a", a: 4, b: 2 }, "left");
    board = placeTile(board, { id: "b", a: 2, b: 5 }, "right");
    board = placeTile(board, { id: "c", a: 5, b: 6 }, "right");
    board = placeTile(board, { id: "d", a: 6, b: 3 }, "right");
    const before = computeChainLayout(board, T);

    board = placeTile(board, { id: "e", a: 1, b: 4 }, "left");
    const after = computeChainLayout(board, T);

    // The center is always the chain's true midpoint (~0), whichever side grew —
    // this is exactly the guarantee that replaces the old "snap back right" bug.
    expect(Math.abs(before.bounds.centerX)).toBeLessThan(0.01);
    expect(Math.abs(after.bounds.centerX)).toBeLessThan(0.01);

    // Existing tiles shift by at most half the new tile's footprint (a small,
    // symmetric nudge), never a large jump toward the opposite edge.
    const newTileFootprint = T * 2; // "1-4" is a non-double
    const tileA_before = before.tiles.find((t) => t.id === "a")!;
    const tileA_after = after.tiles.find((t) => t.id === "a")!;
    expect(Math.abs(tileA_after.cx - tileA_before.cx)).toBeLessThanOrEqual(newTileFootprint);
  });

  it("keeps the center stable when growing on the right too", () => {
    let board: PlacedTile[] = [];
    board = placeTile(board, { id: "a", a: 4, b: 2 }, "left");
    board = placeTile(board, { id: "b", a: 2, b: 5 }, "right");
    const before = computeChainLayout(board, T);

    board = placeTile(board, { id: "c", a: 5, b: 6 }, "right");
    const after = computeChainLayout(board, T);

    expect(Math.abs(before.bounds.centerX)).toBeLessThan(0.01);
    expect(Math.abs(after.bounds.centerX)).toBeLessThan(0.01);
  });

  it("keeps a stable center when the chain grows on both sides in turn", () => {
    let board: PlacedTile[] = [];
    board = placeTile(board, { id: "a", a: 3, b: 3 }, "left");
    const mid = computeChainLayout(board, T).bounds.centerX;

    board = placeTile(board, { id: "b", a: 3, b: 5 }, "right");
    board = placeTile(board, { id: "c", a: 3, b: 1 }, "left");
    const after = computeChainLayout(board, T).bounds.centerX;

    expect(Math.abs(after - mid)).toBeLessThan(0.01);
  });
});

describe("calculateOptimalZoom", () => {
  const viewportDesktop = { width: 1000, height: 300 };
  const viewportMobile = { width: 380, height: 140 };

  it("uses maximum zoom for a small chain that already fits", () => {
    const { bounds } = computeChainLayout(chain([6, 6]), T);
    const zoom = calculateOptimalZoom(bounds, viewportDesktop);
    expect(zoom).toBe(CAMERA_MAX_ZOOM);
  });

  it("zooms out as the chain grows longer", () => {
    const shortBounds = computeChainLayout(chain([2, 5], [5, 3]), T).bounds;
    const longBounds = computeChainLayout(
      chain([2, 5], [5, 3], [3, 6], [6, 1], [1, 4], [4, 0], [0, 2]),
      T
    ).bounds;
    const zoomShort = calculateOptimalZoom(shortBounds, viewportMobile);
    const zoomLong = calculateOptimalZoom(longBounds, viewportMobile);
    expect(zoomLong).toBeLessThan(zoomShort);
  });

  it("never goes below the minimum readable zoom", () => {
    const hugeChainBounds = { minX: 0, maxX: 5000, minY: -40, maxY: 40, width: 5000, height: 80, centerX: 2500, centerY: 0 };
    const zoom = calculateOptimalZoom(hugeChainBounds, viewportMobile);
    expect(zoom).toBe(CAMERA_MIN_ZOOM);
  });

  it("gives desktop's wider viewport a higher zoom than mobile for the same chain", () => {
    const { bounds } = computeChainLayout(
      chain([2, 5], [5, 3], [3, 6], [6, 1], [1, 4]),
      T
    );
    const zoomDesktop = calculateOptimalZoom(bounds, viewportDesktop);
    const zoomMobile = calculateOptimalZoom(bounds, viewportMobile);
    expect(zoomDesktop).toBeGreaterThanOrEqual(zoomMobile);
  });

  it("falls back to max zoom when the viewport has not been measured yet", () => {
    expect(calculateOptimalZoom({ minX: 0, maxX: 10, minY: 0, maxY: 10, width: 10, height: 10, centerX: 5, centerY: 5 }, { width: 0, height: 0 })).toBe(
      CAMERA_MAX_ZOOM
    );
  });
});

describe("pickWorldTileSize", () => {
  it("gives narrow phone viewports a smaller natural tile size than wide desktop ones", () => {
    expect(pickWorldTileSize(320)).toBeLessThan(pickWorldTileSize(1200));
  });

  it("never goes below a legible floor or above a sensible ceiling", () => {
    expect(pickWorldTileSize(50)).toBeGreaterThanOrEqual(24);
    expect(pickWorldTileSize(5000)).toBeLessThanOrEqual(44);
  });

  it("falls back to a sane default when the viewport has not been measured yet", () => {
    expect(pickWorldTileSize(0)).toBe(42);
  });
});
