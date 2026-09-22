import type { UserStats } from "@/lib/user-profile";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  emoji: string;
  unlocked: boolean;
  progress: number;
};

export function buildAchievements(stats: UserStats): Achievement[] {
  const define = (id: string, title: string, description: string, emoji: string, value: number, goal: number): Achievement => ({
    id,
    title,
    description,
    emoji,
    unlocked: value >= goal,
    progress: Math.min(100, Math.round((value / goal) * 100)),
  });

  return [
    define("first-quiz", "Алғашқы қадам", "Бірінші викторинаны аяқта.", "🌱", stats.quizCount, 1),
    define("five-quiz", "Тұрақты зерттеуші", "5 викторина өт.", "🔬", stats.quizCount, 5),
    define("perfect", "Мінсіз нәтиже", "100% нәтиже көрсет.", "🏆", stats.bestPercent, 100),
    define("high-avg", "Сенімді аналитик", "Орташа нәтижең 80%-дан жоғары болсын.", "📈", stats.avgPercent, 80),
    define("streak", "Үш күндік серия", "3 күн қатарынан тест тапсыр.", "🔥", stats.streak, 3),
    define("xp-500", "500 XP", "500 тәжірибе ұпайын жина.", "⭐", stats.xp, 500),
    define("homework", "Жауапты оқушы", "3 тапсырма жібер.", "📚", stats.assignmentsSubmitted, 3),
    define("graded", "Бағаланған жұмыс", "Мұғалімнен 1 баға ал.", "✅", stats.assignmentsGraded, 1),
  ];
}
