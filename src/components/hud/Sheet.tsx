"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label={title}
            className="relative z-10 w-full max-w-md rounded-t-3xl bg-bg-elevated p-5 shadow-2xl sm:rounded-3xl"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-dim hover:text-text"
              >
                ✕
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
