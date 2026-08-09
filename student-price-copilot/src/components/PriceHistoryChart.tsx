"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface HistoryPoint {
  date: string; // ISO date
  price: number;
}

export function PriceHistoryChart({ points }: { points: HistoryPoint[] }) {
  if (points.length < 2) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
        Not enough price history yet to chart a trend — check back after a
        few more scans, or seed more historical data via the seed script.
      </div>
    );
  }

  return (
    <div className="h-56 rounded-lg border border-slate-200 bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickFormatter={(d) => new Date(d).toLocaleDateString()}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `$${v}`}
            width={50}
          />
          <Tooltip
            formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
            labelFormatter={(d) => new Date(d).toLocaleDateString()}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#2c63e6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
