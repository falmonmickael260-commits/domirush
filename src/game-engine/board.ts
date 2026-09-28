import type { PlacedTile, Side, Tile } from "./types";

export interface BoardEnds {
  left: number | null;
  right: number | null;
}

export function getBoardEnds(board: PlacedTile[]): BoardEnds {
  if (board.length === 0) return { left: null, right: null };
  return { left: board[0].left, right: board[board.length - 1].right };
}

/** Whether a tile has a face matching the given end value. */
export function tileMatches(tile: Tile, end: number): boolean {
  return tile.a === end || tile.b === end;
}

/**
 * Which sides of the board a given tile could legally be played on right now.
 * An empty board accepts any tile on either "side" (both resolve to the same placement).
 */
export function playableSides(tile: Tile, board: PlacedTile[]): Side[] {
  const { left, right } = getBoardEnds(board);
  if (left === null || right === null) return ["left", "right"];
  const sides: Side[] = [];
  if (tileMatches(tile, left)) sides.push("left");
  if (tileMatches(tile, right)) sides.push("right");
  return sides;
}

/** Returns, for every tile in a hand, which sides it could be played on. Tiles with no legal side are omitted. */
export function computePlayableMoves(
  hand: Tile[],
  board: PlacedTile[]
): Record<string, Side[]> {
  const moves: Record<string, Side[]> = {};
  for (const tile of hand) {
    const sides = playableSides(tile, board);
    if (sides.length > 0) moves[tile.id] = sides;
  }
  return moves;
}

export function hasAnyPlayableMove(hand: Tile[], board: PlacedTile[]): boolean {
  return hand.some((tile) => playableSides(tile, board).length > 0);
}

/**
 * Orients a tile onto the given end of the board and returns the resulting PlacedTile.
 * Throws if the tile cannot legally be placed there.
 */
export function orientTileForPlacement(
  tile: Tile,
  side: Side,
  board: PlacedTile[]
): PlacedTile {
  const { left, right } = getBoardEnds(board);

  if (left === null || right === null) {
    // First tile of the game: orient arbitrarily as a-b (doubles are symmetric anyway).
    return { tile, left: tile.a, right: tile.b };
  }

  const end = side === "left" ? left : right;
  if (!tileMatches(tile, end)) {
    throw new Error(
      `Tile ${tile.id} does not match the ${side} end (${end}) of the board.`
    );
  }

  const otherValue = tile.a === end ? tile.b : tile.a;

  if (side === "left") {
    // The matching pip must touch the existing left end, so it becomes the tile's right face.
    return { tile, left: otherValue, right: end };
  }
  // Matching pip touches the existing right end, so it becomes the tile's left face.
  return { tile, left: end, right: otherValue };
}

export function placeTile(board: PlacedTile[], tile: Tile, side: Side): PlacedTile[] {
  const placed = orientTileForPlacement(tile, side, board);
  return side === "left" ? [placed, ...board] : [...board, placed];
}
