import Link from "next/link";
import { ArrowRight, Eye, Wand2 } from "lucide-react";
import type { PublicWorkflowTemplate } from "@/types/hub";
import { DIFFICULTY_LABELS } from "@/constants/hub";
import { Badge } from "@/components/ui/badge";

interface TemplateCardProps {
  template: PublicWorkflowTemplate;
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Link
      href={`/playground/template/${template.slug}`}
      className="group border-border bg-card hover:border-primary/40 hover:shadow-primary/5 flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      {template.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={template.thumbnailUrl}
          alt={template.title}
          className="h-36 w-full object-cover"
        />
      ) : (
        <div className="via-primary/10 flex h-36 w-full items-center justify-center bg-gradient-to-br from-violet-500/15 to-teal-500/15">
          <Wand2 className="text-primary h-9 w-9 opacity-70 transition-transform group-hover:scale-110" />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {template.category && (
            <Badge variant="secondary" className="text-[10px]">
              {template.category.name}
            </Badge>
          )}
          <Badge variant="outline" className="text-[10px]">
            {DIFFICULTY_LABELS[template.difficulty]}
          </Badge>
          {template.featured && <Badge className="text-[10px]">Featured</Badge>}
        </div>
        <h3 className="group-hover:text-primary line-clamp-2 leading-snug font-semibold transition-colors">
          {template.title}
        </h3>
        <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
          {template.description}
        </p>
        <div className="text-muted-foreground mt-auto flex items-center justify-between pt-2 text-xs">
          <span className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            {template.views_count.toLocaleString()} views
          </span>
          <span className="text-primary flex items-center gap-1 font-medium">
            Open <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
