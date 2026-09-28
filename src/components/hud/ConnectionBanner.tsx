"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ConnectionStatus } from "@/hooks/useRoom";

export function ConnectionBanner({ status }: { status: ConnectionStatus }) {
  const [prevStatus, setPrevStatus] = useState(status);
  const [wasDisconnected, setWasDisconnected] = useState(false);
  const [showBack, setShowBack] = useState(false);

  // Derive transition state during render (no effect needed for this part):
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-state-based-on-a-prop-change
  if (status !== prevStatus) {
    setPrevStatus(status);
    if (status === "reconnecting") setWasDisconnected(true);
    if (status === "connected" && wasDisconnected) {
      setWasDisconnected(false);
      setShowBack(true);
    }
  }

  // A real effect: manage the auto-hide timer for the "back" toast.
  useEffect(() => {
    if (!showBack) return;
    const t = setTimeout(() => setShowBack(false), 2200);
    return () => clearTimeout(t);
  }, [showBack]);

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
