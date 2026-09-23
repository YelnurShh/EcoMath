import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { fetchWithRetry, listenWithRetry } from "@/lib/firestore-retry";
import { millis, num, type UserProfile } from "@/lib/user-profile";

export type Assignment = {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  topic: string;
  targetClass: string; // "" = барлық сынып
  maxPoints: number;
  dueAt: number;
  createdAt: number;
  submissionCount: number;
  gradedCount: number;
};

export type SubmissionStatus = "submitted" | "graded";

export type Submission = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
  studentName: string;
  className: string;
  text: string;
  link: string;
  status: SubmissionStatus;
  grade: number;
  maxPoints: number;
  feedback: string;
  submittedAt: number;
  gradedAt: number;
  gradedBy: string;
};

function db() {
  const instance = getFirebaseDb();
  if (!instance) throw new Error("Firebase конфигурациясы толтырылмаған.");
  return instance;
}

function mapAssignment(id: string, data: Record<string, unknown>): Assignment {
  return {
    id,
    teacherId: String(data.teacherId ?? ""),
    teacherName: String(data.teacherName ?? "Мұғалім"),
    title: String(data.title ?? "Тапсырма"),
    description: String(data.description ?? ""),
    topic: String(data.topic ?? "Жалпы"),
    targetClass: String(data.targetClass ?? ""),
    maxPoints: num(data.maxPoints, 10),
    dueAt: millis(data.dueAt),
    createdAt: millis(data.createdAt) || num(data.createdAtMs),
    submissionCount: num(data.submissionCount),
    gradedCount: num(data.gradedCount),
  };
}

function mapSubmission(assignmentId: string, assignmentTitle: string, id: string, data: Record<string, unknown>): Submission {
  return {
    id,
    assignmentId,
    assignmentTitle,
    studentId: String(data.studentId ?? id),
    studentName: String(data.studentName ?? "Оқушы"),
    className: String(data.className ?? ""),
    text: String(data.text ?? ""),
    link: String(data.link ?? ""),
    status: data.status === "graded" ? "graded" : "submitted",
    grade: num(data.grade),
    maxPoints: num(data.maxPoints, 10),
    feedback: String(data.feedback ?? ""),
    submittedAt: millis(data.submittedAt),
    gradedAt: millis(data.gradedAt),
    gradedBy: String(data.gradedBy ?? ""),
  };
}

export async function createAssignment(
  profile: UserProfile,
  input: { title: string; description: string; topic: string; targetClass: string; maxPoints: number; dueAt: number },
) {
  const ref = await addDoc(collection(db(), "assignments"), {
    teacherId: profile.uid,
    teacherName: profile.displayName,
    title: input.title.trim().slice(0, 120),
    description: input.description.trim().slice(0, 2000),
    topic: input.topic,
    targetClass: input.targetClass.trim().slice(0, 20),
    maxPoints: Math.min(Math.max(Math.round(input.maxPoints), 1), 100),
    dueAt: input.dueAt,
    submissionCount: 0,
    gradedCount: 0,
    createdAtMs: Date.now(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteAssignment(assignmentId: string) {
  await deleteDoc(doc(db(), "assignments", assignmentId));
}

export function subscribeToAssignments(
  callback: (items: Assignment[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  // orderBy қолданылмайды: өрісі әлі жазылмаған құжат нәтижеден түсіп қалады.
  return listenWithRetry(
    (onData, onFail) =>
      onSnapshot(
        query(collection(db(), "assignments"), limit(100)),
        (snapshot) => {
          onData();
          callback(sortAssignments(snapshot.docs.map((item) => mapAssignment(item.id, item.data()))));
        },
        onFail,
      ),
    onError,
  );
}

export async function getAssignments(): Promise<Assignment[]> {
  const snapshot = await fetchWithRetry(() => getDocs(query(collection(db(), "assignments"), limit(100))));
  return sortAssignments(snapshot.docs.map((item) => mapAssignment(item.id, item.data())));
}

function sortAssignments(items: Assignment[]): Assignment[] {
  return [...items].sort((a, b) => b.createdAt - a.createdAt);
}

/** Оқушының өз тапсырмасын жіберуі (submission id = studentId). */
export async function submitAssignment(
  assignment: Assignment,
  profile: UserProfile,
  input: { text: string; link: string },
) {
  const ref = doc(db(), "assignments", assignment.id, "submissions", profile.uid);
  const existing = await getDoc(ref);

  await setDoc(
    ref,
    {
      studentId: profile.uid,
      studentName: profile.displayName,
      className: profile.className,
      text: input.text.trim().slice(0, 3000),
      link: input.link.trim().slice(0, 300),
      status: "submitted",
      grade: 0,
      maxPoints: assignment.maxPoints,
      feedback: "",
      submittedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  if (!existing.exists()) {
    await updateDoc(doc(db(), "assignments", assignment.id), { submissionCount: increment(1) }).catch(() => undefined);
    await setDoc(
      doc(db(), "users", profile.uid),
      { stats: { assignmentsSubmitted: increment(1) }, lastActiveAt: serverTimestamp() },
      { merge: true },
    ).catch(() => undefined);
  }
}

export async function gradeSubmission(
  assignment: Assignment,
  submission: Submission,
  teacher: UserProfile,
  input: { grade: number; feedback: string },
) {
  const grade = Math.min(Math.max(Math.round(input.grade), 0), assignment.maxPoints);
  await updateDoc(doc(db(), "assignments", assignment.id, "submissions", submission.id), {
    status: "graded",
    grade,
    feedback: input.feedback.trim().slice(0, 1000),
    gradedAt: serverTimestamp(),
    gradedBy: teacher.displayName,
    updatedAt: serverTimestamp(),
  });

  if (submission.status !== "graded") {
    await updateDoc(doc(db(), "assignments", assignment.id), { gradedCount: increment(1) }).catch(() => undefined);
    await setDoc(
      doc(db(), "users", submission.studentId),
      { stats: { assignmentsGraded: increment(1), gradeSum: increment(grade), xp: increment(grade * 10) } },
      { merge: true },
    ).catch(() => undefined);
  }
}

export function subscribeToSubmissions(
  assignment: Assignment,
  callback: (items: Submission[]) => void,
  onError: (error: unknown) => void,
): Unsubscribe {
  return listenWithRetry(
    (onData, onFail) =>
      onSnapshot(
        query(collection(db(), "assignments", assignment.id, "submissions"), limit(200)),
        (snapshot) => {
          onData();
          callback(
            snapshot.docs
              .map((item) => mapSubmission(assignment.id, assignment.title, item.id, item.data()))
              .sort((a, b) => b.submittedAt - a.submittedAt),
          );
        },
        onFail,
      ),
    onError,
  );
}

export async function getMySubmission(assignmentId: string, studentId: string): Promise<Submission | null> {
  const snapshot = await getDoc(doc(db(), "assignments", assignmentId, "submissions", studentId));
  if (!snapshot.exists()) return null;
  return mapSubmission(assignmentId, "", snapshot.id, snapshot.data());
}

/** Оқушының барлық тапсырмалары бойынша жіберілімдерін жинау. */
export async function getMySubmissions(assignments: Assignment[], studentId: string): Promise<Record<string, Submission>> {
  const entries = await Promise.all(
    assignments.map(async (assignment) => {
      try {
        const snapshot = await getDoc(doc(db(), "assignments", assignment.id, "submissions", studentId));
        if (!snapshot.exists()) return null;
        return [assignment.id, mapSubmission(assignment.id, assignment.title, snapshot.id, snapshot.data())] as const;
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(entries.filter(Boolean) as (readonly [string, Submission])[]);
}

/** Мұғалім панеліне: барлық тапсырмалар бойынша жіберілімдер тізімі. */
export async function getAllSubmissions(assignments: Assignment[]): Promise<Submission[]> {
  const chunks = await Promise.all(
    assignments.map(async (assignment) => {
      try {
        const snapshot = await fetchWithRetry(() =>
          getDocs(collection(db(), "assignments", assignment.id, "submissions")),
        );
        return snapshot.docs.map((item) => mapSubmission(assignment.id, assignment.title, item.id, item.data()));
      } catch {
        return [] as Submission[];
      }
    }),
  );
  return chunks.flat().sort((a, b) => b.submittedAt - a.submittedAt);
}

/** Сынып атауын салыстыруға дайындау: бос орын, дефис, регистр ескерілмейді. */
export function normalizeClass(value: string): string {
  return (value || "").replace(/[\s\-_.]/g, "").toLowerCase();
}

export function isVisibleForStudent(assignment: Assignment, className: string) {
  if (!assignment.targetClass.trim()) return true;
  return normalizeClass(assignment.targetClass) === normalizeClass(className);
}

export async function getStudentsForTeacher(): Promise<UserProfile[]> {
  const { mapProfile } = await import("@/lib/user-profile");
  // Ережелердегі isTeacher() мұғалімнің users/{uid} құжатын оқиды. Кіргеннен кейінгі
  // алғашқы сәтте ол құжат әлі көрінбей, permission-denied келуі мүмкін — қайталаймыз.
  const snapshot = await fetchWithRetry(() =>
    getDocs(query(collection(db(), "users"), where("role", "==", "student"), limit(300))),
  );
  return snapshot.docs.map((item) => mapProfile(item.id, item.data() as Record<string, unknown>));
}
