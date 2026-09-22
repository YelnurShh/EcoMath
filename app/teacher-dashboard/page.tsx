"use client";

import { ArrowRight, LayoutDashboard, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { LoadingLottie } from "@/components/loading-lottie";
import { TeacherDashboard } from "@/components/teacher-dashboard";

export default function TeacherDashboardPage() {
  const { user, loading, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [loading, router, user]);

  if (loading || (user && !profile)) {
    return (
      <main className="teacher-dashboard-page">
        <div className="teacher-loading page-shell">
          <LoadingLottie width={150} height={150} />
          <p>Мұғалім панелі жүктелуде...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  if (profile?.role !== "teacher") {
    return (
      <main className="teacher-dashboard-page">
        <section className="page-shell">
          <div className="teacher-denied glass-card">
            <ShieldAlert />
            <h1>Бұл бет тек мұғалімдерге арналған</h1>
            <p>Сіздің аккаунтыңыз оқушы ретінде тіркелген. Мұғалім рөлін алу үшін мектеп әкімшісінен шақыру кодын сұраңыз.</p>
            <Link href="/profile" className="gradient-button">Профильге қайту <ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="teacher-dashboard-page">
      <section className="teacher-dashboard page-shell">
        <header className="teacher-dashboard-hero">
          <div>
            <span className="section-kicker"><LayoutDashboard size={15} /> МҰҒАЛІМ ПАНЕЛІ</span>
            <h1>Сәлем, {profile.displayName.split(" ")[0]}!</h1>
            <p>Оқушылардың үлгерімін бақылаңыз, тапсырма беріңіз, жұмыстарды бағалап кері байланыс жазыңыз.</p>
          </div>
          <Link href="/profile" className="soft-button">Профиль <ArrowRight size={16} /></Link>
        </header>
        <TeacherDashboard profile={profile} />
      </section>
    </main>
  );
}
