"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 items-center justify-center rounded-sm border border-line font-mono text-sm text-ink-soft transition-colors hover:border-purple hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
    >
      <span aria-hidden className="leading-none">
        {isDark === null ? "" : isDark ? "☀" : "☾"}
      </span>
    </button>
  );
}
