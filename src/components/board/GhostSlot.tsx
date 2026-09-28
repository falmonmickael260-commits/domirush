"use client";

import { motion } from "framer-motion";

export function GhostSlot({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="relative flex h-20 w-10 flex-shrink-0 items-center justify-center rounded-[16%] border-2 border-dashed border-gold/70 bg-gold/10"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: [0.55, 1, 0.55], scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ opacity: { duration: 1.3, repeat: Infinity, ease: "easeInOut" }, scale: { duration: 0.2 } }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-gold-bright" />
    </motion.button>
  );
}
