"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSoloGame } from "@/hooks/useSoloGame";
import { GameView } from "@/components/GameView";
import type { TargetScore } from "@/game-engine";

interface SoloConfig {
  playerCount: 2 | 3 | 4;
  targetScore: TargetScore;
}

function SoloSetup({ onStart }: { onStart: (config: SoloConfig) => void }) {
  const [playerCount, setPlayerCount] = useState<2 | 3 | 4>(4);
  const [targetScore, setTargetScore] = useState<TargetScore>(100);
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 bg-bg px-5 py-10">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="absolute left-4 top-4 text-sm text-text-dim hover:text-text"
      >
        ← Accueil
      </button>

      <div className="text-center">
        <h1 className="wordmark text-3xl font-extrabold">DOMIRUSH</h1>
        <p className="mt-1 text-sm text-text-dim">Mode solo — affrontez l&apos;IA</p>
      </div>

      <div className="w-full max-w-sm rounded-3xl bg-bg-elevated p-6 shadow-xl">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-faint">
          Nombre de joueurs
        </label>
        <div className="mb-6 grid grid-cols-3 gap-2">
          {([2, 3, 4] as const).map((n) => (
            <button
              key={n}
              onClick={() => setPlayerCount(n)}
              className={`rounded-2xl py-3 text-sm font-bold transition ${
                playerCount === n
                  ? "bg-gradient-to-b from-gold-bright to-gold text-ink"
                  : "bg-bg-panel text-text-dim"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-faint">
          Partie en
        </label>
        <div className="mb-8 grid grid-cols-2 gap-2">
          {([50, 100] as const).map((n) => (
            <button
              key={n}
              onClick={() => setTargetScore(n)}
              className={`rounded-2xl py-3 text-sm font-bold transition ${
                targetScore === n
                  ? "bg-gradient-to-b from-gold-bright to-gold text-ink"
                  : "bg-bg-panel text-text-dim"
              }`}
            >
              {n} points
            </button>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => onStart({ playerCount, targetScore })}
          className="w-full rounded-2xl bg-gradient-to-b from-gold-bright to-gold py-3.5 text-sm font-extrabold uppercase tracking-wide text-ink shadow-lg shadow-black/30"
        >
          Jouer en solo
        </motion.button>
      </div>
    </div>
  );
}

function SoloGame({ config }: { config: SoloConfig }) {
  const router = useRouter();
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
  } = useSoloGame({ ...config, humanName: "Vous" });

  return (
    <GameView
      vm={viewModel}
      selectedTileId={selectedTileId}
      onSelectTile={selectTile}
      onPlayTile={playTile}
      onDraw={drawTile}
      onPass={pass}
      onContinue={continueRound}
      onRematch={rematch}
      onQuit={() => router.push("/")}
      errorMessage={error}
    />
  );
}

export default function SoloPage() {
  const [config, setConfig] = useState<SoloConfig | null>(null);
  if (!config) return <SoloSetup onStart={setConfig} />;
  return <SoloGame config={config} />;
}
