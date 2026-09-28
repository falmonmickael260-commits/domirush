"use client";

import { useMemo, useState } from "react";
import { LayoutGroup } from "framer-motion";
import { computePlayableMoves, hasAnyPlayableMove } from "@/game-engine";
import type { Side } from "@/game-engine";
import type { GameViewModel } from "@/lib/viewModel";
import { computeSeatLayout } from "@/lib/viewModel";
import { GameTable } from "@/components/board/GameTable";
import { PlayerHand } from "@/components/hand/PlayerHand";
import { TopBar } from "@/components/hud/TopBar";
import { ScoreSheet } from "@/components/hud/ScoreSheet";
import { MenuSheet } from "@/components/hud/MenuSheet";
import { ActionBar } from "@/components/hud/ActionBar";
import { RoundEndModal } from "@/components/modals/RoundEndModal";
import { GameEndModal } from "@/components/modals/GameEndModal";

export interface GameViewProps {
  vm: GameViewModel;
  selectedTileId: string | null;
  onSelectTile: (tileId: string | null) => void;
  onPlayTile: (tileId: string, side: Side) => void;
  onDraw: () => void;
  onPass: () => void;
  onContinue: () => void;
  onRematch: () => void;
  onQuit: () => void;
  errorMessage?: string | null;
}

export function GameView({
  vm,
  selectedTileId,
  onSelectTile,
  onPlayTile,
  onDraw,
  onPass,
  onContinue,
  onRematch,
  onQuit,
  errorMessage,
}: GameViewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scoresOpen, setScoresOpen] = useState(false);

  const seats = useMemo(() => computeSeatLayout(vm.players, vm.myId), [vm.players, vm.myId]);
  const isMyTurn = vm.currentPlayerId === vm.myId;
  const activePlayer = vm.players.find((p) => p.id === vm.currentPlayerId) ?? null;

  const selectedTile = vm.myHand.find((t) => t.id === selectedTileId) ?? null;
  const playableSidesForSelected = selectedTile
    ? computePlayableMoves([selectedTile], vm.board)[selectedTile.id] ?? []
    : null;

  const iHaveAMove = hasAnyPlayableMove(vm.myHand, vm.board);
  const canDraw = isMyTurn && !iHaveAMove && vm.boneyardCount > 0;
  const canPass = isMyTurn && !iHaveAMove && vm.boneyardCount === 0;

  function handlePlayAt(side: Side) {
    if (!selectedTile) return;
    onPlayTile(selectedTile.id, side);
  }

  return (
    <LayoutGroup>
      <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-bg">
        <TopBar
          roundNumber={vm.roundNumber}
          targetScore={vm.targetScore}
          activePlayer={activePlayer}
          isMyTurn={isMyTurn}
          onOpenMenu={() => setMenuOpen(true)}
          onOpenScores={() => setScoresOpen(true)}
        />

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-2 sm:px-4">
          <GameTable
            seats={seats}
            activePlayerId={vm.currentPlayerId}
            handCounts={vm.handCounts}
            scores={vm.scores}
            board={vm.board}
            playableSidesForSelected={playableSidesForSelected}
            onPlayAt={handlePlayAt}
          />

          <ActionBar show={canDraw || canPass} canDraw={canDraw} canPass={canPass} onDraw={onDraw} onPass={onPass} />
        </div>

        {errorMessage && (
          <div className="pointer-events-none absolute inset-x-0 top-16 z-40 flex justify-center">
            <div className="rounded-full bg-danger/90 px-4 py-1.5 text-xs font-medium text-white shadow-lg">
              {errorMessage}
            </div>
          </div>
        )}

        <div className="relative z-20 border-t border-white/5 bg-bg-elevated/60">
          <PlayerHand
            hand={vm.myHand}
            board={vm.board}
            isMyTurn={isMyTurn}
            selectedTileId={selectedTileId}
            onSelect={onSelectTile}
          />
        </div>

        <MenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} onQuit={onQuit} />
        <ScoreSheet
          open={scoresOpen}
          onClose={() => setScoresOpen(false)}
          players={vm.players}
          scores={vm.scores}
          targetScore={vm.targetScore}
        />

        {vm.phase === "round_end" && vm.lastRoundResult && (
          <RoundEndModal
            result={vm.lastRoundResult}
            players={vm.players}
            scores={vm.scores}
            onContinue={onContinue}
          />
        )}

        {vm.phase === "game_end" && (
          <GameEndModal
            winner={vm.players.find((p) => p.id === vm.winnerId)}
            players={vm.players}
            scores={vm.scores}
            onRematch={onRematch}
            onLobby={onQuit}
          />
        )}
      </div>
    </LayoutGroup>
  );
}
