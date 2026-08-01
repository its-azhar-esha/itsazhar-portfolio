"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpen,
  CalendarClock,
  ClipboardList,
  Lightbulb,
  Settings2,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getHelp, type HelpEntry, type HelpSection, type HelpSectionKind } from "@/lib/admin-help";

const SECTION_ICONS: Record<HelpSectionKind, React.ComponentType<{ className?: string }>> = {
  what: BookOpen,
  why: Lightbulb,
  when: CalendarClock,
  how: Settings2,
  effects: SlidersHorizontal,
  best: Star,
  notes: ClipboardList,
  warning: AlertTriangle,
};

const SECTION_ICON_CLASS: Record<HelpSectionKind, string> = {
  what: "text-primary",
  why: "text-amber-500",
  when: "text-sky-500",
  how: "text-violet-500",
  effects: "text-emerald-500",
  best: "text-fuchsia-500",
  notes: "text-muted-foreground",
  warning: "text-red-500",
};

export function HelpButton({
  helpId,
  label,
  className,
  align = "center",
}: {
  helpId: string;
  label?: string;
  className?: string;
  align?: "center" | "left";
}) {
  const [open, setOpen] = React.useState(false);
  const entry = getHelp(helpId);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={label ?? `Help: ${entry?.title ?? helpId}`}
        className={cn(
          "text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-transparent text-[11px] font-bold transition-colors",
          className,
        )}
      >
        ?
      </button>
      <HelpDialog
        entry={entry ?? fallbackEntry(helpId)}
        open={open}
        onClose={() => setOpen(false)}
        align={align}
      />
    </>
  );
}

function fallbackEntry(id: string): HelpEntry {
  return {
    id,
    title: id,
    summary: "Help content for this item has not been written yet.",
    sections: [],
  };
}

export function HelpDialog({
  entry: e,
  open,
  onClose,
  align = "center",
}: {
  entry: HelpEntry;
  open: boolean;
  onClose: () => void;
  align?: "center" | "left";
}) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-help-title"
            className="border-border/50 bg-background relative z-10 flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border shadow-xl"
          >
            <div className="border-border/40 flex items-start justify-between gap-3 border-b px-5 py-4">
              <div className="min-w-0">
                <p className="text-muted-foreground text-[10px] font-semibold tracking-widest uppercase">
                  Help
                </p>
                <h3 id="admin-help-title" className="mt-0.5 text-sm font-semibold">
                  {e.title}
                </h3>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{e.summary}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close help"
                className="text-muted-foreground hover:text-foreground -mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
              {e.sections.length === 0 ? (
                <p className="text-muted-foreground text-sm">{e.summary}</p>
              ) : (
                e.sections.map((section) => (
                  <HelpSectionBlock key={section.kind} section={section} align={align} />
                ))
              )}
            </div>

            <div className="border-border/40 flex items-center justify-between gap-3 border-t px-5 py-3">
              <p className="text-muted-foreground text-[10px]">
                Press ESC or click outside to close
              </p>
              <button
                type="button"
                onClick={onClose}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              >
                Got it
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function HelpSectionBlock({ section, align }: { section: HelpSection; align: "center" | "left" }) {
  const Icon = SECTION_ICONS[section.kind] ?? BookOpen;
  return (
    <section>
      <h4
        className={cn(
          "flex items-center gap-1.5 text-xs font-semibold",
          align === "center" ? "justify-center" : "justify-start",
        )}
      >
        <Icon className={cn("h-3.5 w-3.5", SECTION_ICON_CLASS[section.kind])} />
        {section.title}
      </h4>
      <div className="text-muted-foreground mt-1.5 space-y-1.5 text-xs leading-relaxed">
        {section.body.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
        {section.bullets && section.bullets.length > 0 && (
          <ul className="ml-4 list-disc space-y-1">
            {section.bullets.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
