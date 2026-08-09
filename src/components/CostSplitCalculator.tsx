"use client";

import { useState } from "react";

export function CostSplitCalculator({ price }: { price: number }) {
  const [roommates, setRoommates] = useState(2);

  const perPerson = price / Math.max(roommates, 1);

  return (
    <div className="rounded-lg border border-line bg-paper-raised p-4">
      <h3 className="font-mono text-xs uppercase tracking-wide text-ink-soft">
        Splitting this with roommates?
      </h3>
      <div className="mt-3 flex items-center gap-3">
        <label htmlFor="roommates" className="text-sm text-ink-soft">
          Number of people
        </label>
        <input
          id="roommates"
          type="number"
          min={1}
          max={10}
          value={roommates}
          onChange={(e) =>
            setRoommates(Math.max(1, Number(e.target.value) || 1))
          }
          className="w-16 rounded-md border border-line bg-paper px-2 py-1 font-mono text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald"
        />
      </div>
      <p className="mt-3 font-mono text-lg font-semibold tabular-nums text-emerald-deep">
        ${perPerson.toFixed(2)}{" "}
        <span className="font-sans text-sm font-normal text-ink-soft">
          per person
        </span>
      </p>
    </div>
  );
}
