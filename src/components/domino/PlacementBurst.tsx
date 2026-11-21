import type { CSSProperties } from "react";
import type { Engraving, LandingEffect } from "@/lib/dominoEngravings";

const PARTICLES: Record<LandingEffect, string> = {
  sparks: "M8 1 10 6 15 8 10 10 8 15 6 10 1 8 6 6Z",
  crystals: "M8 0 14 8 8 16 2 8Z",
  orbit: "M8 3a5 5 0 1 0 0 10 5 5 0 1 0 0-10Z",
  wave: "M0 10Q4 2 8 8T16 6L16 10Q12 16 8 11T0 13Z",
  flame: "M8 0C15 7 16 11 11 15 3 17 1 11 5 6 5 10 8 10 8 0Z",
  bolt: "M11 0 2 9 7 9 5 16 15 5 9 6Z",
  petals: "M8 1C20 3 14 14 3 15 0 8 4 1 8 1Z",
  stars: "M8 0 10 5 16 6 12 10 13 16 8 13 3 16 4 10 0 6 6 5Z",
};

export function PlacementBurst({ engraving }: { engraving: Engraving }) {
  return (
    <span aria-hidden="true" className="placement-burst" data-placement-effect={engraving.effect}
      style={{ "--burst-color": engraving.burstColor ?? engraving.color } as CSSProperties}>
      {Array.from({ length: 12 }, (_, i) => {
        const angle = i * Math.PI / 6;
        const distance = 40 + (i % 3) * 10;
        return (
          <svg key={i} viewBox="0 0 16 16" className="placement-particle"
            style={{
              "--burst-x": `${Math.cos(angle) * distance}px`,
              "--burst-y": `${Math.sin(angle) * distance}px`,
              "--burst-angle": `${i * 40}deg`,
              "--burst-delay": `${i % 3 * 32}ms`,
            } as CSSProperties}>
            <path d={PARTICLES[engraving.effect]} fill="currentColor" />
          </svg>
        );
      })}
    </span>
  );
}
