"use client";

import { useEffect } from "react";

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

  return (
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
    </div>
  );
}
