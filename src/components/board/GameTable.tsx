"use client";

import type { PlacedTile, Side } from "@/game-engine";
import type { SeatPosition } from "@/lib/viewModel";
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
  return (
    <div
      className="relative mx-auto aspect-[4/5] max-h-full w-full max-w-lg rounded-[28px] p-3 sm:aspect-[16/9] sm:max-w-6xl sm:p-6"
      style={{
        background:
          "radial-gradient(120% 140% at 50% 0%, var(--color-wood-light) 0%, var(--color-wood) 45%, var(--color-wood-dark) 100%)",
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
          borderColor: "var(--color-wood-rail)",
          background:
            "radial-gradient(80% 90% at 50% 50%, var(--color-felt) 0%, #0f1712 100%)",
          boxShadow: "inset 0 6px 18px rgba(0,0,0,0.55)",
        }}
      >
        {seats.map((seat) => (
          <PlayerSeat
            key={seat.player.id}
            player={seat.player}
            position={seat.position}
            tileCount={handCounts[seat.player.id] ?? 0}
            isActive={seat.player.id === activePlayerId}
            score={scores[seat.player.id] ?? 0}
          />
        ))}

        <div className="absolute inset-0 flex items-center justify-center px-16 sm:px-24">
          <div className="h-24 w-full sm:h-40 lg:h-52">
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
