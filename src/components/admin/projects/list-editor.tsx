"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";

interface ListEditorProps {
  value: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
}

export function ListEditor({
  value,
  onChange,
  placeholder = "Item",
  emptyMessage = "No items yet",
}: ListEditorProps) {
  function updateItem(index: number, text: string) {
    onChange(value.map((item, i) => (i === index ? text : item)));
  }

  function addItem() {
    onChange([...value, ""]);
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {value.length === 0 && (
          <p className="text-muted-foreground text-xs italic">{emptyMessage}</p>
        )}
        {value.map((item, index) => (
          <div
            key={index}
            className="border-border/50 bg-muted/40 flex items-center gap-2 rounded-lg border px-3 py-2"
          >
            <GripVertical className="text-muted-foreground h-4 w-4 shrink-0" />
            <span className="text-muted-foreground w-5 shrink-0 text-center text-xs font-bold">
              {index + 1}
            </span>
            <Input
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              placeholder={`${placeholder} ${index + 1}`}
              className="h-9 flex-1"
            />
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
                onClick={() => moveItem(index, -1)}
                disabled={index === 0}
                aria-label={`Move item ${index + 1} up`}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
                onClick={() => moveItem(index, 1)}
                disabled={index === value.length - 1}
                aria-label={`Move item ${index + 1} down`}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive h-8 w-8"
                onClick={() => removeItem(index)}
                aria-label={`Remove item ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addItem}>
        <Plus className="h-3.5 w-3.5" />
        Add item
      </Button>
    </div>
  );
}
