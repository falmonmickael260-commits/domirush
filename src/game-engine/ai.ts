import { computePlayableMoves } from "./board";
import type { GameState, Side, Tile } from "./types";

export interface AiDecision {
  action: "play" | "draw" | "pass";
  tileId?: string;
  side?: Side;
}

/**
 * A simple but not naive AI: prefers playing doubles (they're harder to place later
 * and block one of your own exits), then prefers its heaviest tile (to shed pip
 * liability early), and otherwise plays the first legal move it finds.
 */
export function decideAiMove(state: GameState, playerId: string): AiDecision {
  const hand = state.hands[playerId] ?? [];
  const moves = computePlayableMoves(hand, state.board);
  const playableTileIds = Object.keys(moves);

  if (playableTileIds.length === 0) {
    return state.boneyard.length > 0 ? { action: "draw" } : { action: "pass" };
  }

  const candidates = hand.filter((t) => playableTileIds.includes(t.id));
  const best = pickBestTile(candidates);
  const side = moves[best.id][0];

  return { action: "play", tileId: best.id, side };
}

function pickBestTile(tiles: Tile[]): Tile {
  const doubles = tiles.filter((t) => t.a === t.b);
  const pool = doubles.length > 0 ? doubles : tiles;
  return pool.reduce((heaviest, t) =>
    t.a + t.b > heaviest.a + heaviest.b ? t : heaviest
  );
}

/** A natural-feeling "thinking" delay so the AI never plays instantly. */
export function aiThinkingDelayMs(): number {
  return 700 + Math.floor(Math.random() * (1800 - 700));
}
