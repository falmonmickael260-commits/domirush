"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRoom } from "@/hooks/useRoom";
import { getSavedProfile, randomAvatar } from "@/lib/identity";
import { AvatarPicker } from "@/components/lobby/AvatarPicker";
import type { PlayerCount, TargetScore } from "@/game-engine";

export default function CreerPage() {
  const router = useRouter();
  const { createRoom, error } = useRoom();
  const saved = getSavedProfile();
  const [name, setName] = useState(saved.name);
  const [avatar, setAvatar] = useState(saved.avatar || randomAvatar());
  const [playerCount, setPlayerCount] = useState<PlayerCount>(4);
  const [targetScore, setTargetScore] = useState<TargetScore>(100);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const code = await createRoom({ name: name.trim(), avatar }, { playerCount, targetScore });
      router.push(`/salon/${code}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-5 py-10">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="absolute left-4 top-4 text-sm text-text-dim hover:text-text"
      >
        ← Accueil
      </button>

      <h1 className="wordmark mb-1 text-center text-3xl font-extrabold">DOMIRUSH</h1>
      <p className="mb-8 text-center text-sm text-text-dim">Créer une partie</p>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-3xl bg-bg-elevated p-6 shadow-xl"
      >
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-faint">
          Pseudo
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={16}
          placeholder="Votre pseudo"
          className="mb-5 w-full rounded-2xl bg-bg-panel px-4 py-3 text-sm text-text outline-none ring-gold focus:ring-2"
        />

        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-faint">
          Avatar
        </label>
        <div className="mb-6">
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>

        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-text-faint">
          Nombre de joueurs
        </label>
        <div className="mb-6 grid grid-cols-3 gap-2">
          {([2, 3, 4] as const).map((n) => (
            <button
              key={n}
              type="button"
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
              type="button"
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

        {error && <p className="mb-4 text-center text-xs text-danger">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={!name.trim() || loading}
          className="w-full rounded-2xl bg-gradient-to-b from-gold-bright to-gold py-3.5 text-sm font-extrabold uppercase tracking-wide text-ink shadow-lg shadow-black/30 disabled:opacity-50"
        >
          {loading ? "Création…" : "Créer la table"}
        </motion.button>
      </form>
    </div>
  );
}
