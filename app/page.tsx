"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView, useScroll, useTransform, type MotionValue } from "motion/react";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useSplashDone } from "@/contexts/SplashContext";

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function ScrollReveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Nav() {
  return (
    <nav className="nav-bar" dir="ltr">
      <div className="nav-brand">
        <img src="/logo/rook.svg" alt="Outplay" width={40} height={40} />
        <span className="nav-brand-text serif">Outplay</span>
      </div>
      <div className="nav-links">
        <a href="#how">How it works</a>
        <a href="#features">Features</a>
        <a href="#about">About</a>
      </div>
    </nav>
  );
}

function Hero() {
  const splashDone = useSplashDone();

  const variants = {
    hidden: { opacity: 0, y: 30, filter: "blur(16px)" },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.9,
        delay,
        ease: [0.16, 1, 0.3, 1] as const,
      },
    }),
  };

  return (
    <section className="hero">
      <img
        src="/logo/rook.svg"
        alt=""
        aria-hidden="true"
        className="hero-watermark"
      />
      <div className="hero-inner">
        <motion.div
          className="hero-eyebrow arabic"
          initial="hidden"
          animate={splashDone ? "visible" : "hidden"}
          variants={variants}
          custom={0.1}
        >
          حلّل. افهم. اتقدّم.
        </motion.div>

        {/* Big Outplay — the main reveal */}
        <motion.h1
          className="hero-title serif"
          initial="hidden"
          animate={splashDone ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0, y: 40, scale: 0.92, filter: "blur(24px)" },
            visible: {
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
              transition: {
                duration: 1.2,
                delay: 0.2,
                ease: [0.16, 1, 0.3, 1],
              },
            },
          }}
        >
          Outplay
        </motion.h1>

        <motion.p
          className="hero-subtitle arabic"
          initial="hidden"
          animate={splashDone ? "visible" : "hidden"}
          variants={variants}
          custom={0.7}
        >
          تحليل شطرنج بالعربي — <span className="accent">افهم كل غلطة وليه.</span>
        </motion.p>

        <motion.div
          initial="hidden"
          animate={splashDone ? "visible" : "hidden"}
          variants={variants}
          custom={0.9}
        >
          <Link href="/import" className="btn-primary arabic">
            ابدأ التحليل
            <ArrowIcon />
          </Link>
        </motion.div>
      </div>

      <motion.div
        className="hero-scroll"
        initial={{ opacity: 0 }}
        animate={splashDone ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: 1.4 }}
      >
        scroll ↓
      </motion.div>
    </section>
  );
}

function PinnedStep({
  step,
  index,
  total,
  progress,
}: {
  step: { num: string; title: string; body: string };
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const start = index / total;
  const end = (index + 1) / total;

  const opacity = useTransform(
    progress,
    [start, start + 0.05, end - 0.05, end],
    [index === 0 ? 1 : 0, 1, 1, end === 1 ? 1 : 0]
  );
  const y = useTransform(progress, [start, end], [40, -40]);

  return (
    <motion.div className="pinned-step" style={{ opacity, y }}>
      <div className="step-num">{step.num}</div>
      <h3 className="step-title arabic">{step.title}</h3>
      <p className="step-body arabic">{step.body}</p>
    </motion.div>
  );
}

function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const steps = [
    {
      num: "01",
      title: "الصق مباراتك",
      body: "PGN من chess.com أو Lichess — أو العب على الرقعة مباشرة.",
    },
    {
      num: "02",
      title: "شوف التحليل",
      body: "Stockfish 17.1 بيحلل كل موقف في ثواني، ويطلع أحسن نقلة.",
    },
    {
      num: "03",
      title: "افهم غلطاتك",
      body: "تصنيف كل نقلة، وشوكات وتثبيتات — كل حاجة بالعربي.",
    },
  ];

  return (
    <div ref={ref} className="pinned-container" id="how">
      <div className="pinned-inner">
        <div className="pinned-content">
          {steps.map((step, i) => (
            <PinnedStep
              key={i}
              step={step}
              index={i}
              total={steps.length}
              progress={scrollYProgress}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Problem() {
  return (
    <section className="section">
      <ScrollReveal>
        <div className="section-eyebrow arabic">المشكلة</div>
      </ScrollReveal>
      <ScrollReveal delay={0.05}>
        <h2 className="section-title arabic">بتلعب بس مش بتتعلم</h2>
      </ScrollReveal>
      <ScrollReveal delay={0.15}>
        <p className="section-body arabic">
          مئات المباريات، وآلاف الأخطاء المتكررة. بتشوف إنك غلطت، بس مش بتعرف ليه — ولا إزاي تصلحها.
        </p>
      </ScrollReveal>
    </section>
  );
}

function Features() {
  const features = [
    {
      num: "01",
      title: "تحليل فوري",
      body: "Stockfish 17.1 بيحلل كل موقف في أقل من ثانية.",
    },
    {
      num: "02",
      title: "شرح بالعربي",
      body: "مش مصطلحات إنجليزية — كلام تفهمه وتتعلم منه.",
    },
    {
      num: "03",
      title: "تصنيف كل نقلة",
      body: "من عبقرية لكارثة — تعرف بالظبط إيه اللي حصل.",
    },
  ];

  return (
    <section className="section" id="features">
      <ScrollReveal>
        <div className="section-eyebrow arabic">الميزات</div>
      </ScrollReveal>
      <ScrollReveal delay={0.05}>
        <h2 className="section-title arabic">إيه اللي بتاخده</h2>
      </ScrollReveal>
      <div className="glass-grid">
        {features.map((f, i) => (
          <ScrollReveal key={i} delay={i * 0.12}>
            <div className="glass-card">
              <div className="glass-num">{f.num}</div>
              <h3 className="glass-title arabic">{f.title}</h3>
              <p className="glass-body arabic">{f.body}</p>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="section" style={{ textAlign: "center" }} id="about">
      <ScrollReveal>
        <h2
          className="section-title arabic"
          style={{ margin: "0 auto 40px", maxWidth: "600px" }}
        >
          جاهز تبدأ؟
        </h2>
      </ScrollReveal>
      <ScrollReveal delay={0.1}>
        <Link href="/import" className="btn-primary arabic">
          حلل مباراتك
          <ArrowIcon />
        </Link>
      </ScrollReveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <img src="/logo/rook.svg" alt="" width={32} height={32} />
          <span className="serif" style={{ fontSize: "20px", fontWeight: 700 }}>
            Outplay
          </span>
        </div>

        <div className="footer-links arabic">
          <Link href="/import">حلّل مباراتك</Link>
          <Link href="/play">العب على الرقعة</Link>
          <a
            href="https://github.com/zynxilb/outplay-ui"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </div>

        <div className="footer-meta arabic">© 2026 Outplay · صُنع في مصر</div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <LoadingScreen>
      <main>
        <Nav />
        <Hero />
        <HowItWorks />
        <Problem />
        <Features />
        <FinalCTA />
        <Footer />
      </main>
    </LoadingScreen>
  );
}
