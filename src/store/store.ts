import { useSyncExternalStore } from "react";
import { createSeed } from "../data/seed";
import type { DB, User } from "../domain/types";
import { persist, readDB, STORAGE_KEY } from "./repository";
let db: DB;
let loadError = "";
try {
  db = readDB();
} catch (e) {
  db = createSeed();
  loadError = (e as Error).message;
}
let session: string | null = sessionStorage.getItem("elo-session");
let revision = 0;
const listeners = new Set<() => void>();
const emit = () => {
  revision++;
  listeners.forEach((l) => l());
};
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) {
    try {
      db = readDB();
      emit();
    } catch (e) {
      loadError = (e as Error).message;
      emit();
    }
  }
});
export function transact(fn: (db: DB) => void) {
  const next = structuredClone(db);
  fn(next);
  persist(next);
  db = next;
  emit();
}
export function login(user: User) {
  session = user.id;
  sessionStorage.setItem("elo-session", user.id);
  sessionStorage.setItem(
    "elo-session-version",
    String(user.sessionVersion || 0),
  );
  emit();
}
export function logout() {
  session = null;
  sessionStorage.removeItem("elo-session");
  emit();
}
export function reset() {
  const seed = createSeed();
  persist(seed);
  db = seed;
  loadError = "";
  Object.keys(sessionStorage)
    .filter((k) =>
      [
        "elo-",
        "draft:",
        "search:",
        "filter:",
        "doc-search:",
        "assistant-draft:",
        "internal-draft:",
        "chat-scroll:",
      ].some((prefix) => k.startsWith(prefix)),
    )
    .forEach((k) => sessionStorage.removeItem(k));
  logout();
}
export function useStore() {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => revision,
  );
  return {
    db,
    user: db.users.find(
      (u) =>
        u.id === session &&
        u.active &&
        (u.sessionVersion || 0) ===
          Number(sessionStorage.getItem("elo-session-version") || 0),
    ),
    loadError,
  };
}
export const snapshot = () => db;
