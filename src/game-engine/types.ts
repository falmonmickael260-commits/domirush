/**
 * Core types for the Domirush game engine.
 * This module is pure TypeScript with zero UI or transport dependencies,
 * so it can run identically on the server (authoritative) and in the
 * browser (solo/demo mode against AI).
 */

export type PlayerCount = 2 | 3 | 4;
export type TargetScore = 50 | 100;

/** A domino tile as dealt, before it is placed on the board. `a` and `b` are always a<=b. */
export interface Tile {
  id: string;
  a: number;
  b: number;
}

export type Side = "left" | "right";

/** A tile once placed on the board, oriented so that `left`/`right` are the exposed pip values. */
export interface PlacedTile {
  tile: Tile;
  left: number;
  right: number;
}

export type GamePhase =
  | "waiting"
  | "playing"
  | "round_end"
  | "game_end";

export type PlayerKind = "human" | "ai";

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  color: string;
  kind: PlayerKind;
  connected: boolean;
  seat: number;
}

/** Why the round ended. */
export type RoundEndReason = "domino" | "blocked";

export interface RoundResult {
  reason: RoundEndReason;
  winnerId: string | null;
  pointsAwarded: number;
  handsPipCount: Record<string, number>;
  isSplitBlocked?: boolean;
}

export interface GameState {
  id: string;
  config: {
    playerCount: PlayerCount;
    targetScore: TargetScore;
  };
  phase: GamePhase;
  players: PlayerState[];
  /** Full hands, keyed by player id. Server-authoritative; redacted before sending to clients. */
  hands: Record<string, Tile[]>;
  boneyard: Tile[];
  board: PlacedTile[];
  /** Pip values currently exposed at each end of the chain. Null when the board is empty. */
  leftEnd: number | null;
  rightEnd: number | null;
  currentPlayerIndex: number;
  scores: Record<string, number>;
  roundNumber: number;
  /** Number of consecutive passes (a pass = could not play and boneyard empty). Used to detect a blocked round. */
  consecutivePasses: number;
  startingPlayerId: string | null;
  lastRoundResult: RoundResult | null;
  winnerId: string | null;
  /** Increments on every mutation; useful for client reconciliation / animation keys. */
  sequence: number;
  /** Last move made, for animation purposes on the client. */
  lastMove: LastMove | null;
}

export interface LastMove {
  type: "play" | "pass" | "draw";
  playerId: string;
  tileId?: string;
  side?: Side;
}

export class GameError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "GameError";
  }
}

/** A version of GameState safe to send to a specific player: other hands are redacted to counts. */
export interface RedactedGameState extends Omit<GameState, "hands" | "boneyard"> {
  hands: Record<string, Tile[] | number>;
  boneyardCount: number;
}
