"use client";

import { useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { PlacedTile, Side } from "@/game-engine";
import { computeChainLayout, pickWorldTileSize } from "@/lib/boardCamera";
import { useBoardCamera } from "@/hooks/useBoardCamera";
import { useMeasuredSize } from "@/hooks/useMeasuredSize";
import { Domino } from "@/components/domino/Domino";
import { GhostSlot } from "./GhostSlot";

export interface BoardChainProps {
  board: PlacedTile[];
  playableSidesForSelected: Side[] | null;
  onPlayAt: (side: Side) => void;
}

/**
 * Renders the domino chain on a "dynamic camera": every tile lives in a fixed
 * world-space coordinate system (see lib/boardCamera), and a single
 * transformed layer pans/zooms to keep the whole chain framed, centered on
 * its true geometric center — never on the last tile played. See
 * useBoardCamera for the interpolation itself.
 */
export function BoardChain({ board, playableSidesForSelected, onPlayAt }: BoardChainProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const viewport = useMeasuredSize(viewportRef);
  const worldTileSize = pickWorldTileSize(viewport.width);

  const { tiles, bounds } = useMemo(
    () => computeChainLayout(board, worldTileSize),
    [board, worldTileSize]
  );
  const { x, y, scale } = useBoardCamera(bounds, viewport);

  const ghostGap = worldTileSize * 0.35;
  const showLeftGhost = board.length === 0 || playableSidesForSelected?.includes("left");
  const showRightGhost = board.length > 0 && playableSidesForSelected?.includes("right");
  const leftGhostCx = board.length === 0 ? 0 : bounds.minX - ghostGap;
  const rightGhostCx = bounds.maxX + ghostGap;

  return (
    <div ref={viewportRef} data-board-viewport className="relative h-full w-full overflow-hidden">
      <motion.div className="absolute left-1/2 top-1/2" style={{ x, y, scale }}>
        <AnimatePresence>
          {showLeftGhost && (
            <div
              key="ghost-left"
              style={{ position: "absolute", left: leftGhostCx, top: 0, transform: "translate(-50%, -50%)" }}
            >
              <GhostSlot label="Jouer à gauche" onClick={() => onPlayAt("left")} />
            </div>
          )}
        </AnimatePresence>

        {tiles.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-center"
            style={{
              position: "absolute",
              left: t.cx,
              top: t.cy,
              width: t.width,
              height: t.height,
              transform: "translate(-50%, -50%)",
            }}
          >
            <Domino
              id={t.id}
              topValue={t.left}
              bottomValue={t.right}
              width={worldTileSize}
              rotationDeg={t.rotationDeg}
              state="placed"
            />
          </div>
        ))}

        <AnimatePresence>
          {showRightGhost && (
            <div
              key="ghost-right"
              style={{ position: "absolute", left: rightGhostCx, top: 0, transform: "translate(-50%, -50%)" }}
            >
              <GhostSlot label="Jouer à droite" onClick={() => onPlayAt("right")} />
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
