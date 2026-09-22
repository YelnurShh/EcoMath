import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import { EMPTY_STATS, millis, num, readStats } from "@/lib/user-profile";

export type QuizResult = {
  id: string;
  score: number;
  total: number;
  percent: number;
  topicId: string;
  topicTitle: string;
  durationSec: number;
  createdAt: number;
};

function db() {
  const instance = getFirebaseDb();
  if (!instance) throw new Error("Firebase конфигурациясы толтырылмаған.");
  return instance;
}

function resultsCollection(userId: string) {
  return collection(db(), "users", userId, "quizAttempts");
}

function sameDay(a: number, b: number) {
  const first = new Date(a);
  const second = new Date(b);
  return first.toDateString() === second.toDateString();
}

function isYesterday(previous: number, now: number) {
  const day = 24 * 60 * 60 * 1000;
  return sameDay(previous + day, now);
}

export async function saveQuizResult(input: {
  userId: string;
  displayName: string;
  className: string;
  score: number;
  total: number;
  topicId: string;
  topicTitle: string;
  durationSec: number;
}) {
  const createdAt = Date.now();
  const percent = Math.round((input.score / Math.max(input.total, 1)) * 100);

  await addDoc(resultsCollection(input.userId), {
    score: input.score,
    total: input.total,
    percent,
    topicId: input.topicId,
    topicTitle: input.topicTitle,
    durationSec: Math.max(0, Math.round(input.durationSec)),
    createdAt,
  });

  // Профильдегі жиынтық статистиканы жаңарту (мұғалім панелі осыны оқиды).
  const userRef = doc(db(), "users", input.userId);
  const snapshot = await getDoc(userRef);
  const previous = snapshot.exists() ? readStats(snapshot.data() as Record<string, unknown>) : EMPTY_STATS;

  const quizCount = previous.quizCount + 1;
  const totalCorrect = previous.totalCorrect + input.score;
  const totalQuestions = previous.totalQuestions + input.total;
  const xpGain = input.score * 20 + (percent === 100 ? 60 : percent >= 80 ? 30 : 0);

  let streak = previous.streak;
  if (previous.lastQuizAt === 0) streak = 1;
  else if (sameDay(previous.lastQuizAt, createdAt)) streak = Math.max(previous.streak, 1);
  else if (isYesterday(previous.lastQuizAt, createdAt)) streak = previous.streak + 1;
  else streak = 1;

  await setDoc(
    userRef,
    {
      lastActiveAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stats: {
        ...previous,
        quizCount,
        totalCorrect,
        totalQuestions,
        bestPercent: Math.max(previous.bestPercent, percent),
        lastPercent: percent,
        avgPercent: Math.round((totalCorrect / Math.max(totalQuestions, 1)) * 100),
        xp: previous.xp + xpGain,
        streak,
        lastQuizAt: createdAt,
      },
    },
    { merge: true },
  );

  return { percent, xpGain, streak };
}

export async function getQuizResults(userId: string, max = 30): Promise<QuizResult[]> {
  const resultQuery = query(resultsCollection(userId), orderBy("createdAt", "desc"), limit(max));
  const snapshot = await getDocs(resultQuery);
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      id: item.id,
      score: num(data.score),
      total: num(data.total, 5),
      percent: num(data.percent),
      topicId: String(data.topicId ?? "mixed"),
      topicTitle: String(data.topicTitle ?? "Аралас тест"),
      durationSec: num(data.durationSec),
      createdAt: millis(data.createdAt),
    };
  });
}
