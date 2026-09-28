"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createInitialGameState,
  currentPlayer,
  gameReducer,
  decideAiMove,
  aiThinkingDelayMs,
} from "@/game-engine";
import type { GameState, PlayerState, Side, TargetScore } from "@/game-engine";
import { playSound } from "@/lib/sound";
import { viewModelFromGameState } from "@/lib/viewModel";
import { friendlyMessage } from "@/lib/errorMessages";
import { GameError } from "@/game-engine";

export interface SoloGameOptions {
  playerCount: 2 | 3 | 4;
  targetScore: TargetScore;
  humanName: string;
}

const AI_NAMES = ["Léa", "Noah", "Chloé", "Hugo", "Emma", "Louis"];
const AVATARS = ["🦊", "🐼", "🦁", "🐨", "🐸", "🦉"];
const SEAT_COLORS = ["var(--seat-1)", "var(--seat-2)", "var(--seat-3)", "var(--seat-4)"];

function buildPlayers(options: SoloGameOptions): PlayerState[] {
  const shuffledNames = [...AI_NAMES].sort(() => Math.random() - 0.5);
  const players: PlayerState[] = [
    {
      id: "you",
      name: options.humanName || "Vous",
      avatar: "🙂",
      color: SEAT_COLORS[0],
      kind: "human",
      connected: true,
      seat: 0,
    },
  ];
  for (let i = 1; i < options.playerCount; i++) {
    players.push({
      id: `ai-${i}`,
      name: shuffledNames[i - 1],
      avatar: AVATARS[i - 1],
      color: SEAT_COLORS[i],
      kind: "ai",
      connected: true,
      seat: i,
    });
  }
  return players;
}

export function useSoloGame(options: SoloGameOptions) {
  const [state, setState] = useState<GameState>(() => {
    const players = buildPlayers(options);
    const initial = createInitialGameState(
      `solo-${Date.now()}`,
      players,
      { playerCount: options.playerCount, targetScore: options.targetScore }
    );
    return gameReducer(initial, { type: "START_GAME" });
  });
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dispatch = useCallback((updater: (s: GameState) => GameState) => {
    setState((prev) => {
      try {
        const next = updater(prev);
        setError(null);
        return next;
      } catch (err) {
        const code = err instanceof GameError ? err.code : undefined;
        setError(friendlyMessage(code, err instanceof Error ? err.message : undefined));
        playSound("error");
        return prev;
      }
    });
  }, []);

  const playTile = useCallback(
    (tileId: string, side: Side) => {
      dispatch((s) => gameReducer(s, { type: "PLAY_TILE", playerId: "you", tileId, side }));
      setSelectedTileId(null);
      playSound("place");
    },
    [dispatch]
  );

  const drawTile = useCallback(() => {
    dispatch((s) => gameReducer(s, { type: "DRAW_TILE", playerId: "you" }));
    playSound("click");
  }, [dispatch]);

  const pass = useCallback(() => {
    dispatch((s) => gameReducer(s, { type: "PASS", playerId: "you" }));
    playSound("click");
  }, [dispatch]);

  const continueRound = useCallback(() => {
    dispatch((s) => gameReducer(s, { type: "CONTINUE" }));
    playSound("turn");
  }, [dispatch]);

  const rematch = useCallback(() => {
    dispatch((s) => gameReducer(s, { type: "REMATCH" }));
  }, [dispatch]);

  const selectTile = useCallback((tileId: string | null) => {
    setSelectedTileId(tileId);
    if (tileId) playSound("click");
  }, []);

  // Drive AI turns.
  useEffect(() => {
    if (state.phase !== "playing") return;
    const active = currentPlayer(state);
    if (active.kind !== "ai") return;

    aiTimeoutRef.current = setTimeout(() => {
      setState((prev) => {
        if (prev.phase !== "playing") return prev;
        const player = currentPlayer(prev);
        if (player.kind !== "ai" || player.id !== active.id) return prev;
        try {
          const decision = decideAiMove(prev, player.id);
          if (decision.action === "play") {
            const next = gameReducer(prev, {
              type: "PLAY_TILE",
              playerId: player.id,
              tileId: decision.tileId!,
              side: decision.side!,
            });
            playSound("place");
            return next;
          }
          if (decision.action === "draw") {
            return gameReducer(prev, { type: "DRAW_TILE", playerId: player.id });
          }
          return gameReducer(prev, { type: "PASS", playerId: player.id });
        } catch {
          return prev;
        }
      });
    }, aiThinkingDelayMs());

    return () => {
      if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sequence, state.phase]);

  // Play a subtle cue whenever the turn changes to the human.
  const lastTurnPlayerRef = useRef<string | null>(null);
  useEffect(() => {
    const active = state.phase === "playing" ? currentPlayer(state).id : null;
    if (active && active !== lastTurnPlayerRef.current && active === "you") {
      playSound("turn");
    }
    lastTurnPlayerRef.current = active;
  }, [state]);

  const viewModel = useMemo(() => viewModelFromGameState(state, "you"), [state]);

  return {
    state,
    viewModel,
    selectedTileId,
    selectTile,
    playTile,
    drawTile,
    pass,
    continueRound,
    rematch,
    error,
  };
}
