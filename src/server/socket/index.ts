import type { Server, Socket } from "socket.io";
import { GameError } from "@/game-engine";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket";
import { roomManager } from "../roomManager";
import type { Room } from "../types";
import { redactGameStateFor } from "@/game-engine";
import { logCompletedGame } from "../database";
import { deriveShortPlayerId } from "@/lib/playerId";
import { publishResult, verifyIdentity } from "../platform";

type IO = Server<ClientToServerEvents, ServerToClientEvents>;
type Sock = Socket<ClientToServerEvents, ServerToClientEvents>;

function broadcastRoom(io: IO, room: Room) {
  io.to(room.code).emit("room:update", roomManager.toSummary(room));
}

function broadcastGame(io: IO, room: Room) {
  if (!room.game) return;
  for (const player of room.players) {
    if (!player.socketId) continue;
    io.to(player.socketId).emit("game:state", redactGameStateFor(room.game, player.playerId));
  }
  if (room.status === "finished" && room.game.winnerId) {
    void logCompletedGame(room);
    publishResult(room);
  }
}

export function registerSocketHandlers(io: IO) {
  io.on("connection", (socket: Sock) => {
    socket.on("room:create", async (payload, ack) => {
      try {
        const identity = await verifyIdentity(payload.platformToken);
        if (payload.platformToken && !identity) throw new Error("Invalid platform identity");
        if (!socket.connected) return;
        const room = roomManager.createRoom(
          { deviceId: payload.deviceId, name: identity?.username || payload.name, avatar: payload.avatar, userId: identity?.uid },
          { playerCount: payload.playerCount, targetScore: payload.targetScore }
        );
        joinSocketToRoom(socket, room.code, payload.deviceId);
        roomManager.attachSocket(room.code, payload.deviceId, socket.id);
        broadcastRoom(io, room);
        ack({ ok: true, code: room.code });
      } catch (err) {
        ack({ ok: false, error: toErrorCode(err) });
      }
    });

    socket.on("room:join", async (payload, ack) => {
      const existing = roomManager.getRoom(payload.code)?.players.some(p => p.deviceId === payload.deviceId);
      let identity: Awaited<ReturnType<typeof verifyIdentity>> = null;
      try {
        if (!existing) identity = await verifyIdentity(payload.platformToken);
        if (!existing && payload.platformToken && !identity) throw new Error("Invalid platform identity");
      } catch {
        ack({ ok: false, error: "CONNECTION_ERROR" });
        return;
      }
      if (!socket.connected) return;
      const result = roomManager.joinRoom(payload.code, {
        deviceId: payload.deviceId,
        name: identity?.username || payload.name,
        avatar: payload.avatar,
        userId: identity?.uid,
      });
      if (!result.ok) {
        ack({ ok: false, error: result.error });
        return;
      }
      joinSocketToRoom(socket, result.room.code, payload.deviceId);
      const room = roomManager.attachSocket(result.room.code, payload.deviceId, socket.id);
      if (!room) {
        ack({ ok: false, error: "ROOM_NOT_FOUND" });
        return;
      }
      broadcastRoom(io, room);
      socket.to(room.code).emit("player:joined", { name: payload.name });
      if (room.game) broadcastGame(io, room);
      ack({ ok: true });
    });

    socket.on("room:leave", (payload) => {
      if (!seated(socket, payload.code) || socket.data.deviceId !== payload.deviceId) return;
      const room = roomManager.leaveRoom(payload.code, payload.deviceId);
      roomManager.handleDisconnect(socket.id);
      delete socket.data.deviceId;
      delete socket.data.code;
      socket.leave(payload.code);
      if (room) broadcastRoom(io, room);
    });

    socket.on("game:start", (payload) => {
      if (!seated(socket, payload.code)?.isHost) return;
      const room = roomManager.getRoom(payload.code);
      if (!room?.players.every(p => p.connected)) return;
      const result = roomManager.startGame(payload.code);
      if ("error" in result) {
        socket.emit("game:error", { code: result.error, message: result.error });
        return;
      }
      broadcastRoom(io, result);
      broadcastGame(io, result);
    });

    socket.on("game:play_tile", (payload) => {
      dispatchAction(io, socket, payload.code, {
        type: "PLAY_TILE",
        playerId: currentPlayerId(socket),
        tileId: payload.tileId,
        side: payload.side,
      });
    });

    socket.on("game:draw", (payload) => {
      dispatchAction(io, socket, payload.code, {
        type: "DRAW_TILE",
        playerId: currentPlayerId(socket),
      });
    });

    socket.on("game:pass", (payload) => {
      dispatchAction(io, socket, payload.code, {
        type: "PASS",
        playerId: currentPlayerId(socket),
      });
    });

    socket.on("game:continue", (payload) => {
      dispatchAction(io, socket, payload.code, { type: "CONTINUE" });
    });

    socket.on("game:rematch", (payload) => {
      dispatchAction(io, socket, payload.code, { type: "REMATCH" });
    });

    socket.on("disconnect", () => {
      const result = roomManager.handleDisconnect(socket.id);
      if (!result) return;
      const { room, player } = result;
      broadcastRoom(io, room);
      socket.to(room.code).emit("player:left", { name: player.name });
    });
  });
}

function joinSocketToRoom(socket: Sock, code: string, deviceId: string) {
  if (socket.data.code && socket.data.code !== code) {
    socket.leave(socket.data.code);
    roomManager.handleDisconnect(socket.id);
  }
  socket.join(code);
  socket.data.code = code;
  socket.data.deviceId = deviceId;
}

function currentPlayerId(socket: Sock): string {
  return typeof socket.data.deviceId === "string" ? deriveShortPlayerId(socket.data.deviceId) : "";
}

function seated(socket: Sock, code: string) {
  if (socket.data.code !== code) return undefined;
  return roomManager.getRoom(code)?.players.find(p => p.socketId === socket.id);
}

function dispatchAction(
  io: IO,
  socket: Sock,
  code: string,
  action: Parameters<typeof roomManager.applyAction>[1]
) {
  if (!seated(socket, code)) return;
  try {
    const result = roomManager.applyAction(code, action);
    if ("error" in result) {
      socket.emit("game:error", { code: result.error, message: result.error });
      return;
    }
    broadcastRoom(io, result);
    broadcastGame(io, result);
  } catch (error) {
    const code = toErrorCode(error);
    socket.emit("game:error", { code, message: code });
  }
}

function toErrorCode(err: unknown): string {
  if (err instanceof GameError) return err.code;
  return "CONNECTION_ERROR";
}
