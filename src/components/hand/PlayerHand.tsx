"use client";

import type { PlacedTile, Tile } from "@/game-engine";
import { computePlayableMoves } from "@/game-engine";
import { Domino } from "@/components/domino/Domino";

export interface PlayerHandProps {
  hand: Tile[];
  board: PlacedTile[];
  isMyTurn: boolean;
  selectedTileId: string | null;
  onSelect: (tileId: string | null) => void;
}

export function PlayerHand({ hand, board, isMyTurn, selectedTileId, onSelect }: PlayerHandProps) {
  const moves = computePlayableMoves(hand, board);

  return (
    <div className="no-scrollbar flex w-full items-end gap-2 overflow-x-auto px-4 pb-3 pt-6 sm:justify-center sm:gap-3">
      {hand.map((tile) => {
        const isPlayable = Boolean(moves[tile.id]);
        const isSelected = selectedTileId === tile.id;
        const state = !isMyTurn
          ? "normal"
          : isSelected
            ? "selected"
            : isPlayable
              ? "playable"
              : "unplayable";

        return (
          <Domino
            key={tile.id}
            id={tile.id}
            topValue={tile.a}
            bottomValue={tile.b}
            width={44}
            interactive={isMyTurn && isPlayable}
            state={state}
            onClick={() => onSelect(isSelected ? null : tile.id)}
          />
        );
      })}
    </div>
  );
}
