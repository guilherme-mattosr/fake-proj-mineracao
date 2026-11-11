import type { DB, Document, LegalCase, User } from "./types";
export const isLawyer = (u: User) =>
  u.role === "advogado" && u.active && u.verified && u.emailVerified;
export const canAccessCase = (u: User, c: LegalCase) =>
  u.active &&
  u.emailVerified &&
  (u.role === "advogado"
    ? isLawyer(u) && c.lawyers.includes(u.id)
    : u.role === "cliente" &&
      c.clients.includes(u.id) &&
      c.status !== "Aguardando aceite" &&
      c.status !== "Suspenso");
export const canWriteCase = (u: User, c: LegalCase) =>
  canAccessCase(u, c) && c.status === "Ativo";
export function canAccessDocument(u: User, d: Document, db: DB) {
  const current = db.users.find((x) => x.id === u.id);
  if (!current) return false;
  u = current;
  if (!u.active || !u.emailVerified || d.deleted || u.role === "administracao")
    return false;
  if (d.internalThreadId)
    return (
      isLawyer(u) &&
      db.internal.some(
        (t) =>
          t.id === d.internalThreadId &&
          t.office === u.office &&
          t.participants.includes(u.id),
      )
    );
  if (!d.caseId) return u.role === "cliente" && d.owner === u.id;
  const c = db.cases.find((c) => c.id === d.caseId);
  return (
    !!c &&
    canAccessCase(u, c) &&
    (u.role === "advogado" ||
      (!d.internal && (d.shared || d.versions[0]?.author === u.id)))
  );
}
export const canEditDocument = (u: User, d: Document, db: DB) =>
  isLawyer(u) &&
  canAccessDocument(u, d, db) &&
  !!db.cases.find((c) => c.id === d.caseId && canWriteCase(u, c));
export const canVersionDocument = (u: User, d: Document, db: DB) =>
  canAccessDocument(u, d, db) &&
  !!db.cases.find((c) => c.id === d.caseId && canWriteCase(u, c)) &&
  (isLawyer(u) || d.allowClientVersion);
export const canRevokeDocument = (u: User, d: Document, db: DB) =>
  canEditDocument(u, d, db) &&
  d.shared &&
  db.users.find((x) => x.id === d.versions[0]?.author)?.role === "advogado";
export const canUseAssistant = (u: User, db: DB) =>
  u.role !== "administracao" && db.cases.some((c) => canWriteCase(u, c));
export function allowedPath(u: User, path: string) {
  return (
    path.startsWith("/" + u.role + "/") ||
    path === "/" + u.role ||
    path.startsWith("/sistema/")
  );
}
