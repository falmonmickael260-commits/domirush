"use client";

import { DEFAULT_AVATARS } from "@/lib/identity";

export function AvatarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (avatar: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {DEFAULT_AVATARS.map((a) => (
        <button
          key={a}
          type="button"
          onClick={() => onChange(a)}
          aria-label={`Avatar ${a}`}
          aria-pressed={value === a}
          className={`flex h-10 w-10 items-center justify-center rounded-full text-lg transition ${
            value === a ? "bg-gold text-ink ring-2 ring-gold-bright" : "bg-bg-panel"
          }`}
        >
          {a}
        </button>
      ))}
    </div>
  );
}
