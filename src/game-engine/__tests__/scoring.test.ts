import { describe, expect, it } from "vitest";
import {
  applyRoundResult,
  checkForGameWinner,
  determineFirstPlayerId,
  scoreBlockedRound,
  scoreDominoRound,
} from "../scoring";
import type { PlayerState, Tile } from "../types";

function player(id: string, seat: number): PlayerState {
  return { id, name: id, avatar: "🙂", color: "#fff", kind: "human", connected: true, seat };
}

describe("determineFirstPlayerId", () => {
  it("picks the holder of the highest double", () => {
    const players = [player("a", 0), player("b", 1)];
    const hands: Record<string, Tile[]> = {
      a: [{ id: "4-4", a: 4, b: 4 }],
      b: [{ id: "6-6", a: 6, b: 6 }],
    };
    expect(determineFirstPlayerId(players, hands)).toBe("b");
  });

  it("falls back to the highest-value single tile when nobody has a double", () => {
    const players = [player("a", 0), player("b", 1)];
    const hands: Record<string, Tile[]> = {
      a: [{ id: "2-3", a: 2, b: 3 }],
      b: [{ id: "5-6", a: 5, b: 6 }],
    };
    expect(determineFirstPlayerId(players, hands)).toBe("b");
  });
});

describe("scoreDominoRound", () => {
  it("awards the winner the sum of every opponent's remaining pips", () => {
    const hands: Record<string, Tile[]> = {
      winner: [],
      a: [{ id: "3-4", a: 3, b: 4 }],
      b: [{ id: "6-6", a: 6, b: 6 }],
    };
    const result = scoreDominoRound("winner", hands);
    expect(result.pointsAwarded).toBe(7 + 12);
    expect(result.winnerId).toBe("winner");
    expect(result.reason).toBe("domino");
  });
});

describe("scoreBlockedRound", () => {
  it("awards the lowest hand the sum of every other hand", () => {
    const hands: Record<string, Tile[]> = {
      a: [{ id: "1-1", a: 1, b: 1 }],
      b: [{ id: "6-6", a: 6, b: 6 }],
    };
    const result = scoreBlockedRound(hands);
    expect(result.winnerId).toBe("a");
    expect(result.pointsAwarded).toBe(12);
    expect(result.reason).toBe("blocked");
  });

  it("flags a split when multiple players tie for lowest", () => {
    const hands: Record<string, Tile[]> = {
      a: [{ id: "1-1", a: 1, b: 1 }],
      b: [{ id: "0-2", a: 0, b: 2 }],
      c: [{ id: "6-6", a: 6, b: 6 }],
    };
    const result = scoreBlockedRound(hands);
    expect(result.isSplitBlocked).toBe(true);
  });
});

describe("applyRoundResult / checkForGameWinner", () => {
  it("accumulates score across rounds", () => {
    const scores = applyRoundResult({ a: 10, b: 5 }, {
      reason: "domino",
      winnerId: "a",
      pointsAwarded: 8,
      handsPipCount: {},
    });
    expect(scores).toEqual({ a: 18, b: 5 });
  });

  it("declares a winner once a score reaches the target", () => {
    expect(checkForGameWinner({ a: 48, b: 30 }, 50)).toBeNull();
    expect(checkForGameWinner({ a: 52, b: 30 }, 50)).toBe("a");
  });
});
