import { AuthPanel } from "@/components/auth-panel";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-shell page-shell">
        <div className="auth-intro">
          <span className="eyebrow">EcoMath · жеке кеңістік</span>
          <h1>Зерттеуді <span>жалғастыр.</span></h1>
          <p>Өз есептеріңізге қайта оралып, экологияны сандар арқылы зерттеуді жалғастырыңыз.</p>
        </div>
        <AuthPanel />
      </section>
    </main>
  );
}
