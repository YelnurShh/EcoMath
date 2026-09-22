import { FlaskConical } from "lucide-react";
import { LabCalculator } from "@/components/lab-calculator";

export default function LabPage() {
  return <main className="inner-page lab-page"><section className="page-intro page-shell"><div className="eyebrow"><FlaskConical size={15}/> Интерактивті зертхана</div><h1>Бір өзгерістің <span>үлкен әсерін</span> есепте</h1><p>Көрсеткіштерді өзгертіп, мектеп бір оқу жылында қанша пластикті азайта алатынын бірден көр.</p></section><section className="page-shell"><LabCalculator /></section></main>;
}
