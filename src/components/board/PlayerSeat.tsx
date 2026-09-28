"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import type { PlayerState } from "@/game-engine";
import type { SeatPosition } from "@/lib/viewModel";

const POSITION_CLASSES: Record<SeatPosition["position"], string> = {
  south: "bottom-2 left-1/2 -translate-x-1/2",
  north: "top-2 left-1/2 -translate-x-1/2",
  east: "right-2 top-1/2 -translate-y-1/2",
  west: "left-2 top-1/2 -translate-y-1/2",
  topLeft: "top-2 left-[12%]",
  topRight: "top-2 right-[12%]",
};

export interface PlayerSeatProps {
  player: PlayerState;
  position: SeatPosition["position"];
  tileCount: number;
  isActive: boolean;
  score: number;
}

export function PlayerSeat({ player, position, tileCount, isActive, score }: PlayerSeatProps) {
  return (
    <div className={clsx("absolute z-20 flex flex-col items-center gap-1", POSITION_CLASSES[position])}>
      <div className="relative">
        {isActive && (
          <motion.div
            className="absolute -inset-1.5 rounded-full"
            style={{ boxShadow: `0 0 0 2px ${player.color}, 0 0 18px 2px ${player.color}` }}
            animate={{ opacity: [0.55, 1, 0.55] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <div
          className={clsx(
            "relative flex h-11 w-11 items-center justify-center rounded-full text-xl sm:h-14 sm:w-14 sm:text-2xl lg:h-16 lg:w-16 lg:text-3xl",
            "bg-bg-panel border-2"
          )}
          style={{ borderColor: player.color }}
        >
          {player.avatar}
          {!player.connected && (
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-danger ring-2 ring-bg-panel" />
          )}
        </div>
        <span className="absolute -bottom-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-bg-elevated px-1 text-[10px] font-bold text-text ring-2 ring-bg-panel">
          {tileCount}
        </span>
      </div>
      <div className="flex flex-col items-center rounded-full bg-bg-panel/80 px-2.5 py-0.5 backdrop-blur-sm">
        <span className="text-[11px] font-semibold leading-tight text-text sm:text-xs">
          {player.name}
        </span>
        <span className="text-[10px] font-medium leading-tight text-gold">{score} pts</span>
      </div>
    </div>
  );
}
