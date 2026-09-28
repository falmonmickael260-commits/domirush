"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { PlayerState } from "@/game-engine";

export interface TopBarProps {
  roundNumber: number;
  targetScore: number;
  activePlayer: PlayerState | null;
  isMyTurn: boolean;
  onOpenMenu: () => void;
  onOpenScores: () => void;
  roomCode?: string;
}

export function TopBar({
  roundNumber,
  targetScore,
  activePlayer,
  isMyTurn,
  onOpenMenu,
  onOpenScores,
}: TopBarProps) {
  return (
    <div className="relative z-30 flex items-center justify-between gap-2 px-3 py-2.5 sm:px-5">
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="Menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-panel/90 text-text-dim transition hover:text-gold"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </button>

      <div className="flex flex-col items-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={activePlayer?.id ?? "none"}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.25 }}
            className="text-xs font-semibold uppercase tracking-wide text-text-dim sm:text-sm"
          >
            {isMyTurn ? "À vous de jouer" : `Tour de ${activePlayer?.name ?? "…"}`}
          </motion.span>
        </AnimatePresence>
        <span className="text-[10px] text-text-faint">
          Manche {roundNumber} · objectif {targetScore} pts
        </span>
      </div>

      <button
        type="button"
        onClick={onOpenScores}
        aria-label="Scores"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-bg-panel/90 text-text-dim transition hover:text-gold"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 20V10M12 20V4M18 20v-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
