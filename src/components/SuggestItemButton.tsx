"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";

export function SuggestItemButton({ page }: { page: "dorm" | "textbooks" }) {
  const [open, setOpen] = useState(false);
  const [itemTitle, setItemTitle] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!itemTitle.trim()) return;
    setStatus("submitting");
    try {
      await fetch("/api/suggest-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, itemTitle, note }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setStatus("done");
    }
  }

  function close() {
    setOpen(false);
    setTimeout(() => {
      setStatus("idle");
      setItemTitle("");
      setNote("");
    }, 200);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-sm font-mono text-xs uppercase tracking-wide text-purple underline decoration-dotted underline-offset-4 transition-colors hover:text-purple-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
      >
        Don&apos;t see what you need? Suggest an item &rarr;
      </button>

      {open && (
        <Modal onClose={close} labelledBy="suggest-item-title">
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between border-b border-dashed border-line pb-3">
              <h2 id="suggest-item-title" className="font-display text-lg text-ink">
                Suggest an item
              </h2>
              <button
                onClick={close}
                aria-label="Close"
                className="rounded-sm border border-line px-2 py-1 font-mono text-xs text-ink-soft transition-colors hover:border-purple hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
              >
                Close
              </button>
            </div>

            {status === "done" ? (
              <p className="text-sm text-ink-soft">
                Thanks, that&apos;s noted. If enough people ask for the same
                thing, it&apos;s the next item I add.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label
                    htmlFor="suggest-title"
                    className="font-mono text-[11px] uppercase tracking-wide text-ink-faint"
                  >
                    {page === "dorm" ? "Item" : "Book or course title"}
                  </label>
                  <input
                    id="suggest-title"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    required
                    placeholder={
                      page === "dorm"
                        ? "e.g. Egg crate mattress pad"
                        : "e.g. Intro to Statistics, Moore"
                    }
                    className="mt-1 w-full rounded-sm border border-line bg-paper-raised px-3 py-2 font-mono text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
                  />
                </div>
                <div>
                  <label
                    htmlFor="suggest-note"
                    className="font-mono text-[11px] uppercase tracking-wide text-ink-faint"
                  >
                    Anything else? (optional)
                  </label>
                  <textarea
                    id="suggest-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-sm border border-line bg-paper-raised px-3 py-2 font-mono text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "submitting" || !itemTitle.trim()}
                  className="w-full rounded-sm bg-ink px-4 py-2 font-mono text-xs uppercase tracking-wide text-paper transition-colors hover:bg-purple disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status === "submitting" ? "Sending…" : "Send suggestion"}
                </button>
              </form>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
