import { Landing } from "@/components/landing";
import { getContext } from "@/lib/context";

export default async function Home() {
  const ctx = await getContext().catch(() => null);
  return <Landing signedIn={Boolean(ctx)} />;
}
