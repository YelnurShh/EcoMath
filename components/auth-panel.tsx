"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, GraduationCap, Leaf, LogOut, Mail, School } from "lucide-react";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { LoadingLottie } from "@/components/loading-lottie";
import type { UserRole } from "@/lib/user-profile";

function getAuthMessage(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "Бір нәрсе дұрыс болмады. Қайта байқап көріңіз.";
  }

  switch (error.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email немесе құпиясөз қате.";
    case "auth/email-already-in-use":
      return "Бұл email бұрын тіркелген. Кіру режимін таңдаңыз.";
    case "auth/weak-password":
      return "Құпиясөз кемінде 6 таңбадан тұруы керек.";
    case "auth/popup-closed-by-user":
      return "Google терезесі жабылды.";
    case "auth/popup-blocked":
      return "Браузер popup терезесін бұғаттады. Қайта байқап көріңіз.";
    default:
      return "Авторизация кезінде қате пайда болды. Қайта байқап көріңіз.";
  }
}

export function AuthPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/profile");
  }, [router, user]);

  if (loading) {
    return <div className="auth-state"><LoadingLottie width={130} height={130} /><span>Жүктелуде...</span></div>;
  }

  if (user) {
    return (
      <div className="auth-state auth-signed-in">
        <span className="auth-avatar">{(user.displayName ?? user.email ?? "E").charAt(0).toUpperCase()}</span>
        <div>
          <strong>{user.displayName ?? "EcoMath қолданушысы"}</strong>
          <span>{user.email}</span>
        </div>
        <button className="soft-button auth-signout" onClick={() => signOut(getFirebaseAuth()!)} type="button">
          <LogOut size={16} /> Шығу
        </button>
      </div>
    );
  }

  if (!isFirebaseConfigured()) {
    return (
      <div className="auth-state auth-config-warning">
        <Leaf size={28} />
        <strong>Firebase кілттері әлі қосылмаған</strong>
        <p>`.env.local` файлына Firebase Console-дан алынған мәндерді енгізіңіз.</p>
      </div>
    );
  }

  async function handleGoogleSignIn() {
    setError("");
    setBusy(true);
    try {
      if (isSignUp) window.localStorage.setItem("ecoMathPendingRole", role);
      const result = await signInWithPopup(getFirebaseAuth()!, googleProvider);
      if (isSignUp && result.operationType === "signIn" && result.user) {
        window.localStorage.setItem("ecoMathPendingRole", role);
      }
      router.replace("/profile");
    } catch (authError) {
      setError(getAuthMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const auth = getFirebaseAuth()!;
      if (isSignUp) {
        window.localStorage.setItem("ecoMathPendingRole", role);
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.replace("/profile");
    } catch (authError) {
      setError(getAuthMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-heading">
        <span className="auth-icon"><Leaf size={22} /></span>
        <div>
          <span className="section-kicker">EcoMath қауымдастығы</span>
          <h2>{isSignUp ? "Аккаунт ашу" : "Қайта қош келдіңіз"}</h2>
        </div>
      </div>
      <p className="auth-description">Зертханадағы нәтижелеріңізді сақтап, оқу барысын жалғастырыңыз.</p>
      {isSignUp && <div className="role-picker"><span>Сіз кімсіз?</span><div><button className={role === "student" ? "active" : ""} onClick={() => setRole("student")} type="button"><GraduationCap /><span><strong>Оқушы</strong><small>Викторина өту және оқу</small></span></button><button className={role === "teacher" ? "active" : ""} onClick={() => setRole("teacher")} type="button"><School /><span><strong>Мұғалім</strong><small>Оқушыларды басқару</small></span></button></div></div>}
      <button className="google-button" onClick={handleGoogleSignIn} disabled={busy} type="button">
        <span className="google-mark">G</span> Google арқылы жалғастыру
      </button>
      <div className="auth-divider"><span>немесе email арқылы</span></div>
      <form className="auth-form" onSubmit={handleEmailSubmit}>
        <label htmlFor="email">Email</label>
        <div className="auth-input-wrap"><Mail size={17} /><input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" required /></div>
        <label htmlFor="password">Құпиясөз</label>
        <div className="auth-input-wrap"><input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Кемінде 6 таңба" minLength={6} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Құпиясөзді жасыру" : "Құпиясөзді көрсету"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="gradient-button auth-submit" disabled={busy} type="submit">{busy ? "Күтіңіз..." : isSignUp ? "Аккаунт ашу" : "Кіру"}<ArrowRight size={17} /></button>
      </form>
      <button className="auth-switch" onClick={() => { setIsSignUp((value) => !value); setRole("student"); setError(""); }} type="button">{isSignUp ? "Аккаунтыңыз бар ма? Кіру" : "Жаңа аккаунт ашу"}</button>
    </div>
  );
}
