import { ClipboardList } from "lucide-react";
import { StudentAssignments } from "@/components/student-assignments";

export default function AssignmentsPage() {
  return (
    <main className="inner-page assignments-page">
      <section className="page-shell">
        <div className="page-intro compact-intro">
          <span className="eyebrow"><ClipboardList size={16} /> ТАПСЫРМАЛАР</span>
          <h1>Мұғалім берген <span>жұмыстар</span></h1>
          <p>Тапсырманы орындап, жауабыңызды жіберіңіз. Мұғалім бағалап, жеке пікір жазады.</p>
        </div>
        <StudentAssignments />
      </section>
    </main>
  );
}
