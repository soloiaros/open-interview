"use client";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOut() {
  const router = useRouter();
  return (
    <button
      className="cursor-pointer font-mono text-[11px] uppercase tracking-wide text-ink-3 transition-colors hover:text-ink"
      onClick={async () => {
        await authClient.signOut();
        router.push("/");
      }}
    >
      Sign out
    </button>
  );
}
