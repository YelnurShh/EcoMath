"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { AlertTriangle, Loader2, ShieldAlert, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/google-icon";
import {
  deleteAccount,
  getDeleteErrorMessage,
  getPrimaryProvider,
  reauthenticate,
  type DeletionProgress,
} from "@/lib/delete-account";
import type { UserRole } from "@/lib/user-profile";

const CONFIRM_WORD = "ӨШІРУ";

export function DeleteAccountDialog({
  user,
  role,
  displayName,
}: {
  user: User;
  role: UserRole;
  displayName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<"warn" | "confirm">("warn");
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<DeletionProgress | null>(null);

  const provider = getPrimaryProvider(user);
  const isTeacher = role === "teacher";

  function close() {
    if (busy) return;
    setOpen(false);
    setStage("warn");
    setConfirmText("");
    setPassword("");
    setError("");
    setProgress(null);
  }

  async function handleDelete() {
    if (confirmText.trim().toUpperCase() !== CONFIRM_WORD) {
      setError(`Растау үшін «${CONFIRM_WORD}» деп жазыңыз.`);
      return;
    }
    if (provider === "password" && password.length < 6) {
      setError("Құпиясөзіңізді енгізіңіз.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      // 1. Жеке басты растау
      setProgress({ step: "Жеке басыңыз расталуда...", done: 0, total: 1 });
      await reauthenticate(user, provider === "password" ? { type: "password", password } : { type: "google" });

      // 2. Барлық деректі және аккаунтты өшіру
      await deleteAccount(user, role, setProgress);

      // 3. Басты бетке қайту. Auth күйі толық тазаруы үшін бетті қайта жүктейміз.
      router.replace("/?deleted=1");
      router.refresh();
    } catch (deleteError) {
      console.error(deleteError);
      setError(getDeleteErrorMessage(deleteError));
      setBusy(false);
      setProgress(null);
    }
  }

  if (!open) {
    return (
      <button className="danger-zone-button" onClick={() => setOpen(true)} type="button">
        <Trash2 size={16} /> Аккаунтты өшіру
      </button>
    );
  }

  return (
    <div className="delete-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-title">
      <div className="delete-modal">
        <button className="delete-close" onClick={close} disabled={busy} type="button" aria-label="Жабу"><X size={18} /></button>

        {stage === "warn" ? (
          <>
            <span className="delete-icon"><AlertTriangle /></span>
            <h2 id="delete-title">Аккаунтты өшіресіз бе?</h2>
            <p className="delete-lead">
              <strong>{displayName}</strong> аккаунты мен оған байланысты барлық дерек Firestore-дан
              <strong> біржола</strong> жойылады. Бұл әрекетті кері қайтару мүмкін емес.
            </p>

            <div className="delete-list">
              <span>Не өшіріледі:</span>
              <ul>
                <li>Профиль деректері (аты, сынып, мектеп, XP, деңгей, төсбелгілер)</li>
                <li>Барлық викторина нәтижелері мен статистика</li>
                {isTeacher ? (
                  <>
                    <li>Сіз жариялаған <strong>барлық тапсырма</strong></li>
                    <li>Сол тапсырмаларға оқушылар жіберген жұмыстар мен бағалар</li>
                    <li>Кері байланыс чаттарындағы сіздің хабарламаларыңыз</li>
                  </>
                ) : (
                  <>
                    <li>Тапсырмаларға жіберген жұмыстарыңыз және алған бағаларыңыз</li>
                    <li>Мұғаліммен жазысқан барлық кері байланыс тарихы</li>
                  </>
                )}
                <li>Кіру аккаунты (бұдан кейін бұл email-мен кіре алмайсыз)</li>
              </ul>
            </div>

            {isTeacher && (
              <p className="delete-teacher-warn">
                <ShieldAlert size={15} />
                Сіз мұғалімсіз: тапсырмаларыңыз өшірілсе, оқушылар оларды және өз бағаларын көре алмайды.
              </p>
            )}

            <div className="delete-actions">
              <Button variant="ghost" onClick={close}>Болдырмау</Button>
              <button className="danger-button" onClick={() => setStage("confirm")} type="button">
                <Trash2 size={16} /> Иә, жалғастыру
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="delete-icon"><Trash2 /></span>
            <h2 id="delete-title">Соңғы растау</h2>
            <p className="delete-lead">Қауіпсіздік үшін төмендегі өрістерді толтырыңыз.</p>

            <label className="delete-field">
              <span>Растау үшін «{CONFIRM_WORD}» деп жазыңыз</span>
              <input
                value={confirmText}
                onChange={(event) => setConfirmText(event.target.value)}
                placeholder={CONFIRM_WORD}
                disabled={busy}
                autoComplete="off"
              />
            </label>

            {provider === "password" && (
              <label className="delete-field">
                <span>Құпиясөзіңіз</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••"
                  disabled={busy}
                  autoComplete="current-password"
                />
              </label>
            )}

            {provider === "google" && (
              <p className="delete-google-note">
                <GoogleIcon size={16} /> Жалғастырғанда Google терезесі ашылып, жеке басыңызды растайсыз.
              </p>
            )}

            {progress && (
              <div className="delete-progress" role="status">
                <Loader2 className="spin" size={16} />
                <div>
                  <strong>{progress.step}</strong>
                  {progress.total > 1 && <i style={{ width: `${(progress.done / progress.total) * 100}%` }} />}
                </div>
              </div>
            )}

            {error && <p className="auth-error" role="alert">{error}</p>}

            <div className="delete-actions">
              <Button variant="ghost" onClick={() => setStage("warn")} disabled={busy}>Артқа</Button>
              <button
                className="danger-button"
                onClick={handleDelete}
                disabled={busy || confirmText.trim().toUpperCase() !== CONFIRM_WORD}
                type="button"
              >
                {busy ? <><Loader2 className="spin" size={16} /> Өшірілуде...</> : <><Trash2 size={16} /> Біржола өшіру</>}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
