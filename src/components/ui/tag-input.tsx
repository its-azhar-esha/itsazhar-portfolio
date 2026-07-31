"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  hint?: string;
  maxTags?: number;
  maxLength?: number;
  className?: string;
  error?: string;
  id?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Type and press Enter to add",
  hint,
  maxTags = 20,
  maxLength = 60,
  className,
  error,
  id,
}: TagInputProps) {
  const [input, setInput] = React.useState("");

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    if (tag.length > maxLength) return;
    if (value.length >= maxTags) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setInput("");
      return;
    }
    onChange([...value, tag]);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handleBlur() {
    if (input.trim()) addTag(input);
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "border-border bg-background focus-within:border-primary/40 focus-within:ring-primary/20 flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5 transition-all duration-200 focus-within:ring-1 focus-within:outline-none",
          error && "border-destructive/60",
          className,
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="bg-accent text-accent-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
              className="text-muted-foreground hover:text-foreground rounded-sm transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          className="placeholder:text-muted-foreground/60 min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
        />
      </div>
      {hint && (
        <p className="text-muted-foreground text-xs">
          {hint} · {value.length}/{maxTags}
        </p>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
