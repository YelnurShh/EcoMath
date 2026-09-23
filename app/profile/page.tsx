"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { LoadingLottie } from "@/components/loading-lottie";
import { StudentProfile } from "@/components/student-profile";
import { TeacherProfile } from "@/components/teacher-profile";

export default function ProfilePage() {
  const { user, loading, profile, profileError } = useAuth();

  if (loading || (user && !profile && !profileError)) {
    return (
      <main className="profile-page">
        <div className="profile-loading page-shell">
          <LoadingLottie width={150} height={150} />
          <p>Жеке кеңістік жүктелуде...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="profile-page">
        <section className="profile-empty page-shell">
          <Sparkles size={32} />
          <h1>Профильге кіру керек</h1>
          <p>Жеке нәтижелеріңізді көру үшін алдымен аккаунтыңызға кіріңіз.</p>
          <Link href="/login" className="gradient-button">Кіру / Тіркелу <ArrowRight size={17} /></Link>
        </section>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="profile-page">
        <section className="profile-empty page-shell">
          <Sparkles size={32} />
          <h1>Профиль жүктелмеді</h1>
          <p>{profileError || "Интернет байланысы мен Firestore ережелерін тексеріп, бетті жаңартыңыз."}</p>
        </section>
      </main>
    );
  }

  return (
    <main className={profile.role === "teacher" ? "teacher-profile-page" : "profile-page"}>
      {profile.role === "teacher" ? (
        <TeacherProfile user={user} profile={profile} />
      ) : (
        <StudentProfile user={user} profile={profile} />
      )}
    </main>
  );
}
