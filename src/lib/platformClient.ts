"use client";

const game = "dominorush";
let platform: { origin: string; launch: string } | undefined;

export function getPlatformToken() {
  if (typeof window === "undefined") return undefined;
  try {
    return new URLSearchParams(location.search).get("rg_token") || sessionStorage.getItem("domirush:platformToken") || undefined;
  } catch {
    return undefined;
  }
}

export function configurePlatform(origin: string, launch: string) {
  platform = { origin, launch };
}

export function tellPlatform(type: string, fields?: object) {
  if (!platform) return;
  window.parent.postMessage({ ...fields, type, v: 1, game, launch: platform.launch }, platform.origin);
}

export function reportPlatformRoom(code: string, secret: string, playerId: string) {
  tellPlatform("rg:room", { session: { code, secret, playerId } });
}
