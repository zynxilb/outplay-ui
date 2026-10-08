"use client";

import Link from "next/link";
import { motion, useScroll, useSpring } from "motion/react";
import { LoadingScreen } from "@/components/LoadingScreen";

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2px",
        background: "var(--accent)",
        transformOrigin: "0%",
        scaleX,
        zIndex: 100,
      }}
    />
  );
}

function toggleTheme() {
  const root = document.documentElement;
  const wasDark = root.classList.contains("dark");
  if (wasDark) {
    root.classList.remove("dark");
    try { localStorage.setItem("theme", "light"); } catch (e) {}
  } else {
    root.classList.add("dark");
    try { localStorage.setItem("theme", "dark"); } catch (e) {}
  }
}

function Nav() {
  return (
    <nav className="nav-bar" dir="ltr">
      <div className="nav-brand">
        <img
          src="/logo/icon.svg"
          alt="Outplay"
          width="56"
          height="48"
          style={{ height: "auto" }}
        />
        <span
          className="serif"
          style={{
            fontSize: "28px",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "var(--text)",
          }}
        >
          Outplay
        </span>
      </div>

      <div className="nav-actions">
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#about">About</a>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="theme-btn"
        >
          <svg
            className="theme-icon-light"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <svg
            className="theme-icon-dark"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </button>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="retro-bg" aria-hidden="true" />

      <img
        src="/logo/queen.svg"
        alt=""
        className="hero-queen"
        aria-hidden="true"
      />

      <div className="hero-content">
        <motion.div
          className="hero-tagline arabic"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          حلّل. افهم. اتقدّم.
        </motion.div>

        <motion.h1
          className="hero-title serif"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          Outplay
        </motion.h1>

        <motion.p
          className="hero-subtitle arabic"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          من التحليل للتقدم — <span className="accent">خطوة كل يوم.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link href="/import" className="hero-cta">
            <span className="hero-cta-label arabic">ابدأ التحليل</span>
            <span className="hero-cta-line" />
          </Link>
        </motion.div>
      </div>

      <motion.div
        className="hero-scroll"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
      >
        ↓ SCROLL
      </motion.div>
    </section>
  );
}

export default function Home() {
  return (
    <LoadingScreen>
      <main style={{ minHeight: "100vh", position: "relative" }}>
        <ScrollProgress />
        <Nav />
        <Hero />
      </main>
    </LoadingScreen>
  );
}
