import Link from "next/link";
import { ArrowRight, BarChart3, Check, FlaskConical, Leaf, MessageCircleMore, Play, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main>
      <section className="home-hero page-shell">
        <div className="gradient-blob blob-one" /><div className="gradient-blob blob-two" />
        <div className="hero-copy animate-in">
          <div className="eyebrow"><Sparkles size={15} /> Ғылыми жоба · Экология × Математика</div>
          <h1>Табиғатты түсін.<br /><span>Сандармен өзгерт.</span></h1>
          <p>Экологиялық мәселелерді өлшеп, формулаға айналдырып, нақты әрі тиімді шешім табуды үйрен.</p>
          <div className="hero-actions">
            <Link href="/lab" className="gradient-button large-button">Зертхананы ашу <ArrowRight /></Link>
            <Link href="/quiz" className="soft-button large-button"><Play /> Викторина ойнау</Link>
          </div>
          <div className="hero-notes"><span><Check /> Нақты формулалар</span><span><Check /> Интерактивті модель</span><span><Check /> Мұғаліммен байланыс</span></div>
        </div>
        <div className="hero-visual animate-in delay-one">
          <div className="visual-glow" /><div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="planet-core"><Leaf /><strong>−32%</strong><small>қалдық болжамы</small></div>
          <div className="floating-card float-a"><BarChart3 /><span>Дәлдік</span><b>94%</b></div>
          <div className="floating-card float-b"><FlaskConical /><span>Модель</span><b>y = kx + b</b></div>
        </div>
      </section>

      <section className="home-path page-shell">
        <div className="section-heading"><div><span className="section-kicker">ЗЕРТТЕУ БАҒЫТЫ</span><h2>Үйрен. Зертте. Сұрақ қой.</h2></div><p>Теориядан бастап интерактивті есепке, білімді тексеруге және мұғалімнің жеке көмегіне дейінгі толық оқу жолы.</p></div>
        <div className="route-grid">
          {[
            ["01", "Әдістер", "Статистика, сызықтық модель және оңтайландыруды түсін.", "/methods"],
            ["02", "Зертхана", "Мектептегі пластик шығынын интерактивті есепте.", "/lab"],
            ["03", "Жоба жоспары", "Ғылыми жұмысты төрт нақты қадаммен құрастыр.", "/project"],
            ["04", "Викторина", "Бес тапсырма арқылы біліміңді бірден тексер.", "/quiz"],
            ["05", "Кері байланыс", "Сұрағыңды мұғалімге жіберіп, жеке жауап ал.", "/feedback"],
          ].map(([n,title,text,href]) => <Link href={href} className="route-card" key={title}><span>{n}</span><h3>{title}</h3><p>{text}</p><div>Бетті ашу <ArrowRight /></div></Link>)}
        </div>
      </section>

      <section className="mentor-banner page-shell">
        <div className="mentor-icon"><MessageCircleMore /></div>
        <div><span className="section-kicker">ТҮСІНБЕГЕН ЖЕРІҢ БАР МА?</span><h2>Мұғаліммен тікелей сөйлес</h2><p>Есепті, зертхана нәтижесін немесе ғылыми жоба идеясын жібер. Барлық жауап жеке кабинетіңде сақталады.</p></div>
        <Link href="/feedback" className="gradient-button large-button">Сұрақ қою <ArrowRight /></Link>
      </section>
    </main>
  );
}
