import type { VendorPrice } from "@/lib/bookscouter";

export function PriceTable({ prices }: { prices: VendorPrice[] }) {
  const sorted = [...prices].sort((a, b) => a.price - b.price);
  const lowest = sorted[0]?.price;

  return (
    <table className="w-full overflow-hidden rounded-lg border border-slate-200 text-sm">
      <thead className="bg-slate-100 text-left text-slate-600">
        <tr>
          <th className="px-4 py-2 font-medium">Vendor</th>
          <th className="px-4 py-2 font-medium">Format</th>
          <th className="px-4 py-2 font-medium text-right">Price</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((p, i) => (
          <tr
            key={`${p.vendor}-${i}`}
            className={
              p.price === lowest
                ? "bg-brand-50 font-semibold text-brand-700"
                : "border-t border-slate-100"
            }
          >
            <td className="px-4 py-2">{p.vendor}</td>
            <td className="px-4 py-2 capitalize text-slate-600">
              {p.format ?? "—"}
            </td>
            <td className="px-4 py-2 text-right">${p.price.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
