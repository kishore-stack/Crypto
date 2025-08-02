// utils/api.js
export async function fetchMarketCoins({ page = 1, per_page = 50 }) {
  const url = `/api/markets?page=${page}&per_page=${per_page}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Market API error: ${res.status} ${body}`);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      throw new Error("Unexpected response format from market API");
    }

    if (data.length === 0) {
      throw new Error("No more coins to display.");
    }

    return data;
  } catch (error) {
    console.error("fetchMarketCoins error:", error);
    throw error;
  }
}
