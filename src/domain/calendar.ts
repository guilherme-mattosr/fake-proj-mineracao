import type { Appointment, DB, User } from "./types";
import { audit, getCase, notify, requireThat } from "./common";
import { isLawyer } from "./permissions";
import { id, now } from "../lib/format";

export interface AppointmentInput {
  title: string;
  lawyerId: string;
  caseId?: string;
  start?: string;
  duration: number;
  location: string;
  notes: string;
  sourceMessageId?: string;
}
export function canSeeAppointment(user: User, item: Appointment) {
  return (
    user.active &&
    user.emailVerified &&
    user.role !== "administracao" &&
    (item.lawyerId === user.id || item.clientIds.includes(user.id))
  );
}
function actor(db: DB, user: User) {
  const current = db.users.find(
    (u) => u.id === user.id && u.active && u.emailVerified,
  );
  requireThat(current && (isLawyer(current) || current.role === "cliente"));
  return current!;
}
function validateTime(start: string | undefined, duration: number) {
  requireThat(
    start &&
      Number.isFinite(Date.parse(start)) &&
      Date.parse(start) > Date.now(),
    "Informe uma data e um horário futuros.",
  );
  requireThat(
    Number.isInteger(duration) && duration >= 15 && duration <= 480,
    "A duração deve ser de 15 a 480 minutos.",
  );
}
function checkConflict(db: DB, item: Appointment, start: string) {
  const begin = Date.parse(start),
    end = begin + item.duration * 60000;
  requireThat(
    !db.appointments.some(
      (a) =>
        a.id !== item.id &&
        a.status === "Confirmado" &&
        a.lawyerId === item.lawyerId &&
        a.start &&
        Date.parse(a.start) < end &&
        Date.parse(a.start) + a.duration * 60000 > begin,
    ),
    "Este horário conflita com outro compromisso da agenda.",
  );
}
function announce(db: DB, user: User, item: Appointment, title: string) {
  [...new Set([item.lawyerId, ...item.clientIds])]
    .filter((uid) => uid !== user.id)
    .forEach((uid) => {
      const recipient = db.users.find((u) => u.id === uid)!;
      notify(db, uid, title, `/${recipient.role}/calendario`, "Agenda");
    });
}
export function createAppointment(db: DB, user: User, input: AppointmentInput) {
  user = actor(db, user);
  requireThat(input.title.trim(), "Informe o título.");
  const c = input.caseId ? getCase(db, user, input.caseId, true) : undefined;
  requireThat(c || isLawyer(user));
  const lawyer = db.users.find((u) => u.id === input.lawyerId && isLawyer(u));
  requireThat(
    lawyer && (c ? c.lawyers.includes(lawyer.id) : lawyer.id === user.id),
  );
  requireThat(
    Number.isInteger(input.duration) &&
      input.duration >= 15 &&
      input.duration <= 480,
    "Duração inválida.",
  );
  if (input.start) validateTime(input.start, input.duration);
  const item: Appointment = {
    ...input,
    id: id(),
    title: input.title.trim(),
    lawyerId: lawyer!.id,
    requestedBy: user.id,
    clientIds: c ? (user.role === "cliente" ? [user.id] : [...c.clients]) : [],
    kind: c ? "Reunião" : "Pessoal",
    status: c ? "Pendente" : "Confirmado",
    createdAt: now(),
  };
  if (!c) {
    validateTime(item.start, item.duration);
    checkConflict(db, item, item.start!);
  }
  db.appointments.unshift(item);
  if (c)
    notify(
      db,
      lawyer!.id,
      `IA: confirme a reunião em ${c.title}`,
      "/advogado/calendario",
      "Agenda",
    );
  audit(db, user, c ? "Solicitar reunião" : "Criar compromisso", item.id);
  return item;
}
export function decideAppointment(
  db: DB,
  user: User,
  aid: string,
  accept: boolean,
  start?: string,
) {
  user = actor(db, user);
  const item = db.appointments.find((a) => a.id === aid);
  requireThat(
    item &&
      isLawyer(user) &&
      item.lawyerId === user.id &&
      item.status === "Pendente",
  );
  if (item!.caseId) getCase(db, user, item!.caseId, true);
  if (accept) {
    validateTime(start, item!.duration);
    checkConflict(db, item!, start!);
    item!.start = start;
    item!.status = "Confirmado";
  } else item!.status = "Recusado";
  announce(
    db,
    user,
    item!,
    `Reunião ${accept ? "confirmada" : "recusada"}: ${item!.title}`,
  );
  audit(db, user, accept ? "Confirmar reunião" : "Recusar reunião", aid);
}
export function cancelAppointment(db: DB, user: User, aid: string) {
  user = actor(db, user);
  const item = db.appointments.find((a) => a.id === aid);
  requireThat(
    item &&
      canSeeAppointment(user, item) &&
      ["Pendente", "Confirmado"].includes(item.status),
  );
  item!.status = "Cancelado";
  announce(db, user, item!, `Compromisso cancelado: ${item!.title}`);
  audit(db, user, "Cancelar compromisso", aid);
}
export function editPersonalAppointment(
  db: DB,
  user: User,
  aid: string,
  input: AppointmentInput,
) {
  user = actor(db, user);
  const item = db.appointments.find((a) => a.id === aid);
  requireThat(
    item &&
      isLawyer(user) &&
      item.lawyerId === user.id &&
      item.kind === "Pessoal" &&
      item.status === "Confirmado",
  );
  requireThat(input.title.trim());
  validateTime(input.start, input.duration);
  checkConflict(db, { ...item!, duration: input.duration }, input.start!);
  Object.assign(item!, {
    title: input.title.trim(),
    start: input.start,
    duration: input.duration,
    location: input.location,
    notes: input.notes,
  });
  audit(db, user, "Editar compromisso", aid);
}
