"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

/** Аккаунт өшірілгеннен кейін басты бетте көрсетілетін растау хабарламасы. */
export function DeletedNotice() {
  // Бастапқы күйді рендер кезінде емес, инициализатор ішінде анықтаймыз.
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("deleted") === "1";
  });

  useEffect(() => {
    if (!visible) return;
    // URL-ді тазалаймыз, бет жаңартылғанда хабарлама қайта шықпауы үшін.
    window.history.replaceState({}, "", window.location.pathname);
    const timer = window.setTimeout(() => setVisible(false), 9000);
    return () => window.clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="deleted-notice" role="status">
      <CheckCircle2 />
      <div>
        <strong>Аккаунт өшірілді</strong>
        <p>Барлық деректеріңіз Firestore-дан біржола жойылды. EcoMath-ты пайдаланғаныңыз үшін рақмет!</p>
      </div>
      <button onClick={() => setVisible(false)} type="button" aria-label="Жабу"><X size={16} /></button>
    </div>
  );
}
