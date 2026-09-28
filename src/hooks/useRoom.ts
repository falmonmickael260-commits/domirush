"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socketClient";
import { getDeviceId, getSavedProfile, saveProfile, type PlayerProfile } from "@/lib/identity";
import { friendlyMessage } from "@/lib/errorMessages";
import type { PlayerCount, TargetScore } from "@/game-engine";
import type { RoomSummary } from "@/server/types";

const LAST_ROOM_KEY = "domirush:lastRoomCode";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting" | "disconnected";

export function useRoom() {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [room, setRoom] = useState<RoomSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deviceId] = useState(() => getDeviceId());
  const everConnectedRef = useRef(false);

  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      setStatus(everConnectedRef.current ? "connected" : "connected");
      const lastCode = localStorage.getItem(LAST_ROOM_KEY);
      if (lastCode) {
        const profile = getSavedProfile();
        socket.emit(
          "room:join",
          { deviceId, code: lastCode, name: profile.name, avatar: profile.avatar },
          () => {
            everConnectedRef.current = true;
          }
        );
      } else {
        everConnectedRef.current = true;
      }
    }
    function onDisconnect() {
      setStatus("reconnecting");
    }
    function onRoomUpdate(summary: RoomSummary) {
      setRoom(summary);
      localStorage.setItem(LAST_ROOM_KEY, summary.code);
    }
    function onGameError(payload: { code: string; message: string }) {
      setError(friendlyMessage(payload.code, payload.message));
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("room:update", onRoomUpdate);
    socket.on("game:error", onGameError);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("room:update", onRoomUpdate);
      socket.off("game:error", onGameError);
    };
  }, [deviceId]);

  const createRoom = useCallback(
    (profile: PlayerProfile, config: { playerCount: PlayerCount; targetScore: TargetScore }) => {
      saveProfile(profile);
      return new Promise<string>((resolve, reject) => {
        getSocket().emit(
          "room:create",
          { deviceId, name: profile.name, avatar: profile.avatar, ...config },
          (res) => {
            if (res.ok) {
              localStorage.setItem(LAST_ROOM_KEY, res.code);
              resolve(res.code);
            } else {
              setError(friendlyMessage(res.error));
              reject(new Error(res.error));
            }
          }
        );
      });
    },
    [deviceId]
  );

  const joinRoom = useCallback(
    (code: string, profile: PlayerProfile) => {
      saveProfile(profile);
      return new Promise<void>((resolve, reject) => {
        getSocket().emit(
          "room:join",
          { deviceId, code: code.toUpperCase(), name: profile.name, avatar: profile.avatar },
          (res) => {
            if (res.ok) {
              localStorage.setItem(LAST_ROOM_KEY, code.toUpperCase());
              resolve();
            } else {
              setError(friendlyMessage(res.error));
              reject(new Error(res.error));
            }
          }
        );
      });
    },
    [deviceId]
  );

  const leaveRoom = useCallback(
    (code: string) => {
      getSocket().emit("room:leave", { deviceId, code });
      localStorage.removeItem(LAST_ROOM_KEY);
      setRoom(null);
    },
    [deviceId]
  );

  const startGame = useCallback((code: string) => {
    getSocket().emit("game:start", { code });
  }, []);

  return { status, room, error, deviceId, createRoom, joinRoom, leaveRoom, startGame, setError };
}
