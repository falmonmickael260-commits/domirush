import { customAlphabet } from "nanoid";
import { gameReducer, createInitialGameState } from "@/game-engine";
import { deriveShortPlayerId } from "@/lib/playerId";
import type { GameAction, PlayerCount, PlayerState, TargetScore } from "@/game-engine";
import type { Room, RoomPlayer, RoomSummary } from "./types";

// Excludes visually ambiguous characters (0/O, 1/I) so codes are easy to read aloud and type.
const generateCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

const SEAT_COLORS = ["var(--seat-1)", "var(--seat-2)", "var(--seat-3)", "var(--seat-4)"];
const ROOM_TTL_MS = 1000 * 60 * 60 * 4; // 4h of inactivity before a room is garbage-collected

class RoomManager {
  private rooms = new Map<string, Room>();
  /** socketId -> {code, deviceId}, so a disconnect handler can find who dropped. */
  private socketIndex = new Map<string, { code: string; deviceId: string }>();

  createRoom(
    host: { deviceId: string; name: string; avatar: string },
    config: { playerCount: PlayerCount; targetScore: TargetScore }
  ): Room {
    let code = generateCode();
    while (this.rooms.has(code)) code = generateCode();

    const hostPlayer: RoomPlayer = {
      deviceId: host.deviceId,
      playerId: deriveShortPlayerId(host.deviceId),
      name: host.name,
      avatar: host.avatar,
      color: SEAT_COLORS[0],
      socketId: null,
      connected: false,
      isHost: true,
      seat: 0,
    };

    const room: Room = {
      code,
      config,
      players: [hostPlayer],
      game: null,
      status: "lobby",
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
    };
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  joinRoom(
    code: string,
    joiner: { deviceId: string; name: string; avatar: string }
  ): { ok: true; room: Room } | { ok: false; error: string } {
    const room = this.getRoom(code);
    if (!room) return { ok: false, error: "ROOM_NOT_FOUND" };

    const existing = room.players.find((p) => p.deviceId === joiner.deviceId);
    if (existing) {
      existing.name = joiner.name || existing.name;
      this.touch(room);
      return { ok: true, room };
    }

    if (room.status !== "lobby") return { ok: false, error: "GAME_ALREADY_STARTED" };
    if (room.players.length >= room.config.playerCount) return { ok: false, error: "ROOM_FULL" };

    room.players.push({
      deviceId: joiner.deviceId,
      playerId: deriveShortPlayerId(joiner.deviceId),
      name: joiner.name,
      avatar: joiner.avatar,
      color: SEAT_COLORS[room.players.length],
      socketId: null,
      connected: false,
      isHost: false,
      seat: room.players.length,
    });
    this.touch(room);
    return { ok: true, room };
  }

  attachSocket(code: string, deviceId: string, socketId: string): Room | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;
    const player = room.players.find((p) => p.deviceId === deviceId);
    if (!player) return undefined;
    player.socketId = socketId;
    player.connected = true;
    this.socketIndex.set(socketId, { code, deviceId });
    this.touch(room);
    return room;
  }

  handleDisconnect(socketId: string): { room: Room; player: RoomPlayer } | undefined {
    const entry = this.socketIndex.get(socketId);
    if (!entry) return undefined;
    this.socketIndex.delete(socketId);
    const room = this.getRoom(entry.code);
    if (!room) return undefined;
    const player = room.players.find((p) => p.deviceId === entry.deviceId);
    if (!player) return undefined;
    player.connected = false;
    player.socketId = null;
    this.touch(room);
    return { room, player };
  }

  leaveRoom(code: string, deviceId: string): Room | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;
    room.players = room.players.filter((p) => p.deviceId !== deviceId);
    if (room.players.length === 0) {
      this.rooms.delete(room.code);
      return undefined;
    }
    if (!room.players.some((p) => p.isHost)) room.players[0].isHost = true;
    this.touch(room);
    return room;
  }

  canStart(room: Room): boolean {
    return room.status === "lobby" && room.players.length === room.config.playerCount;
  }

  startGame(code: string): Room | { error: string } {
    const room = this.getRoom(code);
    if (!room) return { error: "ROOM_NOT_FOUND" };
    if (!this.canStart(room)) return { error: "NOT_READY" };

    const gamePlayers: PlayerState[] = room.players.map((p) => ({
      id: p.playerId,
      name: p.name,
      avatar: p.avatar,
      color: p.color,
      kind: "human",
      connected: p.connected,
      seat: p.seat,
    }));

    const initial = createInitialGameState(code, gamePlayers, room.config);
    room.game = gameReducer(initial, { type: "START_GAME" });
    room.status = "playing";
    this.touch(room);
    return room;
  }

  applyAction(code: string, action: GameAction): Room | { error: string } {
    const room = this.getRoom(code);
    if (!room || !room.game) return { error: "ROOM_NOT_FOUND" };
    room.game = gameReducer(room.game, action);
    if (room.game.phase === "game_end") room.status = "finished";
    this.touch(room);
    return room;
  }

  resetToLobby(code: string): Room | undefined {
    const room = this.getRoom(code);
    if (!room) return undefined;
    room.status = "lobby";
    room.game = null;
    this.touch(room);
    return room;
  }

  toSummary(room: Room): RoomSummary {
    return {
      code: room.code,
      config: room.config,
      status: room.status,
      players: room.players.map(({ deviceId: _d, socketId: _s, ...rest }) => rest),
      hostPlayerId: room.players.find((p) => p.isHost)?.playerId ?? "",
    };
  }

  private touch(room: Room) {
    room.lastActivityAt = Date.now();
  }

  sweepStaleRooms() {
    const now = Date.now();
    for (const [code, room] of this.rooms) {
      if (now - room.lastActivityAt > ROOM_TTL_MS) this.rooms.delete(code);
    }
  }
}

export const roomManager = new RoomManager();
