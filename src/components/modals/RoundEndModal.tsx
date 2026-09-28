"use client";

import { motion } from "framer-motion";
import type { PlayerState, RoundResult } from "@/game-engine";

export function RoundEndModal({
  result,
  players,
  scores,
  onContinue,
}: {
  result: RoundResult;
  players: PlayerState[];
  scores: Record<string, number>;
  onContinue: () => void;
}) {
  const winner = players.find((p) => p.id === result.winnerId);
  const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="w-full max-w-sm rounded-3xl bg-bg-elevated p-6 text-center shadow-2xl"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">
          Manche terminée
        </p>
        <p className="mt-1 text-2xl">{winner?.avatar}</p>
        <h2 className="mt-1 text-xl font-bold text-text">
          🏆 {winner?.name} gagne la manche
        </h2>
        <p className="mt-1 text-sm text-text-dim">
          {result.reason === "blocked" ? "Partie bloquée — " : ""}
          Points remportés :{" "}
          <span className="font-bold text-gold">+{result.pointsAwarded}</span>
        </p>

        <ul className="mt-5 flex flex-col gap-1.5 text-left">
          {ranked.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl bg-bg-panel px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 text-text">
                <span>{p.avatar}</span>
                {p.name}
              </span>
              <span className="font-bold text-gold">{scores[p.id] ?? 0}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onContinue}
          className="mt-6 w-full rounded-2xl bg-gradient-to-b from-gold-bright to-gold py-3 text-sm font-bold text-ink shadow-lg shadow-black/30 transition active:scale-[0.98]"
        >
          CONTINUER
        </button>
      </motion.div>
    </div>
  );
}
