import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { chatMessage, chatThread } from "@/db/schema";
import { ChatView } from "@/components/chat/chat-view";
import { requireContext } from "@/lib/context";

export default async function Chat({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const ctx = await requireContext();
  const { t } = await searchParams;
  const threads = await db
    .select({ id: chatThread.id, title: chatThread.title })
    .from(chatThread)
    .where(and(eq(chatThread.orgId, ctx.orgId), eq(chatThread.userId, ctx.userId)))
    .orderBy(desc(chatThread.updatedAt))
    .limit(20);
  const messages = t
    ? await db
        .select({ id: chatMessage.id, role: chatMessage.role, content: chatMessage.content, citations: chatMessage.citations })
        .from(chatMessage)
        .innerJoin(chatThread, eq(chatMessage.threadId, chatThread.id))
        .where(and(eq(chatMessage.threadId, t), eq(chatThread.orgId, ctx.orgId), eq(chatThread.userId, ctx.userId)))
        .orderBy(asc(chatMessage.createdAt))
    : [];
  return <ChatView key={t ?? "new"} threadId={t} threads={threads} initial={messages} />;
}
