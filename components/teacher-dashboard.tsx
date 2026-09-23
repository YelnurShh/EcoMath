"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Flame,
  GraduationCap,
  Info,
  Loader2,
  MessageCircleMore,
  Plus,
  Search,
  Send,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { firestoreErrorText } from "@/lib/firestore-retry";
import { useAuth } from "@/components/auth-provider";
import { FeedbackCenter } from "@/components/feedback-center";
import { LoadingLottie } from "@/components/loading-lottie";
import {
  createAssignment,
  deleteAssignment,
  getAllSubmissions,
  gradeSubmission,
  subscribeToAssignments,
  type Assignment,
  type Submission,
} from "@/lib/assignments";
import { getStudentsForTeacher } from "@/lib/assignments";
import { levelFromXp, type UserProfile } from "@/lib/user-profile";

type Tab = "overview" | "students" | "assignments" | "grading" | "feedback";

const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "overview", label: "Шолу", icon: BarChart3 },
  { id: "students", label: "Оқушылар", icon: Users },
  { id: "assignments", label: "Тапсырмалар", icon: ClipboardList },
  { id: "grading", label: "Тексеру", icon: BadgeCheck },
  { id: "feedback", label: "Кері байланыс", icon: MessageCircleMore },
];

function formatDate(value: number) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("kk-KZ", { day: "numeric", month: "short", year: "numeric" });
}

function daysAgo(value: number) {
  if (!value) return "белгісіз";
  const diff = Date.now() - value;
  const days = Math.floor(diff / 86_400_000);
  if (days <= 0) return "бүгін";
  if (days === 1) return "кеше";
  if (days < 30) return `${days} күн бұрын`;
  return formatDate(value);
}

export function TeacherDashboard({ profile }: { profile: UserProfile }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [now] = useState(() => Date.now());

  const loadStudents = useCallback(async () => {
    try {
      const list = await getStudentsForTeacher();
      setStudents(list);
      setError(""); // сәтті жүктелді — ескі қатені өшіреміз
    } catch (loadError) {
      console.error(loadError);
      setError(firestoreErrorText(loadError, "Оқушылар тізімін жүктеу мүмкін болмады."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    return subscribeToAssignments(
      (items) => {
        setAssignments(items);
        setError("");
      },
      (subError) => {
        console.error(subError);
        setError(firestoreErrorText(subError, "Тапсырмаларды жүктеу мүмкін болмады."));
      },
    );
  }, []);

  const refreshSubmissions = useCallback(async () => {
    if (assignments.length === 0) {
      setSubmissions([]);
      return;
    }
    const list = await getAllSubmissions(assignments);
    setSubmissions(list);
  }, [assignments]);

  useEffect(() => {
    refreshSubmissions();
  }, [refreshSubmissions]);

  const classes = useMemo(() => {
    const set = new Set(students.map((student) => student.className).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students
      .filter((student) => (classFilter === "all" ? true : student.className === classFilter))
      .filter((student) =>
        term
          ? student.displayName.toLowerCase().includes(term) || student.email.toLowerCase().includes(term)
          : true,
      )
      .sort((a, b) => b.stats.xp - a.stats.xp);
  }, [classFilter, search, students]);

  const metrics = useMemo(() => {
    const active = students.filter((student) => now - student.lastActiveAt < 7 * 86_400_000).length;
    const withQuiz = students.filter((student) => student.stats.quizCount > 0);
    const avg = withQuiz.length
      ? Math.round(withQuiz.reduce((sum, student) => sum + student.stats.avgPercent, 0) / withQuiz.length)
      : 0;
    const quizzes = students.reduce((sum, student) => sum + student.stats.quizCount, 0);
    const pending = submissions.filter((item) => item.status === "submitted").length;
    const struggling = withQuiz.filter((student) => student.stats.avgPercent < 60).length;
    return { total: students.length, active, avg, quizzes, pending, struggling };
  }, [now, students, submissions]);

  const leaderboard = useMemo(() => filteredStudents.slice(0, 5), [filteredStudents]);

  const classStats = useMemo(() => {
    const map = new Map<string, { name: string; count: number; sum: number; quizzes: number }>();
    students.forEach((student) => {
      const key = student.className || "Сыныбы көрсетілмеген";
      const entry = map.get(key) ?? { name: key, count: 0, sum: 0, quizzes: 0 };
      entry.count += 1;
      entry.sum += student.stats.avgPercent;
      entry.quizzes += student.stats.quizCount;
      map.set(key, entry);
    });
    return Array.from(map.values())
      .map((entry) => ({ ...entry, avg: Math.round(entry.sum / Math.max(entry.count, 1)) }))
      .sort((a, b) => b.avg - a.avg);
  }, [students]);

  if (loading) {
    return (
      <div className="teacher-loading">
        <LoadingLottie width={150} height={150} />
        <p>Оқушы деректері жүктелуде...</p>
      </div>
    );
  }

  return (
    <div className="teacher-shell">
      <div className="teacher-tabs" role="tablist">
        {tabs.map((item) => {
          const Icon = item.icon;
          const badge =
            item.id === "grading" && metrics.pending > 0 ? metrics.pending : item.id === "students" ? metrics.total : 0;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              className={tab === item.id ? "active" : ""}
              onClick={() => setTab(item.id)}
              type="button"
            >
              <Icon size={16} /> {item.label}
              {badge > 0 && <i>{badge}</i>}
            </button>
          );
        })}
      </div>

      {error && <p className="teacher-error" role="alert">{error}</p>}

      {tab === "overview" && (
        <div className="teacher-panel">
          <div className="teacher-metrics">
            <article><span className="metric-icon lime"><Users /></span><div><small>БАРЛЫҚ ОҚУШЫ</small><strong>{metrics.total}</strong><p>тіркелген аккаунт</p></div></article>
            <article><span className="metric-icon mint"><Activity /></span><div><small>БЕЛСЕНДІ (7 КҮН)</small><strong>{metrics.active}</strong><p>соңғы аптада кірген</p></div></article>
            <article><span className="metric-icon sky"><TrendingUp /></span><div><small>СЫНЫП ОРТАШАСЫ</small><strong>{metrics.avg}%</strong><p>викторина бойынша</p></div></article>
            <article className="dark"><span className="metric-icon"><BadgeCheck /></span><div><small>ТЕКСЕРУДІ КҮТЕДІ</small><strong>{metrics.pending}</strong><p>жіберілген жұмыс</p></div></article>
          </div>

          <div className="teacher-two-col">
            <article className="teacher-card">
              <header><div><span className="section-kicker">РЕЙТИНГ</span><h3>Үздік оқушылар</h3></div><Button variant="ghost" onClick={() => setTab("students")}>Барлығы <ArrowRight size={15} /></Button></header>
              {leaderboard.length === 0 ? (
                <p className="teacher-empty">Әзірге оқушы тіркелмеген.</p>
              ) : (
                <ol className="leaderboard">
                  {leaderboard.map((student, position) => {
                    const level = levelFromXp(student.stats.xp);
                    return (
                      <li key={student.uid}>
                        <span className={`rank rank-${position + 1}`}>{position + 1}</span>
                        <div>
                          <strong>{student.displayName}</strong>
                          <small>{student.className || "сынып көрсетілмеген"} · {level.title}</small>
                        </div>
                        <b>{student.stats.xp} XP</b>
                        <span className={student.stats.avgPercent >= 80 ? "excellent" : student.stats.avgPercent >= 60 ? "good" : "practice"}>
                          {student.stats.avgPercent}%
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </article>

            <article className="teacher-card">
              <header><div><span className="section-kicker">СЫНЫПТАР</span><h3>Сынып бойынша үлгерім</h3></div></header>
              {classStats.length === 0 ? (
                <p className="teacher-empty">Дерек жоқ.</p>
              ) : (
                <div className="class-bars">
                  {classStats.map((entry) => (
                    <div className="class-bar" key={entry.name}>
                      <div><strong>{entry.name}</strong><span>{entry.count} оқушы · {entry.quizzes} тест</span></div>
                      <div className="bar-track"><i style={{ width: `${Math.max(entry.avg, 3)}%` }} /></div>
                      <b>{entry.avg}%</b>
                    </div>
                  ))}
                </div>
              )}
            </article>
          </div>

          {metrics.struggling > 0 && (
            <article className="teacher-alert">
              <Flame />
              <div>
                <strong>{metrics.struggling} оқушының орташа нәтижесі 60%-дан төмен</strong>
                <p>Оларға жеке тапсырма беріп, кері байланыс арқылы қолдау көрсетуге болады.</p>
              </div>
              <Button onClick={() => setTab("students")} className="gradient-button">Тізімді көру</Button>
            </article>
          )}
        </div>
      )}

      {tab === "students" && (
        <div className="teacher-panel">
          <div className="teacher-toolbar">
            <div className="search-field">
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Оқушының аты немесе email..." />
            </div>
            <div className="class-chips">
              {classes.map((item) => (
                <button key={item} className={classFilter === item ? "active" : ""} onClick={() => setClassFilter(item)} type="button">
                  {item === "all" ? "Барлық сынып" : item}
                </button>
              ))}
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <p className="teacher-empty">Оқушы табылмады.</p>
          ) : (
            <div className="student-table">
              <div className="student-row head">
                <span>Оқушы</span><span>Сынып</span><span>Тест</span><span>Орташа</span><span>Үздік</span><span>XP</span><span>Белсенділік</span>
              </div>
              {filteredStudents.map((student) => (
                <div className="student-row" key={student.uid}>
                  <span className="student-name">
                    <i>{student.displayName.charAt(0).toUpperCase()}</i>
                    <span><strong>{student.displayName}</strong><small>{student.email}</small></span>
                  </span>
                  <span>{student.className || "—"}</span>
                  <span>{student.stats.quizCount}</span>
                  <span className={student.stats.avgPercent >= 80 ? "excellent" : student.stats.avgPercent >= 60 ? "good" : "practice"}>
                    {student.stats.avgPercent}%
                  </span>
                  <span>{student.stats.bestPercent}%</span>
                  <span>{student.stats.xp}</span>
                  <span className="muted">{daysAgo(student.lastActiveAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "assignments" && (
        <AssignmentsPanel
          profile={profile}
          assignments={assignments}
          classes={classes.filter((item) => item !== "all")}
          onChanged={refreshSubmissions}
        />
      )}

      {tab === "grading" && (
        <GradingPanel
          profile={profile}
          assignments={assignments}
          submissions={submissions}
          onGraded={async () => {
            await refreshSubmissions();
            await loadStudents();
          }}
        />
      )}

      {tab === "feedback" && (
        <div className="teacher-panel">
          <FeedbackCenter />
        </div>
      )}

      {!user && <Link href="/login">Кіру</Link>}
    </div>
  );
}

function AssignmentsPanel({
  profile,
  assignments,
  classes,
  onChanged,
}: {
  profile: UserProfile;
  assignments: Assignment[];
  classes: string[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("Зертхана");
  const [targetClass, setTargetClass] = useState("");
  const [maxPoints, setMaxPoints] = useState(10);
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setBusy(true);
    setError("");
    try {
      await createAssignment(profile, {
        title,
        description,
        topic,
        targetClass,
        maxPoints,
        dueAt: dueDate ? new Date(`${dueDate}T23:59:00`).getTime() : 0,
      });
      setTitle("");
      setDescription("");
      setTargetClass("");
      setDueDate("");
      setMaxPoints(10);
      setOpen(false);
      onChanged();
    } catch (createError) {
      console.error(createError);
      setError("Тапсырма құрылмады. Firestore ережелерін тексеріңіз.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="teacher-panel">
      <div className="teacher-toolbar">
        <div><span className="section-kicker">ТАПСЫРМАЛАР</span><h3>Оқушыларға берілген жұмыстар</h3></div>
        <Button className="gradient-button" onClick={() => setOpen((value) => !value)}><Plus size={16} /> Жаңа тапсырма</Button>
      </div>

      {open && (
        <form className="assignment-form teacher-card" onSubmit={submit}>
          <div className="form-row">
            <label>
              <span>Тақырыбы</span>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Мектептегі су шығынын өлшеу" maxLength={120} required />
            </label>
            <label>
              <span>Бөлім</span>
              <select value={topic} onChange={(event) => setTopic(event.target.value)}>
                <option>Зертхана</option><option>Статистика</option><option>Сызықтық модель</option>
                <option>Пайыз</option><option>Ғылыми жоба</option><option>Жалпы</option>
              </select>
            </label>
          </div>
          <label>
            <span>Сипаттама және талаптар</span>
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="7 күн бойы су шығынын өлшеп, орташа мәнін тауып, диаграмма жаса..." maxLength={2000} required />
          </label>
          <div className="form-row three">
            <label>
              <span>Кімге арналған</span>
              <select value={targetClass} onChange={(event) => setTargetClass(event.target.value)}>
                <option value="">Барлық оқушыға</option>
                {classes.map((item) => <option key={item} value={item}>{item} сыныбы</option>)}
              </select>
            </label>
            <label>
              <span>Макс. балл</span>
              <input type="number" min={1} max={100} value={maxPoints} onChange={(event) => setMaxPoints(Number(event.target.value))} />
            </label>
            <label>
              <span>Мерзімі</span>
              <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </label>
          </div>
          <p className="assignment-form-note">
            <Info size={14} />
            {targetClass
              ? `Бұл тапсырманы тек профилінде «${targetClass}» сыныбы көрсетілген оқушылар көреді.`
              : "Сынып таңдалмаған — тапсырманы барлық оқушы көреді. Бұл ең сенімді нұсқа."}
          </p>
          {error && <p className="auth-error">{error}</p>}
          <div className="form-actions">
            <Button type="submit" className="gradient-button" disabled={busy}>{busy ? <Loader2 className="spin" /> : <Send size={16} />} Жариялау</Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Болдырмау</Button>
          </div>
        </form>
      )}

      {assignments.length === 0 ? (
        <p className="teacher-empty">Әзірге тапсырма жоқ. Бірінші тапсырманы жариялаңыз.</p>
      ) : (
        <div className="assignment-grid">
          {assignments.map((assignment) => (
            <article className="assignment-card" key={assignment.id}>
              <header>
                <span className="assignment-topic">{assignment.topic}</span>
                {assignment.teacherId === profile.uid && (
                  <button
                    className="icon-button danger"
                    type="button"
                    aria-label="Тапсырманы жою"
                    onClick={async () => {
                      if (!window.confirm("Тапсырманы жою керек пе?")) return;
                      await deleteAssignment(assignment.id).catch(() => undefined);
                      onChanged();
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </header>
              <h4>{assignment.title}</h4>
              <p>{assignment.description}</p>
              <div className="assignment-meta">
                <span><GraduationCap size={14} /> {assignment.targetClass ? `${assignment.targetClass} сыныбы` : "Барлық оқушы"}</span>
                <span><BadgeCheck size={14} /> {assignment.maxPoints} балл</span>
                <span><CalendarClock size={14} /> {assignment.dueAt ? formatDate(assignment.dueAt) : "мерзімсіз"}</span>
              </div>
              <footer>
                <span>{assignment.submissionCount} жіберілім</span>
                <span>{assignment.gradedCount} тексерілді</span>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function GradingPanel({
  profile,
  assignments,
  submissions,
  onGraded,
}: {
  profile: UserProfile;
  assignments: Assignment[];
  submissions: Submission[];
  onGraded: () => void;
}) {
  const [filter, setFilter] = useState<"pending" | "graded" | "all">("pending");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [grade, setGrade] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const visible = useMemo(
    () => submissions.filter((item) => (filter === "all" ? true : filter === "pending" ? item.status === "submitted" : item.status === "graded")),
    [filter, submissions],
  );

  async function save(submission: Submission) {
    const assignment = assignments.find((item) => item.id === submission.assignmentId);
    if (!assignment) return;
    setBusy(true);
    setError("");
    try {
      await gradeSubmission(assignment, submission, profile, { grade, feedback });
      setActiveId(null);
      setFeedback("");
      onGraded();
    } catch (gradeError) {
      console.error(gradeError);
      setError("Бағаны сақтау мүмкін болмады.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="teacher-panel">
      <div className="teacher-toolbar">
        <div><span className="section-kicker">ТЕКСЕРУ</span><h3>Оқушылар жіберген жұмыстар</h3></div>
        <div className="class-chips">
          <button className={filter === "pending" ? "active" : ""} onClick={() => setFilter("pending")} type="button">Күтуде</button>
          <button className={filter === "graded" ? "active" : ""} onClick={() => setFilter("graded")} type="button">Бағаланды</button>
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")} type="button">Барлығы</button>
        </div>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {visible.length === 0 ? (
        <p className="teacher-empty">Бұл санатта жұмыс жоқ.</p>
      ) : (
        <div className="submission-list">
          {visible.map((submission) => {
            const assignment = assignments.find((item) => item.id === submission.assignmentId);
            const isActive = activeId === `${submission.assignmentId}:${submission.id}`;
            return (
              <article className={`submission-card ${submission.status}`} key={`${submission.assignmentId}:${submission.id}`}>
                <header>
                  <div>
                    <strong>{submission.studentName}</strong>
                    <small>{submission.className || "сынып көрсетілмеген"} · {assignment?.title ?? submission.assignmentTitle}</small>
                  </div>
                  <span className={`status-pill ${submission.status === "graded" ? "answered" : "open"}`}>
                    {submission.status === "graded" ? `${submission.grade}/${submission.maxPoints} балл` : "Тексерілмеген"}
                  </span>
                </header>
                <p className="submission-text">{submission.text}</p>
                {submission.link && (
                  <a className="submission-link" href={submission.link} target="_blank" rel="noreferrer">Жұмыс сілтемесі ↗</a>
                )}
                <div className="submission-meta">
                  <span>Жіберілді: {daysAgo(submission.submittedAt)}</span>
                  {submission.status === "graded" && submission.feedback && <span>Пікір: {submission.feedback}</span>}
                </div>

                {isActive ? (
                  <div className="grade-form">
                    <label>
                      <span>Баға (0–{assignment?.maxPoints ?? submission.maxPoints})</span>
                      <input
                        type="number"
                        min={0}
                        max={assignment?.maxPoints ?? submission.maxPoints}
                        value={grade}
                        onChange={(event) => setGrade(Number(event.target.value))}
                      />
                    </label>
                    <Textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Оқушыға түсінікті пікір жазыңыз..." maxLength={1000} />
                    <div className="form-actions">
                      <Button className="gradient-button" disabled={busy} onClick={() => save(submission)}>
                        {busy ? <Loader2 className="spin" /> : <CheckCircle2 size={16} />} Бағаны сақтау
                      </Button>
                      <Button variant="ghost" onClick={() => setActiveId(null)}>Жабу</Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveId(`${submission.assignmentId}:${submission.id}`);
                      setGrade(submission.grade || assignment?.maxPoints || submission.maxPoints);
                      setFeedback(submission.feedback);
                    }}
                  >
                    <BadgeCheck size={16} /> {submission.status === "graded" ? "Бағаны өзгерту" : "Бағалау"}
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
