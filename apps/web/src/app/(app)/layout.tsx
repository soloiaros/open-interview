import Link from "next/link";
import { SignOut } from "@/components/account-menu";
import { TabBar } from "@/components/tab-bar";
import { APP_NAME } from "@/lib/brand";
import { requireContext } from "@/lib/context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireContext();
  return (
    <div className="min-h-dvh pb-32">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-bg/80 px-6 py-4 backdrop-blur-md">
        <Link href="/app" className="display text-[26px] leading-none">
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-5">
          <span className="hidden text-[13px] text-ink-3 sm:inline">{ctx.orgName}</span>
          <SignOut />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1080px] px-6 pt-6">{children}</main>
      <TabBar />
    </div>
  );
}
