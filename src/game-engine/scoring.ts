import { handPipTotal } from "./deck";
import type { PlayerState, RoundResult, Tile } from "./types";

/**
 * Determines who starts the very first round: the holder of the highest double.
 * If nobody holds a double, the player holding the single highest-value tile starts
 * (a common, deterministic fallback for the rare all-singles deal).
 */
export function determineFirstPlayerId(
  players: PlayerState[],
  hands: Record<string, Tile[]>
): string {
  let bestDouble: { playerId: string; value: number } | null = null;
  let bestSingle: { playerId: string; total: number; high: number } | null = null;

  for (const player of players) {
    for (const tile of hands[player.id] ?? []) {
      if (tile.a === tile.b) {
        if (!bestDouble || tile.a > bestDouble.value) {
          bestDouble = { playerId: player.id, value: tile.a };
        }
      }
      const total = tile.a + tile.b;
      const high = Math.max(tile.a, tile.b);
      if (
        !bestSingle ||
        total > bestSingle.total ||
        (total === bestSingle.total && high > bestSingle.high)
      ) {
        bestSingle = { playerId: player.id, total, high };
      }
    }
  }

  if (bestDouble) return bestDouble.playerId;
  if (bestSingle) return bestSingle.playerId;
  return players[0].id;
}

/** Same rule, applied when a player emptied their hand: the winner of a round starts the next one (handled by caller). */
export function determineFirstPlayerAfterBlock(
  players: PlayerState[],
  hands: Record<string, Tile[]>
): string {
  return determineFirstPlayerId(players, hands);
}

/**
 * Scoring for a round that ended because a player played their last tile ("domino"):
 * that player scores the sum of pips remaining in every other player's hand.
 */
export function scoreDominoRound(
  winnerId: string,
  hands: Record<string, Tile[]>
): RoundResult {
  const handsPipCount: Record<string, number> = {};
  let points = 0;
  for (const [playerId, hand] of Object.entries(hands)) {
    const total = handPipTotal(hand);
    handsPipCount[playerId] = total;
    if (playerId !== winnerId) points += total;
  }
  return {
    reason: "domino",
    winnerId,
    pointsAwarded: points,
    handsPipCount,
  };
}

/**
 * Scoring for a blocked round (nobody can play and the boneyard is empty):
 * the player(s) with the lowest pip count in hand win the sum of every other
 * hand's pips. A tie for lowest splits the points as evenly as possible.
 */
export function scoreBlockedRound(hands: Record<string, Tile[]>): RoundResult {
  const handsPipCount: Record<string, number> = {};
  for (const [playerId, hand] of Object.entries(hands)) {
    handsPipCount[playerId] = handPipTotal(hand);
  }

  const lowest = Math.min(...Object.values(handsPipCount));
  const winners = Object.keys(handsPipCount).filter(
    (id) => handsPipCount[id] === lowest
  );
  const totalPips = Object.entries(handsPipCount)
    .filter(([id]) => !winners.includes(id))
    .reduce((sum, [, pips]) => sum + pips, 0);

  return {
    reason: "blocked",
    winnerId: winners[0],
    pointsAwarded: totalPips,
    handsPipCount,
    isSplitBlocked: winners.length > 1,
  };
}

export function applyRoundResult(
  scores: Record<string, number>,
  result: RoundResult
): Record<string, number> {
  const next = { ...scores };
  if (result.winnerId) {
    next[result.winnerId] = (next[result.winnerId] ?? 0) + result.pointsAwarded;
  }
  return next;
}

export function checkForGameWinner(
  scores: Record<string, number>,
  targetScore: number
): string | null {
  let winner: string | null = null;
  let highest = -1;
  for (const [playerId, score] of Object.entries(scores)) {
    if (score >= targetScore && score > highest) {
      winner = playerId;
      highest = score;
    }
  }
  return winner;
}
