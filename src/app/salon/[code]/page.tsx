"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useRoom } from "@/hooks/useRoom";
import { getSavedProfile } from "@/lib/identity";
import { deriveShortPlayerId } from "@/lib/playerId";
import { ConnectionBanner } from "@/components/hud/ConnectionBanner";
import { playSound } from "@/lib/sound";

export default function LobbyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();
  const { room, error, status, deviceId, joinRoom, leaveRoom, startGame } = useRoom();
  const [copied, setCopied] = useState(false);
  const myPlayerId = deriveShortPlayerId(deviceId);

  useEffect(() => {
    const profile = getSavedProfile();
    joinRoom(code, profile).catch(() => {
      router.push("/rejoindre");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  useEffect(() => {
    if (room?.status === "playing" || room?.status === "finished") {
      router.push(`/partie/${code}`);
    }
  }, [room?.status, code, router]);

  useEffect(() => {
    if (room && room.players.length > 1) playSound("join");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room?.players.length]);

  const isHost = room?.hostPlayerId === myPlayerId;
  const canStart = room ? room.players.length === room.config.playerCount : false;

  function copyCode() {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function shareCode() {
    const text = `Viens jouer à Domirush avec moi 🎲\nRejoins ma partie avec le code ${code}.`;
    if (navigator.share) {
      navigator.share({ title: "Domirush", text }).catch(() => {});
    } else {
      copyCode();
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center bg-bg px-5 py-10">
      <ConnectionBanner status={status} />

      <button
        type="button"
        onClick={() => {
          leaveRoom(code);
          router.push("/");
        }}
        className="absolute left-4 top-4 text-sm text-text-dim hover:text-text"
      >
        ← Quitter
      </button>

      <h1 className="wordmark mb-1 text-center text-3xl font-extrabold">DOMIRUSH</h1>
      <p className="mb-6 text-sm text-text-dim">Salon d&apos;attente</p>

      <div className="mb-6 flex flex-col items-center gap-2 rounded-3xl bg-bg-elevated px-8 py-5 shadow-xl">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-faint">
          Code de partie
        </span>
        <span className="wordmark text-4xl font-extrabold tracking-[0.2em]">{code}</span>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={copyCode}
            className="rounded-full bg-bg-panel px-4 py-2 text-xs font-semibold text-text"
          >
            {copied ? "Copié ✓" : "Copier le code"}
          </button>
          <button
            type="button"
            onClick={shareCode}
            className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink"
          >
            Partager
          </button>
        </div>
      </div>

      <p className="mb-3 text-xs text-text-faint">Partage le code avec tes amis</p>

      <div className="mb-8 w-full max-w-sm rounded-3xl bg-bg-elevated p-5 shadow-xl">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-text-faint">
          {room ? `${room.players.length} / ${room.config.playerCount} joueurs` : "Connexion…"}
        </p>
        <ul className="flex flex-col gap-2">
          {room?.players.map((p) => (
            <motion.li
              key={p.playerId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between rounded-2xl bg-bg-panel px-4 py-2.5"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-text">
                <span className="text-lg">{p.avatar}</span>
                {p.name}
                {p.playerId === room.hostPlayerId && (
                  <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold text-gold">
                    HÔTE
                  </span>
                )}
              </span>
              <span className={p.connected ? "text-success" : "text-text-faint"}>
                {p.connected ? "✓" : "…"}
              </span>
            </motion.li>
          ))}
          {room &&
            Array.from({ length: room.config.playerCount - room.players.length }).map((_, i) => (
              <li
                key={`empty-${i}`}
                className="flex items-center rounded-2xl border border-dashed border-white/10 px-4 py-2.5 text-sm text-text-faint"
              >
                En attente d&apos;un joueur…
              </li>
            ))}
        </ul>
      </div>

      {error && <p className="mb-4 text-center text-xs text-danger">{error}</p>}

      {isHost ? (
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!canStart}
          onClick={() => startGame(code)}
          className="w-full max-w-sm rounded-2xl bg-gradient-to-b from-gold-bright to-gold py-3.5 text-sm font-extrabold uppercase tracking-wide text-ink shadow-lg shadow-black/30 disabled:opacity-40"
        >
          Démarrer la partie
        </motion.button>
      ) : (
        <p className="text-sm text-text-dim">En attente que l&apos;hôte démarre la partie…</p>
      )}
    </div>
  );
}
