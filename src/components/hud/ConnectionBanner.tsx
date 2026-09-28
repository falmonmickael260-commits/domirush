"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ConnectionStatus } from "@/hooks/useRoom";

export function ConnectionBanner({ status }: { status: ConnectionStatus }) {
  const [showBack, setShowBack] = useState(false);
  const [wasDisconnected, setWasDisconnected] = useState(false);

  useEffect(() => {
    if (status === "reconnecting") setWasDisconnected(true);
    if (status === "connected" && wasDisconnected) {
      setShowBack(true);
      setWasDisconnected(false);
      const t = setTimeout(() => setShowBack(false), 2200);
      return () => clearTimeout(t);
    }
  }, [status, wasDisconnected]);

  const message =
    status === "reconnecting"
      ? "Connexion perdue… reconnexion en cours"
      : showBack
        ? "Vous êtes de retour !"
        : null;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center pt-3"
        >
          <div
            className={`rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg ${
              status === "reconnecting" ? "bg-danger text-white" : "bg-success text-ink"
            }`}
          >
            {message}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
