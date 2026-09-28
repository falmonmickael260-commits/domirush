import { createDeck, dealHands, shuffleDeck } from "./deck";
import { computePlayableMoves, hasAnyPlayableMove, placeTile } from "./board";
import {
  applyRoundResult,
  checkForGameWinner,
  determineFirstPlayerId,
  scoreBlockedRound,
  scoreDominoRound,
} from "./scoring";
import type {
  GameState,
  PlayerCount,
  PlayerState,
  RedactedGameState,
  Side,
  TargetScore,
  Tile,
} from "./types";
import { GameError } from "./types";

export function createInitialGameState(
  id: string,
  players: PlayerState[],
  config: { playerCount: PlayerCount; targetScore: TargetScore }
): GameState {
  return {
    id,
    config,
    phase: "waiting",
    players,
    hands: {},
    boneyard: [],
    board: [],
    leftEnd: null,
    rightEnd: null,
    currentPlayerIndex: 0,
    scores: Object.fromEntries(players.map((p) => [p.id, 0])),
    roundNumber: 0,
    consecutivePasses: 0,
    startingPlayerId: null,
    lastRoundResult: null,
    winnerId: null,
    sequence: 0,
    lastMove: null,
  };
}

function dealNewRound(state: GameState, startingPlayerId?: string): GameState {
  const deck = shuffleDeck(createDeck());
  const { hands, boneyard } = dealHands(deck, state.config.playerCount);
  const handsByPlayerId: Record<string, Tile[]> = {};
  state.players.forEach((p, i) => {
    handsByPlayerId[p.id] = hands[i];
  });

  const firstPlayerId =
    startingPlayerId ?? determineFirstPlayerId(state.players, handsByPlayerId);
  const firstPlayerIndex = state.players.findIndex((p) => p.id === firstPlayerId);

  return {
    ...state,
    phase: "playing",
    hands: handsByPlayerId,
    boneyard,
    board: [],
    leftEnd: null,
    rightEnd: null,
    currentPlayerIndex: firstPlayerIndex >= 0 ? firstPlayerIndex : 0,
    roundNumber: state.roundNumber + 1,
    consecutivePasses: 0,
    startingPlayerId: firstPlayerId,
    lastRoundResult: null,
    lastMove: null,
    sequence: state.sequence + 1,
  };
}

export function currentPlayer(state: GameState): PlayerState {
  return state.players[state.currentPlayerIndex];
}

function nextPlayerIndex(state: GameState): number {
  return (state.currentPlayerIndex + 1) % state.players.length;
}

function finishRound(
  state: GameState,
  result: ReturnType<typeof scoreDominoRound>
): GameState {
  const scores = applyRoundResult(state.scores, result);
  const winnerId = checkForGameWinner(scores, state.config.targetScore);
  return {
    ...state,
    phase: winnerId ? "game_end" : "round_end",
    scores,
    lastRoundResult: result,
    winnerId,
    sequence: state.sequence + 1,
  };
}

export type GameAction =
  | { type: "START_GAME" }
  | { type: "PLAY_TILE"; playerId: string; tileId: string; side: Side }
  | { type: "DRAW_TILE"; playerId: string }
  | { type: "PASS"; playerId: string }
  | { type: "CONTINUE" }
  | { type: "REMATCH" };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_GAME": {
      if (state.phase !== "waiting") {
        throw new GameError("INVALID_PHASE", "Game has already started.");
      }
      return dealNewRound(state);
    }

    case "PLAY_TILE": {
      assertPlayersTurn(state, action.playerId);
      const hand = state.hands[action.playerId];
      const tile = hand.find((t) => t.id === action.tileId);
      if (!tile) {
        throw new GameError("TILE_NOT_OWNED", "You do not have that tile.");
      }
      const legalSides = computePlayableMoves([tile], state.board)[tile.id];
      if (!legalSides || !legalSides.includes(action.side)) {
        throw new GameError(
          "ILLEGAL_MOVE",
          `That tile cannot be played on the ${action.side} side.`
        );
      }

      const newBoard = placeTile(state.board, tile, action.side);
      const newHand = hand.filter((t) => t.id !== action.tileId);
      const newHands = { ...state.hands, [action.playerId]: newHand };

      const midState: GameState = {
        ...state,
        board: newBoard,
        leftEnd: newBoard[0].left,
        rightEnd: newBoard[newBoard.length - 1].right,
        hands: newHands,
        consecutivePasses: 0,
        lastMove: { type: "play", playerId: action.playerId, tileId: tile.id, side: action.side },
        sequence: state.sequence + 1,
      };

      if (newHand.length === 0) {
        return finishRound(midState, scoreDominoRound(action.playerId, newHands));
      }

      return { ...midState, currentPlayerIndex: nextPlayerIndex(midState) };
    }

    case "DRAW_TILE": {
      assertPlayersTurn(state, action.playerId);
      const hand = state.hands[action.playerId];
      if (hasAnyPlayableMove(hand, state.board)) {
        throw new GameError(
          "MUST_PLAY",
          "You have a legal move and must play instead of drawing."
        );
      }
      if (state.boneyard.length === 0) {
        throw new GameError("BONEYARD_EMPTY", "There are no tiles left to draw.");
      }
      const [drawn, ...restBoneyard] = state.boneyard;
      const newHand = [...hand, drawn];
      const newState: GameState = {
        ...state,
        hands: { ...state.hands, [action.playerId]: newHand },
        boneyard: restBoneyard,
        lastMove: { type: "draw", playerId: action.playerId },
        sequence: state.sequence + 1,
      };

      if (!hasAnyPlayableMove(newHand, state.board) && restBoneyard.length === 0) {
        return advanceAsPass(newState, action.playerId);
      }
      return newState;
    }

    case "PASS": {
      assertPlayersTurn(state, action.playerId);
      const hand = state.hands[action.playerId];
      if (hasAnyPlayableMove(hand, state.board)) {
        throw new GameError("MUST_PLAY", "You have a legal move and cannot pass.");
      }
      if (state.boneyard.length > 0) {
        throw new GameError(
          "MUST_DRAW",
          "You must draw from the boneyard before you can pass."
        );
      }
      return advanceAsPass(state, action.playerId);
    }

    case "CONTINUE": {
      if (state.phase !== "round_end") {
        throw new GameError("INVALID_PHASE", "No round result to continue from.");
      }
      const nextStarter = state.lastRoundResult?.winnerId ?? undefined;
      return dealNewRound(state, nextStarter);
    }

    case "REMATCH": {
      if (state.phase !== "game_end") {
        throw new GameError("INVALID_PHASE", "Game has not ended yet.");
      }
      const resetScores = Object.fromEntries(state.players.map((p) => [p.id, 0]));
      const reset: GameState = {
        ...state,
        phase: "waiting",
        scores: resetScores,
        roundNumber: 0,
        winnerId: null,
        lastRoundResult: null,
        sequence: state.sequence + 1,
      };
      return dealNewRound(reset);
    }

    default:
      return state;
  }
}

function assertPlayersTurn(state: GameState, playerId: string): void {
  if (state.phase !== "playing") {
    throw new GameError("INVALID_PHASE", "The round is not in progress.");
  }
  if (currentPlayer(state).id !== playerId) {
    throw new GameError("NOT_YOUR_TURN", "It is not your turn.");
  }
}

function advanceAsPass(state: GameState, playerId: string): GameState {
  const consecutivePasses = state.consecutivePasses + 1;
  const passedState: GameState = {
    ...state,
    consecutivePasses,
    lastMove: { type: "pass", playerId },
    sequence: state.sequence + 1,
  };

  if (consecutivePasses >= state.players.length) {
    return finishRound(passedState, scoreBlockedRound(state.hands));
  }

  return { ...passedState, currentPlayerIndex: nextPlayerIndex(passedState) };
}

/** Whether the round is blocked right now (informational; the engine also detects this via consecutivePasses). */
export function isRoundBlocked(state: GameState): boolean {
  if (state.boneyard.length > 0) return false;
  return state.players.every((p) => !hasAnyPlayableMove(state.hands[p.id] ?? [], state.board));
}

/** Produces the view of the game state safe to send to a given player: other hands become counts only. */
export function redactGameStateFor(state: GameState, viewerId: string | null): RedactedGameState {
  const hands: Record<string, Tile[] | number> = {};
  for (const [playerId, hand] of Object.entries(state.hands)) {
    hands[playerId] = playerId === viewerId ? hand : hand.length;
  }
  const { boneyard, ...rest } = state;
  return { ...rest, hands, boneyardCount: boneyard.length };
}
