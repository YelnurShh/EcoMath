import { BrainCircuit } from "lucide-react";
import { QuizGame } from "@/components/quiz-game";

export default function QuizPage() {
  return <main className="inner-page quiz-page"><section className="page-intro compact-intro page-shell"><div className="eyebrow"><BrainCircuit size={15}/> Білімді тексер</div><h1>EcoMath <span>викторинасы</span></h1><p>Экология мен математикаға қатысты 5 тапсырманы орында. Әр жауаптан кейін қысқа түсіндірме беріледі.</p></section><section className="page-shell"><QuizGame /></section></main>;
}
