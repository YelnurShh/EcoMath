import { MessageCircleMore } from "lucide-react";
import { FeedbackCenter } from "@/components/feedback-center";

export default function FeedbackPage() {
  return <main className="inner-page feedback-page"><section className="page-shell"><div className="page-intro compact-intro"><span className="eyebrow"><MessageCircleMore size={16} /> ТІКЕЛЕЙ КЕРІ БАЙЛАНЫС</span><h1>Сұрағыңды қой.<br /><span>Жауабын бірге тап.</span></h1><p>Есеп, зертхана немесе ғылыми жоба туралы мұғаліммен қауіпсіз әрі ыңғайлы сөйлес.</p></div><FeedbackCenter /></section></main>;
}
