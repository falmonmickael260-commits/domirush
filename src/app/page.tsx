"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-bg">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(212,175,106,0.16), transparent), radial-gradient(80% 60% at 50% 100%, rgba(107,66,38,0.35), transparent)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="wordmark text-5xl font-extrabold tracking-tight sm:text-7xl"
        >
          DOMIRUSH
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-3 text-base text-text-dim sm:text-lg"
        >
          Le domino. À plusieurs. En ligne.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="my-10 flex items-center justify-center gap-2"
        >
          {[
            [6, 6],
            [6, 3],
            [3, 1],
          ].map(([a, b], i) => (
            <div
              key={i}
              className="flex h-16 w-8 flex-col items-center justify-center rounded-lg border border-gold-dim/40 bg-gradient-to-b from-ivory to-ivory-dim shadow-lg sm:h-20 sm:w-10"
              style={{ transform: `translateY(${i % 2 === 0 ? 4 : -4}px) rotate(${(i - 1) * 4}deg)` }}
            >
              <span className="text-[10px] font-bold text-ink/70 sm:text-xs">{a}</span>
              <span className="my-0.5 h-px w-4 bg-ink/20" />
              <span className="text-[10px] font-bold text-ink/70 sm:text-xs">{b}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex w-full max-w-xs flex-col gap-3"
        >
          <Link
            href="/solo"
            className="rounded-2xl bg-gradient-to-b from-gold-bright to-gold py-3.5 text-sm font-extrabold uppercase tracking-wide text-ink shadow-lg shadow-black/30 transition active:scale-[0.98]"
          >
            Jouer en solo
          </Link>
          <Link
            href="/creer"
            className="rounded-2xl bg-bg-elevated py-3.5 text-sm font-bold text-text shadow-md transition active:scale-[0.98]"
          >
            Créer une partie
          </Link>
          <Link
            href="/rejoindre"
            className="rounded-2xl bg-bg-elevated py-3.5 text-sm font-bold text-text shadow-md transition active:scale-[0.98]"
          >
            Rejoindre une partie
          </Link>
        </motion.div>

        <p className="mt-8 text-xs text-text-faint">Joue avec ta famille et tes amis.</p>

        <Link href="/regles" className="mt-4 text-xs font-medium text-text-dim underline underline-offset-4">
          Comment jouer ?
        </Link>
      </div>
    </main>
  );
}
