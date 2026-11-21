"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-bg">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(212,175,106,0.16), transparent), radial-gradient(80% 60% at 50% 100%, rgba(27,82,62,0.45), transparent)",
        }}
      />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 w-full max-w-xl overflow-hidden rounded-[2rem] border border-gold/30 shadow-2xl shadow-black/40"
        >
          <Image src="/domirush.webp" alt="Domirush" width={1200} height={750} priority className="h-auto w-full" />
        </motion.h1>

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
