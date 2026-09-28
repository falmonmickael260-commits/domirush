"use client";

import { motion } from "framer-motion";
import { DominoSVG } from "@/components/domino/DominoSVG";

const TILES: [number, number][] = [
  [6, 6],
  [6, 3],
  [3, 1],
];

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-bg">
      <div className="flex items-end gap-2">
        {TILES.map(([a, b], i) => (
          <motion.div
            key={i}
            className="h-16 w-8"
            initial={{ opacity: 0, y: 16, rotate: -8 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{
              duration: 0.5,
              delay: i * 0.15,
              repeat: Infinity,
              repeatType: "reverse",
              repeatDelay: 0.6,
              ease: "easeOut",
            }}
          >
            <DominoSVG a={a} b={b} />
          </motion.div>
        ))}
      </div>
      <span className="wordmark text-xl font-extrabold tracking-wide">DOMIRUSH</span>
    </div>
  );
}
