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
        className="inline-flex items-center gap-1.5 rounded-sm font-mono text-xs uppercase tracking-wide text-purple underline decoration-dotted underline-offset-4 transition-colors hover:text-purple-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
      >
        <span aria-hidden>+</span>
        Don&apos;t see what you need? Suggest an item
      </button>

      {open && (
        <Modal onClose={close} labelledBy="suggest-item-title">
          <div className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-4 border-b border-dashed border-line pb-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wide text-purple">
                  Suggestion
                </p>
                <h2 id="suggest-item-title" className="mt-1 font-display text-lg text-ink">
                  {page === "dorm" ? "What's missing from the dorm catalog?" : "What's missing from the textbook list?"}
                </h2>
              </div>
              <button
                onClick={close}
                aria-label="Close"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-base leading-none text-ink-soft transition-colors hover:border-purple hover:text-purple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
              >
                <span aria-hidden>&times;</span>
              </button>
            </div>

            {status === "done" ? (
              <div className="flex gap-3 rounded-xl border border-line bg-paper-raised p-4">
                <div className="min-w-0">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-purple-deep">
                    <span aria-hidden>&#10003;</span>
                    Noted
                  </span>
                  <p className="mt-1.5 font-display text-[15px] italic leading-snug text-ink">
                    Thanks, that&apos;s saved. If enough people ask for the
                    same thing, it&apos;s the next item I add.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm leading-relaxed text-ink-soft">
                  Tell me what you couldn&apos;t find and I&apos;ll consider
                  it for the catalog.
                </p>
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
                    className="mt-1.5 w-full rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
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
                    className="mt-1.5 w-full rounded-xl border border-line bg-paper-raised px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-ink-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === "submitting" || !itemTitle.trim()}
                  className="w-full rounded-xl bg-purple px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-wide text-paper transition-colors hover:bg-purple-deep disabled:cursor-not-allowed disabled:bg-ink-faint/20 disabled:text-ink-faint"
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
