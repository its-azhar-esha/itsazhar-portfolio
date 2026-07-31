import { notFound } from "next/navigation";
import { getCaseStudyById } from "@/lib/case-studies";
import { CaseStudyForm } from "@/components/admin/case-studies/case-study-form";

export const dynamic = "force-dynamic";

export default async function EditCaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getCaseStudyById(id);
  if (!result.success) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Edit Case Study</h2>
        <p className="text-muted-foreground mt-1 text-sm">Update case study details.</p>
      </div>
      <CaseStudyForm caseStudy={result.data} />
    </div>
  );
}
