import { Pool } from "pg";
import type { Room } from "./types";

/**
 * Optional match-history logging. Domirush plays entirely in-memory in real
 * time and never depends on Postgres to function — this is a best-effort,
 * fire-and-forget persistence layer for completed games, active only when
 * DATABASE_URL is set (e.g. a Railway Postgres plugin attached to the service).
 */

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function getPool(): Pool | null {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === "false" ? undefined : { rejectUnauthorized: false },
    });
  }
  return pool;
}

async function ensureSchema(p: Pool): Promise<void> {
  if (!schemaReady) {
    schemaReady = p.query(`
      CREATE TABLE IF NOT EXISTS games_history (
        id SERIAL PRIMARY KEY,
        room_code TEXT NOT NULL,
        player_count INT NOT NULL,
        target_score INT NOT NULL,
        winner_name TEXT,
        scores JSONB NOT NULL,
        rounds_played INT NOT NULL,
        finished_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `).then(() => undefined);
  }
  return schemaReady;
}

export async function logCompletedGame(room: Room): Promise<void> {
  const p = getPool();
  if (!p || !room.game) return;
  try {
    await ensureSchema(p);
    const winner = room.players.find((pl) => pl.playerId === room.game?.winnerId);
    await p.query(
      `INSERT INTO games_history (room_code, player_count, target_score, winner_name, scores, rounds_played)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        room.code,
        room.config.playerCount,
        room.config.targetScore,
        winner?.name ?? null,
        JSON.stringify(room.game.scores),
        room.game.roundNumber,
      ]
    );
  } catch (err) {
    // Never let optional history logging break gameplay.
    console.error("[domirush] failed to log completed game:", err);
  }
}

export async function checkDatabaseHealth(): Promise<boolean> {
  const p = getPool();
  if (!p) return true; // no database configured — not a health failure
  try {
    await p.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
