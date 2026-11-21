"use client";

import type { PlacedTile, Side } from "@/game-engine";
import type { SeatPosition } from "@/lib/viewModel";
import { useDominoShop } from "@/components/DominoSkinProvider";
import { BOARD_SKINS } from "@/lib/dominoSkins";
import { PlayerSeat } from "./PlayerSeat";
import { BoardChain } from "./BoardChain";

export interface GameTableProps {
  seats: SeatPosition[];
  activePlayerId: string | null;
  handCounts: Record<string, number>;
  scores: Record<string, number>;
  board: PlacedTile[];
  playableSidesForSelected: Side[] | null;
  onPlayAt: (side: Side) => void;
}

export function GameTable({
  seats,
  activePlayerId,
  handCounts,
  scores,
  board,
  playableSidesForSelected,
  onPlayAt,
}: GameTableProps) {
  const { shop } = useDominoShop();
  const table = BOARD_SKINS[shop.equippedBoard];

  return (
    <div
      className="relative mx-auto aspect-[4/5] max-h-full w-full max-w-lg rounded-[28px] p-3 sm:aspect-[16/9] sm:max-w-6xl sm:p-6"
      style={{
        background:
          `radial-gradient(120% 140% at 50% 0%, ${table.rail} 0%, ${table.felt} 75%)`,
        boxShadow:
          "inset 0 2px 6px rgba(255,255,255,0.12), inset 0 -10px 24px rgba(0,0,0,0.45), 0 20px 40px -12px rgba(0,0,0,0.6)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-3 rounded-[22px] opacity-25 sm:inset-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 9px)",
        }}
      />

      <div
        className="relative h-full w-full rounded-[20px] border-2"
        style={{
          borderColor: table.border,
          background:
            `radial-gradient(80% 90% at 50% 35%, ${table.felt} 30%, ${table.rail} 160%)`,
          boxShadow: "inset 0 6px 18px rgba(0,0,0,0.55)",
        }}
      >
        {seats.map((seat) => (
          <PlayerSeat
            key={seat.player.id}
            player={seat.player}
            position={seat.position === "east" ? "topRight" : seat.position === "west" ? "topLeft" : seat.position}
            tileCount={handCounts[seat.player.id] ?? 0}
            isActive={seat.player.id === activePlayerId}
            score={scores[seat.player.id] ?? 0}
          />
        ))}

        <div className="absolute inset-x-3 bottom-[23%] top-[26%] flex items-center justify-center sm:inset-x-6">
          <div className="h-full w-full">
            <BoardChain
              board={board}
              playableSidesForSelected={playableSidesForSelected}
              onPlayAt={onPlayAt}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
