import { CaseStudyForm } from "@/components/admin/case-studies/case-study-form";

export const dynamic = "force-dynamic";

export default function NewCaseStudyPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">New Case Study</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Add a case study to the &quot;From manual to automated&quot; section.
        </p>
      </div>
      <CaseStudyForm />
    </div>
  );
}
