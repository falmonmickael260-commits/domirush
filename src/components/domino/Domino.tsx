"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { DominoSVG } from "./DominoSVG";

export type DominoVisualState =
  | "normal"
  | "selected"
  | "playable"
  | "unplayable"
  | "placed";

export interface DominoProps {
  id: string;
  topValue: number;
  bottomValue: number;
  width?: number;
  rotationDeg?: 0 | 90 | -90 | 180;
  state?: DominoVisualState;
  interactive?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
}

export function Domino({
  id,
  topValue,
  bottomValue,
  width = 64,
  rotationDeg = 0,
  state = "normal",
  interactive = false,
  onClick,
  ariaLabel,
}: DominoProps) {
  const height = width * 2;
  const isUnplayable = state === "unplayable";
  const isSelected = state === "selected";
  const isPlayable = state === "playable";

  return (
    <motion.button
      type="button"
      layoutId={id}
      layout
      disabled={!interactive || isUnplayable}
      onClick={onClick}
      aria-label={ariaLabel ?? `Domino ${topValue}-${bottomValue}`}
      aria-pressed={isSelected}
      className={clsx(
        "relative rounded-[16%] outline-none select-none",
        interactive && !isUnplayable ? "cursor-pointer" : "cursor-default",
        interactive && "focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      )}
      style={{ width, height, touchAction: "manipulation" }}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{
        opacity: isUnplayable ? 0.45 : 1,
        scale: isSelected ? 1 : 1,
        rotate: rotationDeg,
        y: isSelected ? -14 : 0,
        filter: isUnplayable ? "saturate(0.35) brightness(0.85)" : "saturate(1) brightness(1)",
      }}
      whileHover={
        interactive && !isUnplayable
          ? { y: -10, scale: 1.05, transition: { duration: 0.18, ease: "easeOut" } }
          : undefined
      }
      whileTap={interactive && !isUnplayable ? { scale: 0.97 } : undefined}
      transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.9 }}
    >
      <div
        className={clsx(
          "absolute inset-0 rounded-[16%] transition-shadow duration-200",
          isSelected && "shadow-[0_0_0_3px_var(--color-gold-bright),0_10px_24px_-6px_rgba(0,0,0,0.55)]",
          isPlayable && !isSelected && "shadow-[0_0_0_2px_rgba(212,175,106,0.55),0_8px_18px_-8px_rgba(0,0,0,0.5)]",
          !isSelected && !isPlayable && "shadow-[0_6px_14px_-6px_rgba(0,0,0,0.55)]"
        )}
      />
      <DominoSVG a={topValue} b={bottomValue} className="relative block w-full h-full" />
    </motion.button>
  );
}
