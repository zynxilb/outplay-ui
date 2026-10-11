import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "عن Outplay — منصة تحليل شطرنج عربية",
  description: "Outplay منصة تحليل شطرنج بالعربي. افهم كل غلطة وليه.",
};

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <main className="about-page">
      <div className="about-inner">
        <Link href="/" className="about-back arabic">
          → رجوع
        </Link>

        <div className="section-eyebrow arabic">عن المشروع</div>
        <h1 className="section-title arabic" style={{ marginBottom: "32px" }}>
          ليه Outplay؟
        </h1>

        <div className="about-content arabic">
          <p>
            الشطرنج لعبة عالمية، بس أغلب أدوات التحليل بالإنجليزي. المصطلحات معقدة،
            والشرح مش دايمًا مفهوم — خصوصًا للمبتدئين والمتوسطين.
          </p>

          <p>
            Outplay بيحل المشكلة دي. بيستخدم Stockfish — نفس المحرك اللي بتستخدمه
            المنصات الكبيرة — بس بيقدم التحليل <strong>بالعربي</strong>، وبيشرح
            أسباب كل غلطة بلغة بسيطة.
          </p>

          <p>
            الفرق مش بس في اللغة. إحنا بنشتغل على <strong>الشرح</strong> — مش بس
            الأرقام. لما نقول إن النقلة غلطة، بنقولك <em>ليه</em>، وإيه اللي كان
            المفروض تلعبه.
          </p>

          <h2 className="about-h2">المبادئ</h2>
          <ul className="about-list">
            <li>
              <strong>مجاني.</strong> التحليل، الرقعة، كل حاجة. مفيش اشتراك، مفيش إعلانات.
            </li>
            <li>
              <strong>شفافية.</strong> الكود مفتوح على{" "}
              <a href="https://github.com/zynxilb/outplay-ui" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              . تقدر تشوف بنفسك إزاي بنحلل.
            </li>
            <li>
              <strong>خصوصية.</strong> مفيش تسجيل، مفيش تتبع، ومبارياتك مش بتتخزن.
            </li>
            <li>
              <strong>عربي أولاً.</strong> مش ترجمة — المشروع مبني بالعربي من الأول.
            </li>
          </ul>

          <h2 className="about-h2">التقنية</h2>
          <p>
            Outplay مبني على <strong>Next.js</strong> و <strong>React</strong>،
            وبيستخدم <strong>Stockfish 17.1</strong> (WASM) للتحليل. الـinterface
            عربي بالكامل، والتحليل بيشتغل في المتصفح.
          </p>

          <h2 className="about-h2">تواصل</h2>
          <p>
            عندك سؤال، اقتراح، أو لقيت bug؟ افتح issue على{" "}
            <a href="https://github.com/zynxilb/outplay-ui/issues" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            .
          </p>
        </div>

        <div className="about-cta">
          <Link href="/import" className="btn-primary arabic">
            حلل مباراتك
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </main>
  );
}
