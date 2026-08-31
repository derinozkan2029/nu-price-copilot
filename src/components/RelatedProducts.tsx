import Image from "next/image";
import type { SimilarProduct } from "@/lib/serpapi";
import { AnimatedPrice } from "@/components/AnimatedPrice";

export function RelatedProducts({ products }: { products: SimilarProduct[] }) {
  return (
    <div className="border-t border-dashed border-line pt-3">
      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
        You might also like
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {products.map((p, i) => (
          <a
            key={`${p.vendor}-${i}`}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col overflow-hidden rounded-sm border border-line bg-paper-raised transition-colors hover:border-purple/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple"
          >
            <div className="relative aspect-square w-full border-b border-line bg-paper">
              <Image
                src={p.thumbnail}
                alt={p.title}
                fill
                sizes="120px"
                className="object-contain p-2"
              />
            </div>
            <div className="flex flex-col gap-0.5 p-2">
              <p className="line-clamp-2 text-[11px] leading-tight text-ink-soft">
                {p.title}
              </p>
              <div className="flex items-center justify-between font-mono text-[11px] font-semibold tabular-nums text-purple-deep">
                <AnimatedPrice value={p.price} />
              </div>
              <p className="truncate font-mono text-[9px] uppercase tracking-wide text-ink-faint">
                {p.vendor}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
