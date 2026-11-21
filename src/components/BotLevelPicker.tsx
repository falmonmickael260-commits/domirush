"use client";

import { BOT_LEVELS, type BotLevel } from "@/game-engine";

export function BotLevelPicker({ value, onChange }: { value: BotLevel; onChange: (value: BotLevel) => void }) {
  return (
    <fieldset>
      <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-faint">Niveau des bots</legend>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(BOT_LEVELS) as BotLevel[]).map(level => (
          <button key={level} type="button" aria-pressed={value === level} onClick={() => onChange(level)}
            className={`rounded-xl px-2 py-3 text-sm font-bold ${value === level ? "bg-gold text-ink" : "bg-bg-panel text-text-dim"}`}>
            {BOT_LEVELS[level]}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
