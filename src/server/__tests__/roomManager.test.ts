import { describe, expect, it } from "vitest";
import { roomManager } from "../roomManager";

function host(name = "Mickael") {
  return { deviceId: crypto.randomUUID(), name, avatar: "🙂" };
}

describe("roomManager.createRoom / joinRoom", () => {
  it("creates a room with the host as the sole, connected-pending player", () => {
    const h = host();
    const room = roomManager.createRoom(h, { playerCount: 2, targetScore: 50 });
    expect(room.players).toHaveLength(1);
    expect(room.players[0].isHost).toBe(true);
    expect(room.status).toBe("lobby");
    expect(room.code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it("lets a second player join up to the configured player count", () => {
    const room = roomManager.createRoom(host(), { playerCount: 2, targetScore: 50 });
    const result = roomManager.joinRoom(room.code, { deviceId: crypto.randomUUID(), name: "Sarah", avatar: "🦊" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.room.players).toHaveLength(2);
  });

  it("refuses to join a full room", () => {
    const room = roomManager.createRoom(host(), { playerCount: 2, targetScore: 50 });
    roomManager.joinRoom(room.code, { deviceId: crypto.randomUUID(), name: "Sarah", avatar: "🦊" });
    const third = roomManager.joinRoom(room.code, { deviceId: crypto.randomUUID(), name: "Hugo", avatar: "🐼" });
    expect(third.ok).toBe(false);
    if (!third.ok) expect(third.error).toBe("ROOM_FULL");
  });

  it("refuses to join a room that does not exist", () => {
    const result = roomManager.joinRoom("ZZZZZZ", { deviceId: crypto.randomUUID(), name: "Sarah", avatar: "🦊" });
    expect(result.ok).toBe(false);
  });

  it("treats a rejoin from the same deviceId as a reconnection, not a new player", () => {
    const h = host();
    const room = roomManager.createRoom(h, { playerCount: 2, targetScore: 50 });
    roomManager.joinRoom(room.code, { deviceId: crypto.randomUUID(), name: "Sarah", avatar: "🦊" });
    const rejoin = roomManager.joinRoom(room.code, { deviceId: h.deviceId, name: "Mickael", avatar: "🙂" });
    expect(rejoin.ok).toBe(true);
    if (rejoin.ok) expect(rejoin.room.players).toHaveLength(2);
  });
});

describe("roomManager reconnection lifecycle", () => {
  it("marks a player connected on attachSocket and disconnected on handleDisconnect", () => {
    const h = host();
    const room = roomManager.createRoom(h, { playerCount: 2, targetScore: 50 });
    const attached = roomManager.attachSocket(room.code, h.deviceId, "socket-1");
    expect(attached?.players[0].connected).toBe(true);

    const result = roomManager.handleDisconnect("socket-1");
    expect(result?.player.connected).toBe(false);
    expect(result?.room.code).toBe(room.code);
  });

  it("does nothing for an unknown socket id", () => {
    expect(roomManager.handleDisconnect("unknown-socket")).toBeUndefined();
  });
});

describe("roomManager.leaveRoom", () => {
  it("reassigns host when the host leaves", () => {
    const h = host();
    const room = roomManager.createRoom(h, { playerCount: 2, targetScore: 50 });
    const joinerId = crypto.randomUUID();
    roomManager.joinRoom(room.code, { deviceId: joinerId, name: "Sarah", avatar: "🦊" });

    const afterLeave = roomManager.leaveRoom(room.code, h.deviceId);
    expect(afterLeave?.players).toHaveLength(1);
    expect(afterLeave?.players[0].isHost).toBe(true);
    expect(afterLeave?.players[0].name).toBe("Sarah");
  });

  it("deletes the room once the last player leaves", () => {
    const h = host();
    const room = roomManager.createRoom(h, { playerCount: 2, targetScore: 50 });
    roomManager.leaveRoom(room.code, h.deviceId);
    expect(roomManager.getRoom(room.code)).toBeUndefined();
  });
});

describe("roomManager.startGame", () => {
  it("refuses to start until the room is full", () => {
    const h = host();
    const room = roomManager.createRoom(h, { playerCount: 2, targetScore: 50 });
    const result = roomManager.startGame(room.code);
    expect("error" in result).toBe(true);
  });

  it("deals a game once the room is full and flips status to playing", () => {
    const h = host();
    const room = roomManager.createRoom(h, { playerCount: 2, targetScore: 50 });
    roomManager.joinRoom(room.code, { deviceId: crypto.randomUUID(), name: "Sarah", avatar: "🦊" });
    const result = roomManager.startGame(room.code);
    expect("error" in result).toBe(false);
    if (!("error" in result)) {
      expect(result.status).toBe("playing");
      expect(result.game?.phase).toBe("playing");
      Object.values(result.game!.hands).forEach((hand) => expect(hand).toHaveLength(7));
    }
  });
});

describe("roomManager.toSummary", () => {
  it("never exposes deviceId or socketId to clients", () => {
    const h = host();
    const room = roomManager.createRoom(h, { playerCount: 2, targetScore: 50 });
    const summary = roomManager.toSummary(room);
    const serialized = JSON.stringify(summary);
    expect(serialized).not.toContain(h.deviceId);
    expect(serialized).not.toContain("socketId");
  });
});
