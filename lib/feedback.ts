import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { UserProfile, UserRole } from "@/lib/user-profile";

export type FeedbackStatus = "open" | "answered" | "closed";

export type FeedbackThread = {
  id: string;
  studentId: string;
  studentName: string;
  subject: string;
  category: string;
  status: FeedbackStatus;
  lastMessage: string;
  createdAt: number;
  updatedAt: number;
};

export type FeedbackMessage = {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  createdAt: number;
};

function dbOrThrow() {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase конфигурациясы толтырылмаған.");
  return db;
}

function millis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") return value.toMillis();
  return 0;
}

export async function createFeedbackThread(profile: UserProfile, subject: string, category: string, text: string) {
  const db = dbOrThrow();
  const thread = await addDoc(collection(db, "feedbackThreads"), {
    studentId: profile.uid,
    studentName: profile.displayName,
    subject: subject.trim(),
    category,
    status: "open",
    lastMessage: text.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addDoc(collection(db, "feedbackThreads", thread.id, "messages"), {
    senderId: profile.uid,
    senderName: profile.displayName,
    senderRole: "student",
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
  return thread.id;
}

export async function sendFeedbackMessage(threadId: string, profile: UserProfile, text: string) {
  const db = dbOrThrow();
  await addDoc(collection(db, "feedbackThreads", threadId, "messages"), {
    senderId: profile.uid,
    senderName: profile.displayName,
    senderRole: profile.role,
    text: text.trim(),
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "feedbackThreads", threadId), {
    lastMessage: text.trim(),
    status: profile.role === "teacher" ? "answered" : "open",
    updatedAt: serverTimestamp(),
  });
}

export async function setFeedbackStatus(threadId: string, status: FeedbackStatus) {
  await updateDoc(doc(dbOrThrow(), "feedbackThreads", threadId), { status, updatedAt: serverTimestamp() });
}

export function subscribeToThreads(profile: UserProfile, callback: (items: FeedbackThread[]) => void, onError: () => void): Unsubscribe {
  const base = collection(dbOrThrow(), "feedbackThreads");
  const request = profile.role === "teacher"
    ? query(base, orderBy("updatedAt", "desc"), limit(50))
    : query(base, where("studentId", "==", profile.uid), limit(30));

  return onSnapshot(request, (snapshot) => callback(snapshot.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      studentId: String(data.studentId ?? ""),
      studentName: String(data.studentName ?? "Оқушы"),
      subject: String(data.subject ?? "Сұрақ"),
      category: String(data.category ?? "Жалпы"),
      status: data.status === "answered" || data.status === "closed" ? data.status : "open",
      lastMessage: String(data.lastMessage ?? ""),
      createdAt: millis(data.createdAt),
      updatedAt: millis(data.updatedAt),
    };
  }).sort((a, b) => b.updatedAt - a.updatedAt)), onError);
}

export function subscribeToMessages(threadId: string, callback: (items: FeedbackMessage[]) => void, onError: () => void): Unsubscribe {
  const request = query(collection(dbOrThrow(), "feedbackThreads", threadId, "messages"), orderBy("createdAt", "asc"), limit(100));
  return onSnapshot(request, (snapshot) => callback(snapshot.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      senderId: String(data.senderId ?? ""),
      senderName: String(data.senderName ?? "EcoMath қолданушысы"),
      senderRole: data.senderRole === "teacher" ? "teacher" : "student",
      text: String(data.text ?? ""),
      createdAt: millis(data.createdAt),
    };
  })), onError);
}
