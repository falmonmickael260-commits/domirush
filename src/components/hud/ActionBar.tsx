"use client";

import { AnimatePresence, motion } from "framer-motion";

export function ActionBar({
  show,
  canDraw,
  canPass,
  onDraw,
  onPass,
}: {
  show: boolean;
  canDraw: boolean;
  canPass: boolean;
  onDraw: () => void;
  onPass: () => void;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          className="pointer-events-none absolute inset-x-0 bottom-[104px] z-20 flex justify-center sm:bottom-[120px]"
        >
          <div className="pointer-events-auto flex gap-2 rounded-full bg-bg-elevated/95 px-2 py-2 shadow-xl backdrop-blur-sm">
            {canDraw && (
              <button
                type="button"
                onClick={onDraw}
                className="rounded-full bg-gold px-5 py-2 text-sm font-bold text-ink transition active:scale-95"
              >
                Piocher
              </button>
            )}
            {canPass && (
              <button
                type="button"
                onClick={onPass}
                className="rounded-full bg-bg-panel px-5 py-2 text-sm font-semibold text-text transition active:scale-95"
              >
                Passer
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
