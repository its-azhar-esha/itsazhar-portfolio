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
  clearable?: boolean;
}

/** Splits raw input or pasted text into individual candidate tags. */
function splitDelimited(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);
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
  clearable = false,
}: TagInputProps) {
  const [input, setInput] = React.useState("");
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editValue, setEditValue] = React.useState("");

  function addTags(raw: string) {
    const candidates = splitDelimited(raw);
    if (candidates.length === 0) {
      setInput("");
      return;
    }
    const next = [...value];
    for (const tag of candidates) {
      if (tag.length > maxLength) continue;
      if (next.length >= maxTags) break;
      if (next.some((t) => t.toLowerCase() === tag.toLowerCase())) continue;
      next.push(tag);
    }
    if (next.length !== value.length || input.trim()) {
      onChange(next);
    }
    setInput("");
  }

  function commitEdit() {
    if (editingIndex === null) return;
    const tag = editValue.trim();
    const next = [...value];
    if (!tag) {
      next.splice(editingIndex, 1);
    } else if (tag.length <= maxLength) {
      const duplicatedElsewhere = next.some(
        (t, i) => i !== editingIndex && t.toLowerCase() === tag.toLowerCase(),
      );
      if (!duplicatedElsewhere) {
        next[editingIndex] = tag;
      }
    }
    setEditingIndex(null);
    setEditValue("");
    onChange(next);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (editingIndex !== null) {
      if (e.key === "Enter") {
        e.preventDefault();
        commitEdit();
      } else if (e.key === "Escape") {
        setEditingIndex(null);
        setEditValue("");
      }
      return;
    }
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTags(input);
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text");
    if (!text) return;
    if (editingIndex !== null) {
      setEditValue(text);
      return;
    }
    e.preventDefault();
    addTags(text);
  }

  function handleBlur() {
    if (editingIndex !== null) {
      commitEdit();
      return;
    }
    if (input.trim()) addTags(input);
  }

  function startEdit(index: number, tag: string) {
    setEditingIndex(index);
    setEditValue(tag);
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
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
        {value.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="bg-accent text-accent-foreground group inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
          >
            {editingIndex === index ? (
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                autoFocus
                maxLength={maxLength}
                aria-label={`Edit ${tag}`}
                className="w-24 bg-transparent px-0.5 text-xs outline-none"
              />
            ) : (
              <>
                <span
                  title="Double-click to edit"
                  onDoubleClick={() => startEdit(index, tag)}
                  className="cursor-text"
                >
                  {tag}
                </span>
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  aria-label={`Remove ${tag}`}
                  className="text-muted-foreground hover:text-foreground rounded-sm transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            )}
          </span>
        ))}
        <input
          id={id}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          className="placeholder:text-muted-foreground/60 min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
        />
      </div>
      {(hint || clearable) && (
        <div className="flex items-center justify-between gap-2">
          {hint ? (
            <p className="text-muted-foreground text-xs">
              {hint} · {value.length}/{maxTags}
            </p>
          ) : (
            <p className="text-muted-foreground text-xs">
              {value.length}/{maxTags}
            </p>
          )}
          {clearable && value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-muted-foreground hover:text-destructive text-xs font-medium transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
