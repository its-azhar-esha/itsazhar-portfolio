"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImageIcon, X } from "lucide-react";
import { MediaLibrary } from "./media-library";

interface MediaPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  folder?: string;
}

export function MediaPicker({ open, onClose, onSelect, folder }: MediaPickerProps) {
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  function handleSelect(url: string) {
    onSelect(url);
    onClose();
  }

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
            className="border-border/50 bg-background relative z-10 flex max-h-[80vh] w-full max-w-3xl flex-col rounded-xl border shadow-xl"
          >
            <div className="border-border/40 flex items-center justify-between border-b px-5 py-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="text-muted-foreground h-4 w-4" />
                <h3 className="text-sm font-semibold">Media Library</h3>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground -mr-1 flex h-7 w-7 items-center justify-center rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <MediaLibrary onSelect={handleSelect} folder={folder} />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
