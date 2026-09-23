"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Link2,
  Loader2,
  MessageSquareQuote,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth-provider";
import { LoadingLottie } from "@/components/loading-lottie";
import {
  getMySubmissions,
  isVisibleForStudent,
  submitAssignment,
  subscribeToAssignments,
  type Assignment,
  type Submission,
} from "@/lib/assignments";

function formatDate(value: number) {
  if (!value) return "мерзімсіз";
  return new Date(value).toLocaleDateString("kk-KZ", { day: "numeric", month: "long" });
}

export function StudentAssignments() {
  const { user, profile, loading: authLoading } = useAuth();
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState<"active" | "done" | "all">("active");
  const [showOtherClasses, setShowOtherClasses] = useState(false);
  const [now] = useState(() => Date.now());

  const uid = user?.uid;
  const className = profile?.className ?? "";

  // Тапсырмаларды нақты уақытта тыңдау — мұғалім жарияласа бірден көрінеді.
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeToAssignments(
      (items) => {
        setAllAssignments(items);
        setError("");
        setLoading(false);
      },
      (subError) => {
        console.error(subError);
        setError("Тапсырмаларды жүктеу мүмкін болмады. Интернет байланысы мен Firestore ережелерін тексеріңіз.");
        setLoading(false);
      },
    );
  }, [uid]);

  // Менің жіберілімдерім
  const loadSubmissions = useCallback(async () => {
    if (!uid || allAssignments.length === 0) {
      setSubmissions({});
      return;
    }
    try {
      setSubmissions(await getMySubmissions(allAssignments, uid));
    } catch (loadError) {
      console.error(loadError);
    }
  }, [allAssignments, uid]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // Маған арналған / басқа сыныпқа арналған
  const forMe = useMemo(
    () => allAssignments.filter((item) => isVisibleForStudent(item, className)),
    [allAssignments, className],
  );
  const otherClasses = useMemo(
    () => allAssignments.filter((item) => !isVisibleForStudent(item, className)),
    [allAssignments, className],
  );

  const pool = showOtherClasses ? allAssignments : forMe;

  const visible = useMemo(() => {
    return pool.filter((assignment) => {
      const submission = submissions[assignment.id];
      if (filter === "all") return true;
      if (filter === "done") return Boolean(submission);
      return !submission;
    });
  }, [filter, pool, submissions]);

  const summary = useMemo(() => {
    const done = forMe.filter((item) => submissions[item.id]).length;
    const graded = Object.values(submissions).filter((item) => item.status === "graded");
    const avg = graded.length
      ? Math.round((graded.reduce((sum, item) => sum + item.grade / Math.max(item.maxPoints, 1), 0) / graded.length) * 100)
      : 0;
    return { total: forMe.length, done, graded: graded.length, avg };
  }, [forMe, submissions]);

  if (authLoading || (user && loading)) {
    return <div className="teacher-loading"><LoadingLottie width={140} height={140} /><p>Тапсырмалар жүктелуде...</p></div>;
  }

  if (!user || !profile) {
    return (
      <div className="feedback-gate glass-card">
        <ClipboardList />
        <h2>Тапсырмаларды көру үшін кіріңіз</h2>
        <p>Мұғалім берген тапсырмалар мен бағаларыңыз жеке кабинетте сақталады.</p>
        <Link href="/login" className="gradient-button">Кіру / Тіркелу <ArrowRight size={16} /></Link>
      </div>
    );
  }

  async function send(assignment: Assignment) {
    if (!profile || !text.trim()) return;
    setBusy(true);
    try {
      await submitAssignment(assignment, profile, { text, link });
      setText("");
      setLink("");
      setOpenId(null);
      await loadSubmissions();
    } catch (sendError) {
      console.error(sendError);
      setError("Жұмыс жіберілмеді. Қайта байқап көріңіз.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="assignments-page-inner">
      <div className="assignment-summary">
        <article><small>БАРЛЫҚ ТАПСЫРМА</small><strong>{summary.total}</strong></article>
        <article><small>ОРЫНДАЛҒАН</small><strong>{summary.done}</strong></article>
        <article><small>БАҒАЛАНҒАН</small><strong>{summary.graded}</strong></article>
        <article className="accent"><small>ОРТАША БАЛЛ</small><strong>{summary.avg}%</strong></article>
      </div>

      {/* Сынып көрсетілмесе — тапсырма көрінбеуінің басты себебі */}
      {!profile.className && (
        <div className="assignment-hint warn">
          <AlertCircle />
          <div>
            <strong>Профильде сыныбыңыз көрсетілмеген</strong>
            <p>Мұғалім белгілі бір сыныпқа тапсырма берсе, ол сізге көрінбейді. Профильде сыныбыңызды жазыңыз.</p>
          </div>
          <Link href="/profile" className="soft-button">Профильді толтыру <ArrowRight size={14} /></Link>
        </div>
      )}

      {/* Басқа сыныпқа арналған тапсырмалар бар екенін білдіру */}
      {profile.className && otherClasses.length > 0 && (
        <div className="assignment-hint">
          <Users />
          <div>
            <strong>{otherClasses.length} тапсырма басқа сыныпқа арналған</strong>
            <p>Сіздің сыныбыңыз — <b>{profile.className}</b>. Мұғалім басқа сынып көрсеткен тапсырмалар жасырылған.</p>
          </div>
          <button className="soft-button" type="button" onClick={() => setShowOtherClasses((value) => !value)}>
            {showOtherClasses ? "Жасыру" : "Бәрін көрсету"}
          </button>
        </div>
      )}

      <div className="assignment-toolbar">
        <div className="class-chips assignment-filters">
          <button className={filter === "active" ? "active" : ""} onClick={() => setFilter("active")} type="button">Орындалмаған</button>
          <button className={filter === "done" ? "active" : ""} onClick={() => setFilter("done")} type="button">Жіберілген</button>
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")} type="button">Барлығы</button>
        </div>
        <button className="soft-button" type="button" onClick={loadSubmissions} aria-label="Жаңарту">
          <RefreshCw size={15} /> Жаңарту
        </button>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {visible.length === 0 ? (
        <div className="teacher-empty big">
          <ClipboardList />
          <strong>
            {allAssignments.length === 0
              ? "Әзірге тапсырма жарияланбаған"
              : forMe.length === 0
                ? "Сіздің сыныбыңызға тапсырма жоқ"
                : "Бұл санатта тапсырма жоқ"}
          </strong>
          <p>
            {allAssignments.length === 0
              ? "Мұғалім жаңа тапсырма жарияласа, ол осы жерде бірден пайда болады."
              : forMe.length === 0
                ? `Барлығы ${allAssignments.length} тапсырма бар, бірақ олар басқа сыныптарға арналған.`
                : "Басқа сүзгіні таңдап көріңіз."}
          </p>
        </div>
      ) : (
        <div className="assignment-grid student">
          {visible.map((assignment) => {
            const submission = submissions[assignment.id];
            const overdue = assignment.dueAt > 0 && assignment.dueAt < now && !submission;
            const otherClass = !isVisibleForStudent(assignment, className);
            return (
              <article className={`assignment-card ${submission?.status === "graded" ? "graded" : submission ? "submitted" : ""} ${overdue ? "overdue" : ""} ${otherClass ? "other-class" : ""}`} key={assignment.id}>
                <header>
                  <span className="assignment-topic">{assignment.topic}</span>
                  {submission ? (
                    <span className={`status-pill ${submission.status === "graded" ? "answered" : "open"}`}>
                      {submission.status === "graded" ? `${submission.grade}/${submission.maxPoints}` : "Тексеруде"}
                    </span>
                  ) : overdue ? (
                    <span className="status-pill closed">Мерзімі өтті</span>
                  ) : null}
                </header>
                <h4>{assignment.title}</h4>
                <p>{assignment.description}</p>
                <div className="assignment-meta">
                  <span><BadgeCheck size={14} /> {assignment.maxPoints} балл</span>
                  <span><CalendarClock size={14} /> {formatDate(assignment.dueAt)}</span>
                  <span><Clock3 size={14} /> {assignment.teacherName}</span>
                  {assignment.targetClass && <span><Users size={14} /> {assignment.targetClass}</span>}
                </div>

                {otherClass && <p className="other-class-note">Бұл тапсырма {assignment.targetClass} сыныбына арналған.</p>}

                {submission?.status === "graded" && submission.feedback && (
                  <div className="teacher-feedback-note">
                    <MessageSquareQuote size={16} />
                    <div><strong>Мұғалім пікірі</strong><p>{submission.feedback}</p></div>
                  </div>
                )}

                {openId === assignment.id ? (
                  <div className="grade-form">
                    <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Жауабыңызды, есептеулеріңізді және қорытындыңызды жазыңыз..." maxLength={3000} />
                    <div className="link-field">
                      <Link2 size={16} />
                      <Input value={link} onChange={(event) => setLink(event.target.value)} placeholder="Құжат/презентация сілтемесі (міндетті емес)" />
                    </div>
                    <div className="form-actions">
                      <Button className="gradient-button" disabled={busy || !text.trim()} onClick={() => send(assignment)}>
                        {busy ? <Loader2 className="spin" /> : <Send size={16} />} Жіберу
                      </Button>
                      <Button variant="ghost" onClick={() => setOpenId(null)}>Болдырмау</Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant={submission ? "outline" : "default"}
                    className={submission ? "" : "gradient-button"}
                    onClick={() => {
                      setOpenId(assignment.id);
                      setText(submission?.text ?? "");
                      setLink(submission?.link ?? "");
                    }}
                  >
                    {submission ? <><CheckCircle2 size={16} /> Жауапты өңдеу</> : <><Send size={16} /> Жұмысты жіберу</>}
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
