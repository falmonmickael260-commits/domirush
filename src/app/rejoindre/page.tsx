"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRoom } from "@/hooks/useRoom";
import { DEFAULT_AVATARS, getSavedProfile, randomAvatar } from "@/lib/identity";
import { AvatarPicker } from "@/components/lobby/AvatarPicker";

export default function RejoindrePage() {
  const router = useRouter();
  const { joinRoom, error } = useRoom();
  // Start with SSR-safe defaults, then hydrate from localStorage after mount.
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(DEFAULT_AVATARS[0]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reading localStorage must wait until after the SSR-matched first paint.
    const saved = getSavedProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(saved.name);
    setAvatar(saved.avatar || randomAvatar());
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || code.trim().length < 4) return;
    setLoading(true);
    try {
      await joinRoom(code.trim(), { name: name.trim(), avatar });
      router.push(`/salon/${code.trim().toUpperCase()}`);
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
      <p className="mb-8 text-center text-sm text-text-dim">Rejoindre une partie</p>

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
          Code de la partie
        </label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={6}
          placeholder="ABCD12"
          className="mb-8 w-full rounded-2xl bg-bg-panel px-4 py-3 text-center text-lg font-bold uppercase tracking-[0.3em] text-text outline-none ring-gold focus:ring-2"
        />

        {error && <p className="mb-4 text-center text-xs text-danger">{error}</p>}

        <motion.button
          whileTap={{ scale: 0.97 }}
          type="submit"
          disabled={!name.trim() || code.trim().length < 4 || loading}
          className="w-full rounded-2xl bg-gradient-to-b from-gold-bright to-gold py-3.5 text-sm font-extrabold uppercase tracking-wide text-ink shadow-lg shadow-black/30 disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Rejoindre la table"}
        </motion.button>
      </form>
    </div>
  );
}
