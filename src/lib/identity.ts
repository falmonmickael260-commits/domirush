"use client";

const DEVICE_ID_KEY = "domirush:deviceId";
const PROFILE_KEY = "domirush:profile";

export interface PlayerProfile {
  name: string;
  avatar: string;
}

const DEFAULT_AVATARS = ["🙂", "🦊", "🐼", "🦁", "🐨", "🐸", "🦉", "🐯", "🐵", "🐧"];

export function getDeviceId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2);
  }
}

export function getSavedProfile(): PlayerProfile {
  if (typeof window === "undefined") return { name: "", avatar: DEFAULT_AVATARS[0] };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { name: "", avatar: randomAvatar() };
}

export function saveProfile(profile: PlayerProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore storage errors
  }
}

export function randomAvatar(): string {
  return DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];
}

export { DEFAULT_AVATARS };
