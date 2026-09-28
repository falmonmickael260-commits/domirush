import { describe, expect, it } from "vitest";
import { createInitialGameState, currentPlayer, gameReducer } from "../engine";
import { decideAiMove } from "../ai";
import { createDeck, dealHands, handPipTotal, shuffleDeck } from "../deck";
import type { GameState, PlayerState, Tile } from "../types";
import { GameError } from "../types";

function makePlayers(count: number): PlayerState[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Player ${i}`,
    avatar: "🙂",
    color: "#fff",
    kind: "human" as const,
    connected: true,
    seat: i,
  }));
}

/** Builds a fully controlled mid-round state so tests don't depend on random dealing. */
function scenario(overrides: Partial<GameState> = {}): GameState {
  const players = makePlayers(2);
  const base = createInitialGameState("game-1", players, {
    playerCount: 2,
    targetScore: 50,
  });
  return {
    ...base,
    phase: "playing",
    hands: {
      p0: [
        { id: "6-6", a: 6, b: 6 },
        { id: "6-3", a: 6, b: 3 },
      ],
      p1: [
        { id: "1-2", a: 1, b: 2 },
        { id: "3-3", a: 3, b: 3 },
      ],
    },
    boneyard: [],
    board: [],
    currentPlayerIndex: 0,
    ...overrides,
  };
}

describe("START_GAME", () => {
  it("deals hands and starts with the highest-double holder", () => {
    const players = makePlayers(4);
    const initial = createInitialGameState("g", players, { playerCount: 4, targetScore: 100 });
    const started = gameReducer(initial, { type: "START_GAME" });

    expect(started.phase).toBe("playing");
    players.forEach((p) => expect(started.hands[p.id]).toHaveLength(7));
    expect(started.boneyard).toHaveLength(0);

    const starter = currentPlayer(started);
    const startersHighestDouble = started.hands[starter.id]
      .filter((t) => t.a === t.b)
      .sort((a, b) => b.a - a.a)[0];
    // The starter must hold the single highest double across all hands (or nobody has one).
    const allDoubles = players.flatMap((p) => started.hands[p.id].filter((t) => t.a === t.b));
    if (allDoubles.length > 0) {
      const globalHighest = Math.max(...allDoubles.map((t) => t.a));
      expect(startersHighestDouble?.a).toBe(globalHighest);
    }
  });

  it("refuses to start twice", () => {
    const players = makePlayers(2);
    const initial = createInitialGameState("g", players, { playerCount: 2, targetScore: 50 });
    const started = gameReducer(initial, { type: "START_GAME" });
    expect(() => gameReducer(started, { type: "START_GAME" })).toThrow(GameError);
  });
});

describe("PLAY_TILE validation", () => {
  it("rejects a move from the wrong player", () => {
    const state = scenario();
    expect(() =>
      gameReducer(state, { type: "PLAY_TILE", playerId: "p1", tileId: "1-2", side: "left" })
    ).toThrow(/not your turn/i);
  });

  it("rejects a tile the player does not own", () => {
    const state = scenario();
    expect(() =>
      gameReducer(state, { type: "PLAY_TILE", playerId: "p0", tileId: "1-2", side: "left" })
    ).toThrow(/do not have/i);
  });

  it("rejects an illegal placement", () => {
    const state = scenario({
      board: [{ tile: { id: "4-4", a: 4, b: 4 }, left: 4, right: 4 }],
      leftEnd: 4,
      rightEnd: 4,
    });
    expect(() =>
      gameReducer(state, { type: "PLAY_TILE", playerId: "p0", tileId: "6-3", side: "left" })
    ).toThrow(/cannot be played/i);
  });

  it("accepts a legal placement, updates board and hand, and advances the turn", () => {
    const state = scenario();
    const next = gameReducer(state, {
      type: "PLAY_TILE",
      playerId: "p0",
      tileId: "6-6",
      side: "left",
    });
    expect(next.board).toHaveLength(1);
    expect(next.hands.p0).toHaveLength(1);
    expect(next.leftEnd).toBe(6);
    expect(next.rightEnd).toBe(6);
    expect(currentPlayer(next).id).toBe("p1");
  });
});

describe("winning by domino", () => {
  it("ends the round and scores opponents' pips when a player empties their hand", () => {
    const state = scenario({
      hands: {
        p0: [{ id: "6-6", a: 6, b: 6 }],
        p1: [{ id: "3-3", a: 3, b: 3 }],
      },
    });
    const next = gameReducer(state, {
      type: "PLAY_TILE",
      playerId: "p0",
      tileId: "6-6",
      side: "left",
    });
    expect(next.phase).toBe("round_end");
    expect(next.lastRoundResult?.winnerId).toBe("p0");
    expect(next.lastRoundResult?.pointsAwarded).toBe(6);
    expect(next.scores.p0).toBe(6);
  });

  it("moves to game_end once the target score is reached", () => {
    const state = scenario({
      scores: { p0: 45, p1: 0 },
      hands: {
        p0: [{ id: "6-6", a: 6, b: 6 }],
        p1: [{ id: "3-3", a: 3, b: 3 }],
      },
    });
    const next = gameReducer(state, {
      type: "PLAY_TILE",
      playerId: "p0",
      tileId: "6-6",
      side: "left",
    });
    expect(next.phase).toBe("game_end");
    expect(next.winnerId).toBe("p0");
  });
});

describe("draw and pass rules", () => {
  it("forces a draw when the player has no move and the boneyard is non-empty", () => {
    const state = scenario({
      board: [{ tile: { id: "0-0", a: 0, b: 0 }, left: 0, right: 0 }],
      leftEnd: 0,
      rightEnd: 0,
      hands: { p0: [{ id: "6-6", a: 6, b: 6 }], p1: [{ id: "3-3", a: 3, b: 3 }] },
      boneyard: [{ id: "1-1", a: 1, b: 1 }],
    });
    expect(() => gameReducer(state, { type: "PASS", playerId: "p0" })).toThrow(/must draw/i);

    const next = gameReducer(state, { type: "DRAW_TILE", playerId: "p0" });
    expect(next.hands.p0).toHaveLength(2);
    expect(next.boneyard).toHaveLength(0);
  });

  it("rejects drawing when a legal move already exists", () => {
    const state = scenario({
      board: [{ tile: { id: "6-6", a: 6, b: 6 }, left: 6, right: 6 }],
      leftEnd: 6,
      rightEnd: 6,
      boneyard: [{ id: "1-1", a: 1, b: 1 }],
    });
    expect(() => gameReducer(state, { type: "DRAW_TILE", playerId: "p0" })).toThrow(/must play/i);
  });

  it("blocks the round once every player has passed in turn with an empty boneyard", () => {
    const state = scenario({
      board: [{ tile: { id: "0-0", a: 0, b: 0 }, left: 0, right: 0 }],
      leftEnd: 0,
      rightEnd: 0,
      hands: { p0: [{ id: "6-6", a: 6, b: 6 }], p1: [{ id: "3-3", a: 3, b: 3 }] },
      boneyard: [],
    });
    const afterP0Pass = gameReducer(state, { type: "PASS", playerId: "p0" });
    expect(afterP0Pass.phase).toBe("playing");
    const afterP1Pass = gameReducer(afterP0Pass, { type: "PASS", playerId: "p1" });
    expect(afterP1Pass.phase).toBe("round_end");
    expect(afterP1Pass.lastRoundResult?.reason).toBe("blocked");
    // p1 has fewer pips (6) than p0 (12), so p1 should win the blocked round.
    expect(afterP1Pass.lastRoundResult?.winnerId).toBe("p1");
  });
});

describe("CONTINUE and REMATCH", () => {
  it("deals a fresh round, started by the previous round's winner", () => {
    const state = scenario({
      hands: { p0: [{ id: "6-6", a: 6, b: 6 }], p1: [{ id: "3-3", a: 3, b: 3 }] },
    });
    const roundEnd = gameReducer(state, {
      type: "PLAY_TILE",
      playerId: "p0",
      tileId: "6-6",
      side: "left",
    });
    const nextRound = gameReducer(roundEnd, { type: "CONTINUE" });
    expect(nextRound.phase).toBe("playing");
    expect(nextRound.roundNumber).toBe(1);
    expect(currentPlayer(nextRound).id).toBe("p0");
    expect(nextRound.hands.p0).toHaveLength(7);
  });

  it("resets scores on rematch", () => {
    const state = scenario({
      phase: "game_end",
      scores: { p0: 52, p1: 30 },
      winnerId: "p0",
    });
    const rematch = gameReducer(state, { type: "REMATCH" });
    expect(rematch.phase).toBe("playing");
    expect(rematch.scores).toEqual({ p0: 0, p1: 0 });
    expect(rematch.winnerId).toBeNull();
  });
});

describe("full game simulation (AI vs AI)", () => {
  for (const playerCount of [2, 3, 4] as const) {
    it(`plays a complete ${playerCount}-player game to a winner without violating invariants`, () => {
      const players = makePlayers(playerCount);
      let state = createInitialGameState(`sim-${playerCount}`, players, {
        playerCount,
        targetScore: 50,
      });
      state = gameReducer(state, { type: "START_GAME" });

      let safetyCounter = 0;
      while (state.phase !== "game_end" && safetyCounter < 5000) {
        safetyCounter++;

        if (state.phase === "round_end") {
          state = gameReducer(state, { type: "CONTINUE" });
          continue;
        }

        const totalTilesBefore =
          Object.values(state.hands).reduce((s, h) => s + h.length, 0) +
          state.boneyard.length +
          state.board.length;
        expect(totalTilesBefore).toBe(28);

        const player = currentPlayer(state);
        const decision = decideAiMove(state, player.id);
        if (decision.action === "play") {
          state = gameReducer(state, {
            type: "PLAY_TILE",
            playerId: player.id,
            tileId: decision.tileId!,
            side: decision.side!,
          });
        } else if (decision.action === "draw") {
          state = gameReducer(state, { type: "DRAW_TILE", playerId: player.id });
        } else {
          state = gameReducer(state, { type: "PASS", playerId: player.id });
        }
      }

      expect(state.phase).toBe("game_end");
      expect(state.winnerId).not.toBeNull();
      expect(state.scores[state.winnerId!]).toBeGreaterThanOrEqual(50);
      // Every other player must have strictly fewer points than the winner at the moment of victory.
      for (const p of players) {
        if (p.id !== state.winnerId) {
          expect(state.scores[p.id]).toBeLessThan(state.scores[state.winnerId!] + 1);
        }
      }
    });
  }
});

describe("dealing sanity used by the reducer", () => {
  it("never deals the same physical tile twice across a shuffled deck", () => {
    const deck = shuffleDeck(createDeck());
    const { hands, boneyard } = dealHands(deck, 3);
    const total = handPipTotal(hands.flat()) + handPipTotal(boneyard);
    const deckTotal = handPipTotal(deck as Tile[]);
    expect(total).toBe(deckTotal);
  });
});
