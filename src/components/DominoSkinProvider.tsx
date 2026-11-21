"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { isBoardSkin, isDominoSkin, isSkinId, type BoardSkin, type DominoSkin, type SkinId } from "@/lib/dominoSkins";
import { getPlatformToken } from "@/lib/platformClient";

type Shop = { balance: number | null; equipped: DominoSkin; equippedBoard: BoardSkin; owned: SkinId[]; prices: Partial<Record<SkinId, number | null>> };
const defaults: Shop = { balance: null, equipped: "classic", equippedBoard: "boardclassic", owned: ["classic", "boardclassic"], prices: {} };
type ShopAction = "buy" | "equip";
type ShopStatus = "loading" | "ready" | "unavailable";
const ShopContext = createContext<{ shop: Shop; status: ShopStatus; change: (action: ShopAction, item: SkinId, expectedPrice?: number) => Promise<void> }>({
  shop: defaults,
  status: "loading",
  change: async () => { throw new Error("Boutique indisponible."); },
});

async function fetchShop(action: "catalog" | ShopAction, item?: SkinId, expectedPrice?: number, signal?: AbortSignal): Promise<Shop> {
  const response = await fetch("/api/shop", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, item, expectedPrice, token: getPlatformToken() }), signal,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Boutique indisponible.");
  return {
    balance: typeof data.balance === "number" ? data.balance : null,
    equipped: isDominoSkin(data.equipped) ? data.equipped : "classic",
    equippedBoard: isBoardSkin(data.equippedBoard) ? data.equippedBoard : "boardclassic",
    owned: ["classic", "boardclassic", ...(Array.isArray(data.owned) ? data.owned.filter(isSkinId) : [])],
    prices: data.prices ?? {},
  };
}

export function DominoSkinProvider({ children }: { children: ReactNode }) {
  const [shop, setShop] = useState(defaults);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const change = useCallback(async (action: ShopAction, item: SkinId, expectedPrice?: number) => {
    setShop(await fetchShop(action, item, expectedPrice));
    setStatus("ready");
  }, []);

  useEffect(() => {
    const load = new AbortController();
    fetchShop("catalog", undefined, undefined, load.signal).then(data => {
      if (load.signal.aborted) return;
      setShop(data);
      setStatus("ready");
    }).catch(() => {
      if (!load.signal.aborted) setStatus("unavailable");
    });
    return () => load.abort();
  }, []);

  return <ShopContext.Provider value={{ shop, status, change }}>{children}</ShopContext.Provider>;
}

export function useDominoShop() {
  return useContext(ShopContext);
}
