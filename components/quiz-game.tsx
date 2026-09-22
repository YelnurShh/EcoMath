"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, RotateCcw, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/components/auth-provider";
import Link from "next/link";
import { saveQuizResult } from "@/lib/quiz-results";
import { LoadingLottie } from "@/components/loading-lottie";

const questions = [
  { question: "500 оқушының әрқайсысы күніне 2 бөтелке қолданса, бір күнде неше бөтелке жиналады?", options: ["250", "500", "1 000", "2 000"], answer: 2, explanation: "500 × 2 = 1 000 бөтелке." },
  { question: "Деректер жиыны: 4, 6, 6, 8. Орташа мәні қанша?", options: ["5", "6", "7", "8"], answer: 1, explanation: "(4 + 6 + 6 + 8) ÷ 4 = 6." },
  { question: "Қалдық көлемі 200 кг-нан 150 кг-ға азайды. Азаю пайызы қанша?", options: ["20%", "25%", "30%", "50%"], answer: 1, explanation: "50 ÷ 200 × 100% = 25%." },
  { question: "y = 3x + 2 формуласында x = 4 болса, y нешеге тең?", options: ["9", "12", "14", "18"], answer: 2, explanation: "3 × 4 + 2 = 14." },
  { question: "Қай әдіс деректің ең жиі кездесетін мәнін көрсетеді?", options: ["Медиана", "Мода", "Орташа мән", "Диапазон"], answer: 1, explanation: "Мода — деректер жиынында ең жиі кездесетін мән." },
];

export function QuizGame() {
  const { user, loading } = useAuth();
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState("");
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const savedResult = useRef(false);
  const question = questions[index];
  const correct = Number(selected) === question.answer;

  const check = () => {
    if (!selected) return;
    setChecked(true);
    if (Number(selected) === question.answer) setScore((value) => value + 1);
  };
  const next = () => {
    if (index === questions.length - 1) { setFinished(true); return; }
    setIndex((value) => value + 1); setSelected(""); setChecked(false);
  };
  const restart = () => { savedResult.current = false; setSaveError(false); setIndex(0); setSelected(""); setChecked(false); setScore(0); setFinished(false); };

  useEffect(() => {
    if (!finished || !user || savedResult.current) return;
    savedResult.current = true;
    saveQuizResult(user.uid, score, questions.length).catch(() => setSaveError(true));
  }, [finished, score, user]);

  if (loading) return <div className="auth-state quiz-auth-state"><LoadingLottie width={130} height={130} /><span>Жүктелуде...</span></div>;

  if (!user) {
    return (
      <div className="quiz-auth-gate glass-card">
        <div className="result-orb"><Sparkles /></div>
        <span>ҰПАЙ ЖИНАУ ҮШІН</span>
        <h2>Алдымен аккаунтыңызға кіріңіз</h2>
        <p>Нәтижеңізді есептеп, оқу барысын жалғастыру үшін Google немесе email арқылы кіріңіз.</p>
        <Link href="/login" className="gradient-button quiz-button">Кіру / Тіркелу <ArrowRight /></Link>
      </div>
    );
  }

  if (finished) {
    const percent = Math.round(score / questions.length * 100);
    return <div className="quiz-result glass-card"><div className="result-orb"><Sparkles /></div><span>ВИКТОРИНА АЯҚТАЛДЫ</span><h2>{score} / {questions.length}</h2><p>{percent >= 80 ? "Керемет нәтиже! Математикалық модельдерді жақсы меңгергенсің." : percent >= 60 ? "Жақсы нәтиже! Әдістер бетін тағы бір қарап шықсаң, одан да жоғары балл аласың." : "Жақсы бастама! Формулаларды қайталап, викторинаны қайта өтіп көр."}</p>{saveError && <p className="auth-error">Нәтиже сақталмады. Firestore rules баптауын тексеріңіз.</p>}<Button onClick={restart} className="gradient-button quiz-button"><RotateCcw /> Қайта бастау</Button></div>;
  }

  return (
    <div className="quiz-shell">
      <div className="quiz-progress"><div><span>СҰРАҚ {index + 1} / {questions.length}</span><b>{score} ұпай</b></div><div className="progress-track"><i style={{ width: `${((index + (checked ? 1 : 0)) / questions.length) * 100}%` }} /></div></div>
      <div className="quiz-card glass-card">
        <span className="quiz-number">0{index + 1}</span>
        <h2>{question.question}</h2>
        <RadioGroup value={selected} onValueChange={checked ? undefined : setSelected} className="quiz-options" aria-label="Жауап нұсқалары">
          {question.options.map((option, optionIndex) => {
            const state = checked ? optionIndex === question.answer ? "correct" : optionIndex === Number(selected) ? "wrong" : "" : "";
            return <label className={`quiz-option ${state}`} key={option}><RadioGroupItem value={String(optionIndex)} disabled={checked} /><span>{option}</span>{state === "correct" && <Check />}{state === "wrong" && <X />}</label>;
          })}
        </RadioGroup>
        {checked && <div className={`answer-note ${correct ? "success" : "error"}`}><strong>{correct ? "Дұрыс жауап!" : "Дұрыс жауапты қарап шық."}</strong><p>{question.explanation}</p></div>}
        <div className="quiz-actions">
          {!checked ? <Button onClick={check} disabled={!selected} className="gradient-button quiz-button">Жауапты тексер <ArrowRight /></Button> : <Button onClick={next} className="gradient-button quiz-button">{index === questions.length - 1 ? "Нәтижені көру" : "Келесі сұрақ"} <ArrowRight /></Button>}
        </div>
      </div>
    </div>
  );
}
