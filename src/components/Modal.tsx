"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
}

export function Modal({ onClose, labelledBy, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog on open, and restore it to whatever had
    // focus before (the trigger button) on close, so keyboard/screen-reader
    // users aren't left on a trigger that's now behind the overlay.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  // Rendered into document.body via a portal rather than inline: any
  // ancestor with a CSS transform (including animate-fade-up's
  // animation-fill-mode: both, which keeps its transform applied forever
  // after the animation ends) creates a new containing block, which
  // silently breaks `position: fixed` on a nested modal — it ends up
  // positioned relative to that ancestor instead of the viewport. A
  // portal sidesteps the problem entirely regardless of where the
  // trigger lives in the tree.
  return createPortal(
    <div
      className="animate-overlay-in fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/55 p-4 py-[6vh] backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="animate-card-settle w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_24px_60px_-20px_rgb(27_24_18/0.35)] focus:outline-none"
      >
        <div className="h-1.5 w-full bg-purple" aria-hidden />
        {children}
      </div>
    </div>,
    document.body
  );
}
