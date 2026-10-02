import { EMPTY_DRAFT, type DiningDraft, type Place, type SearchSession } from "./domain";

const DRAFT_KEY = "mwo-draft";
const SESSION_KEY = "mwo-session";
const SAVED_KEY = "mwo-saved";

export function loadDraft(): DiningDraft {
  if (typeof window === "undefined") return EMPTY_DRAFT;
  const raw = sessionStorage.getItem(DRAFT_KEY);
  if (!raw) return EMPTY_DRAFT;
  try {
    return { ...EMPTY_DRAFT, ...JSON.parse(raw) };
  } catch {
    return EMPTY_DRAFT;
  }
}

export function saveDraft(draft: DiningDraft) {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadClientSession(): SearchSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SearchSession;
  } catch {
    return null;
  }
}

export function saveClientSession(session: SearchSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSaved(): Place[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(SAVED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Place[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function toggleSaved(place: Place) {
  const current = loadSaved();
  const exists = current.some((item) => item.kakaoId === place.kakaoId);
  const next = exists ? current.filter((item) => item.kakaoId !== place.kakaoId) : [place, ...current];
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  return !exists;
}
