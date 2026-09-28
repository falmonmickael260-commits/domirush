import type { Server, Socket } from "socket.io";
import { GameError } from "@/game-engine";
import type { ClientToServerEvents, ServerToClientEvents } from "@/types/socket";
import { roomManager } from "../roomManager";
import type { Room } from "../types";
import { redactGameStateFor } from "@/game-engine";
import { logCompletedGame } from "../database";
import { deriveShortPlayerId } from "@/lib/playerId";

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
  }
}

export function registerSocketHandlers(io: IO) {
  io.on("connection", (socket: Sock) => {
    socket.on("room:create", (payload, ack) => {
      try {
        const room = roomManager.createRoom(
          { deviceId: payload.deviceId, name: payload.name, avatar: payload.avatar },
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

    socket.on("room:join", (payload, ack) => {
      const result = roomManager.joinRoom(payload.code, {
        deviceId: payload.deviceId,
        name: payload.name,
        avatar: payload.avatar,
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
      const room = roomManager.leaveRoom(payload.code, payload.deviceId);
      socket.leave(payload.code);
      if (room) broadcastRoom(io, room);
    });

    socket.on("game:start", (payload) => {
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
      const result = roomManager.applyAction(payload.code, { type: "CONTINUE" });
      if ("error" in result) return;
      broadcastRoom(io, result);
      broadcastGame(io, result);
    });

    socket.on("game:rematch", (payload) => {
      const result = roomManager.applyAction(payload.code, { type: "REMATCH" });
      if ("error" in result) return;
      broadcastRoom(io, result);
      broadcastGame(io, result);
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
  socket.join(code);
  socket.data.code = code;
  socket.data.deviceId = deviceId;
}

function currentPlayerId(socket: Sock): string {
  return deriveShortPlayerId(socket.data.deviceId as string);
}

function dispatchAction(
  io: IO,
  socket: Sock,
  code: string,
  action: Parameters<typeof roomManager.applyAction>[1]
) {
  const result = roomManager.applyAction(code, action);
  if ("error" in result) {
    socket.emit("game:error", { code: result.error, message: result.error });
    return;
  }
  broadcastRoom(io, result);
  broadcastGame(io, result);
}

function toErrorCode(err: unknown): string {
  if (err instanceof GameError) return err.code;
  return "CONNECTION_ERROR";
}
