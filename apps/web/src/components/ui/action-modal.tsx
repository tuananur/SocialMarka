"use client";

import { Button } from "@heroui/react";

export type ActionModalConfig = {
  isOpen: boolean;
  title: string;
  description: string;
  type?: "danger" | "info" | "success" | "error";
  confirmText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

export function ActionModal({
  config,
  setConfig,
}: {
  config: ActionModalConfig;
  setConfig: (config: ActionModalConfig) => void;
}) {
  if (!config.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
              config.type === "danger" || config.type === "error"
                ? "bg-rose-100 text-rose-600 dark:bg-rose-950/50"
                : config.type === "success"
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50"
                : "bg-sky-100 text-sky-600 dark:bg-sky-950/50"
            }`}
          >
            {config.type === "danger" ? "🗑️" : config.type === "error" ? "❌" : config.type === "success" ? "✅" : "ℹ️"}
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {config.title}
          </h3>
        </div>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {config.description}
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          {config.type === "danger" && (
            <Button
              size="sm"
              variant="outline"
              onPress={() => {
                setConfig({ ...config, isOpen: false });
                if (config.onCancel) config.onCancel();
              }}
              className="border-slate-200 text-slate-700 hover:bg-slate-50 font-medium dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              İptal
            </Button>
          )}
          <Button
            size="sm"
            variant={config.type === "danger" || config.type === "error" ? "danger" : "primary"}
            onPress={() => {
              const cb = config.onConfirm;
              setConfig({ ...config, isOpen: false });
              if (cb) cb();
            }}
            className="font-semibold px-4"
          >
            {config.confirmText || "Tamam"}
          </Button>
        </div>
      </div>
    </div>
  );
}
