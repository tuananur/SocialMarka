"use client";

import { SessionProvider } from "next-auth/react";
import { Toast } from "@heroui/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
      <Toast.Provider placement="top end" maxVisibleToasts={3} />
    </SessionProvider>
  );
}
