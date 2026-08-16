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

export function PriceHistoryChart({
  points,
  caption,
}: {
  points: HistoryPoint[];
  caption?: string;
}) {
  if (points.length < 2) {
    return (
      <div className="rounded-sm border border-dashed border-line p-4 font-mono text-xs text-ink-faint">
        Not enough price history yet to chart a trend. Check back after a
        few more scans, or seed more historical data via the seed script.
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-line bg-paper-raised p-4">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <XAxis
              dataKey="date"
              tick={{
                fontSize: 11,
                fill: "rgb(var(--color-ink-soft))",
                fontFamily: "var(--font-mono)",
              }}
              tickFormatter={(d) => new Date(d).toLocaleDateString()}
              axisLine={{ stroke: "rgb(var(--color-line))" }}
              tickLine={false}
            />
            <YAxis
              tick={{
                fontSize: 11,
                fill: "rgb(var(--color-ink-soft))",
                fontFamily: "var(--font-mono)",
              }}
              tickFormatter={(v) => `$${v}`}
              width={50}
              axisLine={{ stroke: "rgb(var(--color-line))" }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                background: "rgb(var(--color-paper-raised))",
                border: "1px solid rgb(var(--color-line))",
                borderRadius: 6,
                color: "rgb(var(--color-ink))",
              }}
              labelStyle={{ color: "rgb(var(--color-ink-soft))" }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
              labelFormatter={(d) => new Date(d).toLocaleDateString()}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="rgb(var(--color-purple))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {caption && (
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-ink-faint">
          {caption}
        </p>
      )}
    </div>
  );
}
