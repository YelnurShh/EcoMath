import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

export type QuizResult = {
  id: string;
  score: number;
  total: number;
  percent: number;
  createdAt: number;
};

function resultsCollection(userId: string) {
  const db = getFirebaseDb();
  if (!db) throw new Error("Firebase конфигурациясы толтырылмаған.");
  return collection(db, "users", userId, "quizAttempts");
}

export async function saveQuizResult(userId: string, score: number, total: number) {
  const createdAt = Date.now();
  await addDoc(resultsCollection(userId), {
    score,
    total,
    percent: Math.round((score / total) * 100),
    createdAt,
  });
}

export async function getQuizResults(userId: string): Promise<QuizResult[]> {
  const resultQuery = query(resultsCollection(userId), orderBy("createdAt", "desc"), limit(20));
  const snapshot = await getDocs(resultQuery);
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      score: Number(data.score ?? 0),
      total: Number(data.total ?? 0),
      percent: Number(data.percent ?? 0),
      createdAt: Number(data.createdAt ?? 0),
    };
  });
}