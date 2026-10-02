import type { Feedback, SearchSession } from "./domain";

const TTL_MS = 6 * 60 * 60 * 1000;

type Store = Map<string, SearchSession>;

function store() {
  const globalStore = globalThis as typeof globalThis & { __diningSessions?: Store };
  if (!globalStore.__diningSessions) globalStore.__diningSessions = new Map();
  return globalStore.__diningSessions;
}

function prune(sessions: Store) {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - Date.parse(session.updatedAt) > TTL_MS) sessions.delete(id);
  }
}

export function saveSession(session: SearchSession) {
  const sessions = store();
  prune(sessions);
  sessions.set(session.id, session);
  return session;
}

export function getSession(id: string) {
  const sessions = store();
  prune(sessions);
  return sessions.get(id) ?? null;
}

export function addFeedback(sessionId: string, feedback: Feedback) {
  const session = getSession(sessionId);
  if (!session) return null;
  session.feedback = [...session.feedback.filter((item) => item.placeId !== feedback.placeId), feedback];
  session.updatedAt = new Date().toISOString();
  return saveSession(session);
}
