// pages/index.js
import Head from "next/head";
import { useEffect, useState, useCallback } from "react";
import { fetchMarketCoins } from "../utils/api";
import Layout from "../components/Layout";
import styles from "../styles/dashboard.module.css";
import Image from "next/image";


const DEBOUNCE_MS = 300;
const PER_PAGE = 50;

export default function Home() {
  const [coins, setCoins] = useState([]);
  const [display, setDisplay] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [watchlist, setWatchlist] = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("watchlist") || "[]");
    } catch {
      return [];
    }
  });

  const loadPage = useCallback(
    async (targetPage) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchMarketCoins({ page: targetPage, per_page: PER_PAGE });
        setCoins(data);
        setDisplay(data);
        setPage(targetPage);
      } catch (e) {
        setError(e.message || "Failed to load"); // keep current page if error
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadPage(page);
  }, [loadPage, page]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim().toLowerCase()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!debounced) {
      setDisplay(coins);
    } else {
      setDisplay(
        coins.filter(
          (c) =>
            c.name.toLowerCase().includes(debounced) ||
            c.symbol.toLowerCase().includes(debounced)
        )
      );
    }
  }, [debounced, coins]);

  // persist watchlist
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("watchlist", JSON.stringify(watchlist));
    }
  }, [watchlist]);

  const toggleWatch = (id) => {
    setWatchlist((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <>
      <Head>
        <title>Crypto Markets</title>
        <meta name="description" content="Crypto dashboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Layout>
        <div className={styles.header} style={{ padding: 0, borderBottom: "none" }}>
          <div>
            <h1 className={styles.title}>Crypto Markets</h1>
          </div>
          <div className={styles.searchRow}>
            <input
              aria-label="search coins"
              placeholder="Search name or symbol"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <div style={{ marginLeft: "auto", alignSelf: "center" }}>
              <strong>Page:</strong> {page}
            </div>
          </div>
        </div>

        {loading && <p>Loading...</p>}

        {error && (
          <p style={{ color: "red" }}>
            {error.toString().includes("429")
              ? "Rate limited by CoinGecko. Please wait a few seconds and try again."
              : `Error: ${error.toString()}`}
          </p>
        )}

        {!loading && !error && display.length === 0 && (
          <div className={styles.emptyState}>No coins match.</div>
        )}

        {!loading && !error && display.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>S. No.</th>
                  <th>Coin</th>
                  <th>Price</th>
                  <th>24h %</th>
                  <th>Market Cap</th>
                  <th>24h Volume</th>
                  <th>Watch</th>
                </tr>
              </thead>
              <tbody>
                {display.map((c, index) => (
                  <tr key={c.id}>
                    <td data-label="S. No." style={{ minWidth: 30 }}>
                      {index + 1 + (page - 1) * PER_PAGE}
                    </td>
                    <td data-label="Coin" className={styles.coinCell}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Image
                           src={c.image}
                           alt={c.name}
                           width={24}
                           height={24}
                           style={{ borderRadius: 12 }}
                           unoptimized // optional: skip optimization if you want to avoid extra config
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
                      <div className="value">
                        ${c.current_price.toLocaleString()}
                      </div>
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
                      <div className="value">
                        ${c.market_cap.toLocaleString()}
                      </div>
                    </td>
                    <td data-label="24h Volume">
                      <div className="value">
                        ${c.total_volume.toLocaleString()}
                      </div>
                    </td>
                    <td data-label="Watch" style={{ textAlign: "center" }}>
                      <span
                        className={styles.watchStar}
                        onClick={() => toggleWatch(c.id)}
                      >
                        {watchlist.includes(c.id) ? "★" : "☆"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className={styles.pagination}>
          <button
            onClick={() => loadPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className={styles.button}
          >
            Previous
          </button>
          <button onClick={() => loadPage(page + 1)} className={styles.button}>
            Next
          </button>
        </div>
      </Layout>
    </>
  );
}
