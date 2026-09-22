"use client";

import { ArrowRight, BookOpenCheck, LayoutDashboard, MessageCircleMore, Users } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { FeedbackCenter } from "@/components/feedback-center";
import { useAuth } from "@/components/auth-provider";
import { LoadingLottie } from "@/components/loading-lottie";

export default function TeacherDashboardPage() {
  const { user, loading, profile } = useAuth();

  useEffect(() => {
    if (!loading && (!user || profile?.role !== "teacher")) {
      window.location.replace(user ? "/profile" : "/login");
    }
  }, [loading, profile, user]);

  if (loading || !user || !profile || profile.role !== "teacher") {
    return <main className="teacher-dashboard-page"><div className="teacher-loading page-shell"><LoadingLottie width={150} height={150} /><p>Мұғалім панелі жүктелуде...</p></div></main>;
  }

  return (
    <main className="teacher-dashboard-page">
      <section className="teacher-dashboard page-shell">
        <header className="teacher-dashboard-hero">
          <div><span className="section-kicker"><LayoutDashboard size={15} /> МҰҒАЛІМ ПАНЕЛІ</span><h1>Оқушыларыңызға бағыт беріңіз.</h1><p>Сұрақтарды қарап, әр оқушыға түсінікті кері байланыс беріңіз.</p></div>
          <Link href="/profile" className="soft-button"><ArrowRight size={16} /> Профильге қайту</Link>
        </header>
        <div className="teacher-dashboard-metrics"><article><span><Users /></span><div><strong>EcoMath</strong><small>оқу қауымдастығы</small></div></article><article><span><MessageCircleMore /></span><div><strong>Сұрақтар</strong><small>оқушылармен байланыс</small></div></article><article><span><BookOpenCheck /></span><div><strong>Жеке қолдау</strong><small>әр жауап маңызды</small></div></article></div>
        <section className="teacher-inbox"><div className="teacher-inbox-heading"><div><span className="section-kicker">БАСҚАРУ ОРТАЛЫҒЫ</span><h2>Оқушылардың сұрақтары</h2></div><span>Жауап беруге дайын</span></div><FeedbackCenter /></section>
      </section>
    </main>
  );
}
