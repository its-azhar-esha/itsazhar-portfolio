import { AdminChat } from "@/components/admin/ai/admin-chat";

export const dynamic = "force-dynamic";

export default function AdminAiPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Chat with your CMS content — summarize, draft copy, and generate SEO metadata.
        </p>
      </div>
      <AdminChat />
    </div>
  );
}
