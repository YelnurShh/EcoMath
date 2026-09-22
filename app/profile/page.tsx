"use client";

import { signOut } from "firebase/auth";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  Check,
  ClipboardList,
  Flame,
  FlaskConical,
  LayoutDashboard,
  Leaf,
  LogOut,
  Mail,
  MessageCircleMore,
  Pencil,
  Play,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { LoadingLottie } from "@/components/loading-lottie";
import { getFirebaseAuth } from "@/lib/firebase";
import { getQuizResults, type QuizResult } from "@/lib/quiz-results";
import { levelFromXp, updateProfileFields } from "@/lib/user-profile";
import { buildAchievements } from "@/lib/achievements";
import { getAssignments, getMySubmissions, isVisibleForStudent, type Submission } from "@/lib/assignments";

export default function ProfilePage() {
  const { user, loading, profile, profileError } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [resultsError, setResultsError] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ displayName: "", className: "", school: "", bio: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getQuizResults(user.uid)
      .then(setResults)
      .catch(() => setResultsError(true))
      .finally(() => setResultsLoading(false));
  }, [user]);

  useEffect(() => {
    if (!profile || profile.role !== "student") return;
    getAssignments()
      .then(async (list) => {
        const mine = list.filter((item) => isVisibleForStudent(item, profile.className));
        const map = await getMySubmissions(mine, profile.uid);
        setSubmissions(Object.values(map));
      })
      .catch(() => undefined);
  }, [profile]);

  useEffect(() => {
    if (profile) {
      setDraft({
        displayName: profile.displayName,
        className: profile.className,
        school: profile.school,
        bio: profile.bio,
      });
    }
  }, [profile]);

  const stats = useMemo(() => {
    const best = profile?.stats.bestPercent ?? results.reduce((value, result) => Math.max(value, result.percent), 0);
    const average = profile?.stats.avgPercent ?? (results.length ? Math.round(results.reduce((sum, r) => sum + r.percent, 0) / results.length) : 0);
    const latest = results[0]?.percent ?? profile?.stats.lastPercent ?? 0;
    const nextGoal = best >= 90 ? 100 : best >= 70 ? 90 : best >= 40 ? 70 : 40;
    return { best, average, latest, nextGoal };
  }, [profile, results]);

  const topicBreakdown = useMemo(() => {
    const map = new Map<string, { title: string; sum: number; count: number }>();
    results.forEach((result) => {
      const entry = map.get(result.topicId) ?? { title: result.topicTitle, sum: 0, count: 0 };
      entry.sum += result.percent;
      entry.count += 1;
      map.set(result.topicId, entry);
    });
    return Array.from(map.values())
      .map((entry) => ({ title: entry.title, avg: Math.round(entry.sum / entry.count), count: entry.count }))
      .sort((a, b) => b.avg - a.avg);
  }, [results]);

  if (loading) {
    return <main className="profile-page"><div className="profile-loading page-shell"><LoadingLottie width={150} height={150} /><p>Жеке кеңістік жүктелуде...</p></div></main>;
  }

  if (!user) {
    return (
      <main className="profile-page">
        <section className="profile-empty page-shell">
          <Sparkles size={32} />
          <h1>Профильге кіру керек</h1>
          <p>Жеке нәтижелеріңізді көру үшін алдымен аккаунтыңызға кіріңіз.</p>
          <Link href="/login" className="gradient-button">Кіру / Тіркелу <ArrowRight size={17} /></Link>
        </section>
      </main>
    );
  }

  const displayName = profile?.displayName ?? user.displayName ?? user.email?.split("@")[0] ?? "EcoMath қолданушысы";
  const initial = displayName.charAt(0).toUpperCase();
  const isTeacher = profile?.role === "teacher";
  const firstName = displayName.split(" ")[0];
  const chartResults = [...results].slice(0, 7).reverse();
  const level = levelFromXp(profile?.stats.xp ?? 0);
  const achievements = buildAchievements(profile?.stats ?? {
    quizCount: 0, bestPercent: 0, avgPercent: 0, lastPercent: 0, totalCorrect: 0,
    totalQuestions: 0, xp: 0, streak: 0, lastQuizAt: 0, assignmentsSubmitted: 0, assignmentsGraded: 0, gradeSum: 0,
  });
  const unlockedCount = achievements.filter((item) => item.unlocked).length;
  const gradedSubmissions = submissions.filter((item) => item.status === "graded");

  async function handleSignOut() {
    await signOut(getFirebaseAuth()!);
    router.replace("/");
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfileFields(user.uid, draft);
      setEditing(false);
    } catch {
      /* қате болса форма ашық қалады */
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="profile-page">
      <section className="profile-dashboard page-shell">
        {profileError && <p className="auth-error">{profileError}</p>}

        <header className="profile-hero-card">
          <div className="profile-identity">
            <span className="profile-avatar-large">{initial}<i><Leaf /></i></span>
            <div>
              <div className="profile-labels">
                <span className="profile-role-badge">{isTeacher ? "Мұғалім" : "Оқушы"}</span>
                {profile?.className && <span>{profile.className}</span>}
                {profile?.school && <span>{profile.school}</span>}
              </div>
              <h1>Сәлем, {firstName}!</h1>
              <p><Mail size={15} /> {user.email}</p>
              {profile?.bio && <p className="profile-bio">{profile.bio}</p>}
            </div>
          </div>
          <div className="profile-hero-actions">
            <button className="profile-edit" onClick={() => setEditing((value) => !value)} type="button" aria-label="Профильді өңдеу">
              {editing ? <X /> : <Pencil />}
            </button>
            <Link href={isTeacher ? "/teacher-dashboard" : "/assignments"} className="profile-primary-action">
              {isTeacher ? <LayoutDashboard /> : <ClipboardList />}
              <span><small>{isTeacher ? "БАСҚАРУ ПАНЕЛІ" : "ОҚУ ЖҰМЫСЫ"}</small>{isTeacher ? "Оқушылар мен бағалар" : "Тапсырмаларым"}</span>
              <ArrowRight />
            </Link>
            <button className="profile-signout" onClick={handleSignOut} type="button" aria-label="Аккаунттан шығу"><LogOut /></button>
          </div>
        </header>

        {editing && (
          <form className="profile-edit-form" onSubmit={(event) => { event.preventDefault(); saveProfile(); }}>
            <label><span>Аты-жөні</span><input value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} maxLength={60} /></label>
            <label><span>Сынып</span><input value={draft.className} onChange={(e) => setDraft({ ...draft, className: e.target.value })} maxLength={20} placeholder="9Ә" /></label>
            <label><span>Мектеп</span><input value={draft.school} onChange={(e) => setDraft({ ...draft, school: e.target.value })} maxLength={80} /></label>
            <label className="wide"><span>Өзің туралы</span><input value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} maxLength={240} placeholder="Экология мен математиканы зерттеймін" /></label>
            <button className="gradient-button" type="submit" disabled={saving}><Check size={16} /> {saving ? "Сақталуда..." : "Сақтау"}</button>
          </form>
        )}

        {!isTeacher && (
          <article className="level-card">
            <div>
              <span className="section-kicker">ДЕҢГЕЙ {level.level}</span>
              <h3>{level.title}</h3>
              <p>{profile?.stats.xp ?? 0} XP · келесі деңгейге {Math.max(0, level.nextLevelXp - (profile?.stats.xp ?? 0))} XP қалды</p>
            </div>
            <div className="level-track"><i style={{ width: `${level.progress}%` }} /></div>
            <div className="level-side">
              <span><Flame size={16} /> {profile?.stats.streak ?? 0} күн серия</span>
              <span><Award size={16} /> {unlockedCount}/{achievements.length} төсбелгі</span>
            </div>
          </article>
        )}

        <div className="profile-dashboard-grid">
          <section className="profile-main-column">
            <div className="profile-section-heading">
              <div><span className="section-kicker">ОҚУ КӨРСЕТКІШТЕРІ</span><h2>{isTeacher ? "Жеке белсенділік" : "Сенің прогресің"}</h2></div>
              <span className="level-pill"><Award /> {level.title}</span>
            </div>

            <div className="profile-metric-grid">
              <article className="profile-metric"><span className="metric-icon lime"><BookOpenCheck /></span><div><small>ӨТКЕН ВИКТОРИНА</small><strong>{resultsLoading ? "—" : results.length}</strong><p>барлық әрекет</p></div></article>
              <article className="profile-metric"><span className="metric-icon mint"><Target /></span><div><small>ҮЗДІК НӘТИЖЕ</small><strong>{resultsLoading ? "—" : `${stats.best}%`}</strong><p>жеке рекорд</p></div></article>
              <article className="profile-metric dark"><span className="metric-icon"><TrendingUp /></span><div><small>ОРТАША ҰПАЙ</small><strong>{resultsLoading ? "—" : `${stats.average}%`}</strong><p>{stats.average >= 70 ? "жақсы қарқын" : "өсуге мүмкіндік бар"}</p></div></article>
            </div>

            <article className="profile-progress-card">
              <div className="progress-card-copy">
                <span className="section-kicker">КЕЛЕСІ МАҚСАТ</span>
                <h3>{stats.nextGoal}% нәтижеге жету</h3>
                <p>{results.length ? `Қазіргі рекордың — ${stats.best}%. Формулаларды қайталап, тағы бір рет байқап көр.` : "Алғашқы викторинаны өтіп, оқу прогресіңді баста."}</p>
                <Link href="/quiz" className="gradient-button"><Play /> Викторинаны бастау</Link>
              </div>
              <div className="progress-ring" style={{ "--progress": `${Math.min(stats.best, 100) * 3.6}deg` } as React.CSSProperties}>
                <div><strong>{stats.best}%</strong><span>үздік ұпай</span></div>
              </div>
            </article>

            {topicBreakdown.length > 0 && (
              <article className="profile-history-card">
                <div className="profile-section-heading compact">
                  <div><span className="section-kicker">ТАҚЫРЫПТАР</span><h2>Күшті және әлсіз жақтар</h2></div>
                </div>
                <div className="class-bars">
                  {topicBreakdown.map((topic) => (
                    <div className="class-bar" key={topic.title}>
                      <div><strong>{topic.title}</strong><span>{topic.count} әрекет</span></div>
                      <div className="bar-track"><i style={{ width: `${Math.max(topic.avg, 3)}%` }} /></div>
                      <b>{topic.avg}%</b>
                    </div>
                  ))}
                </div>
              </article>
            )}

            {!isTeacher && gradedSubmissions.length > 0 && (
              <article className="profile-history-card">
                <div className="profile-section-heading compact">
                  <div><span className="section-kicker">МҰҒАЛІМ БАҒАЛАРЫ</span><h2>Тапсырма нәтижелері</h2></div>
                  <span className="results-count">{gradedSubmissions.length} баға</span>
                </div>
                <div className="profile-result-list">
                  {gradedSubmissions.map((item) => (
                    <div className="profile-result-item" key={item.assignmentId}>
                      <span className="result-rank"><ClipboardList size={15} /></span>
                      <div><strong>{item.assignmentTitle || "Тапсырма"}</strong><small>{item.feedback || "Пікір жазылмаған"}</small></div>
                      <b>{item.grade}/{item.maxPoints}</b>
                      <span className={item.grade / item.maxPoints >= 0.8 ? "excellent" : item.grade / item.maxPoints >= 0.6 ? "good" : "practice"}>
                        {Math.round((item.grade / Math.max(item.maxPoints, 1)) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            )}

            <article className="profile-history-card">
              <div className="profile-section-heading compact">
                <div><span className="section-kicker">НӘТИЖЕЛЕР ТАРИХЫ</span><h2>Соңғы талпыныстар</h2></div>
                <span className="results-count">{results.length} рет</span>
              </div>
              {resultsError && <p className="auth-error">Нәтижелерді жүктеу мүмкін болмады.</p>}
              {resultsLoading ? (
                <div className="profile-results-loading"><LoadingLottie width={120} height={120} /></div>
              ) : results.length === 0 ? (
                <div className="profile-no-results"><BarChart3 /><div><strong>Нәтиже әлі жоқ</strong><p>Викторинаны аяқтағаннан кейін статистика осы жерде пайда болады.</p></div></div>
              ) : (
                <>
                  <div className="profile-mini-chart" aria-label="Соңғы нәтижелер диаграммасы">
                    {chartResults.map((result, index) => (
                      <div className="chart-column" key={result.id}>
                        <div><i style={{ height: `${Math.max(result.percent, 8)}%` }}><span>{result.percent}%</span></i></div>
                        <small>{index + 1}</small>
                      </div>
                    ))}
                  </div>
                  <div className="profile-result-list">
                    {results.slice(0, 6).map((result, index) => (
                      <div className="profile-result-item" key={result.id}>
                        <span className="result-rank">{String(index + 1).padStart(2, "0")}</span>
                        <div>
                          <strong>{result.topicTitle}</strong>
                          <small><CalendarDays /> {new Date(result.createdAt).toLocaleDateString("kk-KZ", { day: "numeric", month: "long" })}</small>
                        </div>
                        <b>{result.score}/{result.total}</b>
                        <span className={result.percent >= 80 ? "excellent" : result.percent >= 60 ? "good" : "practice"}>{result.percent}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </article>
          </section>

          <aside className="profile-side-column">
            {!isTeacher && (
              <article className="achievements-card">
                <span className="section-kicker">ТӨСБЕЛГІЛЕР</span>
                <h2>{unlockedCount} / {achievements.length} ашылды</h2>
                <div className="achievement-grid">
                  {achievements.map((item) => (
                    <div className={`achievement ${item.unlocked ? "unlocked" : ""}`} key={item.id} title={item.description}>
                      <span>{item.emoji}</span>
                      <strong>{item.title}</strong>
                      <i style={{ width: `${item.progress}%` }} />
                    </div>
                  ))}
                </div>
              </article>
            )}

            <article className="profile-next-card">
              <span className="section-kicker">ӘРІ ҚАРАЙ</span>
              <h2>{isTeacher ? "Оқушыларға қолдау көрсет" : "Зерттеуді жалғастыр"}</h2>
              <p>{isTeacher ? "Оқушылардың үлгерімін қарап, тапсырма беріп, кері байланыс жазыңыз." : "Модель құрып, нәтижені есептеп, сұрағыңды мұғалімге жібер."}</p>
              <div className="profile-quick-links">
                {isTeacher && (
                  <Link href="/teacher-dashboard"><span><LayoutDashboard /></span><div><strong>Мұғалім панелі</strong><small>Оқушылар, бағалар, аналитика</small></div><ArrowRight /></Link>
                )}
                {!isTeacher && (
                  <Link href="/assignments"><span><ClipboardList /></span><div><strong>Тапсырмалар</strong><small>Жұмысты жіберіп, баға ал</small></div><ArrowRight /></Link>
                )}
                <Link href="/lab"><span><FlaskConical /></span><div><strong>Зертхана</strong><small>Экологиялық калькуляторлар</small></div><ArrowRight /></Link>
                <Link href="/methods"><span><BarChart3 /></span><div><strong>Әдістер</strong><small>Формулаларды қайталау</small></div><ArrowRight /></Link>
                <Link href="/feedback"><span><MessageCircleMore /></span><div><strong>Кері байланыс</strong><small>{isTeacher ? "Сұрақтарға жауап беру" : "Мұғалімнен көмек алу"}</small></div><ArrowRight /></Link>
              </div>
            </article>

            <article className="profile-tip-card">
              <Sparkles />
              <span>БҮГІНГІ КЕҢЕС</span>
              <h3>Деректі жай жинама — салыстыр.</h3>
              <p>Орташа мән мен пайыздық өзгеріс қорытындыңды нақты әрі сенімді етеді.</p>
              <Link href="/methods">Әдістерді қарау <ArrowRight /></Link>
            </article>

            {!resultsLoading && results.length > 0 && (
              <article className="profile-latest-card">
                <span>Соңғы нәтиже</span>
                <strong>{stats.latest}%</strong>
                <div><i style={{ width: `${stats.latest}%` }} /></div>
                <p>{stats.latest >= stats.average ? "Орташа көрсеткіштен жоғары. Жарайсың!" : "Келесі талпыныста нәтижеңді жақсарта аласың."}</p>
              </article>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
