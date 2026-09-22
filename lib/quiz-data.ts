export type QuizQuestion = {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type QuizTopic = {
  id: string;
  title: string;
  description: string;
  icon: "stats" | "linear" | "percent" | "eco" | "mixed";
  questions: QuizQuestion[];
};

export const quizTopics: QuizTopic[] = [
  {
    id: "stats",
    title: "Статистика",
    description: "Орташа мән, медиана, мода және өзгеру ауқымы.",
    icon: "stats",
    questions: [
      { question: "Деректер жиыны: 4, 6, 6, 8. Орташа мәні қанша?", options: ["5", "6", "7", "8"], answer: 1, explanation: "(4 + 6 + 6 + 8) ÷ 4 = 6." },
      { question: "Қай әдіс деректің ең жиі кездесетін мәнін көрсетеді?", options: ["Медиана", "Мода", "Орташа мән", "Диапазон"], answer: 1, explanation: "Мода — ең жиі кездесетін мән." },
      { question: "3, 7, 9, 11, 15 қатарының медианасы қанша?", options: ["7", "9", "10", "11"], answer: 1, explanation: "Реттелген қатардың ортасындағы сан — 9." },
      { question: "Ең үлкен және ең кіші мәннің айырмасы қалай аталады?", options: ["Мода", "Медиана", "Диапазон (размах)", "Дисперсия"], answer: 2, explanation: "Диапазон = max − min." },
      { question: "Аптадағы су шығыны (л): 20, 22, 18, 24, 21, 19, 22. Орташа мәні шамамен қанша?", options: ["19,4", "20,3", "20,9", "22,1"], answer: 2, explanation: "146 ÷ 7 ≈ 20,9 л." },
      { question: "Егер деректің біріне өте үлкен мән қосылса, қай көрсеткіш ең көп өзгереді?", options: ["Мода", "Медиана", "Орташа мән", "Ешқайсысы"], answer: 2, explanation: "Орташа мән шектен тыс мәндерге (выброс) сезімтал." },
    ],
  },
  {
    id: "linear",
    title: "Сызықтық модель",
    description: "y = kx + b және болжам жасау.",
    icon: "linear",
    questions: [
      { question: "y = 3x + 2 формуласында x = 4 болса, y нешеге тең?", options: ["9", "12", "14", "18"], answer: 2, explanation: "3 × 4 + 2 = 14." },
      { question: "y = kx + b теңдеуіндегі k нені білдіреді?", options: ["Бастапқы мән", "Өсу жылдамдығы", "Қате", "Орташа мән"], answer: 1, explanation: "k — бұрыштық коэффициент, өзгеру жылдамдығы." },
      { question: "Күніне 40 кг қалдық жиналса, 30 күнде қанша болады?", options: ["400 кг", "800 кг", "1 200 кг", "1 600 кг"], answer: 2, explanation: "40 × 30 = 1 200 кг." },
      { question: "y = −5x + 100 моделінде x артқанда y қалай өзгереді?", options: ["Артады", "Кемиді", "Өзгермейді", "Алдымен артады"], answer: 1, explanation: "k теріс болғандықтан y кемиді." },
      { question: "Қалдық көлемі y = 2x + 10 (кг). 15 күнде қанша болады?", options: ["30 кг", "35 кг", "40 кг", "45 кг"], answer: 2, explanation: "2 × 15 + 10 = 40 кг." },
      { question: "Модель қандай жағдайда сызықтық деп саналады?", options: ["Өзгеріс тұрақты болғанда", "Өзгеріс екі есе өскенде", "Дерек аз болғанда", "Кез келген жағдайда"], answer: 0, explanation: "Тұрақты (бірдей) өсім — сызықтық тәуелділік белгісі." },
    ],
  },
  {
    id: "percent",
    title: "Пайыз және салыстыру",
    description: "Пайыздық өзгеріс арқылы тиімділікті бағалау.",
    icon: "percent",
    questions: [
      { question: "Қалдық 200 кг-нан 150 кг-ға азайды. Азаю пайызы қанша?", options: ["20%", "25%", "30%", "50%"], answer: 1, explanation: "50 ÷ 200 × 100% = 25%." },
      { question: "80-нен 100-ге өсу қанша пайызды құрайды?", options: ["20%", "25%", "80%", "125%"], answer: 1, explanation: "20 ÷ 80 × 100% = 25%." },
      { question: "500 бөтелкенің 15%-ы қайта өңделсе, ол неше бөтелке?", options: ["50", "65", "75", "85"], answer: 2, explanation: "500 × 0,15 = 75." },
      { question: "Пайыздық өзгеріс формуласы қандай?", options: ["(a − b) ÷ a × 100", "a × b ÷ 100", "(a + b) ÷ 2", "a ÷ b"], answer: 0, explanation: "Δ% = (бастапқы − соңғы) ÷ бастапқы × 100." },
      { question: "Энергия шығыны 40%-ға азайса, бұрынғы 250 кВт·сағ қанша болады?", options: ["100", "125", "150", "175"], answer: 2, explanation: "250 × 0,6 = 150 кВт·сағ." },
      { question: "Қағаз шығыны 120-дан 144 параққа өсті. Өсім қанша пайыз?", options: ["15%", "20%", "24%", "30%"], answer: 1, explanation: "24 ÷ 120 × 100% = 20%." },
    ],
  },
  {
    id: "eco",
    title: "Экология және ресурс",
    description: "Пластик, су, энергия және көмірқышқыл газы.",
    icon: "eco",
    questions: [
      { question: "500 оқушының әрқайсысы күніне 2 бөтелке қолданса, бір күнде неше бөтелке жиналады?", options: ["250", "500", "1 000", "2 000"], answer: 2, explanation: "500 × 2 = 1 000 бөтелке." },
      { question: "Бір пластик бөтелкенің табиғатта ыдырауы шамамен қанша уақыт алады?", options: ["5 жыл", "50 жыл", "450 жыл", "1 000 жыл"], answer: 2, explanation: "PET бөтелке шамамен 450 жылда ыдырайды." },
      { question: "1 000 бөтелке (әрқайсысы 20 г) қанша келі пластик құрайды?", options: ["10 кг", "20 кг", "40 кг", "200 кг"], answer: 1, explanation: "1 000 × 20 г = 20 000 г = 20 кг." },
      { question: "Қайта өңдеу (recycling) ең алдымен нені үнемдейді?", options: ["Тек ақшаны", "Шикізат пен энергияны", "Тек орынды", "Ештеңені"], answer: 1, explanation: "Қайта өңдеу шикізат пен өндіріске кететін энергияны үнемдейді." },
      { question: "Кран 1 минутта 6 л су ағызса, 10 минутта қанша су кетеді?", options: ["16 л", "36 л", "60 л", "600 л"], answer: 2, explanation: "6 × 10 = 60 литр." },
      { question: "«Көміртекті із» (carbon footprint) дегеніміз не?", options: ["Ағаш саны", "Бөлінген CO₂ мөлшері", "Су шығыны", "Қалдық салмағы"], answer: 1, explanation: "Бұл — қызмет нәтижесінде бөлінген CO₂ мөлшері." },
    ],
  },
];

export const quizTopicById = (id: string) => quizTopics.find((topic) => topic.id === id) ?? null;

export function buildMixedQuiz(count = 6): QuizQuestion[] {
  const pool = quizTopics.flatMap((topic) => topic.questions);
  return shuffle(pool).slice(0, count);
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
