import type { Tile } from "./types";

/** Builds the standard double-six domino set: 28 unique tiles from 0-0 to 6-6. */
export function createDeck(): Tile[] {
  const tiles: Tile[] = [];
  for (let a = 0; a <= 6; a++) {
    for (let b = a; b <= 6; b++) {
      tiles.push({ id: `${a}-${b}`, a, b });
    }
  }
  return tiles;
}

/**
 * Fisher-Yates shuffle using a cryptographically secure random source when available,
 * so the server can guarantee a fair, unpredictable deal.
 */
export function shuffleDeck<T>(deck: T[], rng: () => number = secureRandom): T[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function secureRandom(): number {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] / 0x100000000;
  }
  return Math.random();
}

export interface DealResult {
  hands: Tile[][];
  boneyard: Tile[];
}

/**
 * Deals a shuffled double-six set for 2, 3, or 4 players.
 * Every player gets 7 tiles; the remainder becomes the boneyard (draw pile).
 * 4 players consume the full 28 tiles, leaving no boneyard (classic "block" configuration).
 */
export function dealHands(shuffledDeck: Tile[], playerCount: 2 | 3 | 4): DealResult {
  const HAND_SIZE = 7;
  const hands: Tile[][] = [];
  let cursor = 0;
  for (let p = 0; p < playerCount; p++) {
    hands.push(shuffledDeck.slice(cursor, cursor + HAND_SIZE));
    cursor += HAND_SIZE;
  }
  const boneyard = shuffledDeck.slice(cursor);
  return { hands, boneyard };
}

export function tilePipTotal(tile: Tile): number {
  return tile.a + tile.b;
}

export function handPipTotal(hand: Tile[]): number {
  return hand.reduce((sum, t) => sum + tilePipTotal(t), 0);
}
