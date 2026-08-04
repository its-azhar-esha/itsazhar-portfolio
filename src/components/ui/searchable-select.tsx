"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronsUpDown, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchableSelectProps {
  /** Curated suggestions shown in the dropdown. */
  options: readonly string[];
  /** Selected value(s): string for single select, string[] for multi select. */
  value: string | string[];
  onChange: (next: string | string[]) => void;
  /** Single select (category) vs multi select (industries). */
  multiple?: boolean;
  /** Allow typing arbitrary values not present in options. Default true. */
  allowCustom?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyLabel?: string;
  hint?: string;
  maxSelections?: number;
  className?: string;
  error?: string;
  id?: string;
}

const MAX_VISIBLE = 10;

export function SearchableSelect({
  options,
  value,
  onChange,
  multiple = false,
  allowCustom = true,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  emptyLabel = "No matches found",
  hint,
  maxSelections = 20,
  className,
  error,
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [highlight, setHighlight] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = React.useMemo(() => (multiple ? (value as string[]) : []), [multiple, value]);
  const singleValue = multiple ? "" : (value as string);

  const isSelected = React.useCallback(
    (option: string) => (multiple ? selected.includes(option) : singleValue === option),
    [multiple, selected, singleValue],
  );

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = options.filter((o) => !isSelected(o));
    if (!q) return base;
    return base.filter((o) => o.toLowerCase().includes(q));
  }, [options, query, isSelected]);

  const exactMatch = React.useMemo(() => {
    const q = query.trim();
    if (!q) return true;
    return options.some((o) => o.toLowerCase() === q.toLowerCase());
  }, [options, query]);

  const canAddCustom = allowCustom && query.trim().length > 0 && !exactMatch;

  function close() {
    setOpen(false);
    setQuery("");
  }

  function selectOption(option: string) {
    if (multiple) {
      const next = selected.includes(option) ? selected : [...selected, option];
      onChange(next);
      setQuery("");
      setHighlight(0);
    } else {
      onChange(option);
      close();
    }
  }

  function removeValue(option: string) {
    if (!multiple) return;
    onChange(selected.filter((s) => s !== option));
  }

  function addCustom(raw: string) {
    const next = raw.trim();
    if (!next) return;
    if (next.length > 80) return;
    if (multiple) {
      if (selected.some((s) => s.toLowerCase() === next.toLowerCase())) {
        setQuery("");
        return;
      }
      if (selected.length >= maxSelections) return;
      onChange([...selected, next]);
      setQuery("");
      setHighlight(0);
    } else {
      onChange(next);
      close();
    }
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    setHighlight(0);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        openDropdown();
      }
      return;
    }
    const itemCount = filtered.length + (canAddCustom ? 1 : 0);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, Math.max(0, itemCount - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (canAddCustom) {
        addCustom(query);
      } else if (filtered[highlight]) {
        selectOption(filtered[highlight]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      close();
    }
  }

  React.useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (canAddCustom) addCustom(query);
        close();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canAddCustom, query, selected]);

  function openDropdown() {
    setOpen(true);
    setHighlight(0);
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div ref={containerRef} className={cn("space-y-1.5", className)}>
      <div
        className={cn(
          "border-border bg-background focus-within:border-primary/40 focus-within:ring-primary/20 transition-all duration-200 focus-within:ring-1 focus-within:outline-none",
          error ? "border-destructive/60" : "border",
          multiple ? "flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg px-2 py-1.5" : "",
        )}
      >
        {multiple ? (
          <>
            {selected.map((item) => (
              <span
                key={item}
                className="bg-accent text-accent-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
              >
                {item}
                <button
                  type="button"
                  onClick={() => removeValue(item)}
                  aria-label={`Remove ${item}`}
                  className="text-muted-foreground hover:text-foreground rounded-sm transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <input
              id={id}
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => setOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder={selected.length === 0 ? placeholder : ""}
              className="placeholder:text-muted-foreground/60 min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
            />
          </>
        ) : (
          <button
            type="button"
            id={id}
            onClick={() => (open ? close() : openDropdown())}
            className="flex h-10 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm"
          >
            <span
              className={cn(
                "truncate",
                singleValue ? "text-foreground" : "text-muted-foreground/60",
              )}
            >
              {singleValue || placeholder}
            </span>
            <ChevronsUpDown className="text-muted-foreground/70 h-4 w-4 shrink-0" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="border-border bg-background z-30 mt-1 overflow-hidden rounded-lg border shadow-lg"
          >
            {!multiple && (
              <div className="border-border/40 flex items-center gap-2 border-b px-2.5">
                <Search className="text-muted-foreground/60 h-3.5 w-3.5 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className="placeholder:text-muted-foreground/60 h-9 w-full bg-transparent text-sm outline-none"
                />
              </div>
            )}
            <div className="max-h-72 overflow-y-auto p-1">
              {filtered.length === 0 && !canAddCustom && (
                <p className="text-muted-foreground px-2.5 py-2 text-xs">{emptyLabel}</p>
              )}
              {filtered.slice(0, MAX_VISIBLE).map((option, index) => (
                <button
                  key={option}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(option)}
                  onMouseEnter={() => setHighlight(index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm",
                    highlight === index && "bg-accent text-accent-foreground",
                  )}
                >
                  <span className="truncate">{option}</span>
                  {isSelected(option) && <Check className="text-primary h-4 w-4 shrink-0" />}
                </button>
              ))}
              {canAddCustom && (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addCustom(query)}
                  onMouseEnter={() => setHighlight(filtered.length)}
                  className={cn(
                    "text-primary flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm",
                    highlight === filtered.length && "bg-accent text-accent-foreground",
                  )}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className="truncate">Add &ldquo;{query.trim()}&rdquo;</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hint && (
        <p className="text-muted-foreground text-xs">
          {hint}
          {multiple && selected.length > 0 ? ` · ${selected.length}/${maxSelections}` : ""}
        </p>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
