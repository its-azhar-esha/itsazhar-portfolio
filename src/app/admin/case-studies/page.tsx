import { getCaseStudies } from "@/lib/case-studies";
import { CaseStudyList } from "@/components/admin/case-studies/case-study-list";

export const dynamic = "force-dynamic";

export default async function AdminCaseStudiesPage() {
  const result = await getCaseStudies();
  const caseStudies = result.success ? result.data : [];
  const error = result.success ? null : result.error;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Case Studies</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage the &quot;From manual to automated&quot; case studies on the homepage.
        </p>
      </div>
      <CaseStudyList caseStudies={caseStudies} error={error} />
    </div>
  );
}
