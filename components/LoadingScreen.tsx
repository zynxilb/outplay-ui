"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

const SESSION_KEY = "outplay_visited";
const SPLASH_DURATION = 2400;

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
        }, SPLASH_DURATION);
        return () => clearTimeout(t);
      }
    } catch (e) {}
  }, []);

  if (!mounted) return <>{children}</>;

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            style={{
              position: "fixed",
              inset: 0,
              background: "var(--bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
            }}
          >
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              {/* Loading capsule — 0.0-0.6s */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{
                  duration: 0.6,
                  times: [0, 0.15, 0.7, 1],
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: "8px",
                  height: "28px",
                  borderRadius: "9999px",
                  background: "var(--text-dim)",
                  transform: "translate(-50%, -50%)",
                }}
              />

              {/* "Out" — appears blurred, unblurs 0.6-1.4s */}
              <motion.span
                className="serif"
                initial={{ opacity: 0, filter: "blur(20px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontSize: "48px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text)",
                  lineHeight: 1,
                }}
              >
                Out
              </motion.span>

              {/* Icon slot — rook -> P morph (cross-fade + rotate) */}
              <div
                style={{
                  position: "relative",
                  width: "56px",
                  height: "56px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Rook — appears blurred, unblurs, then rotates out */}
                <motion.img
                  src="/logo/icon.svg"
                  alt=""
                  aria-hidden="true"
                  initial={{ opacity: 0, filter: "blur(20px)", rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 1, 0],
                    filter: [
                      "blur(20px)",
                      "blur(0px)",
                      "blur(0px)",
                      "blur(0px)",
                      "blur(0px)",
                    ],
                    rotate: [0, 0, 0, 90, 90],
                    scale: [1, 1, 1, 0.8, 0.8],
                  }}
                  transition={{
                    duration: 2.0,
                    delay: 0.6,
                    times: [0, 0.4, 0.55, 0.7, 1.0],
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    position: "absolute",
                    width: "44px",
                    height: "auto",
                    display: "block",
                  }}
                />

                {/* P logo — appears after rook fades */}
                <motion.img
                  src="/logo/icon-red.svg"
                  alt="Outplay"
                  initial={{ opacity: 0, rotate: -90, scale: 0.8 }}
                  animate={{
                    opacity: [0, 0, 0, 1, 1],
                    rotate: [-90, -90, -90, 0, 0],
                    scale: [0.8, 0.8, 0.8, 1, 1],
                  }}
                  transition={{
                    duration: 2.0,
                    delay: 0.6,
                    times: [0, 0.4, 0.55, 0.7, 1.0],
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{
                    position: "absolute",
                    width: "44px",
                    height: "auto",
                    display: "block",
                  }}
                />
              </div>

              {/* "play" */}
              <motion.span
                className="serif"
                initial={{ opacity: 0, filter: "blur(20px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontSize: "48px",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text)",
                  lineHeight: 1,
                }}
              >
                play
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={showSplash ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: showSplash ? 0 : 1 }}
        transition={{
          duration: 0.5,
          delay: showSplash ? 1.9 : 0,
          ease: "easeInOut",
        }}
      >
        {children}
      </motion.div>
    </>
  );
}
