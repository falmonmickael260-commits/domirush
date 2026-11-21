"use client";

import Link from "next/link";
import { useState } from "react";
import { DominoSVG } from "@/components/domino/DominoSVG";
import { useDominoShop } from "@/components/DominoSkinProvider";
import { DOMINO_SKINS, type DominoSkin } from "@/lib/dominoSkins";

export default function Boutique() {
  const { shop, status, change } = useDominoShop();
  const [preview, setPreview] = useState<DominoSkin | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const selected = preview ?? shop.equipped;
  const skin = DOMINO_SKINS[selected];
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
          {typeof shop.balance === "number" ? `${new Intl.NumberFormat("fr-FR").format(shop.balance)} pièces`
            : status === "loading" ? "Chargement du portefeuille…" : status === "unavailable" ? "Portefeuille indisponible"
            : "Connecte-toi via Revanche Games pour voir tes pièces"}
        </p>
      </header>

      <section aria-label="Aperçu du skin" className="mb-6 grid overflow-hidden rounded-3xl border border-gold/25 bg-bg-elevated sm:grid-cols-2">
        <div className="flex min-h-44 items-center justify-center gap-2 bg-[#12372b] px-5 py-5">
          {[[6, 6], [6, 4], [4, 2]].map(([a, b]) => (
            <DominoSVG key={b} a={a} b={b} skin={selected} className="h-24 w-12 rotate-[-8deg] drop-shadow-lg sm:h-28 sm:w-14" />
          ))}
        </div>
        <div className="flex flex-col justify-center p-6">
          <h2 className="text-2xl font-bold">{skin.name}</h2>
          <p className="mt-1 text-sm text-text-dim">{skin.description}</p>
          <div className="mt-4 min-h-10">
            {selected === shop.equipped ? <p className="text-sm font-semibold text-gold">Équipé</p>
              : owned ? <button type="button" disabled={pending} onClick={() => void act("equip")} className="rounded-lg bg-gold px-4 py-2 font-bold text-ink">Équiper</button>
              : price == null ? <p className="text-sm font-semibold text-gold">Prix à définir</p>
              : <button type="button" disabled={pending || shop.balance === null || shop.balance < price} onClick={() => void act("buy")}
                  className="rounded-lg bg-gold px-4 py-2 font-bold text-ink disabled:opacity-45">Acheter · {price} pièces</button>}
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
        </div>
      </section>

      <section aria-label="Skins de dominos" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(Object.keys(DOMINO_SKINS) as DominoSkin[]).map(id => (
          <button key={id} type="button" aria-pressed={selected === id} onClick={() => { setPreview(id); setError(""); }}
            className={`flex min-h-28 items-center gap-3 rounded-xl border p-3 text-left ${selected === id ? "border-gold bg-bg-panel" : "border-white/10 bg-bg-elevated"}`}>
            <DominoSVG a={5} b={3} skin={id} className="h-14 w-7 shrink-0" />
            <span>
              <span className="block text-sm font-bold">{DOMINO_SKINS[id].name}</span>
              <span className="text-xs text-text-dim">{shop.equipped === id ? "Équipé" : shop.owned.includes(id) ? "Possédé"
                : shop.prices[id] == null ? "Prix à définir" : `${shop.prices[id]} pièces`}</span>
            </span>
          </button>
        ))}
      </section>
    </main>
  );
}
