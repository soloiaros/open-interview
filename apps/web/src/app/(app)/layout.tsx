import { AppFrame } from "@/components/app-frame";
import { requireContext } from "@/lib/context";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireContext();
  return <AppFrame orgName={ctx.orgName}>{children}</AppFrame>;
}
