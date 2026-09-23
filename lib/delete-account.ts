import {
  EmailAuthProvider,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  type User,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  type DocumentReference,
  type Firestore,
} from "firebase/firestore";
import { getFirebaseDb, googleProvider } from "@/lib/firebase";
import type { UserRole } from "@/lib/user-profile";

/** Firestore батчының шегі — 500 операция. Қауіпсіздік үшін 400 аламыз. */
const BATCH_LIMIT = 400;

export type DeletionProgress = {
  step: string;
  done: number;
  total: number;
};

export type DeletionSummary = {
  quizAttempts: number;
  submissions: number;
  feedbackThreads: number;
  feedbackMessages: number;
  assignments: number;
  assignmentSubmissions: number;
};

function dbOrThrow(): Firestore {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase конфигурациясы толтырылмаған.");
  return db;
}

/** Сілтемелер тізімін батчпен өшіру. */
async function deleteRefs(db: Firestore, refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

/** Бір құжаттың ішкі коллекциясын толық өшіру. */
async function deleteSubcollection(db: Firestore, path: string[], name: string): Promise<number> {
  const snapshot = await getDocs(collection(db, ...(path as [string, ...string[]]), name));
  if (snapshot.empty) return 0;
  await deleteRefs(db, snapshot.docs.map((item) => item.ref));
  return snapshot.size;
}

/**
 * Қолданушының Firestore-дағы БАРЛЫҚ деректерін өшіреді.
 * Auth аккаунты бөлек өшіріледі (deleteAccount ішінде).
 */
export async function deleteAllUserData(
  uid: string,
  role: UserRole,
  onProgress?: (progress: DeletionProgress) => void,
): Promise<DeletionSummary> {
  const db = dbOrThrow();
  const summary: DeletionSummary = {
    quizAttempts: 0,
    submissions: 0,
    feedbackThreads: 0,
    feedbackMessages: 0,
    assignments: 0,
    assignmentSubmissions: 0,
  };

  const totalSteps = role === "teacher" ? 5 : 4;
  let step = 0;
  const report = (label: string) => {
    step += 1;
    onProgress?.({ step: label, done: step, total: totalSteps });
  };

  // 1. Викторина нәтижелері
  report("Викторина нәтижелері өшірілуде...");
  summary.quizAttempts = await deleteSubcollection(db, ["users", uid], "quizAttempts");

  // 2. Тапсырмаларға жіберілген жұмыстар (submission id = uid)
  report("Жіберілген жұмыстар өшірілуде...");
  const allAssignments = await getDocs(collection(db, "assignments"));
  const mySubmissionRefs: DocumentReference[] = [];
  await Promise.all(
    allAssignments.docs.map(async (assignment) => {
      const ref = doc(db, "assignments", assignment.id, "submissions", uid);
      try {
        const submissions = await getDocs(
          query(collection(db, "assignments", assignment.id, "submissions"), where("studentId", "==", uid)),
        );
        submissions.forEach((item) => mySubmissionRefs.push(item.ref));
      } catch {
        // list рұқсаты болмаса — тікелей құжатты өшіруге тырысамыз
        mySubmissionRefs.push(ref);
      }
    }),
  );
  if (mySubmissionRefs.length > 0) {
    await deleteRefs(db, mySubmissionRefs);
    summary.submissions = mySubmissionRefs.length;
  }

  // 3. Кері байланыс чаттары (хабарламаларымен бірге)
  report("Кері байланыс тарихы өшірілуде...");
  const threads = await getDocs(
    role === "teacher"
      ? query(collection(db, "feedbackThreads"))
      : query(collection(db, "feedbackThreads"), where("studentId", "==", uid)),
  );

  for (const thread of threads.docs) {
    const data = thread.data() as { studentId?: string };
    const isMine = data.studentId === uid;

    if (role === "teacher" && !isMine) {
      // Мұғалім: чат оқушыға тиесілі, тек өз хабарламаларын өшіреміз.
      const messages = await getDocs(collection(db, "feedbackThreads", thread.id, "messages"));
      const mine = messages.docs.filter((item) => (item.data() as { senderId?: string }).senderId === uid);
      if (mine.length > 0) {
        await deleteRefs(db, mine.map((item) => item.ref));
        summary.feedbackMessages += mine.length;
      }
      continue;
    }

    if (!isMine) continue;

    summary.feedbackMessages += await deleteSubcollection(db, ["feedbackThreads", thread.id], "messages");
    await deleteDoc(thread.ref);
    summary.feedbackThreads += 1;
  }

  // 4. Мұғалім: өзі жариялаған тапсырмалар мен олардың барлық жіберілімдері
  if (role === "teacher") {
    report("Жарияланған тапсырмалар өшірілуде...");
    const mine = await getDocs(query(collection(db, "assignments"), where("teacherId", "==", uid)));
    for (const assignment of mine.docs) {
      summary.assignmentSubmissions += await deleteSubcollection(db, ["assignments", assignment.id], "submissions");
      await deleteDoc(assignment.ref);
      summary.assignments += 1;
    }
  }

  // 5. Профиль құжаты — ең соңында (ережелердегі isTeacher() тексерісі осыған тәуелді)
  report("Профиль өшірілуде...");
  await deleteDoc(doc(db, "users", uid));

  return summary;
}

export type ReauthMethod = { type: "password"; password: string } | { type: "google" };

/** Қолданушыны қайта аутентификациялау (Firebase жуырдағы кіруді талап етеді). */
export async function reauthenticate(user: User, method: ReauthMethod) {
  if (method.type === "google") {
    await reauthenticateWithPopup(user, googleProvider);
    return;
  }
  if (!user.email) throw new Error("Email табылмады.");
  const credential = EmailAuthProvider.credential(user.email, method.password);
  await reauthenticateWithCredential(user, credential);
}

/** Қолданушының негізгі кіру әдісі. */
export function getPrimaryProvider(user: User): "password" | "google" | "other" {
  const ids = user.providerData.map((item) => item.providerId);
  if (ids.includes("password")) return "password";
  if (ids.includes("google.com")) return "google";
  return "other";
}

/**
 * Толық өшіру: алдымен Firestore деректері, содан кейін Auth аккаунты.
 * Реті маңызды — Auth өшкеннен кейін Firestore-ға жазу рұқсаты жоғалады.
 */
export async function deleteAccount(
  user: User,
  role: UserRole,
  onProgress?: (progress: DeletionProgress) => void,
): Promise<DeletionSummary> {
  const summary = await deleteAllUserData(user.uid, role, onProgress);
  onProgress?.({ step: "Аккаунт жабылуда...", done: 1, total: 1 });
  await deleteUser(user);
  return summary;
}

export function getDeleteErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error !== null && "code" in error ? String((error as { code: string }).code) : "";
  switch (code) {
    case "auth/requires-recent-login":
      return "Қауіпсіздік үшін жеке басыңызды қайта растау қажет.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Құпиясөз қате.";
    case "auth/too-many-requests":
      return "Тым көп әрекет жасалды. Біраз уақыттан кейін қайталаңыз.";
    case "auth/popup-closed-by-user":
      return "Растау терезесі жабылды.";
    case "auth/network-request-failed":
      return "Интернет байланысы жоқ. Байланысты тексеріңіз.";
    case "permission-denied":
      return "Деректерді өшіруге рұқсат жоқ. Firestore ережелерін жариялаңыз (firebase deploy --only firestore:rules).";
    default:
      return "Аккаунтты өшіру кезінде қате шықты. Қайта байқап көріңіз.";
  }
}
