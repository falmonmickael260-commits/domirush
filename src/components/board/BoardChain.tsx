"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { PlacedTile, Side } from "@/game-engine";
import { Domino } from "@/components/domino/Domino";
import { DOMINO_ENGRAVINGS } from "@/lib/dominoEngravings";
import { BOARD_SKINS, DOMINO_SKINS } from "@/lib/dominoSkins";
import { useDominoShop } from "@/components/DominoSkinProvider";
import { useMeasuredSize } from "@/hooks/useMeasuredSize";

interface BoardChainProps {
  board: PlacedTile[];
  playableSidesForSelected: Side[] | null;
  onPlayAt: (side: Side) => void;
}

export function BoardChain({ board, playableSidesForSelected, onPlayAt }: BoardChainProps) {
  const reduceMotion = useReducedMotion();
  const { shop } = useDominoShop();
  const skin = DOMINO_SKINS[shop.equipped];
  const engraving = DOMINO_ENGRAVINGS[shop.equipped];
  const table = BOARD_SKINS[shop.equippedBoard];
  const frame = useRef<HTMLIFrameElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const { width, height } = useMeasuredSize(viewport);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function receive(event: MessageEvent) {
      if (event.source === frame.current?.contentWindow &&
          event.origin === window.location.origin && event.data === "domirush:ready") {
        setReady(true);
      }
    }
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, []);

  useEffect(() => {
    if (!ready) return;
    frame.current?.contentWindow?.postMessage({
      type: "domirush:board",
      palette: JSON.stringify({ face: skin.face, engraving, edge: skin.edge, pip: skin.pip, felt: table.felt, accent: table.accent }),
      tiles: JSON.stringify(board.map(({ left, right, tile }) => [left, right, tile.id])),
      effects: reduceMotion === false && Boolean(engraving),
    }, window.location.origin);
  }, [board, ready, skin, table, engraving, reduceMotion]);

  // Keep a playable board while the WebAssembly export starts or WebGL is unavailable.
  let columns = 1;
  let tileSize = 0;
  for (let candidate = 1; candidate <= board.length; candidate++) {
    const rows = Math.ceil(board.length / candidate);
    const fit = Math.min(44, (width - 20) / (candidate * 2.14 + 0.88), (height - 18) / (rows * 1.62 - 0.62));
    if (fit >= tileSize) {
      columns = candidate;
      tileSize = fit;
    }
  }

  const left = board[0]?.left;
  const right = board.at(-1)?.right;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div ref={viewport} data-board-viewport className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-gold/20" style={{ backgroundColor: table.felt }}>
        <iframe ref={frame} src="/godot/index.html" title="Plateau Domirush"
          tabIndex={-1} aria-hidden="true"
          className={`pointer-events-none absolute inset-0 size-full border-0 ${ready ? "" : "invisible"}`}
        />
        {!ready && (
          <div className="absolute inset-0 grid place-content-center">
            {board.length === 0 ? <span className="text-sm text-gold">Premier domino</span> : tileSize > 0 && (
              <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, ${tileSize * 2}px)`, gap: `${tileSize * 0.62}px ${tileSize * 0.14}px` }}>
                {board.map((tile, index) => {
                  const row = Math.floor(index / columns);
                  const reverse = row % 2 === 1;
                  return (
                    <div key={tile.tile.id} className="grid place-items-center"
                      style={{ gridRow: row + 1, gridColumn: reverse ? columns - index % columns : index % columns + 1, height: tileSize }}>
                      <Domino id={tile.tile.id} topValue={reverse ? tile.right : tile.left}
                        bottomValue={reverse ? tile.left : tile.right} rotationDeg={-90}
                        width={tileSize} state="placed" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex min-h-10 items-center justify-between gap-2 text-xs font-semibold text-gold">
        {(["left", "right"] as const).map((side) => {
          const allowed = playableSidesForSelected?.includes(side) && (board.length > 0 || side === "left");
          const label = board.length === 0 ? "Poser le domino" : side === "left" ? `Jouer à gauche · ${left}` : `Jouer à droite · ${right}`;
          return allowed ? (
            <button key={side} type="button" onClick={() => onPlayAt(side)}
              className="min-h-10 rounded-lg bg-gold px-3 text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              {label}
            </button>
          ) : <span key={side}>{board.length > 0 && (side === "left" ? `Gauche · ${left}` : `Droite · ${right}`)}</span>;
        })}
      </div>
    </div>
  );
}
