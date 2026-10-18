import { NewInterviewForm } from "@/components/interview/new-form";
import { PageTitle } from "@/components/ui";
import { requireContext } from "@/lib/context";

export default async function NewInterview() {
  const ctx = await requireContext();
  return (
    <div className="enter flex max-w-[720px] flex-col gap-12">
      <PageTitle title="New interview" lead="Pick a type and write one line." rest="The interviewer plans the questions." />
      <NewInterviewForm defaultExpert={ctx.userName} />
    </div>
  );
}
