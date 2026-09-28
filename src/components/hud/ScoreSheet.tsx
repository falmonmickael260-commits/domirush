"use client";

import type { PlayerState } from "@/game-engine";
import { Sheet } from "./Sheet";

export function ScoreSheet({
  open,
  onClose,
  players,
  scores,
  targetScore,
}: {
  open: boolean;
  onClose: () => void;
  players: PlayerState[];
  scores: Record<string, number>;
  targetScore: number;
}) {
  const ranked = [...players].sort((a, b) => (scores[b.id] ?? 0) - (scores[a.id] ?? 0));

  return (
    <Sheet open={open} onClose={onClose} title="Scores">
      <ul className="flex flex-col gap-2">
        {ranked.map((p, i) => {
          const score = scores[p.id] ?? 0;
          const pct = Math.min(100, (score / targetScore) * 100);
          return (
            <li key={p.id} className="flex flex-col gap-1 rounded-2xl bg-bg-panel px-3 py-2.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-text">
                  <span className="text-base">{p.avatar}</span>
                  {p.name}
                  {i === 0 && score > 0 && <span className="text-xs">🏆</span>}
                </span>
                <span className="text-sm font-bold text-gold">{score}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-dim to-gold-bright transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-center text-xs text-text-faint">Partie en {targetScore} points</p>
    </Sheet>
  );
}
