import Link from "next/link";
import { ArrowRight, BarChart3, ClipboardList, Droplets, Lightbulb, Sparkles } from "lucide-react";

const steps = [
  { icon:Lightbulb, title:"Мәселені таңда", text:"Мектептегі су, қағаз, энергия немесе пластик шығынының біреуін зерттеу нысаны ретінде белгіле.", task:"Зерттеу сұрағын бір сөйлеммен жаз." },
  { icon:ClipboardList, title:"Дерек жина", text:"Кемінде 7 күн бақылау жасап, әр нәтижені бірдей өлшем бірлігімен кестеге енгіз.", task:"Күні, мөлшері және өлшем бірлігі болсын." },
  { icon:BarChart3, title:"Модель құр", text:"Орташа мән, пайыздық өзгеріс немесе сызықтық функция арқылы заңдылықты көрсет.", task:"Формула мен диаграмманы бірге қолдан." },
  { icon:Sparkles, title:"Шешімді тексер", text:"Ұсынысыңды шағын тәжірибеде қолданып, жаңа нәтижені бастапқы дерекпен салыстыр.", task:"Қорытындыны нақты санмен дәлелде." },
];

export default function ProjectPage() {
  return <main className="inner-page"><section className="page-intro page-shell"><div className="eyebrow"><Droplets size={15}/> Ғылыми жоба жоспары</div><h1>Идеядан <span>нақты дәлелге</span> дейін</h1><p>Жоба жұмысын ретімен орында. Әр кезең келесі қадамға қажет деректі дайындайды.</p></section><section className="timeline page-shell">{steps.map((step,index)=>{const Icon=step.icon;return <article className="timeline-card glass-card" key={step.title}><span className="timeline-number">0{index+1}</span><div className="timeline-icon"><Icon/></div><div><h2>{step.title}</h2><p>{step.text}</p><div className="task-chip"><span>Тапсырма</span>{step.task}</div></div></article>})}</section><section className="project-cta page-shell"><div><span>КЕЛЕСІ ҚАДАМ</span><h2>Моделіңді дайын калькуляторда тексер.</h2></div><Link href="/lab" className="gradient-button large-button">Зертханаға өту <ArrowRight/></Link></section></main>;
}
