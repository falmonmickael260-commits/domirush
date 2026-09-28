import { describe, expect, it } from "vitest";
import { createDeck, dealHands, handPipTotal, shuffleDeck } from "../deck";

describe("createDeck", () => {
  it("creates exactly 28 unique double-six tiles", () => {
    const deck = createDeck();
    expect(deck).toHaveLength(28);
    const ids = new Set(deck.map((t) => t.id));
    expect(ids.size).toBe(28);
  });

  it("includes every double", () => {
    const deck = createDeck();
    for (let i = 0; i <= 6; i++) {
      expect(deck.some((t) => t.a === i && t.b === i)).toBe(true);
    }
  });
});

describe("shuffleDeck", () => {
  it("preserves all tiles, only reordering them", () => {
    const deck = createDeck();
    const shuffled = shuffleDeck(deck);
    expect(shuffled).toHaveLength(deck.length);
    expect([...shuffled].sort((a, b) => a.id.localeCompare(b.id))).toEqual(
      [...deck].sort((a, b) => a.id.localeCompare(b.id))
    );
  });

  it("produces different orderings across calls (statistically)", () => {
    const deck = createDeck();
    const a = shuffleDeck(deck).map((t) => t.id).join(",");
    const b = shuffleDeck(deck).map((t) => t.id).join(",");
    expect(a).not.toBe(b);
  });
});

describe("dealHands", () => {
  it("deals 7 tiles per player and a 14-tile boneyard for 2 players", () => {
    const { hands, boneyard } = dealHands(shuffleDeck(createDeck()), 2);
    expect(hands).toHaveLength(2);
    hands.forEach((h) => expect(h).toHaveLength(7));
    expect(boneyard).toHaveLength(14);
  });

  it("deals 7 tiles per player and a 7-tile boneyard for 3 players", () => {
    const { hands, boneyard } = dealHands(shuffleDeck(createDeck()), 3);
    expect(hands).toHaveLength(3);
    hands.forEach((h) => expect(h).toHaveLength(7));
    expect(boneyard).toHaveLength(7);
  });

  it("deals 7 tiles per player and an empty boneyard for 4 players", () => {
    const { hands, boneyard } = dealHands(shuffleDeck(createDeck()), 4);
    expect(hands).toHaveLength(4);
    hands.forEach((h) => expect(h).toHaveLength(7));
    expect(boneyard).toHaveLength(0);
  });

  it("never duplicates or drops a tile across hands + boneyard", () => {
    const deck = shuffleDeck(createDeck());
    const { hands, boneyard } = dealHands(deck, 3);
    const all = [...hands.flat(), ...boneyard];
    expect(all).toHaveLength(28);
    expect(new Set(all.map((t) => t.id)).size).toBe(28);
  });
});

describe("handPipTotal", () => {
  it("sums both faces of every tile", () => {
    expect(handPipTotal([{ id: "2-3", a: 2, b: 3 }, { id: "0-6", a: 0, b: 6 }])).toBe(11);
  });
});
