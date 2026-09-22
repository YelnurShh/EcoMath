"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Loader2, MessageCircle, Plus, Send, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth-provider";
import { createFeedbackThread, sendFeedbackMessage, setFeedbackStatus, subscribeToMessages, subscribeToThreads, type FeedbackMessage, type FeedbackThread } from "@/lib/feedback";
import { ensureUserProfile, type UserProfile } from "@/lib/user-profile";

const statusLabels = { open: "Жауап күтілуде", answered: "Жауап берілді", closed: "Аяқталды" } as const;

export function FeedbackCenter() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [threads, setThreads] = useState<FeedbackThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Зертхана");
  const [newText, setNewText] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return; }
    ensureUserProfile(user).then(setProfile).catch(() => { setError("Профильді жүктеу мүмкін болмады."); setLoading(false); });
  }, [user]);

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    return subscribeToThreads(profile, (items) => {
      setThreads(items);
      setSelectedId((current) => current && items.some((item) => item.id === current) ? current : items[0]?.id ?? null);
      setLoading(false);
    }, () => { setError("Хабарламаларды жүктеу мүмкін болмады. Firestore баптауын тексеріңіз."); setLoading(false); });
  }, [profile]);

  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    return subscribeToMessages(selectedId, setMessages, () => setError("Хаттарды жүктеу мүмкін болмады."));
  }, [selectedId]);

  const selected = useMemo(() => threads.find((item) => item.id === selectedId) ?? null, [selectedId, threads]);

  if (authLoading || loading) return <div className="feedback-loading"><Loader2 className="spin" /><span>Кері байланыс жүктелуде...</span></div>;
  if (!user) return <div className="feedback-gate glass-card"><MessageCircle /><h2>Мұғаліммен байланысу үшін кіріңіз</h2><p>Сұрағыңыз бен жобаңызды жеке кабинет арқылы қауіпсіз жіберуге болады.</p><Link href="/login" className="gradient-button">Кіру / Тіркелу</Link></div>;
  if (!profile) return <div className="feedback-gate glass-card"><p>{error || "Профиль табылмады."}</p></div>;

  async function createThread(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !subject.trim() || !newText.trim()) return;
    setBusy(true); setError("");
    try {
      const id = await createFeedbackThread(profile, subject, category, newText);
      setSelectedId(id); setSubject(""); setNewText(""); setShowNew(false);
    } catch { setError("Сұрақ жіберілмеді. Қайта байқап көріңіз."); }
    finally { setBusy(false); }
  }

  async function sendReply(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !selectedId || !reply.trim()) return;
    setBusy(true); setError("");
    try { await sendFeedbackMessage(selectedId, profile, reply); setReply(""); }
    catch { setError("Хабарлама жіберілмеді. Қайта байқап көріңіз."); }
    finally { setBusy(false); }
  }

  return (
    <div className="feedback-app">
      <aside className="feedback-sidebar">
        <div className="feedback-sidebar-head">
          <div><span className="role-chip"><UserRoundCheck /> {profile.role === "teacher" ? "Мұғалім" : "Оқушы"}</span><h2>{profile.role === "teacher" ? "Оқушылар сұрақтары" : "Менің сұрақтарым"}</h2></div>
          {profile.role === "student" && <button className="new-thread-button" onClick={() => setShowNew((value) => !value)} aria-label="Жаңа сұрақ"><Plus /></button>}
        </div>
        {showNew && profile.role === "student" && <form className="new-thread-form" onSubmit={createThread}>
          <Input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Сұрақ тақырыбы" maxLength={80} required />
          <Select value={category} onValueChange={(value) => value && setCategory(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Зертхана">Зертхана</SelectItem><SelectItem value="Жоба">Жоба</SelectItem><SelectItem value="Математика">Математика</SelectItem><SelectItem value="Викторина">Викторина</SelectItem><SelectItem value="Жалпы">Жалпы</SelectItem></SelectContent></Select>
          <Textarea value={newText} onChange={(event) => setNewText(event.target.value)} placeholder="Нені түсінбей қалдыңыз?" maxLength={1000} required />
          <Button type="submit" disabled={busy} className="gradient-button">{busy ? <Loader2 className="spin" /> : <Send />} Жіберу</Button>
        </form>}
        <div className="thread-list">
          {threads.length === 0 && <div className="thread-empty"><MessageCircle /><p>{profile.role === "teacher" ? "Әзірге оқушылардан сұрақ жоқ." : "Әзірге сұрақ жоқ. Мұғалімге бірінші хатыңызды жіберіңіз."}</p></div>}
          {threads.map((thread) => <button key={thread.id} className={`thread-item ${selectedId === thread.id ? "active" : ""}`} onClick={() => setSelectedId(thread.id)}>
            <span className={`status-dot ${thread.status}`} /><span className="thread-copy"><strong>{thread.subject}</strong>{profile.role === "teacher" && <small>{thread.studentName}</small>}<small>{thread.lastMessage}</small></span><ChevronRight />
          </button>)}
        </div>
      </aside>

      <section className="conversation-panel">
        {!selected ? <div className="conversation-empty"><MessageCircle /><h3>Сұрақты таңдаңыз</h3><p>Хабарламалар осы жерде көрсетіледі.</p></div> : <>
          <header className="conversation-head"><div><span>{selected.category}</span><h2>{selected.subject}</h2>{profile.role === "teacher" && <p>{selected.studentName}</p>}</div><span className={`status-pill ${selected.status}`}>{statusLabels[selected.status]}</span></header>
          <div className="message-list" aria-live="polite">
            {messages.map((message) => <div key={message.id} className={`message-bubble ${message.senderId === profile.uid ? "mine" : "theirs"}`}><div><strong>{message.senderId === profile.uid ? "Сіз" : message.senderName}</strong><span>{message.senderRole === "teacher" ? "Мұғалім" : "Оқушы"}</span></div><p>{message.text}</p>{message.createdAt > 0 && <time>{new Date(message.createdAt).toLocaleString("kk-KZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>}</div>)}
          </div>
          {selected.status === "closed" ? <div className="conversation-closed"><CheckCircle2 /> Бұл сұрақ аяқталған. Қажет болса жаңа сұрақ ашыңыз.</div> : <form className="reply-form" onSubmit={sendReply}><Textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder={profile.role === "teacher" ? "Оқушыға түсінікті жауап жазыңыз..." : "Қосымша хабарлама жазыңыз..."} maxLength={1000} required /><Button type="submit" disabled={busy} className="gradient-button"><Send /> Жіберу</Button>{profile.role === "teacher" && <Button type="button" variant="outline" onClick={() => setFeedbackStatus(selected.id, "closed")}><CheckCircle2 /> Аяқтау</Button>}</form>}
        </>}
        {error && <p className="feedback-error" role="alert">{error}</p>}
      </section>
    </div>
  );
}
