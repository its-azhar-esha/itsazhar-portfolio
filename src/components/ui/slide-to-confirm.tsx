"use client";

import * as React from "react";
import { Check } from "lucide-react";

interface SlideToConfirmProps {
  /** Prompt shown on the track (e.g. "Slide to apply"). */
  label: string;
  /** Called once when the handle is dragged fully to the right. */
  onConfirm: () => void;
  disabled?: boolean;
  /** Destructive styling (red accent). */
  destructive?: boolean;
}

/**
 * Deliberate confirmation gesture: the owner must drag the handle across the
 * track before the action fires. Prevents accidental approvals.
 */
export function SlideToConfirm({
  label,
  onConfirm,
  disabled = false,
  destructive = false,
}: SlideToConfirmProps) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [progress, setProgress] = React.useState(0);
  const [completed, setCompleted] = React.useState(false);
  const [maxTravel, setMaxTravel] = React.useState(0);
  const draggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startProgressRef = React.useRef(0);

  const confirm = React.useCallback(() => {
    setCompleted(true);
    setProgress(1);
    onConfirm();
  }, [onConfirm]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || completed) return;
    const track = trackRef.current;
    if (!track) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    startProgressRef.current = progress;
    setMaxTravel(Math.max(1, track.clientWidth - 44));
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || completed) return;
    const dx = e.clientX - startXRef.current;
    const next = Math.min(1, Math.max(0, startProgressRef.current + dx / maxTravel));
    setProgress(next);
    if (next >= 0.95) {
      draggingRef.current = false;
      confirm();
    }
  };

  const endDrag = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (progress < 1) {
      setProgress(0);
    }
  };

  const accent = destructive ? "bg-red-600" : "bg-primary";

  return (
    <div
      ref={trackRef}
      role="button"
      tabIndex={0}
      aria-label={label}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !disabled && !completed) {
          confirm();
        }
      }}
      className={`relative h-10 w-full overflow-hidden rounded-lg border transition-opacity select-none ${
        disabled ? "opacity-50" : ""
      } ${completed ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
      style={{ touchAction: "none" }}
    >
      <div
        className={`absolute inset-0 ${accent} transition-opacity`}
        style={{ opacity: progress * 0.15 }}
      />
      <div
        className="pointer-events-none absolute top-1/2 w-full -translate-y-1/2 text-center text-xs font-medium"
        style={{
          color: completed ? "hsl(var(--primary-foreground))" : undefined,
          opacity: completed ? 0 : 0.7,
        }}
      >
        {label}
      </div>
      <div
        className={`absolute top-1/2 left-1 flex h-8 w-9 -translate-y-1/2 items-center justify-center rounded-md shadow-sm transition-colors ${
          completed ? accent : "bg-muted-foreground/15"
        }`}
        style={{ transform: `translateX(${progress * maxTravel}px) translateY(-50%)` }}
      >
        {completed ? (
          <Check className="h-4 w-4 text-white" />
        ) : (
          <span className="block h-3.5 w-2 rounded-sm bg-current opacity-60" />
        )}
      </div>
    </div>
  );
}
