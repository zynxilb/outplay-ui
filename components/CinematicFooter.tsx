// components/CinematicFooter.tsx
"use client";

import { useRef, type ReactNode, type MouseEvent as ReactMouseEvent } from "react";
import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
} from "motion/react";

// ===== Magnetic Pill =====
function MagneticPill({
  href,
  children,
  variant = "default",
  size = "lg",
}: {
  href: string;
  children: ReactNode;
  variant?: "default" | "accent";
  size?: "lg" | "sm";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const cfg = { stiffness: 300, damping: 20, mass: 0.5 };
  const sx = useSpring(x, cfg);
  const sy = useSpring(y, cfg);
  const srx = useSpring(rotateX, cfg);
  const sry = useSpring(rotateY, cfg);

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    x.set(dx * 0.3);
    y.set(dy * 0.3);
    rotateX.set(-dy * 0.15);
    rotateY.set(dx * 0.15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    rotateX.set(0);
    rotateY.set(0);
  };

  const classes = [
    "footer-pill",
    variant === "accent" && "footer-pill-accent",
    size === "sm" && "footer-pill-sm",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: sx,
        y: sy,
        rotateX: srx,
        rotateY: sry,
        transformPerspective: 800,
        transformStyle: "preserve-3d",
      }}
    >
      <Link href={href} className={classes}>
        {children}
      </Link>
    </motion.div>
  );
}

// ===== Marquee =====
function MarqueeItem() {
  return (
    <div className="footer-marquee-item">
      <span>حلّل مباراتك</span>
      <span className="footer-marquee-dot">&#10022;</span>
      <span>افهم كل غلطة</span>
      <span className="footer-marquee-dot">&#10022;</span>
      <span>بالعربي</span>
      <span className="footer-marquee-dot">&#10022;</span>
      <span>مجاني للأبد</span>
      <span className="footer-marquee-dot">&#10022;</span>
      <span>Stockfish 17.1</span>
      <span className="footer-marquee-dot">&#10022;</span>
    </div>
  );
}

// ===== Main Component =====
export function CinematicFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: wrapperRef,
    offset: ["start end", "end end"],
  });

  const giantY = useTransform(scrollYProgress, [0, 1], ["8vh", "-2vh"]);
  const giantScale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
  const giantOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [0, 0.5, 1]);

  const contentY = useTransform(scrollYProgress, [0.25, 1], [60, 0]);
  const contentOpacity = useTransform(scrollYProgress, [0.25, 0.75], [0, 1]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div ref={wrapperRef} className="cinematic-footer-wrapper">
      <footer className="cinematic-footer">
        <div className="footer-aurora" aria-hidden />
        <div className="footer-bg-grid" aria-hidden />

        <motion.div
          className="footer-giant-text"
          style={{ y: giantY, scale: giantScale, opacity: giantOpacity }}
          dir="ltr"
          aria-hidden
        >
          Outplay
        </motion.div>

        <div className="footer-marquee" aria-hidden>
          <div className="footer-marquee-track" dir="ltr">
            <MarqueeItem />
            <MarqueeItem />
          </div>
        </div>

        <motion.div
          className="footer-center"
          style={{ y: contentY, opacity: contentOpacity }}
        >
          <h2 className="footer-heading arabic">جاهز تبدأ؟</h2>

          <div className="footer-buttons-primary">
            <MagneticPill href="/import" variant="accent">
              حلّل مباراتك
            </MagneticPill>
            <MagneticPill href="/play">العب على الرقعة</MagneticPill>
          </div>

          <div className="footer-buttons-secondary">
            <MagneticPill href="/about" size="sm">
              عن المشروع
            </MagneticPill>
            <MagneticPill href="/#faq" size="sm">
              الأسئلة
            </MagneticPill>
            <MagneticPill href="/" size="sm">
              الرئيسية
            </MagneticPill>
          </div>
        </motion.div>

        <div className="footer-bottom">
          <div className="footer-copy arabic">&copy; 2026 Outplay</div>

          <div className="footer-made arabic">
            <span>صُنع في مصر</span>
            <span className="footer-heart" aria-hidden>&#9829;</span>
          </div>

          <button
            type="button"
            className="footer-top-btn"
            onClick={scrollToTop}
            aria-label="العودة للأعلى"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
