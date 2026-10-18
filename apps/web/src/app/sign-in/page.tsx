import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { safeNext } from "@/lib/safe-next";
import { APP_NAME } from "@/lib/brand";
import { getContext } from "@/lib/context";
import Link from "next/link";

export default async function SignIn({ searchParams }: { searchParams: Promise<{ mode?: string; next?: string }> }) {
  const { mode, next } = await searchParams;
  const dest = safeNext(next);
  if (await getContext()) redirect(dest);
  return (
    <main className="gutter grid min-h-dvh place-items-center py-16">
      <div className="enter flex w-full max-w-[400px] flex-col gap-10">
        <Link href="/" className="display text-[30px] leading-[0.9]">
          {APP_NAME}
        </Link>
        <AuthForm initialMode={mode === "sign-up" ? "sign-up" : "sign-in"} next={dest} />
      </div>
    </main>
  );
}
