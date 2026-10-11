// components/FAQ.tsx
"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence, useInView } from "motion/react";

const FAQS = [
  {
    q: "Outplay مجاني؟",
    a: "أيوه، بالكامل. التحليل، الرقعة، كل حاجة — من غير اشتراك ولا إعلانات. لو حبيت تدعم المشروع، فيه رابط على GitHub.",
  },
  {
    q: "بيشتغل مع Chess.com و Lichess؟",
    a: "أيوه. انسخ الـPGN من أي منصة (Chess.com، Lichess، أي مصدر)، والصقه في /import. هنحلل كل نقلة بـStockfish 17.1.",
  },
  {
    q: "بتخزنوا مبارياتي؟",
    a: "لأ. التحليل بيتم مؤقتًا في المتصفح والسيرفر، ومفيش أي حاجة بتتخزن على حسابك. الـPGN مش بيحتفظ بيه.",
  },
  {
    q: "إيه الفرق عن Lichess و Chess.com؟",
    a: "Lichess و Chess.com ممتازين، بس التحليل بالإنجليزي. Outplay بيحلل بالعربي، وبيشرح أسباب كل غلطة (مش بس الرقم). ده الفرق الأساسي.",
  },
  {
    q: "إزاي بيحلل بالعربي؟",
    a: "بنستخدم Stockfish (نفس المحرك اللي بتستخدمه المنصات الكبيرة)، وبنترجم التصنيفات والموتيفس للعربي. الشرح بسيط ومباشر.",
  },
];

function FAQItem({
  q,
  a,
  index,
  isOpen,
  onToggle,
}: {
  q: string;
  a: string;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      className={`faq-item${isOpen ? " faq-item-open" : ""}`}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        type="button"
        className="faq-question arabic"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{q}</span>
        <span className="faq-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p className="faq-answer arabic">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="section" id="faq">
      <div className="section-eyebrow arabic">الأسئلة الشائعة</div>
      <h2 className="section-title arabic">عندك سؤال؟</h2>
      <div className="faq-list">
        {FAQS.map((item, i) => (
          <FAQItem
            key={i}
            q={item.q}
            a={item.a}
            index={i}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>
    </section>
  );
}
