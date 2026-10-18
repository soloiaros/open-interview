import { SettingsForm } from "@/components/settings-form";
import { PageTitle } from "@/components/ui";
import { env } from "@/lib/env";
import { requireContext } from "@/lib/context";
import { getSettings } from "@/lib/interview";

export default async function Settings() {
  const ctx = await requireContext();
  const s = await getSettings(ctx.orgId);
  return (
    <div className="enter flex max-w-[760px] flex-col gap-14">
      <PageTitle title="Settings" lead={ctx.orgName} rest={`Signed in as ${ctx.email}.`} />
      <SettingsForm
        initial={{ wikiSchema: s.wikiSchema, interviewerNotes: s.interviewerNotes, glossary: s.glossary, notionParentPageId: s.notionParentPageId ?? "" }}
        notionConnected={Boolean(s.notionTokenEnc)}
        apiKeyPrefix={s.apiKeyPrefix}
        mcpUrl={`${env.appUrl}/api/mcp`}
      />
    </div>
  );
}
