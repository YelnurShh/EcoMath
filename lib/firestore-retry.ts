import type { Unsubscribe } from "firebase/firestore";

/** Firebase қатесінің кодын қауіпсіз алу. */
export function errorCode(error: unknown): string {
  if (typeof error === "object" && error !== null && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return "";
}

/**
 * Уақытша қате ме?
 * Жаңа кірген қолданушының users/{uid} құжаты немесе жаңа құрылған құжат
 * ережелер қозғалтқышына бірден көрінбейді — сол кезде permission-denied келеді.
 */
export function isRetryable(error: unknown): boolean {
  const code = errorCode(error);
  return (
    code.includes("permission-denied") ||
    code.includes("unavailable") ||
    code.includes("internal") ||
    code.includes("deadline-exceeded") ||
    code.includes("aborted")
  );
}

/** Қатені қазақша, нақты мәтінге айналдыру. */
export function firestoreErrorText(error: unknown, fallback = "Деректерді жүктеу мүмкін болмады."): string {
  const code = errorCode(error);
  if (code.includes("permission-denied")) {
    return "Деректерге рұқсат жоқ. Firestore ережелерін жаңартыңыз: firebase deploy --only firestore:rules";
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
  if (code.includes("resource-exhausted")) {
    return "Firestore шегінен асып кетті. Біраздан соң қайталаңыз.";
  }
  return fallback;
}

type ListenOptions = {
  /** Барлығы неше рет байқау (бірінші әрекетті қоса). Әдепкі 4. */
  maxAttempts?: number;
  /** Қайталау аралығының негізі, мс. Әдепкі 600. */
  baseDelay?: number;
};

/**
 * onSnapshot тыңдаушысын уақытша қателерде автоматты қайта қосатын орауыш.
 * `attach` — тыңдаушыны нақты құратын функция; ол берілген callback-тарды пайдалануы керек.
 */
export function listenWithRetry(
  attach: (onData: () => void, onFail: (error: unknown) => void) => Unsubscribe,
  onError: (error: unknown) => void,
  options: ListenOptions = {},
): Unsubscribe {
  const maxAttempts = options.maxAttempts ?? 4;
  const baseDelay = options.baseDelay ?? 600;

  let attempt = 0;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inner: Unsubscribe | null = null;

  const start = () => {
    if (stopped) return;
    try {
      inner = attach(
        () => {
          attempt = 0; // сәтті жауап келді
        },
        (error) => {
          if (stopped) return;
          inner = null;
          attempt += 1;
          if (attempt < maxAttempts && isRetryable(error)) {
            timer = setTimeout(start, attempt * baseDelay);
            return;
          }
          onError(error);
        },
      );
    } catch (error) {
      onError(error);
    }
  };

  start();

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    if (inner) inner();
  };
}

/** Бір реттік сұранысты (getDocs/getDoc) уақытша қателерде қайталау. */
export async function fetchWithRetry<T>(run: () => Promise<T>, maxAttempts = 4, baseDelay = 600): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === maxAttempts - 1) break;
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * baseDelay));
    }
  }
  throw lastError;
}
