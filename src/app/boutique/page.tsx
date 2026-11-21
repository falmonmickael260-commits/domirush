"use client";

import Link from "next/link";
import { useState } from "react";
import { DominoSVG } from "@/components/domino/DominoSVG";
import { useDominoShop } from "@/components/DominoSkinProvider";
import { BOARD_SKINS, DOMINO_SKINS, isBoardSkin, type SkinId } from "@/lib/dominoSkins";

export default function Boutique() {
  const { shop, status, change } = useDominoShop();
  const [category, setCategory] = useState<"domino" | "board">("domino");
  const [preview, setPreview] = useState<SkinId | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const equipped = category === "board" ? shop.equippedBoard : shop.equipped;
  const selected = preview ?? equipped;
  const items = category === "board" ? BOARD_SKINS : DOMINO_SKINS;
  const skin = isBoardSkin(selected) ? BOARD_SKINS[selected] : DOMINO_SKINS[selected];
  const board = BOARD_SKINS[isBoardSkin(selected) ? selected : shop.equippedBoard];
  const domino = isBoardSkin(selected) ? shop.equipped : selected;
  const owned = shop.owned.includes(selected);
  const price = shop.prices[selected];

  async function act(action: "buy" | "equip") {
    setPending(true);
    setError("");
    try { await change(action, selected, action === "buy" ? price ?? undefined : undefined); }
    catch (issue) { setError(issue instanceof Error ? issue.message : "Boutique indisponible."); }
    finally { setPending(false); }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-8">
      <Link href="/" className="text-sm text-text-dim hover:text-gold">← Domirush</Link>
      <header className="my-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="wordmark text-4xl font-extrabold">Boutique</h1>
        <p className="rounded-full border border-gold/30 px-4 py-2 text-sm text-gold">
          {typeof shop.balance === "number" ? `${new Intl.NumberFormat("fr-FR").format(shop.balance)} pièces d’or`
            : status === "loading" ? "Chargement du portefeuille…" : status === "unavailable" ? "Portefeuille indisponible"
            : "Connecte-toi via Revanche Games pour voir tes pièces"}
        </p>
      </header>

      <div role="group" aria-label="Catégorie" className="mb-4 flex gap-2">
        {(["domino", "board"] as const).map(option => (
          <button key={option} type="button" aria-pressed={category === option}
            className={`rounded-xl px-4 py-2 text-sm font-bold ${category === option ? "bg-gold text-ink" : "bg-bg-panel text-text"}`}
            onClick={() => { setCategory(option); setPreview(null); setError(""); }}>
            {option === "domino" ? "Dominos" : "Plateaux"}
          </button>
        ))}
      </div>
      <section aria-label="Aperçu du skin" className="mb-6 grid overflow-hidden rounded-3xl border border-gold/25 bg-bg-elevated sm:grid-cols-2">
        <div className="flex min-h-56 items-center justify-center gap-1 border-8 px-5 py-6 sm:min-h-64 sm:gap-3"
          style={{ background: `radial-gradient(ellipse at 50% 36%, ${board.rail}, ${board.felt} 70%)`, borderColor: board.border }} data-board-preview>
          {[[6, 6], [5, 3], [4, 2]].map(([a, b], index) => (
            <DominoSVG key={b} a={a} b={b} skin={domino} previewEffects={index === 1} className={
              index === 1 ? "z-10 h-40 w-20 shrink-0 drop-shadow-2xl sm:h-48 sm:w-24"
                : `h-28 w-14 shrink-0 drop-shadow-lg sm:h-32 sm:w-16 ${index === 0 ? "-rotate-12" : "rotate-12"}`
            } />
          ))}
        </div>
        <div className="flex flex-col justify-center p-6">
          <h2 className="text-2xl font-bold">{skin.name}</h2>
          <p className="mt-1 text-sm text-text-dim">{skin.description}</p>
          <div className="mt-4 min-h-10">
            {typeof price === "number" && !owned && shop.balance !== null && shop.balance < price && (
              <p className="mb-2 text-sm text-text-dim">Solde insuffisant</p>
            )}
            {selected === equipped ? <p className="text-sm font-semibold text-gold">Équipé</p>
              : owned ? <button type="button" disabled={pending} onClick={() => void act("equip")} className="rounded-lg bg-gold px-4 py-2 font-bold text-ink">Équiper</button>
              : price == null ? <p className="text-sm font-semibold text-gold">Prix à définir</p>
              : <button type="button" disabled={pending || shop.balance === null || shop.balance < price} onClick={() => void act("buy")}
                  className="rounded-lg bg-gold px-4 py-2 font-bold text-ink disabled:opacity-45">Acheter · {price} pièces d’or</button>}
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        </div>
      </section>

      <section aria-label={category === "domino" ? "Skins de dominos" : "Skins de plateaux"} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(Object.keys(items) as SkinId[]).map(id => (
          <button key={id} type="button" aria-pressed={selected === id} onClick={() => { setPreview(id); setError(""); }}
            className={`flex min-h-28 items-center gap-3 rounded-xl border p-3 text-left ${selected === id ? "border-gold bg-bg-panel" : "border-white/10 bg-bg-elevated"}`}>
            {isBoardSkin(id) ? (
              <span aria-hidden="true" className="h-11 w-11 shrink-0 rounded-lg border-4 shadow-inner"
                style={{ background: BOARD_SKINS[id].felt, borderColor: BOARD_SKINS[id].border }} />
            ) : <DominoSVG a={5} b={3} skin={id} className="h-[4.5rem] w-9 shrink-0 drop-shadow-md" />}
            <span>
              <span className="block text-sm font-bold">{isBoardSkin(id) ? BOARD_SKINS[id].name : DOMINO_SKINS[id].name}</span>
              <span className="text-xs text-text-dim">{equipped === id ? "Équipé" : shop.owned.includes(id) ? "Possédé"
                : shop.prices[id] == null ? "Prix à définir" : `${shop.prices[id]} pièces d’or`}</span>
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}
