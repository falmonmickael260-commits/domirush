"use client";

import { useId } from "react";
import { DOMINO_SKINS, type DominoSkin } from "@/lib/dominoSkins";
import { useDominoShop } from "@/components/DominoSkinProvider";
import { DOMINO_ENGRAVINGS } from "@/lib/dominoEngravings";
import { PIP_LAYOUTS } from "@/lib/pips";

interface DominoFaceProps {
  value: number;
  cx: number;
  cy: number;
  half: number;
  pipRadius: number;
  pip: string;
}

function DominoFace({ value, cx, cy, half, pipRadius, pip }: DominoFaceProps) {
  const layout = PIP_LAYOUTS[value] ?? [];
  const inset = half * 0.62;
  const step = inset;
  const originX = cx - step / 2;
  const originY = cy - step / 2;

  return (
    <g>
      {layout.map(([col, row], i) => (
        <circle
          key={i}
          cx={originX + (col * step) / 2}
          cy={originY + (row * step) / 2}
          r={pipRadius}
          fill={pip}
        />
      ))}
    </g>
  );
}

export interface DominoSVGProps {
  a: number;
  b: number;
  className?: string;
  skin?: DominoSkin;
  previewEffects?: boolean;
}

/**
 * Renders a single domino tile as a crisp, resolution-independent SVG.
 * Always drawn in its natural "vertical" orientation (two halves stacked
 * top/bottom); rotate the wrapping element for horizontal placements.
 */
export function DominoSVG({ a, b, className, skin, previewEffects }: DominoSVGProps) {
  const { shop } = useDominoShop();
  const selectedSkin = skin ?? shop.equipped;
  const colors = DOMINO_SKINS[selectedSkin];
  const engraving = DOMINO_ENGRAVINGS[selectedSkin];
  const id = useId();
  const W = 100;
  const H = 200;
  const r = 16;
  const half = W;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      role="img"
      aria-label={`Domino ${a}-${b}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id={`${id}-tile`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={colors.face} />
          <stop offset="42%" stopColor={colors.face} />
          <stop offset="100%" stopColor={colors.shade} />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="18%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {previewEffects && engraving && (
          <>
            <clipPath id={`${id}-face-clip`}><rect x={3} y={3} width={94} height={194} rx={r} /></clipPath>
            <linearGradient id={`${id}-reflection`}>
              <stop offset="0%" stopColor={engraving.color} stopOpacity="0" />
              <stop offset="50%" stopColor={engraving.color} stopOpacity="0.65" />
              <stop offset="100%" stopColor={engraving.color} stopOpacity="0" />
            </linearGradient>
          </>
        )}
        <filter id={`${id}-shadow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      <rect
        x={1.5}
        y={1.5}
        width={W - 3}
        height={H - 3}
        rx={r}
        fill={`url(#${id}-tile)`}
        stroke={colors.edge}
        strokeWidth={2.5}
        filter={`url(#${id}-shadow)`}
      />
      <rect x={1.5} y={1.5} width={W - 3} height={H - 3} rx={r} fill={`url(#${id}-sheen)`} />
      {engraving && (
        <g aria-hidden="true" data-domino-engraving={selectedSkin}>
          <rect x={5} y={5} width={90} height={190} rx={13} fill="none" stroke={colors.edge} opacity={0.55} />
          {[false, true].map(mirrored => (
            <g key={Number(mirrored)} transform={mirrored ? "rotate(180 50 100)" : undefined}
              fill="none" stroke={engraving.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" opacity={0.65}>
              {engraving.strokes.map((stroke, index) => (
                <polyline key={index} points={stroke.map(point => point.join(",")).join(" ")} />
              ))}
            </g>
          ))}
        </g>
      )}

      <line
        x1={W * 0.14}
        y1={H / 2}
        x2={W * 0.86}
        y2={H / 2}
        stroke={colors.edge}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
      <line
        x1={W * 0.14}
        y1={H / 2 + 2.5}
        x2={W * 0.86}
        y2={H / 2 + 2.5}
        stroke="#fff"
        strokeOpacity={0.4}
        strokeWidth={1.5}
        strokeLinecap="round"
      />

      {previewEffects && engraving && (
        <g aria-hidden="true" clipPath={`url(#${id}-face-clip)`}>
          <rect className="domino-preview-reflection" x={-70} y={-40} width={48} height={260}
            fill={`url(#${id}-reflection)`} />
        </g>
      )}

      <DominoFace value={a} cx={half / 2} cy={H * 0.27} half={half} pipRadius={7.5} pip={colors.pip} />
      <DominoFace value={b} cx={half / 2} cy={H * 0.73} half={half} pipRadius={7.5} pip={colors.pip} />
    </svg>
  );
}
