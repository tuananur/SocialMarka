"use client";

import { ProviderIcon } from "../provider-icon";
import { COMPOSER_PLATFORMS, type PlatformId } from "./composer-types";

export function PlatformTabs({
  active,
  onChange,
  disabled,
}: {
  active: PlatformId;
  onChange: (id: PlatformId) => void;
  disabled?: boolean;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2.5">
      {COMPOSER_PLATFORMS.map((p) => {
        const isActive = active === p.id;
        return (
          <button
            key={p.id}
            type="button"
            title={p.label}
            disabled={disabled}
            onClick={() => onChange(p.id)}
            className={`relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm transition ${
              isActive ? "ring-2 ring-amber-400 ring-offset-2" : "opacity-85 hover:opacity-100"
            }`}
          >
            {p.id === "ORIGINAL" ? (
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-700 text-[11px] font-bold text-white">
                OR
              </span>
            ) : (
              <ProviderIcon provider={p.id} size={44} className="rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function FormatTabs({
  value,
  onChange,
}: {
  value: "post" | "story" | "reel";
  onChange: (v: "post" | "story" | "reel") => void;
}) {
  return (
    <div className="mb-3 flex gap-1 rounded-lg bg-ink-50 p-1">
      {(
        [
          { id: "post" as const, label: "Gönderi" },
          { id: "story" as const, label: "Hikâye" },
          { id: "reel" as const, label: "Reel" },
        ]
      ).map((f) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onChange(f.id)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-semibold transition ${
            value === f.id ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
