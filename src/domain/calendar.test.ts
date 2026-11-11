import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createSeed } from "../data/seed";
import type { DB, User } from "./types";
import {
  createAppointment,
  decideAppointment,
  cancelAppointment,
  editPersonalAppointment,
  canSeeAppointment,
} from "./calendar";
import { sendMessage, retryMessage } from "./actions";
import {
  proposedMeetingDate,
  isMeetingRequest,
} from "../services/meetingIntent";
import { readDB, STORAGE_KEY } from "../store/repository";
let db: DB, lawyer: User, client: User;
const input = {
  title: "Reunião de alinhamento",
  lawyerId: "a1",
  caseId: "p1",
  start: "2027-01-10T15:00:00Z",
  duration: 60,
  location: "Escritório",
  notes: "",
};
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-11T12:00:00Z"));
  db = createSeed();
  lawyer = db.users.find((u) => u.id === "a1")!;
  client = db.users.find((u) => u.id === "c1")!;
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("Agenda e confirmação de reuniões", () => {
  it("pedido do cliente só reserva horário depois da confirmação do advogado", () => {
    const item = createAppointment(db, client, input);
    expect(item.status).toBe("Pendente");
    expect(
      db.notices.some(
        (n) =>
          n.userId === lawyer.id &&
          n.path === "/advogado/processos/p1/conversa",
      ),
    ).toBe(true);
    expect(() =>
      decideAppointment(db, client, item.id, true, input.start),
    ).toThrow();
    decideAppointment(db, lawyer, item.id, true, input.start);
    expect(item.status).toBe("Confirmado");
    expect(
      db.notices.some(
        (n) => n.userId === client.id && n.title.includes("confirmada"),
      ),
    ).toBe(true);
    expect(() =>
      decideAppointment(db, lawyer, item.id, true, input.start),
    ).toThrow();
  });
  it("bloqueia sobreposição, permite horários consecutivos e recusa sem agendar", () => {
    const first = createAppointment(db, client, input);
    decideAppointment(db, lawyer, first.id, true, input.start);
    const second = createAppointment(db, client, input);
    expect(() =>
      decideAppointment(db, lawyer, second.id, true, "2027-01-10T15:30:00Z"),
    ).toThrow(/conflita/);
    expect(second.status).toBe("Pendente");
    decideAppointment(db, lawyer, second.id, true, "2027-01-10T16:00:00Z");
    const third = createAppointment(db, client, input);
    decideAppointment(db, lawyer, third.id, false);
    expect(third.status).toBe("Recusado");
  });
  it("isola compromissos pessoais e impede acesso de outras contas", () => {
    const item = createAppointment(db, lawyer, { ...input, caseId: undefined });
    expect(item.status).toBe("Confirmado");
    expect(canSeeAppointment(client, item)).toBe(false);
    expect(() => cancelAppointment(db, client, item.id)).toThrow();
    editPersonalAppointment(db, lawyer, item.id, {
      ...input,
      title: "Consulta",
      start: "2027-01-11T15:00:00Z",
    });
    expect(item.title).toBe("Consulta");
    cancelAppointment(db, lawyer, item.id);
    expect(item.status).toBe("Cancelado");
  });
  it("rejeita datas inválidas, processos sem acesso, contas desativadas e responsáveis externos", () => {
    expect(() =>
      createAppointment(db, client, { ...input, start: "2020-01-01" }),
    ).toThrow();
    expect(() =>
      createAppointment(db, client, { ...input, caseId: "p3" }),
    ).toThrow();
    expect(() =>
      createAppointment(db, client, { ...input, lawyerId: "a4" }),
    ).toThrow();
    client.active = false;
    expect(() => createAppointment(db, client, input)).toThrow();
  });
  it("IA encaminha pedidos de ambos os perfis sem confirmar automaticamente", () => {
    sendMessage(
      db,
      client,
      "p1",
      "Quero marcar uma reunião em 10/01/2027 às 14h30",
    );
    expect(db.appointments).toHaveLength(1);
    expect(db.appointments[0].status).toBe("Pendente");
    expect(db.appointments[0].start).toBeDefined();
    expect(db.messages.at(-1)?.author).toBe("ia");
    expect(db.messages.at(-1)?.appointmentId).toBe(db.appointments[0].id);
    const meeting = db.appointments[0];
    decideAppointment(db, lawyer, meeting.id, true, input.start);
    expect(db.messages.at(-1)?.text).toContain("Reunião confirmada");
    expect(db.messages.at(-1)?.caseId).toBe("p1");
    sendMessage(db, lawyer, "p1", "Vamos marcar uma reunião?");
    expect(db.appointments).toHaveLength(2);
    expect(db.appointments[0].start).toBeUndefined();
  });
  it("mensagem falha não agenda nem notifica; retry gera apenas uma solicitação", () => {
    const mid = sendMessage(
      db,
      client,
      "p1",
      "Quero agendar uma reunião",
      undefined,
      undefined,
      true,
    );
    expect(db.appointments).toHaveLength(0);
    retryMessage(db, client, mid);
    expect(db.appointments).toHaveLength(1);
    expect(() => retryMessage(db, client, mid)).toThrow();
    expect(db.appointments).toHaveLength(1);
  });
  it("migra dados locais existentes sem apagar processos ou contas", () => {
    const old: Partial<DB> = structuredClone(db);
    delete old.appointments;
    vi.stubGlobal("localStorage", {
      getItem: (key: string) =>
        key === STORAGE_KEY ? JSON.stringify(old) : null,
    });
    const migrated = readDB();
    expect(migrated.appointments).toEqual([]);
    expect(migrated.cases).toHaveLength(db.cases.length);
  });
  it("não inventa data a partir de horário incompleto ou data impossível", () => {
    expect(isMeetingRequest("Não quero marcar uma reunião")).toBe(false);
    expect(isMeetingRequest("Onde encontro os documentos do processo?")).toBe(
      false,
    );
    expect(isMeetingRequest("A reunião de ontem foi muito boa")).toBe(false);
    expect(proposedMeetingDate("Reunião amanhã")).toBeUndefined();
    expect(proposedMeetingDate("Reunião em 31/02/2027 às 14h")).toBeUndefined();
  });
});
