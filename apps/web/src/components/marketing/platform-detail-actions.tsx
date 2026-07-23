"use client";

import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { getLoginHref } from "@/lib/urls";

export function PlatformDetailActions({ tone = "default" }: { tone?: "default" | "onAccent" }) {
  const router = useRouter();
  const onAccent = tone === "onAccent";

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant={onAccent ? "secondary" : "primary"}
        size="lg"
        className={
          onAccent
            ? "bg-white font-semibold text-accent"
            : "font-semibold shadow-md shadow-accent/25"
        }
        onPress={() => router.push("/register")}
      >
        Ücretsiz Dene
      </Button>
      <Button
        variant="outline"
        size="lg"
        className={onAccent ? "border-white/40 font-semibold text-white" : "font-semibold"}
        onPress={() => router.push(getLoginHref())}
      >
        Giriş Yap
      </Button>
    </div>
  );
}
