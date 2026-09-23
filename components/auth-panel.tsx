"use client";

import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookMarked,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Leaf,
  LogOut,
  Mail,
  School,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { getFirebaseAuth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { LoadingLottie } from "@/components/loading-lottie";
import { isValidTeacherCode, storePendingSignup, type UserRole } from "@/lib/user-profile";

function getAuthMessage(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "Бір нәрсе дұрыс болмады. Қайта байқап көріңіз.";
  }

  switch ((error as { code: string }).code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email немесе құпиясөз қате.";
    case "auth/invalid-email":
      return "Email мекенжайы дұрыс жазылмаған.";
    case "auth/email-already-in-use":
      return "Бұл email бұрын тіркелген. «Кіру» режимін таңдаңыз.";
    case "auth/weak-password":
      return "Құпиясөз кемінде 6 таңбадан тұруы керек.";
    case "auth/too-many-requests":
      return "Тым көп әрекет жасалды. Біраз уақыттан кейін қайталаңыз.";
    case "auth/network-request-failed":
      return "Интернет байланысы жоқ сияқты. Байланысты тексеріңіз.";
    case "auth/popup-closed-by-user":
      return "Google терезесі жабылды.";
    case "auth/popup-blocked":
      return "Браузер popup терезесін бұғаттады. Браузер баптауын тексеріңіз.";
    case "auth/operation-not-allowed":
      return "Бұл кіру әдісі Firebase Console-да қосылмаған.";
    default:
      return "Авторизация кезінде қате пайда болды. Қайта байқап көріңіз.";
  }
}

function passwordScore(value: string) {
  let score = 0;
  if (value.length >= 6) score += 1;
  if (value.length >= 10) score += 1;
  if (/[A-ZА-ЯӘҒҚҢӨҰҮҺІ]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^\w\s]/.test(value)) score += 1;
  return Math.min(score, 4);
}

export function AuthPanel() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [role, setRole] = useState<UserRole>("student");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [school, setSchool] = useState("");
  const [subject, setSubject] = useState("");
  const [teacherCode, setTeacherCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) router.replace("/profile");
  }, [router, user]);

  const strength = useMemo(() => passwordScore(password), [password]);
  const strengthLabel = ["Тым әлсіз", "Әлсіз", "Орташа", "Жақсы", "Мықты"][strength];

  if (loading) {
    return (
      <div className="auth-state">
        <LoadingLottie width={130} height={130} />
        <span>Жүктелуде...</span>
      </div>
    );
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
        <p>
          Жоба түбіріндегі <code>.env.local</code> файлына Firebase Console-дан алынған
          <code>NEXT_PUBLIC_FIREBASE_*</code> мәндерін енгізіп, серверді қайта іске қосыңыз.
        </p>
      </div>
    );
  }

  function validateSignUp(): string {
    if (fullName.trim().length < 2) return "Аты-жөніңізді толық жазыңыз.";
    if (password.length < 6) return "Құпиясөз кемінде 6 таңбадан тұруы керек.";
    if (password !== confirm) return "Құпиясөздер сәйкес келмейді.";
    if (role === "teacher" && subject.trim().length === 0) return "Оқытатын пәніңізді жазыңыз.";
    if (role === "teacher" && !isValidTeacherCode(teacherCode)) {
      return "Мұғалім шақыру коды қате. Кодты мектеп әкімшісінен алыңыз.";
    }
    if (role === "student" && className.trim().length === 0) return "Сынып нөмірін жазыңыз (мысалы: 9Ә).";
    return "";
  }

  async function handleGoogleSignIn() {
    setError("");
    setNotice("");

    if (isSignUp) {
      const problem = role === "teacher" && !isValidTeacherCode(teacherCode)
        ? "Мұғалім шақыру коды қате. Кодты мектеп әкімшісінен алыңыз."
        : role === "student" && className.trim().length === 0
          ? "Сынып нөмірін жазыңыз (мысалы: 9Ә)."
          : "";
      if (problem) {
        setError(problem);
        return;
      }
      storePendingSignup({
        role,
        className: className.trim(),
        school: school.trim(),
        subject: subject.trim(),
        teacherCode: teacherCode.trim(),
        displayName: fullName.trim() || undefined,
      });
    }

    setBusy(true);
    try {
      await signInWithPopup(getFirebaseAuth()!, googleProvider);
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
    setNotice("");

    if (isSignUp) {
      const problem = validateSignUp();
      if (problem) {
        setError(problem);
        return;
      }
    }

    setBusy(true);
    try {
      const auth = getFirebaseAuth()!;
      if (isSignUp) {
        storePendingSignup({
          role,
          className: className.trim(),
          school: school.trim(),
          subject: subject.trim(),
          teacherCode: teacherCode.trim(),
          displayName: fullName.trim(),
        });
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (fullName.trim()) {
          await updateProfile(credential.user, { displayName: fullName.trim() }).catch(() => undefined);
        }
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      router.replace("/profile");
    } catch (authError) {
      setError(getAuthMessage(authError));
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    setError("");
    setNotice("");
    if (!email.trim()) {
      setError("Алдымен email мекенжайыңызды жазыңыз.");
      return;
    }
    setBusy(true);
    try {
      await sendPasswordResetEmail(getFirebaseAuth()!, email.trim());
      setNotice("Құпиясөзді қалпына келтіру сілтемесі поштаңызға жіберілді.");
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
      <p className="auth-description">
        {isSignUp
          ? "Аккаунт ашып, тапсырмаларды орындаңыз, нәтижеңізді сақтаңыз және мұғаліммен байланысыңыз."
          : "Зертханадағы нәтижелеріңізге оралып, оқу барысын жалғастырыңыз."}
      </p>

      {isSignUp && (
        <div className="role-picker">
          <span>Сіз кімсіз?</span>
          <div>
            <button className={role === "student" ? "active" : ""} onClick={() => { setRole("student"); setError(""); }} type="button">
              <GraduationCap />
              <span><strong>Оқушы</strong><small>Тапсырма, викторина, кері байланыс</small></span>
            </button>
            <button className={role === "teacher" ? "active" : ""} onClick={() => { setRole("teacher"); setError(""); }} type="button">
              <School />
              <span><strong>Мұғалім</strong><small>Шақыру коды қажет</small></span>
            </button>
          </div>
        </div>
      )}

      <button className="google-button" onClick={handleGoogleSignIn} disabled={busy} type="button">
        <span className="google-mark">G</span> Google арқылы жалғастыру
      </button>
      <div className="auth-divider"><span>немесе email арқылы</span></div>

      <form className="auth-form" onSubmit={handleEmailSubmit}>
        {isSignUp && (
          <>
            <label htmlFor="fullName">Аты-жөні</label>
            <div className="auth-input-wrap">
              <UserRound size={17} />
              <input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Айгерім Серікқызы" maxLength={60} required />
            </div>

            <div className="auth-row">
              <div>
                <label htmlFor="className">{role === "teacher" ? "Жетекші сынып (қаласаңыз)" : "Сынып"}</label>
                <div className="auth-input-wrap">
                  <GraduationCap size={17} />
                  <input id="className" value={className} onChange={(event) => setClassName(event.target.value)} placeholder="9Ә" maxLength={20} required={role === "student"} />
                </div>
              </div>
              <div>
                <label htmlFor="school">Мектеп</label>
                <div className="auth-input-wrap">
                  <School size={17} />
                  <input id="school" value={school} onChange={(event) => setSchool(event.target.value)} placeholder="№12 мектеп-лицей" maxLength={80} />
                </div>
              </div>
            </div>

            {role === "teacher" && (
              <>
                <label htmlFor="subject">Оқытатын пән</label>
                <div className="auth-input-wrap">
                  <BookMarked size={17} />
                  <input id="subject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Математика" maxLength={60} required />
                </div>

                <label htmlFor="teacherCode">Мұғалім шақыру коды</label>
                <div className="auth-input-wrap">
                  <ShieldCheck size={17} />
                  <input id="teacherCode" value={teacherCode} onChange={(event) => setTeacherCode(event.target.value)} placeholder="ECOMATH-TEACHER-…" autoComplete="off" required />
                </div>
                <p className="auth-hint"><KeyRound size={14} /> Код мектеп әкімшісінде сақталады. Кодсыз аккаунт оқушы ретінде ашылады.</p>
              </>
            )}
          </>
        )}

        <label htmlFor="email">Email</label>
        <div className="auth-input-wrap">
          <Mail size={17} />
          <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
        </div>

        <label htmlFor="password">Құпиясөз</label>
        <div className="auth-input-wrap">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Кемінде 6 таңба"
            minLength={6}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
          />
          <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Құпиясөзді жасыру" : "Құпиясөзді көрсету"}>
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {isSignUp && password.length > 0 && (
          <div className={`password-strength level-${strength}`}>
            <i /><i /><i /><i />
            <span>{strengthLabel}</span>
          </div>
        )}

        {isSignUp && (
          <>
            <label htmlFor="confirm">Құпиясөзді қайталаңыз</label>
            <div className="auth-input-wrap">
              <input id="confirm" type={showPassword ? "text" : "password"} value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Құпиясөзді қайталаңыз" minLength={6} autoComplete="new-password" required />
            </div>
          </>
        )}

        {error && <p className="auth-error" role="alert">{error}</p>}
        {notice && <p className="auth-notice" role="status">{notice}</p>}

        <button className="gradient-button auth-submit" disabled={busy} type="submit">
          {busy ? "Күтіңіз..." : isSignUp ? "Аккаунт ашу" : "Кіру"} <ArrowRight size={17} />
        </button>
      </form>

      <div className="auth-footer-actions">
        <button
          className="auth-switch"
          onClick={() => {
            setIsSignUp((value) => !value);
            setRole("student");
            setError("");
            setNotice("");
          }}
          type="button"
        >
          {isSignUp ? "Аккаунтыңыз бар ма? Кіру" : "Жаңа аккаунт ашу"}
        </button>
        {!isSignUp && (
          <button className="auth-link" onClick={handleReset} type="button" disabled={busy}>
            Құпиясөзді ұмыттыңыз ба?
          </button>
        )}
      </div>
    </div>
  );
}
