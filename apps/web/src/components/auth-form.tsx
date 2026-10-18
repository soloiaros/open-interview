"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { safeNext } from "@/lib/safe-next";
import { Button, Field, Input } from "@/components/ui";

export function AuthForm({ initialMode, next }: { initialMode: "sign-in" | "sign-up"; next?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(form: FormData) {
    setBusy(true);
    setError("");
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const res =
      mode === "sign-up"
        ? await authClient.signUp.email({ email, password, name: String(form.get("name") || email.split("@")[0]) })
        : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error) return setError(res.error.message ?? "That didn't work. Check your details.");
    router.push(safeNext(next));
    router.refresh();
  }

  return (
    <form action={submit} className="flex flex-col gap-5">
      <h1 className="display text-[56px]">{mode === "sign-up" ? "Create account" : "Sign in"}</h1>
      {mode === "sign-up" && (
        <Field label="Your name">
          <Input name="name" autoComplete="name" required placeholder="Maren Holt" />
        </Field>
      )}
      <Field label="Work email">
        <Input name="email" type="email" autoComplete="email" required placeholder="maren@northwind.io" />
      </Field>
      <Field label="Password" hint={mode === "sign-up" ? "At least 8 characters." : undefined}>
        <Input name="password" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} minLength={8} required />
      </Field>
      {error && <p className="text-[14px] text-danger">{error}</p>}
      <div className="flex items-center gap-6 pt-2">
        <Button type="submit" disabled={busy}>
          {busy ? "One moment" : mode === "sign-up" ? "Create account" : "Sign in"}
        </Button>
        <button type="button" className="cursor-pointer text-[13px] text-ink-3 hover:text-ink" onClick={() => setMode(mode === "sign-up" ? "sign-in" : "sign-up")}>
          {mode === "sign-up" ? "I have an account" : "New here? Create an account"}
        </button>
      </div>
    </form>
  );
}
