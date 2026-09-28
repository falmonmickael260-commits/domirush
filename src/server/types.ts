import type { GameState, PlayerCount, TargetScore } from "@/game-engine";

export interface RoomPlayer {
  deviceId: string;
  playerId: string;
  name: string;
  avatar: string;
  color: string;
  socketId: string | null;
  connected: boolean;
  isHost: boolean;
  seat: number;
}

export type RoomStatus = "lobby" | "playing" | "finished";

export interface Room {
  code: string;
  config: {
    playerCount: PlayerCount;
    targetScore: TargetScore;
  };
  players: RoomPlayer[];
  game: GameState | null;
  status: RoomStatus;
  createdAt: number;
  lastActivityAt: number;
}

/** Public shape of a room sent to clients in the lobby (no game state needed yet). */
export interface RoomSummary {
  code: string;
  config: Room["config"];
  status: RoomStatus;
  players: Array<Omit<RoomPlayer, "socketId" | "deviceId">>;
  hostPlayerId: string;
}
