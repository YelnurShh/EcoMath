import { BarChart3, Calculator, LineChart, Sigma, Target } from "lucide-react";

const methods = [
  { icon:BarChart3, tag:"01 · ДЕРЕК", title:"Статистика", text:"Бақылау нәтижелерін реттеп, орташа мән, медиана, мода және өзгеру ауқымын есептейді.", formula:"x̄ = Σx / n", example:"7 күндегі су шығынының орташа мәнін табу" },
  { icon:LineChart, tag:"02 · БОЛЖАМ", title:"Сызықтық модель", text:"Бір көрсеткіштің екіншісіне тәуелділігін сипаттап, болашақ мәнін болжауға көмектеседі.", formula:"y = kx + b", example:"Оқушы саны артқанда қалдықтың өзгеруін болжау" },
  { icon:Target, tag:"03 · ШЕШІМ", title:"Оңтайландыру", text:"Берілген шектеулер ішінде шығынды азайтып, пайдалы әсерді барынша арттыратын нұсқаны табады.", formula:"min f(x)", example:"Ең аз энергиямен сыныпты тиімді жарықтандыру" },
  { icon:Calculator, tag:"04 · САЛЫСТЫРУ", title:"Пайыздық өзгеріс", text:"Бастапқы және соңғы нәтижені салыстырып, шешімнің қаншалықты тиімді болғанын көрсетеді.", formula:"Δ% = (a−b) / a × 100", example:"Қағаз қалдығын қанша пайызға азайттық?" },
];

export default function MethodsPage() {
  return <main className="inner-page"><section className="page-intro page-shell"><div className="eyebrow"><Sigma size={15}/> Математикалық құралдар</div><h1>Деректі <span>дәлелге</span> айналдыратын әдістер</h1><p>Экологиялық мәселені зерттеу үшін күрделі математика қажет емес. Дұрыс таңдалған төрт әдіс жеткілікті.</p></section><section className="method-list page-shell">{methods.map((item,index)=>{const Icon=item.icon;return <article className="method-row glass-card" key={item.title}><div className="method-icon"><Icon/></div><div className="method-copy"><span>{item.tag}</span><h2>{item.title}</h2><p>{item.text}</p></div><div className="method-math"><code>{item.formula}</code><small>{item.example}</small></div><span className="giant-number">0{index+1}</span></article>})}</section></main>;
}
