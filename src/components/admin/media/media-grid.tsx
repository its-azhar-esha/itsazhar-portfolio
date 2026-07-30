"use client";

import { motion } from "framer-motion";
import { staggerContainer } from "@/lib/motion";
import type { MediaFile } from "@/lib/storage";
import { MediaCard } from "./media-card";

interface MediaGridProps {
  files: MediaFile[];
  onSelect?: (url: string) => void;
  onDelete: (path: string) => void;
}

export function MediaGrid({ files, onSelect, onDelete }: MediaGridProps) {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4"
    >
      {files.map((file) => (
        <MediaCard key={file.url} file={file} onSelect={onSelect} onDelete={onDelete} />
      ))}
    </motion.div>
  );
}
