// components/Layout.js
import Link from "next/link";
import styles from "../styles/dashboard.module.css";

export default function Layout({ children }) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 className={styles.title}>Crypto Dashboard</h1>
        </div>
        <nav className={styles.nav}>
          <Link href="/">Home</Link>
          <Link href="/watchlist">Watchlist</Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
