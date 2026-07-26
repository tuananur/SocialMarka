"use client";

import { Input } from "@heroui/react";
import Link from "next/link";
import { ProviderIcon } from "../provider-icon";
import type { ComposerAccount, ComposerGroup } from "./composer-types";

export function AccountsPanel({
  canEdit,
  groups,
  accounts,
  filteredGroups,
  filteredAccounts,
  accountFilter,
  setAccountFilter,
  groupQuery,
  setGroupQuery,
  accountQuery,
  setAccountQuery,
  selectedAccountIds,
  selectGroup,
  toggleAccount,
  selectAllAccounts,
}: {
  canEdit: boolean;
  groups: ComposerGroup[];
  accounts: ComposerAccount[];
  filteredGroups: ComposerGroup[];
  filteredAccounts: ComposerAccount[];
  accountFilter: "group" | "client";
  setAccountFilter: (v: "group" | "client") => void;
  groupQuery: string;
  setGroupQuery: (v: string) => void;
  accountQuery: string;
  setAccountQuery: (v: string) => void;
  selectedAccountIds: string[];
  selectGroup: (g: ComposerGroup) => void;
  toggleAccount: (id: string) => void;
  selectAllAccounts: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg bg-ink-50 p-1">
        <button
          type="button"
          className={`flex-1 rounded-md py-1.5 text-sm font-semibold ${
            accountFilter === "group" ? "bg-white shadow-sm" : "text-ink-500"
          }`}
          onClick={() => setAccountFilter("group")}
        >
          Grup
        </button>
        <button
          type="button"
          className={`flex-1 rounded-md py-1.5 text-sm font-semibold ${
            accountFilter === "client" ? "bg-white shadow-sm" : "text-ink-500"
          }`}
          onClick={() => setAccountFilter("client")}
        >
          Hesap
        </button>
      </div>

      {accountFilter === "group" ? (
        <>
          <Input
            fullWidth
            placeholder="Grup ara…"
            value={groupQuery}
            onChange={(e) => setGroupQuery(e.target.value)}
          />
          <div className="space-y-2">
            {filteredGroups.length === 0 ? (
              <p className="text-sm text-ink-400">Grup yok.</p>
            ) : (
              filteredGroups.map((g) => {
                const ids = g.accounts.map((a) => a.id);
                const allOn =
                  ids.length > 0 && ids.every((id) => selectedAccountIds.includes(id));
                return (
                  <label
                    key={g.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-100 px-3 py-2 hover:bg-ink-50"
                  >
                    <input
                      type="checkbox"
                      checked={allOn}
                      disabled={!canEdit}
                      onChange={() => selectGroup(g)}
                    />
                    <span className="text-sm font-semibold text-ink-800">{g.name}</span>
                    <span className="ml-auto text-xs text-ink-400">{g.accounts.length}</span>
                  </label>
                );
              })
            )}
          </div>
        </>
      ) : null}

      <div className="border-t border-ink-100 pt-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Hesaplar</p>
          {canEdit && accounts.length > 0 ? (
            <button
              type="button"
              className="text-xs font-semibold text-accent"
              onClick={selectAllAccounts}
            >
              {filteredAccounts.every((a) => selectedAccountIds.includes(a.id)) &&
              filteredAccounts.length > 0
                ? "Temizle"
                : "Tümünü seç"}
            </button>
          ) : null}
        </div>
        <Input
          fullWidth
          placeholder="Hesap ara…"
          value={accountQuery}
          onChange={(e) => setAccountQuery(e.target.value)}
          className="mb-2"
        />
        <div className="max-h-[40vh] space-y-1 overflow-y-auto">
          {filteredAccounts.length === 0 ? (
            <div className="rounded-lg bg-ink-50 p-3 text-sm text-ink-500">
              Bağlı hesap yok.{" "}
              <Link href="/accounts" className="font-semibold text-accent underline">
                Hesap bağla
              </Link>
            </div>
          ) : (
            filteredAccounts.map((a) => (
              <label
                key={a.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-ink-50"
              >
                <input
                  type="checkbox"
                  checked={selectedAccountIds.includes(a.id)}
                  disabled={!canEdit}
                  onChange={() => toggleAccount(a.id)}
                />
                <ProviderIcon provider={a.provider} size={22} />
                <span className="min-w-0 truncate text-sm font-medium text-ink-800">
                  {a.accountName}
                </span>
              </label>
            ))
          )}
        </div>
        <p className="mt-2 text-xs text-ink-400">
          Seçili: {selectedAccountIds.length} hesap
        </p>
      </div>
    </div>
  );
}
