import { describe, expect, it } from "vitest";
import {
  computePlayableMoves,
  getBoardEnds,
  hasAnyPlayableMove,
  orientTileForPlacement,
  placeTile,
} from "../board";
import type { PlacedTile } from "../types";

describe("orientTileForPlacement", () => {
  it("orients the first tile arbitrarily as a-b", () => {
    const placed = orientTileForPlacement({ id: "3-5", a: 3, b: 5 }, "left", []);
    expect(placed).toEqual({ tile: { id: "3-5", a: 3, b: 5 }, left: 3, right: 5 });
  });

  it("orients a tile placed on the left so its matching pip touches the left end", () => {
    const board: PlacedTile[] = [{ tile: { id: "3-5", a: 3, b: 5 }, left: 3, right: 5 }];
    const placed = orientTileForPlacement({ id: "1-3", a: 1, b: 3 }, "left", board);
    expect(placed).toEqual({ tile: { id: "1-3", a: 1, b: 3 }, left: 1, right: 3 });
  });

  it("orients a tile placed on the right so its matching pip touches the right end", () => {
    const board: PlacedTile[] = [{ tile: { id: "3-5", a: 3, b: 5 }, left: 3, right: 5 }];
    const placed = orientTileForPlacement({ id: "5-6", a: 5, b: 6 }, "right", board);
    expect(placed).toEqual({ tile: { id: "5-6", a: 5, b: 6 }, left: 5, right: 6 });
  });

  it("throws when the tile does not match the requested end", () => {
    const board: PlacedTile[] = [{ tile: { id: "3-5", a: 3, b: 5 }, left: 3, right: 5 }];
    expect(() => orientTileForPlacement({ id: "1-2", a: 1, b: 2 }, "left", board)).toThrow();
  });

  it("correctly orients a double placed against itself", () => {
    const board: PlacedTile[] = [{ tile: { id: "6-6", a: 6, b: 6 }, left: 6, right: 6 }];
    const placed = orientTileForPlacement({ id: "3-6", a: 3, b: 6 }, "right", board);
    expect(placed).toEqual({ tile: { id: "3-6", a: 3, b: 6 }, left: 6, right: 3 });
  });
});

describe("placeTile + getBoardEnds", () => {
  it("builds a chain and tracks both ends correctly", () => {
    let board = placeTile([], { id: "6-6", a: 6, b: 6 }, "left");
    board = placeTile(board, { id: "6-3", a: 6, b: 3 }, "right");
    board = placeTile(board, { id: "3-1", a: 3, b: 1 }, "right");
    expect(getBoardEnds(board)).toEqual({ left: 6, right: 1 });
    expect(board.map((p) => p.tile.id)).toEqual(["6-6", "6-3", "3-1"]);
  });

  it("prepends when playing to the left", () => {
    let board = placeTile([], { id: "6-6", a: 6, b: 6 }, "left");
    board = placeTile(board, { id: "2-6", a: 2, b: 6 }, "left");
    expect(getBoardEnds(board)).toEqual({ left: 2, right: 6 });
    expect(board[0].tile.id).toBe("2-6");
  });
});

describe("computePlayableMoves / hasAnyPlayableMove", () => {
  it("reports both sides open on an empty board", () => {
    const hand = [{ id: "2-4", a: 2, b: 4 }];
    expect(computePlayableMoves(hand, [])).toEqual({ "2-4": ["left", "right"] });
  });

  it("only reports sides that actually match", () => {
    const board = placeTile([], { id: "6-6", a: 6, b: 6 }, "left");
    const hand = [
      { id: "6-2", a: 6, b: 2 }, // matches both ends (both are 6)
      { id: "1-2", a: 1, b: 2 }, // matches neither
    ];
    const moves = computePlayableMoves(hand, board);
    expect(moves["6-2"].sort()).toEqual(["left", "right"]);
    expect(moves["1-2"]).toBeUndefined();
  });

  it("hasAnyPlayableMove is false when nothing in hand matches", () => {
    const board = placeTile([], { id: "6-6", a: 6, b: 6 }, "left");
    const hand = [{ id: "1-2", a: 1, b: 2 }];
    expect(hasAnyPlayableMove(hand, board)).toBe(false);
  });
});
