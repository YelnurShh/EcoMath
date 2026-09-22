"use client";

import { useMemo, useState } from "react";
import { Recycle, Sigma, TrendingDown } from "lucide-react";
import { Slider } from "@/components/ui/slider";

export function LabCalculator() {
  const [students, setStudents] = useState(500);
  const [bottles, setBottles] = useState(2);
  const [reduction, setReduction] = useState(40);
  const result = useMemo(() => {
    const total = students * bottles * 180;
    const saved = Math.round(total * reduction / 100);
    return { total, saved, kilograms: Math.round(saved * .02) };
  }, [students, bottles, reduction]);
  const format = (value: number) => new Intl.NumberFormat("kk-KZ").format(value);

  return (
    <div className="lab-workspace">
      <div className="formula-panel glass-card">
        <div className="icon-bubble"><Sigma /></div>
        <span>Қолданылатын модель</span>
        <strong>N = n × b × 180</strong>
        <p>n — оқушы саны, b — күніне қолданылатын бөтелке саны.</p>
        <div className="formula-total"><span>Жалпы болжам</span><b>{format(result.total)} бөтелке</b></div>
      </div>
      <div className="calculator-card">
        <div className="calc-header"><div><span>ИНТЕРАКТИВТІ МОДЕЛЬ</span><h2>Пластик калькуляторы</h2></div><Recycle /></div>
        <RangeControl label="Оқушы саны" valueLabel={format(students)} minLabel="100" maxLabel="1 500"><Slider min={100} max={1500} step={50} value={[students]} onValueChange={(v) => setStudents(v[0])} aria-label="Оқушы саны" /></RangeControl>
        <RangeControl label="Бір оқушыға / күн" valueLabel={`${bottles} бөтелке`} minLabel="1" maxLabel="5"><Slider min={1} max={5} step={1} value={[bottles]} onValueChange={(v) => setBottles(v[0])} aria-label="Күндік бөтелке саны" /></RangeControl>
        <RangeControl label="Азайту мақсаты" valueLabel={`${reduction}%`} minLabel="10%" maxLabel="90%" accent><Slider min={10} max={90} step={5} value={[reduction]} onValueChange={(v) => setReduction(v[0])} aria-label="Азайту мақсаты" /></RangeControl>
        <div className="result-panel" aria-live="polite">
          <div><span>БІР ОҚУ ЖЫЛЫНДАҒЫ НӘТИЖЕ</span><strong>{format(result.saved)} <small>бөтелке</small></strong><p>шамамен <b>{format(result.kilograms)} кг</b> пластик азаяды</p></div>
          <div className="result-icon"><TrendingDown /></div>
          <div className="result-bar"><i style={{ width: `${reduction}%` }} /></div>
        </div>
        <p className="disclaimer">* Оқу үлгісінде 180 оқу күні және бір бөтелкенің орташа салмағы 20 г деп алынды.</p>
      </div>
    </div>
  );
}

function RangeControl({ label, valueLabel, minLabel, maxLabel, accent, children }: { label: string; valueLabel: string; minLabel: string; maxLabel: string; accent?: boolean; children: React.ReactNode }) {
  return <div className={`control-group ${accent ? "accent-control" : ""}`}><div className="control-label"><span>{label}</span><strong>{valueLabel}</strong></div>{children}<div className="range-labels"><span>{minLabel}</span><span>{maxLabel}</span></div></div>;
}
