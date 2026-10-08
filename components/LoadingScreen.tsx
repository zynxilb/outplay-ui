"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const SESSION_KEY = "outplay_visited";

export function LoadingScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const visited = sessionStorage.getItem(SESSION_KEY);
      if (!visited) {
        setShowSplash(true);
        const t = setTimeout(() => {
          setShowSplash(false);
          try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (e) {}
        }, 1500);
        return () => clearTimeout(t);
      }
    } catch (e) {
      // sessionStorage blocked — just skip splash
    }
  }, []);

  // SSR + first render: render children (avoid hydration mismatch)
  if (!mounted) return <>{children}</>;

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            style={{
              position: "fixed",
              inset: 0,
              background: "var(--bg)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              gap: "24px",
            }}
          >
            <motion.img
              src="/logo/icon.svg"
              alt="Outplay"
              width={80}
              height={80}
              initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              style={{ height: "auto" }}
            />

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="serif"
              style={{
                fontSize: "32px",
                fontWeight: 900,
                letterSpacing: "-0.02em",
                color: "var(--text)",
              }}
            >
              Outplay
            </motion.div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "80px" }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                height: "1.5px",
                background: "var(--accent)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={showSplash ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{ duration: 0.6, delay: showSplash ? 1.0 : 0, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </>
  );
}
