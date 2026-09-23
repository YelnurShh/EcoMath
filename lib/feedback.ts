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
import { firestoreErrorText, listenWithRetry } from "@/lib/firestore-retry";
import { millis, type UserProfile, type UserRole } from "@/lib/user-profile";

export type FeedbackStatus = "open" | "answered" | "closed";

export type FeedbackThread = {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  subject: string;
  category: string;
  status: FeedbackStatus;
  lastMessage: string;
  lastSenderRole: UserRole;
  messageCount: number;
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

/** Кері байланыс қателерін қазақша мәтінге айналдыру (ортақ көмекшінің үстінен). */
export function feedbackErrorText(error: unknown, fallback = "Хаттарды жүктеу мүмкін болмады."): string {
  return firestoreErrorText(error, fallback);
}

export async function createFeedbackThread(profile: UserProfile, subject: string, category: string, text: string) {
  const db = dbOrThrow();
  const thread = await addDoc(collection(db, "feedbackThreads"), {
    studentId: profile.uid,
    studentName: profile.displayName,
    studentClass: profile.className ?? "",
    subject: subject.trim().slice(0, 80),
    category,
    status: "open",
    lastMessage: text.trim().slice(0, 1000),
    lastSenderRole: "student",
    messageCount: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await addDoc(collection(db, "feedbackThreads", thread.id, "messages"), {
    senderId: profile.uid,
    senderName: profile.displayName,
    senderRole: "student",
    text: text.trim().slice(0, 1000),
    createdAt: serverTimestamp(),
  });
  return thread.id;
}

export async function sendFeedbackMessage(threadId: string, profile: UserProfile, text: string) {
  const db = dbOrThrow();
  const clean = text.trim().slice(0, 1000);
  await addDoc(collection(db, "feedbackThreads", threadId, "messages"), {
    senderId: profile.uid,
    senderName: profile.displayName,
    senderRole: profile.role,
    text: clean,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, "feedbackThreads", threadId), {
    lastMessage: clean,
    lastSenderRole: profile.role,
    status: profile.role === "teacher" ? "answered" : "open",
    updatedAt: serverTimestamp(),
  });
}

export async function setFeedbackStatus(threadId: string, status: FeedbackStatus) {
  await updateDoc(doc(dbOrThrow(), "feedbackThreads", threadId), { status, updatedAt: serverTimestamp() });
}

export function subscribeToThreads(
  profile: UserProfile,
  callback: (items: FeedbackThread[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  const base = collection(dbOrThrow(), "feedbackThreads");
  const request =
    profile.role === "teacher"
      ? query(base, orderBy("updatedAt", "desc"), limit(80))
      : query(base, where("studentId", "==", profile.uid), limit(40));

  return listenWithRetry(
    (onData, onFail) =>
      onSnapshot(
        request,
        (snapshot) => {
          onData();
          callback(
            snapshot.docs
          .map((item) => {
            const data = item.data();
            return {
              id: item.id,
              studentId: String(data.studentId ?? ""),
              studentName: String(data.studentName ?? "Оқушы"),
              studentClass: String(data.studentClass ?? ""),
              subject: String(data.subject ?? "Сұрақ"),
              category: String(data.category ?? "Жалпы"),
              status: (data.status === "answered" || data.status === "closed" ? data.status : "open") as FeedbackStatus,
              lastMessage: String(data.lastMessage ?? ""),
              lastSenderRole: (data.lastSenderRole === "teacher" ? "teacher" : "student") as UserRole,
              messageCount: Number(data.messageCount ?? 0),
              createdAt: millis(data.createdAt),
              updatedAt: millis(data.updatedAt),
            };
          })
              .sort((a, b) => b.updatedAt - a.updatedAt),
          );
        },
        onFail,
      ),
    onError,
  );
}

export function subscribeToMessages(
  threadId: string,
  callback: (items: FeedbackMessage[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  // Жаңа чат құрылған сәтте ата-құжат ережелер қозғалтқышына әлі көрінбей,
  // permission-denied келуі мүмкін — listenWithRetry автоматты қайта қосады.
  return listenWithRetry(
    (onData, onFail) =>
      onSnapshot(
        query(collection(dbOrThrow(), "feedbackThreads", threadId, "messages"), orderBy("createdAt", "asc"), limit(200)),
        (snapshot) => {
          onData();
          callback(
            snapshot.docs.map((item) => {
              const data = item.data();
              return {
                id: item.id,
                senderId: String(data.senderId ?? ""),
                senderName: String(data.senderName ?? "EcoMath қолданушысы"),
                senderRole: (data.senderRole === "teacher" ? "teacher" : "student") as UserRole,
                text: String(data.text ?? ""),
                createdAt: millis(data.createdAt),
              };
            }),
          );
        },
        onFail,
      ),
    onError,
  );
}
