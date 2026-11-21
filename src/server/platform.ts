import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { z } from "zod";
import { roomManager } from "./roomManager";
import type { Room } from "./types";

const game = "dominorush";
const origin = () => process.env.PLATFORM_SHELL_ORIGIN;
const key = () => process.env.PLATFORM_SHARED_SECRET;
const roomCode = z.string().regex(/^[A-HJ-NP-Z2-9]{6}$/);
const identity = z.object({ uid: z.uuid(), username: z.string().min(1).max(32) });
const command = z.object({
  v: z.literal(1), game: z.literal(game), room: roomCode, uid: z.uuid(),
  operation: z.enum(["inspect", "admit"]), name: z.string().min(1).max(32),
  instance: z.uuid().optional(), inviter: z.uuid().optional(),
  proof: z.object({ code: roomCode, playerId: z.string().optional(), secret: z.uuid().optional() }),
});

function signature(domain: string, stamp: string, raw: string, secret: string) {
  return createHmac("sha256", secret).update(`${domain}.${stamp}.${raw}`).digest();
}

export async function callPlatform(purpose: "identity" | "result" | "shop", data: unknown) {
  const secret = key();
  const base = origin();
  if (!secret || !base) return null;
  const stamp = String(Math.floor(Date.now() / 1000));
  const raw = JSON.stringify(data);
  const signed = signature(`rg-dominorush-${purpose}-v1`, stamp, raw, secret).toString("hex");
  return fetch(new URL(`/api/game/dominorush/${purpose === "result" ? "results" : "identity"}`, base), {
    method: "POST", body: raw, headers: { "content-type": "application/json", "x-rg-signature": `${stamp}.${signed}` },
    redirect: "error", signal: AbortSignal.timeout(5000),
  });
}

export async function verifyIdentity(token: string | undefined) {
  if (!token || token.length > 4096) return null;
  const response = await callPlatform("identity", { token });
  if (!response?.ok) return null;
  const result = identity.safeParse((await response.json()).identity);
  return result.success ? result.data : null;
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

export async function handleConnector(req: IncomingMessage, res: ServerResponse) {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "Méthode invalide." });
    const secret = key();
    const header = req.headers["x-rg-signature"];
    const match = typeof header === "string" && /^(\d{10})\.([a-f0-9]{64})$/.exec(header);
    if (!secret || !match || Math.abs(Date.now() / 1000 - Number(match[1])) > 30) {
      req.resume();
      return send(res, 403, { error: "Signature invalide." });
    }
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of req) {
      length += chunk.length;
      if (length > 8192) {
        send(res, 413, { error: "Requête trop volumineuse." });
        return;
      }
      chunks.push(chunk);
    }
    const raw = Buffer.concat(chunks).toString();
    if (!timingSafeEqual(signature("rg-connector-v1", match[1], raw, secret), Buffer.from(match[2], "hex"))) {
      return send(res, 403, { error: "Signature invalide." });
    }
    const data = command.safeParse(JSON.parse(raw));
    if (!data.success || data.data.proof.code !== data.data.room) return send(res, 400, { error: "Invitation invalide." });
    const { proof, uid, name, operation, instance, inviter } = data.data;
    const room = roomManager.getRoom(data.data.room);
    if (!room || (operation === "admit" && room.instance !== instance)) return send(res, 409, { error: "Salon fermé." });
    const owner = room.players.find(p => p.deviceId === proof.secret && p.playerId === proof.playerId);
    if (!owner || owner.userId !== (operation === "inspect" ? uid : inviter)) {
      return send(res, 403, { error: "Place introuvable." });
    }

    let player = room.players.find(p => p.userId === uid);
    if (operation === "admit" && !player) {
      const deviceId = randomUUID();
      const result = roomManager.joinRoom(room.code, { deviceId, name, avatar: "🎲", userId: uid });
      if (!result.ok) return send(res, 409, { error: "Salon complet ou partie démarrée." });
      player = result.room.players.find(p => p.deviceId === deviceId);
    }
    send(res, 200, {
      room: { code: room.code, instance: room.instance, capacity: room.config.playerCount,
        count: room.players.length, status: room.status === "lobby" ? "open" : room.status === "playing" ? "started" : "closed" },
      ...(operation === "admit" && player ? { session: { code: room.code, playerId: player.playerId, secret: player.deviceId } } : {}),
    });
  } catch {
    if (!res.headersSent) send(res, 400, { error: "Requête invalide." });
  }
}

const queued = new WeakSet<object>();

export function publishResult(room: Room) {
  const state = room.game;
  if (!key() || !origin() || !state?.winnerId || !room.players.some(p => p.userId) || queued.has(state)) return;
  queued.add(state);
  const sorted = [...state.players].sort((a, b) =>
    Number(b.id === state.winnerId) - Number(a.id === state.winnerId) ||
    (state.scores[b.id] ?? 0) - (state.scores[a.id] ?? 0) || a.seat - b.seat);
  const result = {
    game, room: room.code, instance: room.matchId,
    players: sorted.map((p, index) => ({
      userId: room.players.find(player => player.playerId === p.id)?.userId ?? null,
      name: p.name, outcome: index === 0 ? "win" : "loss", score: state.scores[p.id] ?? 0, position: index + 1,
    })),
  };
  async function submit(attempt: number) {
    try {
      const response = await callPlatform("result", result);
      if (response?.ok || (response && response.status < 500 && response.status !== 429)) return;
    } catch { /* A stable match ID makes retries idempotent. */ }
    if (attempt < 6) setTimeout(() => void submit(attempt + 1), 1000 * 2 ** attempt).unref();
    else console.error("Domirush result delivery failed", result.instance);
  }
  void submit(0);
}
