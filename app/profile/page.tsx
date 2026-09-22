"use client";

import { signOut } from "firebase/auth";
import { ArrowRight, Award, BarChart3, BookOpenCheck, CalendarDays, FlaskConical, Leaf, LogOut, Mail, MessageCircleMore, Play, Sparkles, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { LoadingLottie } from "@/components/loading-lottie";
import { getFirebaseAuth } from "@/lib/firebase";
import { getQuizResults, type QuizResult } from "@/lib/quiz-results";

export default function ProfilePage() {
  const { user, loading, profile } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultsError, setResultsError] = useState(false);

  useEffect(() => {
    if (!user) return;
    getQuizResults(user.uid).then(setResults).catch(() => setResultsError(true)).finally(() => setResultsLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    const best = results.reduce((value, result) => Math.max(value, result.percent), 0);
    const average = results.length ? Math.round(results.reduce((sum, result) => sum + result.percent, 0) / results.length) : 0;
    const latest = results[0]?.percent ?? 0;
    const level = best >= 90 ? "Эко-сарапшы" : best >= 70 ? "Зерттеуші" : best >= 40 ? "Тәжірибеші" : "Бастаушы";
    const nextGoal = best >= 90 ? 100 : best >= 70 ? 90 : best >= 40 ? 70 : 40;
    return { best, average, latest, level, nextGoal };
  }, [results]);

  if (loading) return <main className="profile-page"><div className="profile-loading page-shell"><LoadingLottie width={150} height={150} /><p>Жеке кеңістік жүктелуде...</p></div></main>;
  if (!user) return <main className="profile-page"><section className="profile-empty page-shell"><Sparkles size={32} /><h1>Профильге кіру керек</h1><p>Жеке нәтижелеріңізді көру үшін алдымен аккаунтыңызға кіріңіз.</p><Link href="/login" className="gradient-button">Кіру / Тіркелу <ArrowRight size={17} /></Link></section></main>;

  const displayName = user.displayName ?? user.email?.split("@")[0] ?? "EcoMath қолданушысы";
  const initial = displayName.charAt(0).toUpperCase();
  const isTeacher = profile?.role === "teacher";
  const firstName = displayName.split(" ")[0];
  const chartResults = [...results].slice(0, 7).reverse();

  async function handleSignOut() { await signOut(getFirebaseAuth()!); router.replace("/"); }

  return <main className="profile-page"><section className="profile-dashboard page-shell">
    <header className="profile-hero-card">
      <div className="profile-identity"><span className="profile-avatar-large">{initial}<i><Leaf /></i></span><div><div className="profile-labels"><span className="profile-role-badge">{isTeacher ? "Мұғалім" : "Оқушы"}</span><span>EcoMath мүшесі</span></div><h1>Сәлем, {firstName}!</h1><p><Mail size={15} /> {user.email}</p></div></div>
      <div className="profile-hero-actions"><Link href={isTeacher ? "/teacher-dashboard" : "/feedback"} className="profile-primary-action"><MessageCircleMore /><span><small>{isTeacher ? "ЖАҢА СҰРАҚТАР" : "КӨМЕК КЕРЕК ПЕ?"}</small>{isTeacher ? "Оқушыларға жауап беру" : "Мұғалімге жазу"}</span><ArrowRight /></Link><button className="profile-signout" onClick={handleSignOut} type="button" aria-label="Аккаунттан шығу"><LogOut /></button></div>
    </header>

    <div className="profile-dashboard-grid"><section className="profile-main-column">
      <div className="profile-section-heading"><div><span className="section-kicker">ОҚУ КӨРСЕТКІШТЕРІ</span><h2>Сенің прогресің</h2></div><span className="level-pill"><Award /> {stats.level}</span></div>
      <div className="profile-metric-grid">
        <article className="profile-metric"><span className="metric-icon lime"><BookOpenCheck /></span><div><small>ӨТКЕН ВИКТОРИНА</small><strong>{resultsLoading ? "—" : results.length}</strong><p>барлық әрекет</p></div></article>
        <article className="profile-metric"><span className="metric-icon mint"><Target /></span><div><small>ҮЗДІК НӘТИЖЕ</small><strong>{resultsLoading ? "—" : `${stats.best}%`}</strong><p>жеке рекорд</p></div></article>
        <article className="profile-metric dark"><span className="metric-icon"><TrendingUp /></span><div><small>ОРТАША ҰПАЙ</small><strong>{resultsLoading ? "—" : `${stats.average}%`}</strong><p>{stats.average >= 70 ? "жақсы қарқын" : "өсуге мүмкіндік бар"}</p></div></article>
      </div>
      <article className="profile-progress-card"><div className="progress-card-copy"><span className="section-kicker">КЕЛЕСІ МАҚСАТ</span><h3>{stats.nextGoal}% нәтижеге жету</h3><p>{results.length ? `Қазіргі рекордың — ${stats.best}%. Формулаларды қайталап, тағы бір рет байқап көр.` : "Алғашқы викторинаны өтіп, оқу прогресіңді баста."}</p><Link href="/quiz" className="gradient-button"><Play /> Викторинаны бастау</Link></div><div className="progress-ring" style={{ "--progress": `${Math.min(stats.best, 100) * 3.6}deg` } as React.CSSProperties}><div><strong>{stats.best}%</strong><span>үздік ұпай</span></div></div></article>
      <article className="profile-history-card"><div className="profile-section-heading compact"><div><span className="section-kicker">НӘТИЖЕЛЕР ТАРИХЫ</span><h2>Соңғы талпыныстар</h2></div><span className="results-count">{results.length} рет</span></div>
        {resultsError && <p className="auth-error">Нәтижелерді жүктеу мүмкін болмады.</p>}
        {resultsLoading ? <div className="profile-results-loading"><LoadingLottie width={120} height={120} /></div> : results.length === 0 ? <div className="profile-no-results"><BarChart3 /><div><strong>Нәтиже әлі жоқ</strong><p>Викторинаны аяқтағаннан кейін статистика осы жерде пайда болады.</p></div></div> : <><div className="profile-mini-chart" aria-label="Соңғы нәтижелер диаграммасы">{chartResults.map((result, index) => <div className="chart-column" key={result.id}><div><i style={{ height: `${Math.max(result.percent, 8)}%` }}><span>{result.percent}%</span></i></div><small>{index + 1}</small></div>)}</div><div className="profile-result-list">{results.slice(0, 5).map((result, index) => <div className="profile-result-item" key={result.id}><span className="result-rank">{String(index + 1).padStart(2, "0")}</span><div><strong>{new Date(result.createdAt).toLocaleDateString("kk-KZ", { day: "numeric", month: "long" })}</strong><small><CalendarDays /> Викторина нәтижесі</small></div><b>{result.score}/{result.total}</b><span className={result.percent >= 80 ? "excellent" : result.percent >= 60 ? "good" : "practice"}>{result.percent}%</span></div>)}</div></>}
      </article>
    </section>
    <aside className="profile-side-column"><article className="profile-next-card"><span className="section-kicker">ӘРІ ҚАРАЙ</span><h2>{isTeacher ? "Оқушыларға қолдау көрсет" : "Зерттеуді жалғастыр"}</h2><p>{isTeacher ? "Келген сұрақтарды қарап, түсінікті кері байланыс беріңіз." : "Модель құрып, нәтижені есептеп, сұрағыңды мұғалімге жібер."}</p><div className="profile-quick-links"><Link href="/lab"><span><FlaskConical /></span><div><strong>Зертхана</strong><small>Пластик моделін есептеу</small></div><ArrowRight /></Link><Link href="/methods"><span><BarChart3 /></span><div><strong>Әдістер</strong><small>Формулаларды қайталау</small></div><ArrowRight /></Link><Link href="/feedback"><span><MessageCircleMore /></span><div><strong>Кері байланыс</strong><small>{isTeacher ? "Сұрақтарға жауап беру" : "Мұғалімнен көмек алу"}</small></div><ArrowRight /></Link></div></article>
      <article className="profile-tip-card"><Sparkles /><span>БҮГІНГІ КЕҢЕС</span><h3>Деректі жай жинама — салыстыр.</h3><p>Орташа мән мен пайыздық өзгеріс қорытындыңды нақты әрі сенімді етеді.</p><Link href="/methods">Әдістерді қарау <ArrowRight /></Link></article>
      {!resultsLoading && results.length > 0 && <article className="profile-latest-card"><span>Соңғы нәтиже</span><strong>{stats.latest}%</strong><div><i style={{ width: `${stats.latest}%` }} /></div><p>{stats.latest >= stats.average ? "Орташа көрсеткіштен жоғары. Жарайсың!" : "Келесі талпыныста нәтижеңді жақсарта аласың."}</p></article>}
    </aside></div>
  </section></main>;
}
