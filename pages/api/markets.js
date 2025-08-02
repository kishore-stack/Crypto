// pages/api/markets.js
const cache = new Map(); // simple in-memory cache: key -> { timestamp, data }
const CACHE_TTL = 30 * 1000; // 30 seconds

async function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export default async function handler(req, res) {
  const { page = "1", per_page = "50" } = req.query;
  const cacheKey = `markets:${page}:${per_page}`;

  // serve from cache if fresh
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    res.setHeader("x-cache", "HIT");
    return res.status(200).json(cached.data);
  }

  const url =
    `https://api.coingecko.com/api/v3/coins/markets` +
    `?vs_currency=usd&order=market_cap_desc&per_page=${encodeURIComponent(per_page)}` +
    `&page=${encodeURIComponent(page)}&sparkline=false`;

  let attempt = 0;
  const maxAttempts = 3;
  const baseDelay = 500; // ms

  while (attempt < maxAttempts) {
    try {
      const r = await fetch(url);
      if (r.status === 429) {
        // rate limited, will retry after backoff
        attempt++;
        const delay = baseDelay * Math.pow(2, attempt - 1); // 500, 1000, 2000
        await wait(delay);
        continue;
      }

      if (!r.ok) {
        return res.status(r.status).json({ error: r.statusText || "CoinGecko error" });
      }

      const data = await r.json();

      // cache successful result
      cache.set(cacheKey, { timestamp: Date.now(), data });

      // short-term proxy cache header
      res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
      res.setHeader("x-cache", "MISS");
      return res.status(200).json(data);
    } catch (err) {
      attempt++;
      if (attempt >= maxAttempts) {
        return res.status(500).json({ error: err.message || "Fetch failed" });
      }
      await wait(baseDelay * attempt);
    }
  }

  // if we exit loop without success, assume rate-limited
  return res.status(429).json({ error: "Too many requests, please wait a moment and try again." });
}
