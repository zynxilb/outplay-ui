"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SplashContext } from "@/contexts/SplashContext";

const SESSION_KEY = "outplay_visited";
const TOTAL_MS = 3600;

export function LoadingScreen({ children }: { children: React.ReactNode }) {
  const [showSplash, setShowSplash] = useState(true);
  const [isRTL, setIsRTL] = useState(false);

  useEffect(() => {
    try {
      const dir = document.documentElement.dir || "ltr";
      setIsRTL(dir === "rtl");
    } catch {}

    try {
      if (document.documentElement.classList.contains("splash-skip")) {
        setShowSplash(false);
        return;
      }
      if (sessionStorage.getItem(SESSION_KEY)) {
        setShowSplash(false);
        return;
      }
      const t = setTimeout(() => {
        setShowSplash(false);
        try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
      }, TOTAL_MS);
      return () => clearTimeout(t);
    } catch {
      setShowSplash(false);
    }
  }, []);

  const sideText = (text: string, side: "left" | "right") => {
    const dir = side === "left" ? -1 : 1;
    const xIn = isRTL ? -dir * 80 : dir * 80;

    return (
      <motion.span
        className="serif"
        initial={{ opacity: 0, x: xIn }}
        animate={{
          opacity: [0, 1, 1, 1, 0],
          x: [xIn, 0, 0, 0, -xIn * 0.3],
        }}
        transition={{
          duration: 3.6,
          times: [0, 0.15, 0.4, 0.68, 0.85],
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{
          fontSize: "92px",
          fontWeight: 700,
          color: "#EEEEEE",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          display: "inline-block",
        }}
      >
        {text}
      </motion.span>
    );
  };

  return (
    <SplashContext.Provider value={!showSplash}>
      {children}

      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            className="loading-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "56px",
              }}
            >
              {sideText("Out", "left")}

              <motion.img
                src="/logo/rook-white.svg"
                alt="Outplay"
                width={220}
                height={220}
                initial={{
                  opacity: 0,
                  x: 240,
                  rotate: -220,
                  scale: 0.5,
                }}
                animate={{
                  opacity: [0, 1, 1, 1, 1, 0],
                  x: [240, 0, 0, 0, 0, 0],
                  rotate: [-220, 0, 0, 0, 0, 0],
                  scale: [0.5, 1, 1, 1, 1, 1],
                }}
                transition={{
                  duration: 3.6,
                  times: [0, 0.17, 0.4, 0.68, 0.9, 1],
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  display: "block",
                  position: "relative",
                  zIndex: 10,
                }}
              />

              {sideText("play", "right")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </SplashContext.Provider>
  );
}
