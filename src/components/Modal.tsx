"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
}

export function Modal({ onClose, labelledBy, children }: ModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
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
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/50 p-4 py-[6vh]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up w-full max-w-xl rounded-sm border border-line bg-paper"
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
