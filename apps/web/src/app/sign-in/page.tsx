import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { APP_NAME } from "@/lib/brand";
import { getContext } from "@/lib/context";
import Link from "next/link";

export default async function SignIn({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  if (await getContext()) redirect("/app");
  const { mode } = await searchParams;
  return (
    <main className="grid min-h-dvh place-items-center px-6 py-16">
      <div className="enter flex w-full max-w-[400px] flex-col gap-10">
        <Link href="/" className="display text-[30px] leading-none">
          {APP_NAME}
        </Link>
        <AuthForm initialMode={mode === "sign-up" ? "sign-up" : "sign-in"} />
      </div>
    </main>
  );
}
