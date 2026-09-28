import type {
  GamePhase,
  GameState,
  LastMove,
  PlacedTile,
  PlayerState,
  RedactedGameState,
  RoundResult,
  Tile,
} from "@/game-engine";

/**
 * A transport-agnostic shape the UI renders from. Both the solo (in-browser)
 * engine and the multiplayer socket client produce this same shape, so every
 * component works identically whether or not a server is involved.
 */
export interface GameViewModel {
  phase: GamePhase;
  players: PlayerState[];
  myId: string;
  myHand: Tile[];
  handCounts: Record<string, number>;
  board: PlacedTile[];
  leftEnd: number | null;
  rightEnd: number | null;
  currentPlayerId: string | null;
  scores: Record<string, number>;
  targetScore: number;
  roundNumber: number;
  lastRoundResult: RoundResult | null;
  winnerId: string | null;
  boneyardCount: number;
  lastMove: LastMove | null;
}

export function viewModelFromGameState(state: GameState, myId: string): GameViewModel {
  const handCounts: Record<string, number> = {};
  for (const p of state.players) handCounts[p.id] = state.hands[p.id]?.length ?? 0;

  return {
    phase: state.phase,
    players: state.players,
    myId,
    myHand: state.hands[myId] ?? [],
    handCounts,
    board: state.board,
    leftEnd: state.leftEnd,
    rightEnd: state.rightEnd,
    currentPlayerId: state.players[state.currentPlayerIndex]?.id ?? null,
    scores: state.scores,
    targetScore: state.config.targetScore,
    roundNumber: state.roundNumber,
    lastRoundResult: state.lastRoundResult,
    winnerId: state.winnerId,
    boneyardCount: state.boneyard.length,
    lastMove: state.lastMove,
  };
}

export function viewModelFromRedacted(
  state: RedactedGameState,
  myId: string
): GameViewModel {
  const handCounts: Record<string, number> = {};
  for (const p of state.players) {
    const h = state.hands[p.id];
    handCounts[p.id] = typeof h === "number" ? h : h?.length ?? 0;
  }
  const myHandRaw = state.hands[myId];

  return {
    phase: state.phase,
    players: state.players,
    myId,
    myHand: Array.isArray(myHandRaw) ? myHandRaw : [],
    handCounts,
    board: state.board,
    leftEnd: state.leftEnd,
    rightEnd: state.rightEnd,
    currentPlayerId: state.players[state.currentPlayerIndex]?.id ?? null,
    scores: state.scores,
    targetScore: state.config.targetScore,
    roundNumber: state.roundNumber,
    lastRoundResult: state.lastRoundResult,
    winnerId: state.winnerId,
    boneyardCount: state.boneyardCount,
    lastMove: state.lastMove,
  };
}

export interface SeatPosition {
  player: PlayerState;
  position: "south" | "north" | "east" | "west" | "topLeft" | "topRight";
}

const LAYOUTS: Record<number, SeatPosition["position"][]> = {
  2: ["south", "north"],
  3: ["south", "topRight", "topLeft"],
  4: ["south", "east", "north", "west"],
};

/** Rotates the seating so the viewer is always shown at the "south" position. */
export function computeSeatLayout(players: PlayerState[], myId: string): SeatPosition[] {
  const n = players.length;
  const layout = LAYOUTS[n] ?? LAYOUTS[4];
  const selfIdx = players.findIndex((p) => p.id === myId);
  const start = selfIdx >= 0 ? selfIdx : 0;

  return players.map((player, i) => {
    const relative = (i - start + n) % n;
    return { player, position: layout[relative] };
  });
}
