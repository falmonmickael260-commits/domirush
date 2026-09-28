"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useMultiplayerGame } from "@/hooks/useMultiplayerGame";
import { useRoom } from "@/hooks/useRoom";
import { GameView } from "@/components/GameView";
import { ConnectionBanner } from "@/components/hud/ConnectionBanner";

export default function PartiePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { status, leaveRoom } = useRoom();
  const {
    viewModel,
    selectedTileId,
    selectTile,
    playTile,
    drawTile,
    pass,
    continueRound,
    rematch,
    error,
  } = useMultiplayerGame(code);

  if (!viewModel) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg">
        <ConnectionBanner status={status} />
        <span className="wordmark text-2xl font-extrabold">DOMIRUSH</span>
        <p className="text-sm text-text-dim">Connexion à la partie…</p>
      </div>
    );
  }

  return (
    <>
      <ConnectionBanner status={status} />
      <GameView
        vm={viewModel}
        selectedTileId={selectedTileId}
        onSelectTile={selectTile}
        onPlayTile={playTile}
        onDraw={drawTile}
        onPass={pass}
        onContinue={continueRound}
        onRematch={rematch}
        onQuit={() => {
          leaveRoom(code);
          router.push("/");
        }}
        errorMessage={error}
      />
    </>
  );
}
