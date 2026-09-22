"use client";

import { useMemo, useState } from "react";
import { Droplets, Leaf, Recycle, Sigma, TrendingDown, Zap } from "lucide-react";
import { Slider } from "@/components/ui/slider";

type LabId = "plastic" | "water" | "energy" | "paper";

const labs: { id: LabId; title: string; icon: typeof Recycle }[] = [
  { id: "plastic", title: "Пластик", icon: Recycle },
  { id: "water", title: "Су", icon: Droplets },
  { id: "energy", title: "Энергия", icon: Zap },
  { id: "paper", title: "Қағаз", icon: Leaf },
];

const format = (value: number) => new Intl.NumberFormat("kk-KZ").format(Math.round(value));

export function LabCalculator() {
  const [active, setActive] = useState<LabId>("plastic");

  return (
    <div className="lab-wrapper">
      <div className="lab-tabs" role="tablist">
        {labs.map((lab) => {
          const Icon = lab.icon;
          return (
            <button key={lab.id} role="tab" aria-selected={active === lab.id} className={active === lab.id ? "active" : ""} onClick={() => setActive(lab.id)} type="button">
              <Icon size={16} /> {lab.title}
            </button>
          );
        })}
      </div>
      {active === "plastic" && <PlasticLab />}
      {active === "water" && <WaterLab />}
      {active === "energy" && <EnergyLab />}
      {active === "paper" && <PaperLab />}
    </div>
  );
}

function PlasticLab() {
  const [students, setStudents] = useState(500);
  const [bottles, setBottles] = useState(2);
  const [reduction, setReduction] = useState(40);

  const result = useMemo(() => {
    const total = students * bottles * 180;
    const saved = Math.round((total * reduction) / 100);
    return { total, saved, kilograms: saved * 0.02, co2: saved * 0.02 * 3.1 };
  }, [students, bottles, reduction]);

  return (
    <div className="lab-workspace">
      <div className="formula-panel glass-card">
        <div className="icon-bubble"><Sigma /></div>
        <span>Қолданылатын модель</span>
        <strong>N = n × b × 180</strong>
        <p>n — оқушы саны, b — күніне қолданылатын бөтелке саны.</p>
        <div className="formula-total"><span>Жалпы болжам</span><b>{format(result.total)} бөтелке</b></div>
        <div className="formula-total"><span>CO₂ үнемделуі</span><b>{format(result.co2)} кг</b></div>
      </div>
      <div className="calculator-card">
        <div className="calc-header"><div><span>ИНТЕРАКТИВТІ МОДЕЛЬ</span><h2>Пластик калькуляторы</h2></div><Recycle /></div>
        <RangeControl label="Оқушы саны" valueLabel={format(students)} minLabel="100" maxLabel="1 500">
          <Slider min={100} max={1500} step={50} value={[students]} onValueChange={(v) => setStudents(v[0])} aria-label="Оқушы саны" />
        </RangeControl>
        <RangeControl label="Бір оқушыға / күн" valueLabel={`${bottles} бөтелке`} minLabel="1" maxLabel="5">
          <Slider min={1} max={5} step={1} value={[bottles]} onValueChange={(v) => setBottles(v[0])} aria-label="Күндік бөтелке саны" />
        </RangeControl>
        <RangeControl label="Азайту мақсаты" valueLabel={`${reduction}%`} minLabel="10%" maxLabel="90%" accent>
          <Slider min={10} max={90} step={5} value={[reduction]} onValueChange={(v) => setReduction(v[0])} aria-label="Азайту мақсаты" />
        </RangeControl>
        <div className="result-panel" aria-live="polite">
          <div><span>БІР ОҚУ ЖЫЛЫНДАҒЫ НӘТИЖЕ</span><strong>{format(result.saved)} <small>бөтелке</small></strong><p>шамамен <b>{format(result.kilograms)} кг</b> пластик азаяды</p></div>
          <div className="result-icon"><TrendingDown /></div>
          <div className="result-bar"><i style={{ width: `${reduction}%` }} /></div>
        </div>
        <p className="disclaimer">* 180 оқу күні, бір бөтелке 20 г, 1 кг пластик ≈ 3,1 кг CO₂ деп алынды.</p>
      </div>
    </div>
  );
}

function WaterLab() {
  const [taps, setTaps] = useState(12);
  const [minutes, setMinutes] = useState(6);
  const [flow, setFlow] = useState(6);
  const [saving, setSaving] = useState(35);

  const result = useMemo(() => {
    const daily = taps * minutes * flow;
    const yearly = daily * 180;
    const saved = (yearly * saving) / 100;
    return { daily, yearly, saved, baths: saved / 150 };
  }, [flow, minutes, saving, taps]);

  return (
    <div className="lab-workspace">
      <div className="formula-panel glass-card">
        <div className="icon-bubble"><Sigma /></div>
        <span>Қолданылатын модель</span>
        <strong>V = k × t × q × 180</strong>
        <p>k — кран саны, t — тәуліктік ағу уақыты (мин), q — минуттық шығын (л).</p>
        <div className="formula-total"><span>Күндік шығын</span><b>{format(result.daily)} л</b></div>
        <div className="formula-total"><span>Жылдық шығын</span><b>{format(result.yearly)} л</b></div>
      </div>
      <div className="calculator-card">
        <div className="calc-header"><div><span>СУ РЕСУРСЫ</span><h2>Су үнемдеу калькуляторы</h2></div><Droplets /></div>
        <RangeControl label="Мектептегі кран саны" valueLabel={`${taps} кран`} minLabel="2" maxLabel="40">
          <Slider min={2} max={40} step={1} value={[taps]} onValueChange={(v) => setTaps(v[0])} aria-label="Кран саны" />
        </RangeControl>
        <RangeControl label="Тәулігіне ағу уақыты" valueLabel={`${minutes} мин`} minLabel="1" maxLabel="30">
          <Slider min={1} max={30} step={1} value={[minutes]} onValueChange={(v) => setMinutes(v[0])} aria-label="Ағу уақыты" />
        </RangeControl>
        <RangeControl label="Минуттық шығын" valueLabel={`${flow} л/мин`} minLabel="2" maxLabel="15">
          <Slider min={2} max={15} step={1} value={[flow]} onValueChange={(v) => setFlow(v[0])} aria-label="Минуттық шығын" />
        </RangeControl>
        <RangeControl label="Үнемдеу мақсаты" valueLabel={`${saving}%`} minLabel="5%" maxLabel="80%" accent>
          <Slider min={5} max={80} step={5} value={[saving]} onValueChange={(v) => setSaving(v[0])} aria-label="Үнемдеу мақсаты" />
        </RangeControl>
        <div className="result-panel" aria-live="polite">
          <div><span>ЖЫЛЫНА ҮНЕМДЕЛЕТІН СУ</span><strong>{format(result.saved)} <small>литр</small></strong><p>бұл шамамен <b>{format(result.baths)} ванна</b> суына тең</p></div>
          <div className="result-icon"><Droplets /></div>
          <div className="result-bar"><i style={{ width: `${saving}%` }} /></div>
        </div>
        <p className="disclaimer">* 180 оқу күні есебімен. Бір ванна ≈ 150 литр.</p>
      </div>
    </div>
  );
}

function EnergyLab() {
  const [lamps, setLamps] = useState(120);
  const [power, setPower] = useState(36);
  const [hours, setHours] = useState(7);
  const [ledPower, setLedPower] = useState(12);

  const result = useMemo(() => {
    const oldKwh = (lamps * power * hours * 180) / 1000;
    const newKwh = (lamps * ledPower * hours * 180) / 1000;
    const saved = oldKwh - newKwh;
    return { oldKwh, newKwh, saved, percent: Math.round((saved / Math.max(oldKwh, 1)) * 100), co2: saved * 0.35, tenge: saved * 25 };
  }, [hours, ledPower, lamps, power]);

  return (
    <div className="lab-workspace">
      <div className="formula-panel glass-card">
        <div className="icon-bubble"><Sigma /></div>
        <span>Қолданылатын модель</span>
        <strong>E = (N × P × t × 180) / 1000</strong>
        <p>N — шам саны, P — қуат (Вт), t — тәуліктік жұмыс уақыты (сағ).</p>
        <div className="formula-total"><span>Қазіргі шығын</span><b>{format(result.oldKwh)} кВт·сағ</b></div>
        <div className="formula-total"><span>LED-тен кейін</span><b>{format(result.newKwh)} кВт·сағ</b></div>
      </div>
      <div className="calculator-card">
        <div className="calc-header"><div><span>ЭНЕРГИЯ ТИІМДІЛІГІ</span><h2>Жарықтандыру калькуляторы</h2></div><Zap /></div>
        <RangeControl label="Шам саны" valueLabel={`${lamps} шам`} minLabel="20" maxLabel="400">
          <Slider min={20} max={400} step={10} value={[lamps]} onValueChange={(v) => setLamps(v[0])} aria-label="Шам саны" />
        </RangeControl>
        <RangeControl label="Ескі шам қуаты" valueLabel={`${power} Вт`} minLabel="18" maxLabel="100">
          <Slider min={18} max={100} step={2} value={[power]} onValueChange={(v) => setPower(v[0])} aria-label="Ескі шам қуаты" />
        </RangeControl>
        <RangeControl label="LED шам қуаты" valueLabel={`${ledPower} Вт`} minLabel="5" maxLabel="40">
          <Slider min={5} max={40} step={1} value={[ledPower]} onValueChange={(v) => setLedPower(v[0])} aria-label="LED қуаты" />
        </RangeControl>
        <RangeControl label="Тәуліктік жұмыс уақыты" valueLabel={`${hours} сағ`} minLabel="2" maxLabel="12" accent>
          <Slider min={2} max={12} step={1} value={[hours]} onValueChange={(v) => setHours(v[0])} aria-label="Жұмыс уақыты" />
        </RangeControl>
        <div className="result-panel" aria-live="polite">
          <div><span>ЖЫЛДЫҚ ҮНЕМ</span><strong>{format(result.saved)} <small>кВт·сағ</small></strong><p>≈ <b>{format(result.tenge)} ₸</b> және <b>{format(result.co2)} кг</b> CO₂</p></div>
          <div className="result-icon"><Zap /></div>
          <div className="result-bar"><i style={{ width: `${Math.max(result.percent, 3)}%` }} /></div>
        </div>
        <p className="disclaimer">* 1 кВт·сағ ≈ 25 ₸ және 0,35 кг CO₂ деп алынды. Үнем — {result.percent}%.</p>
      </div>
    </div>
  );
}

function PaperLab() {
  const [classes, setClasses] = useState(24);
  const [sheets, setSheets] = useState(40);
  const [duplex, setDuplex] = useState(50);

  const result = useMemo(() => {
    const yearly = classes * sheets * 36;
    const saved = (yearly * duplex) / 100 / 2;
    return { yearly, saved, kg: saved * 0.005, trees: (saved * 0.005) / 16.6 };
  }, [classes, duplex, sheets]);

  return (
    <div className="lab-workspace">
      <div className="formula-panel glass-card">
        <div className="icon-bubble"><Sigma /></div>
        <span>Қолданылатын модель</span>
        <strong>S = c × s × 36</strong>
        <p>c — сынып саны, s — аптасына жұмсалатын парақ саны, 36 — оқу аптасы.</p>
        <div className="formula-total"><span>Жылдық шығын</span><b>{format(result.yearly)} парақ</b></div>
        <div className="formula-total"><span>Салмағы</span><b>{format(result.yearly * 0.005)} кг</b></div>
      </div>
      <div className="calculator-card">
        <div className="calc-header"><div><span>ҚАҒАЗ ҮНЕМДЕУ</span><h2>Қағаз калькуляторы</h2></div><Leaf /></div>
        <RangeControl label="Сынып саны" valueLabel={`${classes} сынып`} minLabel="4" maxLabel="60">
          <Slider min={4} max={60} step={1} value={[classes]} onValueChange={(v) => setClasses(v[0])} aria-label="Сынып саны" />
        </RangeControl>
        <RangeControl label="Аптасына парақ" valueLabel={`${sheets} парақ`} minLabel="10" maxLabel="200">
          <Slider min={10} max={200} step={5} value={[sheets]} onValueChange={(v) => setSheets(v[0])} aria-label="Аптасына парақ" />
        </RangeControl>
        <RangeControl label="Екі жағына басу үлесі" valueLabel={`${duplex}%`} minLabel="0%" maxLabel="100%" accent>
          <Slider min={0} max={100} step={5} value={[duplex]} onValueChange={(v) => setDuplex(v[0])} aria-label="Дуплекс үлесі" />
        </RangeControl>
        <div className="result-panel" aria-live="polite">
          <div><span>ЖЫЛЫНА ҮНЕМДЕЛЕТІН ҚАҒАЗ</span><strong>{format(result.saved)} <small>парақ</small></strong><p>≈ <b>{format(result.kg)} кг</b> немесе <b>{result.trees.toFixed(1)}</b> ағаш</p></div>
          <div className="result-icon"><Leaf /></div>
          <div className="result-bar"><i style={{ width: `${duplex}%` }} /></div>
        </div>
        <p className="disclaimer">* Бір парақ ≈ 5 г, бір ағаштан ≈ 16,6 кг қағаз алынады.</p>
      </div>
    </div>
  );
}

function RangeControl({
  label,
  valueLabel,
  minLabel,
  maxLabel,
  accent,
  children,
}: {
  label: string;
  valueLabel: string;
  minLabel: string;
  maxLabel: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`control-group ${accent ? "accent-control" : ""}`}>
      <div className="control-label"><span>{label}</span><strong>{valueLabel}</strong></div>
      {children}
      <div className="range-labels"><span>{minLabel}</span><span>{maxLabel}</span></div>
    </div>
  );
}
