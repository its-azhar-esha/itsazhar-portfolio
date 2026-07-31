"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Save, Send, Trash2, X } from "lucide-react";

interface FormActionsProps {
  mode: "create" | "edit";
  saving: boolean;
  hasChanges: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onDelete?: () => void;
  onCancel: () => void;
}

export function ProjectFormActions({
  mode,
  saving,
  hasChanges,
  onSaveDraft,
  onPublish,
  onDelete,
  onCancel,
}: FormActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="default"
        size="sm"
        onClick={onSaveDraft}
        disabled={saving || !hasChanges}
        className="gap-2"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {mode === "create" ? "Create Draft" : "Save Draft"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onPublish}
        disabled={saving || !hasChanges}
        className="gap-2"
      >
        <Send className="h-4 w-4" />
        {mode === "create" ? "Publish" : "Update & Publish"}
      </Button>
      {mode === "edit" && onDelete && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          disabled={saving}
          className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onCancel} className="gap-2">
        <X className="h-4 w-4" />
        Cancel
      </Button>
      {hasChanges && !saving && <span className="text-xs text-amber-500">Unsaved changes</span>}
    </div>
  );
}
