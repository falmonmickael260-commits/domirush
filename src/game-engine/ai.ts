import type { GameAction } from "./engine";
import { computePlayableMoves, placeTile } from "./board";
import type { GameState, Side, Tile } from "./types";

export const BOT_LEVELS = { easy: "Facile", medium: "Moyen", hard: "Difficile" } as const;
export type BotLevel = keyof typeof BOT_LEVELS;

export type AiDecision =
  | { action: "play"; tileId: string; side: Side }
  | { action: "draw" }
  | { action: "pass" };

/**
 * A simple but not naive AI: prefers playing doubles (they're harder to place later
 * and block one of your own exits), then prefers its heaviest tile (to shed pip
 * liability early), and otherwise plays the first legal move it finds.
 */
export function decideAiMove(state: GameState, playerId: string, level: BotLevel = "medium"): AiDecision {
  const hand = state.hands[playerId] ?? [];
  const moves = computePlayableMoves(hand, state.board);
  const playableTileIds = Object.keys(moves);

  if (playableTileIds.length === 0) {
    return state.boneyard.length > 0 ? { action: "draw" } : { action: "pass" };
  }

  const candidates = hand.filter((t) => playableTileIds.includes(t.id));
  if (level === "medium") {
    const best = pickBestTile(candidates);
    return { action: "play", tileId: best.id, side: moves[best.id][0] };
  }

  const choices = candidates.flatMap(tile => moves[tile.id].map(side => ({ tile, side })));
  const best = level === "easy"
    ? choices[Math.floor(Math.random() * choices.length)]
    : choices.reduce((best, choice) => scoreChoice(choice) > scoreChoice(best) ? choice : best);

  return { action: "play", tileId: best.tile.id, side: best.side };

  function scoreChoice({ tile, side }: { tile: Tile; side: Side }) {
    const board = placeTile(state.board, tile, side);
    const remaining = hand.filter(other => other.id !== tile.id);
    const followups = Object.keys(computePlayableMoves(remaining, board)).length;
    return followups * 4 + tile.a + tile.b + Number(tile.a === tile.b) * 2;
  }
}

export function aiMoveAction(state: GameState, playerId: string, level: BotLevel): GameAction {
  const move = decideAiMove(state, playerId, level);
  if (move.action === "play") return { type: "PLAY_TILE", playerId, tileId: move.tileId, side: move.side };
  return { type: move.action === "draw" ? "DRAW_TILE" : "PASS", playerId };
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
