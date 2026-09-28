"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSocket } from "@/lib/socketClient";
import { getDeviceId } from "@/lib/identity";
import { deriveShortPlayerId } from "@/lib/playerId";
import { friendlyMessage } from "@/lib/errorMessages";
import { playSound } from "@/lib/sound";
import { viewModelFromRedacted } from "@/lib/viewModel";
import type { RedactedGameState, Side } from "@/game-engine";

export function useMultiplayerGame(code: string) {
  const [state, setState] = useState<RedactedGameState | null>(null);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deviceId = useMemo(() => getDeviceId(), []);
  const myId = useMemo(() => deriveShortPlayerId(deviceId), [deviceId]);

  useEffect(() => {
    const socket = getSocket();
    function onState(next: RedactedGameState) {
      setState((prev) => {
        if (prev && next.lastMove?.type === "play" && next.lastMove.playerId !== myId) {
          playSound("place");
        }
        return next;
      });
      setError(null);
    }
    function onError(payload: { code: string; message: string }) {
      setError(friendlyMessage(payload.code, payload.message));
      playSound("error");
    }
    socket.on("game:state", onState);
    socket.on("game:error", onError);
    return () => {
      socket.off("game:state", onState);
      socket.off("game:error", onError);
    };
  }, [myId]);

  const playTile = useCallback(
    (tileId: string, side: Side) => {
      getSocket().emit("game:play_tile", { code, tileId, side });
      setSelectedTileId(null);
      playSound("place");
    },
    [code]
  );

  const drawTile = useCallback(() => {
    getSocket().emit("game:draw", { code });
    playSound("click");
  }, [code]);

  const pass = useCallback(() => {
    getSocket().emit("game:pass", { code });
    playSound("click");
  }, [code]);

  const continueRound = useCallback(() => {
    getSocket().emit("game:continue", { code });
  }, [code]);

  const rematch = useCallback(() => {
    getSocket().emit("game:rematch", { code });
  }, [code]);

  const selectTile = useCallback((tileId: string | null) => {
    setSelectedTileId(tileId);
    if (tileId) playSound("click");
  }, []);

  const viewModel = useMemo(() => (state ? viewModelFromRedacted(state, myId) : null), [state, myId]);

  return { viewModel, selectedTileId, selectTile, playTile, drawTile, pass, continueRound, rematch, error, myId };
}
