import { Sparkles } from "lucide-react";
import { HelpButton } from "@/components/ui/help-dialog";
import { AiPage } from "@/components/admin/ai/ai-page";
import { getAiConfigAction } from "@/lib/ai/actions";

export const dynamic = "force-dynamic";

export const metadata = { title: "AI | Admin" };

export default async function AdminAiPage() {
  const result = await getAiConfigAction();

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Chat with your CMS content — summarize, draft copy, and generate SEO metadata. The
            Configuration tab controls what the AI knows and which providers power it.
          </p>
        </div>
        <HelpButton helpId="ai-page" label="Help about the AI page" align="left" />
      </div>

      {result.success ? (
        <AiPage initial={result.data} />
      ) : (
        <div className="border-border/50 bg-card rounded-xl border p-8 text-center">
          <div className="bg-primary/10 text-primary mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-lg font-semibold">Could not load AI configuration</p>
          <p className="text-muted-foreground mt-2 text-sm">{result.error}</p>
        </div>
      )}
    </div>
  );
}
