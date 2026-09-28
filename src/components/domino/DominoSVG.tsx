import { PIP_LAYOUTS } from "@/lib/pips";

interface DominoFaceProps {
  value: number;
  cx: number;
  cy: number;
  half: number;
  pipRadius: number;
}

function DominoFace({ value, cx, cy, half, pipRadius }: DominoFaceProps) {
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
          fill="url(#pipGradient)"
        />
      ))}
    </g>
  );
}

export interface DominoSVGProps {
  a: number;
  b: number;
  className?: string;
}

/**
 * Renders a single domino tile as a crisp, resolution-independent SVG.
 * Always drawn in its natural "vertical" orientation (two halves stacked
 * top/bottom); rotate the wrapping element for horizontal placements.
 */
export function DominoSVG({ a, b, className }: DominoSVGProps) {
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
        <linearGradient id="tileGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-ivory)" />
          <stop offset="100%" stopColor="var(--color-ivory-dim)" />
        </linearGradient>
        <radialGradient id="pipGradient" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#4a4038" />
          <stop offset="100%" stopColor="#2b2620" />
        </radialGradient>
        <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="18%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="tileShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity="0.35" />
        </filter>
      </defs>

      <rect
        x={1.5}
        y={1.5}
        width={W - 3}
        height={H - 3}
        rx={r}
        fill="url(#tileGradient)"
        stroke="#c9bb9c"
        strokeWidth={1.5}
        filter="url(#tileShadow)"
      />
      <rect x={1.5} y={1.5} width={W - 3} height={H - 3} rx={r} fill="url(#sheen)" />

      <line
        x1={W * 0.14}
        y1={H / 2}
        x2={W * 0.86}
        y2={H / 2}
        stroke="#c9bb9c"
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

      <DominoFace value={a} cx={half / 2} cy={H * 0.27} half={half} pipRadius={7.5} />
      <DominoFace value={b} cx={half / 2} cy={H * 0.73} half={half} pipRadius={7.5} />
    </svg>
  );
}
