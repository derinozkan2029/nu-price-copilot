"use client";

import { useState } from "react";

export function CostSplitCalculator({ price }: { price: number }) {
  const [roommates, setRoommates] = useState(2);

  const perPerson = price / Math.max(roommates, 1);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-800">
        Splitting this with roommates?
      </h3>
      <div className="mt-3 flex items-center gap-3">
        <label htmlFor="roommates" className="text-sm text-slate-600">
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
          className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
        />
      </div>
      <p className="mt-3 text-lg font-semibold text-brand-700">
        ${perPerson.toFixed(2)}{" "}
        <span className="text-sm font-normal text-slate-500">per person</span>
      </p>
    </div>
  );
}
