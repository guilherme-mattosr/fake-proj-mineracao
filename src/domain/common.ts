import type { DB, User } from "./types";
import { canAccessCase, canWriteCase } from "./permissions";
import { id, now } from "../lib/format";
export const requireThat = (
  ok: unknown,
  msg = "Você não tem permissão para esta ação.",
) => {
  if (!ok) throw new Error(msg);
};
export function audit(
  db: DB,
  u: User,
  action: string,
  resource: string,
  reason?: string,
) {
  db.audits.unshift({
    id: id(),
    actor: u.id,
    at: now(),
    action,
    resource,
    result: "Sucesso",
    reason,
  });
}
export function notify(
  db: DB,
  userId: string,
  title: string,
  path: string,
  category = "Mensagens",
) {
  db.notices.unshift({
    id: id(),
    userId,
    title,
    path,
    category,
    at: now(),
    read: false,
  });
}
export function getCase(db: DB, u: User, caseId: string, write = false) {
  const current = db.users.find((x) => x.id === u.id);
  requireThat(current);
  u = current!;
  const c = db.cases.find((c) => c.id === caseId);
  requireThat(c && (write ? canWriteCase(u, c) : canAccessCase(u, c)));
  return c!;
}
