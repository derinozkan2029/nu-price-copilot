"use client";

import { useState } from "react";

export function SearchBar({
  onSearch,
  placeholder = "Enter an ISBN (e.g. 9780134685991)",
  disabled = false,
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim() && !disabled) onSearch(value.trim());
      }}
      className="flex gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label="ISBN"
        name="isbn"
        autoComplete="off"
        disabled={disabled}
        className="flex-1 rounded-sm border border-line bg-paper-raised px-4 py-2.5 font-mono text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple disabled:cursor-not-allowed disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-sm bg-ink px-5 py-2.5 font-mono text-xs uppercase tracking-wide text-paper transition-colors hover:bg-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? "Searching…" : "Compare"}
      </button>
    </form>
  );
}
