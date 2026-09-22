"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Flame,
  LineChart,
  Leaf,
  Percent,
  RotateCcw,
  Shuffle,
  Sparkles,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/components/auth-provider";
import { saveQuizResult } from "@/lib/quiz-results";
import { buildMixedQuiz, quizTopics, shuffle, type QuizQuestion } from "@/lib/quiz-data";
import { LoadingLottie } from "@/components/loading-lottie";

const topicIcons = {
  stats: BarChart3,
  linear: LineChart,
  percent: Percent,
  eco: Leaf,
  mixed: Shuffle,
} as const;

type Selection = { id: string; title: string; questions: QuizQuestion[] };

export function QuizGame() {
  const { user, loading, profile } = useAuth();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [reward, setReward] = useState<{ xpGain: number; streak: number } | null>(null);
  const savedResult = useRef(false);

  const question = selection?.questions[index];
  const correct = question ? Number(selected) === question.answer : false;

  // Таймер
  useEffect(() => {
    if (!selection || finished) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [selection, finished]);

  useEffect(() => {
    if (!finished || !user || !profile || !selection || savedResult.current) return;
    savedResult.current = true;
    saveQuizResult({
      userId: user.uid,
      displayName: profile.displayName,
      className: profile.className,
      score,
      total: selection.questions.length,
      topicId: selection.id,
      topicTitle: selection.title,
      durationSec: seconds,
    })
      .then((result) => setReward({ xpGain: result.xpGain, streak: result.streak }))
      .catch(() => setSaveError(true));
  }, [finished, profile, score, seconds, selection, user]);

  const progress = useMemo(() => {
    if (!selection) return 0;
    return ((index + (checked ? 1 : 0)) / selection.questions.length) * 100;
  }, [checked, index, selection]);

  function start(topicId: string) {
    const topic = quizTopics.find((item) => item.id === topicId);
    const questions = topic ? shuffle(topic.questions).slice(0, 6) : buildMixedQuiz(8);
    setSelection({ id: topic?.id ?? "mixed", title: topic?.title ?? "Аралас тест", questions });
    setIndex(0);
    setSelected("");
    setChecked(false);
    setScore(0);
    setFinished(false);
    setSeconds(0);
    setReward(null);
    setSaveError(false);
    savedResult.current = false;
  }

  function check() {
    if (!selected || !question) return;
    setChecked(true);
    if (Number(selected) === question.answer) setScore((value) => value + 1);
  }

  function next() {
    if (!selection) return;
    if (index === selection.questions.length - 1) {
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelected("");
    setChecked(false);
  }

  if (loading) {
    return (
      <div className="auth-state quiz-auth-state">
        <LoadingLottie width={130} height={130} />
        <span>Жүктелуде...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="quiz-auth-gate glass-card">
        <div className="result-orb"><Sparkles /></div>
        <span>ҰПАЙ ЖИНАУ ҮШІН</span>
        <h2>Алдымен аккаунтыңызға кіріңіз</h2>
        <p>Нәтижеңізді сақтап, XP жинау және мұғалімге көрсету үшін Google немесе email арқылы кіріңіз.</p>
        <Link href="/login" className="gradient-button quiz-button">Кіру / Тіркелу <ArrowRight /></Link>
      </div>
    );
  }

  // Тақырып таңдау экраны
  if (!selection) {
    return (
      <div className="topic-picker">
        <div className="topic-picker-head">
          <div>
            <span className="section-kicker">ТАҚЫРЫП ТАҢДА</span>
            <h2>Қай саладан тексерілгің келеді?</h2>
          </div>
          <p>Әр тақырыпта 6 сұрақ. Аралас режимде барлық тақырыптан 8 сұрақ кездеседі.</p>
        </div>
        <div className="topic-grid">
          {quizTopics.map((topic) => {
            const Icon = topicIcons[topic.icon];
            return (
              <button className="topic-card" key={topic.id} onClick={() => start(topic.id)} type="button">
                <span className="topic-icon"><Icon /></span>
                <strong>{topic.title}</strong>
                <p>{topic.description}</p>
                <small>{topic.questions.length} сұрақ <ArrowRight size={14} /></small>
              </button>
            );
          })}
          <button className="topic-card mixed" onClick={() => start("mixed")} type="button">
            <span className="topic-icon"><Shuffle /></span>
            <strong>Аралас сынақ</strong>
            <p>Барлық тақырыптан кездейсоқ таңдалған 8 сұрақ.</p>
            <small>8 сұрақ <ArrowRight size={14} /></small>
          </button>
        </div>
      </div>
    );
  }

  if (finished) {
    const total = selection.questions.length;
    const percent = Math.round((score / total) * 100);
    return (
      <div className="quiz-result glass-card">
        <div className="result-orb"><Trophy /></div>
        <span>{selection.title.toUpperCase()} · АЯҚТАЛДЫ</span>
        <h2>{score} / {total}</h2>
        <div className="result-chips">
          <span><Percent size={14} /> {percent}%</span>
          <span><Timer size={14} /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
          {reward && <span className="xp"><Sparkles size={14} /> +{reward.xpGain} XP</span>}
          {reward && reward.streak > 1 && <span className="streak"><Flame size={14} /> {reward.streak} күн қатарынан</span>}
        </div>
        <p>
          {percent >= 80
            ? "Керемет нәтиже! Математикалық модельдерді жақсы меңгергенсің."
            : percent >= 60
              ? "Жақсы нәтиже! Әдістер бетін қайта қарасаң, одан да жоғары балл аласың."
              : "Жақсы бастама! Формулаларды қайталап, викторинаны қайта өтіп көр."}
        </p>
        {saveError && <p className="auth-error">Нәтиже сақталмады. Firestore ережелерін тексеріңіз.</p>}
        <div className="result-actions">
          <Button onClick={() => start(selection.id)} className="gradient-button quiz-button"><RotateCcw /> Қайта өту</Button>
          <Button variant="outline" onClick={() => setSelection(null)}>Басқа тақырып</Button>
          <Link href="/profile" className="soft-button">Профильді көру <ArrowRight size={16} /></Link>
        </div>
      </div>
    );
  }

  if (!question) return null;

  return (
    <div className="quiz-shell">
      <div className="quiz-progress">
        <div>
          <span>{selection.title} · СҰРАҚ {index + 1} / {selection.questions.length}</span>
          <b><Timer size={14} /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")} · {score} ұпай</b>
        </div>
        <div className="progress-track"><i style={{ width: `${progress}%` }} /></div>
      </div>
      <div className="quiz-card glass-card">
        <span className="quiz-number">0{index + 1}</span>
        <h2>{question.question}</h2>
        <RadioGroup value={selected} onValueChange={checked ? undefined : setSelected} className="quiz-options" aria-label="Жауап нұсқалары">
          {question.options.map((option, optionIndex) => {
            const state = checked
              ? optionIndex === question.answer
                ? "correct"
                : optionIndex === Number(selected)
                  ? "wrong"
                  : ""
              : "";
            return (
              <label className={`quiz-option ${state}`} key={option}>
                <RadioGroupItem value={String(optionIndex)} disabled={checked} />
                <span>{option}</span>
                {state === "correct" && <Check />}
                {state === "wrong" && <X />}
              </label>
            );
          })}
        </RadioGroup>
        {checked && (
          <div className={`answer-note ${correct ? "success" : "error"}`}>
            <strong>{correct ? "Дұрыс жауап!" : "Дұрыс жауапты қарап шық."}</strong>
            <p>{question.explanation}</p>
          </div>
        )}
        <div className="quiz-actions">
          {!checked ? (
            <Button onClick={check} disabled={!selected} className="gradient-button quiz-button">Жауапты тексер <ArrowRight /></Button>
          ) : (
            <Button onClick={next} className="gradient-button quiz-button">
              {index === selection.questions.length - 1 ? "Нәтижені көру" : "Келесі сұрақ"} <ArrowRight />
            </Button>
          )}
          <Button variant="ghost" type="button" onClick={() => setSelection(null)}>Тақырыпты ауыстыру</Button>
        </div>
      </div>
    </div>
  );
}
