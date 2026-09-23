"use client";

import { signOut } from "firebase/auth";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BookMarked,
  Building2,
  CalendarClock,
  Check,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MessageCircleMore,
  Pencil,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { updateProfileFields, type UserProfile } from "@/lib/user-profile";
import {
  getAllSubmissions,
  getAssignments,
  getStudentsForTeacher,
  type Assignment,
  type Submission,
} from "@/lib/assignments";
import { subscribeToThreads, type FeedbackThread } from "@/lib/feedback";

function daysAgo(value: number, now: number) {
  if (!value) return "белгісіз";
  const days = Math.floor((now - value) / 86_400_000);
  if (days <= 0) return "бүгін";
  if (days === 1) return "кеше";
  if (days < 30) return `${days} күн бұрын`;
  return new Date(value).toLocaleDateString("kk-KZ", { day: "numeric", month: "short" });
}

export function TeacherProfile({ user, profile }: { user: User; profile: UserProfile }) {
  const router = useRouter();
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [threads, setThreads] = useState<FeedbackThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [now] = useState(() => Date.now());
  const [draft, setDraft] = useState({
    displayName: profile.displayName,
    subject: profile.subject,
    school: profile.school,
    className: profile.className,
    bio: profile.bio,
  });

  const uid = user.uid;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [studentList, assignmentList] = await Promise.all([getStudentsForTeacher(), getAssignments()]);
        if (cancelled) return;
        setStudents(studentList);
        setAssignments(assignmentList);
        const submissionList = await getAllSubmissions(assignmentList);
        if (!cancelled) setSubmissions(submissionList);
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) setError("Деректерді жүктеу мүмкін болмады. Firestore ережелерін тексеріңіз.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  // Тек uid/role өзгергенде қайта жазылу (profile объектісі әр snapshot сайын жаңарады).
  const role = profile.role;
  useEffect(() => {
    return subscribeToThreads(
      { uid, role } as UserProfile,
      setThreads,
      () => undefined,
    );
  }, [role, uid]);

  const myAssignments = useMemo(() => assignments.filter((item) => item.teacherId === uid), [assignments, uid]);

  const stats = useMemo(() => {
    const mineIds = new Set(myAssignments.map((item) => item.id));
    const mySubmissions = submissions.filter((item) => mineIds.has(item.assignmentId));
    const graded = mySubmissions.filter((item) => item.status === "graded");
    const pending = mySubmissions.length - graded.length;
    const withQuiz = students.filter((student) => student.stats.quizCount > 0);
    const classAvg = withQuiz.length
      ? Math.round(withQuiz.reduce((sum, student) => sum + student.stats.avgPercent, 0) / withQuiz.length)
      : 0;
    const gradeAvg = graded.length
      ? Math.round((graded.reduce((sum, item) => sum + item.grade / Math.max(item.maxPoints, 1), 0) / graded.length) * 100)
      : 0;
    const activeStudents = students.filter((student) => now - student.lastActiveAt < 7 * 86_400_000).length;
    const openQuestions = threads.filter((thread) => thread.status === "open").length;
    const answered = threads.filter((thread) => thread.status !== "open").length;
    return {
      students: students.length,
      activeStudents,
      assignments: myAssignments.length,
      submissions: mySubmissions.length,
      graded: graded.length,
      pending,
      classAvg,
      gradeAvg,
      openQuestions,
      answered,
      responseRate: threads.length ? Math.round((answered / threads.length) * 100) : 0,
    };
  }, [myAssignments, now, students, submissions, threads]);

  const myClasses = useMemo(() => {
    const map = new Map<string, { name: string; count: number; sum: number; active: number }>();
    students.forEach((student) => {
      const key = student.className || "Сыныбы көрсетілмеген";
      const entry = map.get(key) ?? { name: key, count: 0, sum: 0, active: 0 };
      entry.count += 1;
      entry.sum += student.stats.avgPercent;
      if (now - student.lastActiveAt < 7 * 86_400_000) entry.active += 1;
      map.set(key, entry);
    });
    return Array.from(map.values())
      .map((entry) => ({ ...entry, avg: Math.round(entry.sum / Math.max(entry.count, 1)) }))
      .sort((a, b) => b.count - a.count);
  }, [now, students]);

  const recentActivity = useMemo(() => {
    const mineIds = new Set(myAssignments.map((item) => item.id));
    const items: { id: string; kind: string; title: string; subtitle: string; at: number }[] = [];

    submissions
      .filter((item) => mineIds.has(item.assignmentId))
      .slice(0, 12)
      .forEach((item) =>
        items.push({
          id: `s-${item.assignmentId}-${item.id}`,
          kind: item.status === "graded" ? "graded" : "submitted",
          title: item.studentName,
          subtitle: `${item.assignmentTitle || "Тапсырма"} · ${item.status === "graded" ? `${item.grade}/${item.maxPoints} балл` : "тексеруді күтуде"}`,
          at: item.status === "graded" ? item.gradedAt || item.submittedAt : item.submittedAt,
        }),
      );

    threads.slice(0, 10).forEach((thread) =>
      items.push({
        id: `t-${thread.id}`,
        kind: thread.status === "open" ? "question" : "answered",
        title: thread.studentName,
        subtitle: thread.subject,
        at: thread.updatedAt,
      }),
    );

    return items.sort((a, b) => b.at - a.at).slice(0, 8);
  }, [myAssignments, submissions, threads]);

  const needAttention = useMemo(
    () =>
      students
        .filter((student) => student.stats.quizCount > 0 && student.stats.avgPercent < 60)
        .sort((a, b) => a.stats.avgPercent - b.stats.avgPercent)
        .slice(0, 5),
    [students],
  );

  const initial = profile.displayName.charAt(0).toUpperCase();
  const firstName = profile.displayName.split(" ")[0];

  async function handleSignOut() {
    await signOut(getFirebaseAuth()!);
    router.replace("/");
  }

  async function saveProfile() {
    setSaving(true);
    try {
      await updateProfileFields(uid, draft);
      setEditing(false);
    } catch {
      /* форма ашық қалады */
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="teacher-profile page-shell">
      <header className="teacher-profile-hero">
        <div className="teacher-hero-bg" />
        <div className="teacher-hero-inner">
          <div className="teacher-identity">
            <span className="teacher-avatar">{initial}<i><ShieldCheck /></i></span>
            <div>
              <div className="teacher-labels">
                <span className="teacher-role-badge"><GraduationCap size={13} /> Мұғалім</span>
                {profile.subject && <span><BookMarked size={12} /> {profile.subject}</span>}
                {profile.school && <span><Building2 size={12} /> {profile.school}</span>}
                {profile.className && <span>Жетекші: {profile.className}</span>}
              </div>
              <h1>{profile.displayName}</h1>
              <p><Mail size={15} /> {user.email}</p>
              {profile.bio && <p className="teacher-bio">{profile.bio}</p>}
            </div>
          </div>
          <div className="teacher-hero-actions">
            <button className="teacher-icon-action" onClick={() => setEditing((value) => !value)} type="button" aria-label="Профильді өңдеу">
              {editing ? <X /> : <Pencil />}
            </button>
            <Link href="/teacher-dashboard" className="teacher-primary-action">
              <LayoutDashboard />
              <span><small>БАСҚАРУ ОРТАЛЫҒЫ</small>Мұғалім панелі</span>
              <ArrowRight />
            </Link>
            <button className="teacher-icon-action danger" onClick={handleSignOut} type="button" aria-label="Аккаунттан шығу"><LogOut /></button>
          </div>
        </div>
      </header>

      {error && <p className="teacher-error">{error}</p>}

      {editing && (
        <form className="profile-edit-form" onSubmit={(event) => { event.preventDefault(); saveProfile(); }}>
          <label><span>Аты-жөні</span><input value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} maxLength={60} /></label>
          <label><span>Пәні</span><input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} maxLength={60} placeholder="Математика / Биология" /></label>
          <label><span>Мектеп</span><input value={draft.school} onChange={(e) => setDraft({ ...draft, school: e.target.value })} maxLength={80} placeholder="№12 мектеп-лицей" /></label>
          <label><span>Жетекші сынып</span><input value={draft.className} onChange={(e) => setDraft({ ...draft, className: e.target.value })} maxLength={20} placeholder="9Ә" /></label>
          <label className="wide"><span>Өзіңіз туралы</span><input value={draft.bio} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} maxLength={240} placeholder="15 жылдық тәжірибесі бар математика мұғалімі" /></label>
          <button className="gradient-button" type="submit" disabled={saving}><Check size={16} /> {saving ? "Сақталуда..." : "Сақтау"}</button>
        </form>
      )}

      <div className="teacher-profile-metrics">
        <article><span className="metric-icon lime"><Users /></span><div><small>ОҚУШЫЛАРЫМ</small><strong>{loading ? "—" : stats.students}</strong><p>{stats.activeStudents} белсенді (7 күн)</p></div></article>
        <article><span className="metric-icon mint"><ClipboardList /></span><div><small>ТАПСЫРМАЛАРЫМ</small><strong>{loading ? "—" : stats.assignments}</strong><p>{stats.submissions} жіберілім</p></div></article>
        <article><span className="metric-icon sky"><BadgeCheck /></span><div><small>ТЕКСЕРІЛГЕН</small><strong>{loading ? "—" : stats.graded}</strong><p>{stats.pending} күтуде</p></div></article>
        <article className="dark"><span className="metric-icon"><TrendingUp /></span><div><small>СЫНЫП ОРТАШАСЫ</small><strong>{loading ? "—" : `${stats.classAvg}%`}</strong><p>викторина бойынша</p></div></article>
      </div>

      <div className="teacher-profile-grid">
        <div className="teacher-profile-main">
          {stats.pending > 0 && (
            <article className="teacher-alert">
              <BadgeCheck />
              <div>
                <strong>{stats.pending} жұмыс тексеруді күтіп тұр</strong>
                <p>Оқушылар жауабын жіберді. Бағалап, кері байланыс жазуға болады.</p>
              </div>
              <Link href="/teacher-dashboard" className="gradient-button">Тексеруге өту</Link>
            </article>
          )}

          <article className="teacher-card">
            <header>
              <div><span className="section-kicker">МЕНІҢ СЫНЫПТАРЫМ</span><h3>Сынып бойынша қамту</h3></div>
              <Link href="/teacher-dashboard" className="soft-button small">Толығырақ <ArrowRight size={14} /></Link>
            </header>
            {loading ? (
              <p className="teacher-empty"><Loader2 className="spin" /> Жүктелуде...</p>
            ) : myClasses.length === 0 ? (
              <p className="teacher-empty">Әзірге оқушы тіркелмеген.</p>
            ) : (
              <div className="class-bars">
                {myClasses.map((entry) => (
                  <div className="class-bar" key={entry.name}>
                    <div><strong>{entry.name}</strong><span>{entry.count} оқушы · {entry.active} белсенді</span></div>
                    <div className="bar-track"><i style={{ width: `${Math.max(entry.avg, 3)}%` }} /></div>
                    <b>{entry.avg}%</b>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="teacher-card">
            <header>
              <div><span className="section-kicker">СОҢҒЫ ОҚИҒАЛАР</span><h3>Оқушылардың әрекеті</h3></div>
            </header>
            {loading ? (
              <p className="teacher-empty"><Loader2 className="spin" /> Жүктелуде...</p>
            ) : recentActivity.length === 0 ? (
              <p className="teacher-empty">Әзірге әрекет жоқ. Тапсырма жариялап көріңіз.</p>
            ) : (
              <ul className="activity-feed">
                {recentActivity.map((item) => (
                  <li key={item.id} className={item.kind}>
                    <span className="activity-dot">
                      {item.kind === "graded" ? <BadgeCheck size={14} /> : item.kind === "submitted" ? <ClipboardList size={14} /> : <MessageCircleMore size={14} />}
                    </span>
                    <div><strong>{item.title}</strong><small>{item.subtitle}</small></div>
                    <time>{daysAgo(item.at, now)}</time>
                  </li>
                ))}
              </ul>
            )}
          </article>

          {needAttention.length > 0 && (
            <article className="teacher-card">
              <header>
                <div><span className="section-kicker">НАЗАР АУДАРЫҢЫЗ</span><h3>Қолдау қажет оқушылар</h3></div>
              </header>
              <ul className="attention-list">
                {needAttention.map((student) => (
                  <li key={student.uid}>
                    <i>{student.displayName.charAt(0).toUpperCase()}</i>
                    <div><strong>{student.displayName}</strong><small>{student.className || "сынып көрсетілмеген"} · {student.stats.quizCount} тест</small></div>
                    <span className="practice">{student.stats.avgPercent}%</span>
                  </li>
                ))}
              </ul>
              <Link href="/feedback" className="soft-button full"><MessageCircleMore size={15} /> Кері байланыс арқылы қолдау көрсету</Link>
            </article>
          )}
        </div>

        <aside className="teacher-profile-side">
          <article className="teacher-card compact">
            <span className="section-kicker">КЕРІ БАЙЛАНЫС</span>
            <h3>Сұрақтарға жауап</h3>
            <div className="mini-stat-row">
              <div><strong>{stats.openQuestions}</strong><small>жауап күтуде</small></div>
              <div><strong>{stats.answered}</strong><small>жауап берілді</small></div>
            </div>
            <div className="bar-track"><i style={{ width: `${Math.max(stats.responseRate, 2)}%` }} /></div>
            <p className="mini-note">Жауап беру деңгейі — {stats.responseRate}%</p>
            <Link href="/feedback" className="soft-button full">Чатты ашу <ArrowRight size={14} /></Link>
          </article>

          <article className="teacher-card compact">
            <span className="section-kicker">БАҒАЛАУ САПАСЫ</span>
            <h3>Орташа баға</h3>
            <div className="grade-ring" style={{ "--progress": `${Math.min(stats.gradeAvg, 100) * 3.6}deg` } as React.CSSProperties}>
              <div><strong>{stats.gradeAvg}%</strong><span>орташа</span></div>
            </div>
            <p className="mini-note">{stats.graded} жұмыс бағаланды</p>
          </article>

          <article className="teacher-card compact">
            <span className="section-kicker">ЖЫЛДАМ ӘРЕКЕТ</span>
            <h3>Не істейміз?</h3>
            <div className="profile-quick-links">
              <Link href="/teacher-dashboard"><span><LayoutDashboard /></span><div><strong>Панель</strong><small>Оқушылар, тапсырма, тексеру</small></div><ArrowRight /></Link>
              <Link href="/feedback"><span><MessageCircleMore /></span><div><strong>Сұрақтар</strong><small>Оқушыларға жауап беру</small></div><ArrowRight /></Link>
              <Link href="/lab"><span><Activity /></span><div><strong>Зертхана</strong><small>Сабаққа дайын калькуляторлар</small></div><ArrowRight /></Link>
              <Link href="/methods"><span><BookMarked /></span><div><strong>Әдістер</strong><small>Формулалар мен мысалдар</small></div><ArrowRight /></Link>
            </div>
          </article>

          <article className="teacher-tip-card">
            <Sparkles />
            <span>ӘДІСТЕМЕЛІК КЕҢЕС</span>
            <h3>Бағамен бірге пікір жазыңыз.</h3>
            <p>Нақты бір сөйлемдік түсіндірме оқушының келесі жұмысын айтарлықтай жақсартады.</p>
            <Link href="/teacher-dashboard"><CalendarClock size={14} /> Тексеруге кірісу</Link>
          </article>
        </aside>
      </div>
    </section>
  );
}
