// Runs `worker` over `items` with at most `limit` in flight at once.
// The dorm and textbooks pages both fire one fetch per grid item on mount;
// left unbounded, a 40+ item grid blasts that many concurrent requests at
// once, which trips SerpApi's per-key concurrency cap (and stresses
// Vercel's serverless pool) — most of the burst comes back 500. Capping
// concurrency keeps every request within a range that actually succeeds.
export async function runWithConcurrencyLimit<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let index = 0;
  async function next(): Promise<void> {
    while (index < items.length) {
      const item = items[index++];
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, next));
}
