// pages/watchlist.js
import Head from "next/head";
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { fetchMarketCoins } from "../utils/api";
import styles from "../styles/dashboard.module.css";

export default function Watchlist() {
  const [coins, setCoins] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // load stored watchlist ids
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("watchlist") || "[]");
      setWatchlist(stored);
    } catch {
      setWatchlist([]);
    }
  }, []);

  // fetch data for coins in watchlist
  useEffect(() => {
    if (watchlist.length === 0) {
      setCoins([]);
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // get a reasonably large page to include watchlist items
        const data = await fetchMarketCoins({ page: 1, per_page: 250 });
        const filtered = data.filter((c) => watchlist.includes(c.id));
        setCoins(filtered);
      } catch (e) {
        setError(e.message || "Failed to load watchlist");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [watchlist]);

  const remove = (id) => {
    const updated = watchlist.filter((x) => x !== id);
    setWatchlist(updated);
    localStorage.setItem("watchlist", JSON.stringify(updated));
    setCoins((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <>
      <Head>
        <title>Watchlist</title>
        <meta name="description" content="Your saved coins" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Layout>
        <div className={styles.header} style={{ padding: 0, borderBottom: "none" }}>
          <div>
            <h1 className={styles.title}>Your Watchlist</h1>
          </div>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>Error: {error.toString()}</p>}

        {!loading && watchlist.length === 0 && (
          <div className={styles.emptyState}>You have no coins in your watchlist.</div>
        )}

        {!loading && coins.length === 0 && watchlist.length > 0 && (
          <div className={styles.emptyState}>No data available for saved coins.</div>
        )}

        {!loading && coins.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Coin</th>
                  <th>Price</th>
                  <th>24h %</th>
                  <th>Market Cap</th>
                  <th>Volume</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {coins.map((c) => (
                  <tr key={c.id}>
                    <td data-label="#" style={{ minWidth: 30 }}>
                      {c.market_cap_rank}
                    </td>
                    <td data-label="Coin" className={styles.coinCell}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <img
                          src={c.image}
                          alt={c.name}
                          width={24}
                          height={24}
                          style={{ borderRadius: 12 }}
                        />
                        <div>
                          <div>{c.name}</div>
                          <div className={styles.smallText}>
                            {c.symbol.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td data-label="Price">
                      <div className="value">${c.current_price.toLocaleString()}</div>
                    </td>
                    <td
                      data-label="24h %"
                      className={
                        c.price_change_percentage_24h >= 0
                          ? styles.positive
                          : styles.negative
                      }
                    >
                      <div className="value">
                        {c.price_change_percentage_24h?.toFixed(2)}%
                      </div>
                    </td>
                    <td data-label="Market Cap">
                      <div className="value">${c.market_cap.toLocaleString()}</div>
                    </td>
                    <td data-label="Volume">
                      <div className="value">${c.total_volume.toLocaleString()}</div>
                    </td>
                    <td data-label="Remove">
                      <button
                        onClick={() => remove(c.id)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid #888",
                          background: "white",
                          cursor: "pointer",
                          fontSize: "0.85rem",
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Layout>
    </>
  );
}
