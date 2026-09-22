const PENDING_KEY = "paytrue_sa_welcome_pending";
const PLAYED_KEY = "paytrue_super_admin_welcome_played";
const SESSION_KEY = "paytrue_sa_welcome_session";

type WelcomeSession = {
  sessionId: string;
  played: boolean;
};

function readSession(): WelcomeSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WelcomeSession;
    if (!parsed?.sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const SUPER_ADMIN_WELCOME_TEXT =
  "Welcome to PayTrue Super Admin Dashboard.";

export function unlockSuperAdminWelcomeSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.getVoices();
    const warm = new SpeechSynthesisUtterance(" ");
    warm.volume = 0;
    warm.rate = 1;
    window.speechSynthesis.speak(warm);
    window.speechSynthesis.cancel();
  } catch {
    // Speech unlock is best-effort; dashboard must still work.
  }
}

export function markSuperAdminWelcomePending() {
  if (typeof window === "undefined") return;
  const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem(PENDING_KEY, sessionId);
  sessionStorage.removeItem(PLAYED_KEY);
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ sessionId, played: false } satisfies WelcomeSession)
  );
}

export function shouldPlaySuperAdminWelcome(): boolean {
  if (typeof window === "undefined") return false;
  if (sessionStorage.getItem(PLAYED_KEY) === "true") return false;

  const session = readSession();
  if (session?.played) return false;

  const pending = sessionStorage.getItem(PENDING_KEY);
  if (!pending) return false;
  if (session && pending !== session.sessionId) return false;

  return true;
}

export function consumeSuperAdminWelcome(): boolean {
  if (!shouldPlaySuperAdminWelcome()) return false;
  markSuperAdminWelcomePlayed();
  return true;
}

export function markSuperAdminWelcomePlayed() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_KEY);
  sessionStorage.setItem(PLAYED_KEY, "true");
  const session = readSession();
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      sessionId: session?.sessionId ?? "played",
      played: true,
    } satisfies WelcomeSession)
  );
}

export function clearSuperAdminWelcome() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_KEY);
  sessionStorage.removeItem(PLAYED_KEY);
  localStorage.removeItem(SESSION_KEY);
}
