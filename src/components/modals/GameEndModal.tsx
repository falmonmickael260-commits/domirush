"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { PlayerState } from "@/game-engine";
import { playSound } from "@/lib/sound";

const CONFETTI_COLORS = ["var(--color-gold)", "var(--color-gold-bright)", "var(--seat-2)", "var(--seat-3)", "var(--seat-4)"];

export function GameEndModal({
  winner,
  players,
  scores,
  onRematch,
  onLobby,
}: {
  winner: PlayerState | undefined;
  players: PlayerState[];
  scores: Record<string, number>;
  onRematch: () => void;
  onLobby: () => void;
}) {
  useEffect(() => {
    playSound("victory");
  }, []);

  const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));
  const confetti = Array.from({ length: 18 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/75 p-4 backdrop-blur-sm">
      {confetti.map((_, i) => (
        <motion.span
          key={i}
          className="absolute top-0 h-2 w-2 rounded-sm"
          style={{
            left: `${(i * 97) % 100}%`,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{ y: "110vh", opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{ duration: 3 + (i % 5) * 0.4, delay: (i % 6) * 0.15, repeat: Infinity, ease: "linear" }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative z-10 w-full max-w-sm rounded-3xl p-[1.5px]"
        style={{ background: "linear-gradient(135deg, var(--color-gold-bright), var(--color-gold-dim))" }}
      >
        <div className="rounded-3xl bg-bg-elevated p-6 text-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="text-5xl"
          >
            🏆
          </motion.div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold">Victoire</p>
          <h2 className="mt-1 text-2xl font-extrabold text-text">{winner?.name}</h2>
          <p className="text-sm text-text-dim">{scores[winner?.id ?? ""] ?? 0} points</p>

          <ul className="mt-5 flex flex-col gap-1.5 text-left">
            {ranked.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-xl bg-bg-panel px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 text-text">
                  <span className="w-4 text-text-faint">{i + 1}.</span>
                  <span>{p.avatar}</span>
                  {p.name}
                </span>
                <span className="font-bold text-gold">{scores[p.id] ?? 0}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={onRematch}
              className="w-full rounded-2xl bg-gradient-to-b from-gold-bright to-gold py-3 text-sm font-bold text-ink shadow-lg shadow-black/30 transition active:scale-[0.98]"
            >
              REJOUER
            </button>
            <button
              type="button"
              onClick={onLobby}
              className="w-full rounded-2xl bg-bg-panel py-3 text-sm font-semibold text-text transition active:scale-[0.98]"
            >
              RETOUR AU SALON
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
