"use client";

import { useState } from "react";
import Link from "next/link";
import { Sheet } from "./Sheet";
import { getSoundEnabled, setSoundEnabled } from "@/lib/sound";

export function MenuSheet({
  open,
  onClose,
  onQuit,
}: {
  open: boolean;
  onClose: () => void;
  onQuit: () => void;
}) {
  const [sound, setSound] = useState(getSoundEnabled());
  const [confirmingQuit, setConfirmingQuit] = useState(false);

  return (
    <Sheet open={open} onClose={onClose} title="Menu">
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setSound((v) => {
              setSoundEnabled(!v);
              return !v;
            });
          }}
          className="flex items-center justify-between rounded-2xl bg-bg-panel px-4 py-3 text-sm font-medium text-text"
        >
          <span>🔊 Son</span>
          <span
            className={`h-6 w-11 rounded-full p-0.5 transition-colors ${sound ? "bg-gold" : "bg-bg"}`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                sound ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </span>
        </button>

        <Link
          href="/regles"
          className="rounded-2xl bg-bg-panel px-4 py-3 text-sm font-medium text-text hover:bg-bg-panel/70"
        >
          📖 Règles du jeu
        </Link>

        <Link
          href="/"
          className="rounded-2xl bg-bg-panel px-4 py-3 text-sm font-medium text-text hover:bg-bg-panel/70"
        >
          🏠 Retour à l&apos;accueil
        </Link>

        {!confirmingQuit ? (
          <button
            type="button"
            onClick={() => setConfirmingQuit(true)}
            className="mt-2 rounded-2xl border border-danger/40 px-4 py-3 text-sm font-semibold text-danger"
          >
            Quitter la partie
          </button>
        ) : (
          <div className="mt-2 flex flex-col gap-2 rounded-2xl border border-danger/40 p-3">
            <p className="text-xs text-text-dim">Quitter maintenant ? La partie sera perdue.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingQuit(false)}
                className="flex-1 rounded-xl bg-bg-panel py-2 text-xs font-medium text-text"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={onQuit}
                className="flex-1 rounded-xl bg-danger py-2 text-xs font-semibold text-white"
              >
                Confirmer
              </button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
