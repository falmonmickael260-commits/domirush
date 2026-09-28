"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import type { PlacedTile, Side } from "@/game-engine";
import { Domino } from "@/components/domino/Domino";
import { GhostSlot } from "./GhostSlot";

export interface BoardChainProps {
  board: PlacedTile[];
  playableSidesForSelected: Side[] | null;
  onPlayAt: (side: Side) => void;
  tileSize?: number;
}

export function BoardChain({
  board,
  playableSidesForSelected,
  onPlayAt,
  tileSize = 34,
}: BoardChainProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
  }, [board.length]);

  const showLeftGhost = board.length === 0 || playableSidesForSelected?.includes("left");
  const showRightGhost = board.length > 0 && playableSidesForSelected?.includes("right");

  return (
    <div
      ref={scrollRef}
      className="no-scrollbar flex h-full w-full items-center gap-1 overflow-x-auto px-6"
      style={{ maskImage: "linear-gradient(90deg, transparent, black 6%, black 94%, transparent)" }}
    >
      <div className="flex flex-shrink-0 items-center gap-1 mx-auto">
        <AnimatePresence>
          {showLeftGhost && (
            <GhostSlot key="ghost-left" label="Jouer à gauche" onClick={() => onPlayAt("left")} />
          )}
        </AnimatePresence>

        {board.map((placed) => {
          const isDouble = placed.tile.a === placed.tile.b;
          const w = isDouble ? tileSize : tileSize * 2;
          const h = isDouble ? tileSize * 2 : tileSize;
          return (
            <div
              key={placed.tile.id}
              className="flex flex-shrink-0 items-center justify-center"
              style={{ width: w, height: h }}
            >
              <Domino
                id={placed.tile.id}
                topValue={placed.left}
                bottomValue={placed.right}
                width={tileSize}
                rotationDeg={isDouble ? 0 : -90}
                state="placed"
              />
            </div>
          );
        })}

        <AnimatePresence>
          {showRightGhost && (
            <GhostSlot key="ghost-right" label="Jouer à droite" onClick={() => onPlayAt("right")} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
