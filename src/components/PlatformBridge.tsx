"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { deriveShortPlayerId } from "@/lib/playerId";
import { configurePlatform, reportPlatformRoom, tellPlatform } from "@/lib/platformClient";
import { getDeviceId, getSavedProfile, saveProfile } from "@/lib/identity";
import { getSocket } from "@/lib/socketClient";

const GAME = "dominorush";

export function PlatformBridge({ origin }: { origin?: string }) {
  const router = useRouter();
  useEffect(() => {
    const url = new URL(location.href);
    const token = url.searchParams.get("rg_token");
    if (token) {
      sessionStorage.setItem("domirush:platformToken", token);
      url.searchParams.delete("rg_token");
      history.replaceState(history.state, "", url);
    }
    if (!origin || window.parent === window) return;
    const platformOrigin = new URL(origin).origin;
    let launch: string | undefined;
    function ready() {
      if (!launch) window.parent.postMessage({ type: "rg:ready", v: 1, game: GAME }, platformOrigin);
    }
    function receive(event: MessageEvent) {
      if (event.source !== window.parent || event.origin !== platformOrigin) return;
      const data = event.data;
      if (data?.type !== "rg:bootstrap" || data.game !== GAME || data.v !== 1 || typeof data.launch !== "string" || launch === data.launch) return;
      configurePlatform(platformOrigin, data.launch);
      launch = data.launch;
      const seat = data.admission?.session;
      if (seat) {
        if (typeof seat.code !== "string" || !/^[A-HJ-NP-Z2-9]{6}$/.test(seat.code) ||
            typeof seat.secret !== "string" || seat.playerId !== deriveShortPlayerId(seat.secret)) {
          tellPlatform("rg:join-error");
          return;
        }
        localStorage.setItem(`domirush:seat:${seat.code}`, seat.secret);
        if (typeof data.identity?.username === "string") {
          saveProfile({ ...getSavedProfile(), name: data.identity.username });
        }
        getSocket().timeout(10000).emit("room:join", {
          code: seat.code, deviceId: seat.secret, name: getSavedProfile().name, avatar: getSavedProfile().avatar,
        }, (error, result) => {
          if (error || !result?.ok) {
            tellPlatform("rg:join-error");
            return;
          }
          localStorage.setItem("domirush:lastRoomCode", seat.code);
          reportPlatformRoom(seat.code, seat.secret, seat.playerId);
          router.replace(`/salon/${seat.code}`);
        });
        return;
      }
      const current = /^\/(?:salon|partie)\/([A-HJ-NP-Z2-9]{6})$/.exec(location.pathname)?.[1];
      if (current) {
        const device = getDeviceId(current);
        reportPlatformRoom(current, device, deriveShortPlayerId(device));
      }
    }
    window.addEventListener("message", receive);
    ready();
    const timer = window.setInterval(ready, 750);
    return () => {
      window.removeEventListener("message", receive);
      window.clearInterval(timer);
    };
  }, [origin, router]);
  return null;
}
