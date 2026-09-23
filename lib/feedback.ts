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

function errorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return "";
}

/** Тыңдаушы қатесін оқушыға түсінікті мәтінге айналдырады. */
export function feedbackErrorText(error: unknown, fallback = "Хаттарды жүктеу мүмкін болмады."): string {
  const code = errorCode(error);
  if (code.includes("permission-denied")) {
    return "Деректерге рұқсат жоқ. Firestore ережелерін жаңартыңыз (firebase deploy --only firestore:rules).";
  }
  if (code.includes("unavailable") || code.includes("network")) {
    return "Интернет байланысы үзілді. Қайта қосылуда...";
  }
  if (code.includes("failed-precondition")) {
    return "Firestore индексі қажет. Броузер консоліндегі сілтемені ашып индексті құрыңыз.";
  }
  if (code.includes("unauthenticated")) {
    return "Сеанс мерзімі бітті. Қайта кіріңіз.";
  }
  return fallback;
}

/** Жаңа құжат ережелер қозғалтқышына көрінгенше қате беруі мүмкін — сондықтан қайталап көреміз. */
export function isRetryableListenError(error: unknown): boolean {
  const code = errorCode(error);
  return code.includes("permission-denied") || code.includes("unavailable") || code.includes("internal");
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

  return onSnapshot(
    request,
    (snapshot) =>
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
      ),
    onError,
  );
}

export function subscribeToMessages(
  threadId: string,
  callback: (items: FeedbackMessage[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  // Жаңа чат құрылған сәтте тыңдаушы серверде құжат әлі тіркелмей тұрып қосылуы мүмкін.
  // Ондайда Firestore permission-denied қайтарады, сондықтан бірнеше рет қайта қосыламыз.
  const maxAttempts = 4;
  let attempt = 0;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inner: Unsubscribe | null = null;

  const attach = () => {
    if (stopped) return;
    const request = query(
      collection(dbOrThrow(), "feedbackThreads", threadId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    );

    inner = onSnapshot(
      request,
      (snapshot) => {
        attempt = 0; // сәтті жауап — есептегішті нөлдейміз
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
      (error) => {
        if (stopped) return;
        inner = null;
        attempt += 1;
        if (attempt < maxAttempts && isRetryableListenError(error)) {
          timer = setTimeout(attach, attempt * 600); // 0.6с → 1.2с → 1.8с
          return;
        }
        onError(error);
      },
    );
  };

  attach();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    if (inner) inner();
  };
}
