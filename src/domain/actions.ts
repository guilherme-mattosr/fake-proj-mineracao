import type { DB, Document, LegalCase, User, Update } from "./types";
import {
  canAccessDocument,
  canEditDocument,
  canVersionDocument,
  canWriteCase,
  isLawyer,
} from "./permissions";
import { id, now } from "../lib/format";
import { needsLawyer } from "../services/assistant";
import {
  isMeetingRequest,
  proposedMeetingDate,
} from "../services/meetingIntent";
import { createAppointment } from "./calendar";
import { requireThat, audit, notify, getCase } from "./common";
export { requireThat, audit, notify, getCase } from "./common";
export function createCase(
  db: DB,
  u: User,
  input: {
    title: string;
    area: string;
    number: string;
    email: string;
    description: string;
    lawyers: string[];
  },
) {
  requireThat(isLawyer(u));
  requireThat(db.users.some((x) => x.id === u.id && isLawyer(x)));
  requireThat(
    input.title.trim() &&
      input.area.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email),
    "Preencha título, área e e-mail válido.",
  );
  const lawyers = [...new Set([u.id, ...input.lawyers])];
  requireThat(
    lawyers.every((l) =>
      db.users.some(
        (x) =>
          x.id === l &&
          isLawyer(x) &&
          (l === u.id || (u.office && x.office === u.office)),
      ),
    ),
  );
  const cid = id(),
    at = now();
  const c: LegalCase = {
    id: cid,
    title: input.title.trim(),
    area: input.area,
    number: input.number,
    description: input.description,
    clients: [],
    lawyers,
    status: "Aguardando aceite",
    mode: "IA ativa",
    createdAt: at,
    updatedAt: at,
  };
  db.cases.unshift(c);
  const inv = {
    id: id(),
    caseId: cid,
    email: input.email.toLowerCase().trim(),
    lawyer: u.id,
    sentAt: at,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    status: "Pendente" as const,
  };
  db.invitations.unshift(inv);
  const client = db.users.find(
    (x) => x.email === inv.email && x.role === "cliente",
  );
  if (client)
    notify(
      db,
      client.id,
      `Convite: ${c.title}`,
      "/cliente/convites/" + inv.id,
      "Convites",
    );
  audit(db, u, "Criar processo e convite", cid);
  return cid;
}
export function acceptInvite(db: DB, u: User, iid: string, accept: boolean) {
  const current = db.users.find((x) => x.id === u.id && x.active);
  requireThat(current);
  u = current!;
  const inv = db.invitations.find((i) => i.id === iid);
  requireThat(
    inv &&
      u.role === "cliente" &&
      u.emailVerified &&
      inv.email === u.email &&
      inv.status === "Pendente" &&
      Date.parse(inv.expiresAt) > Date.now(),
    "Convite indisponível ou destinado a outra conta.",
  );
  inv!.status = accept ? "Aceito" : "Recusado";
  const c = db.cases.find((c) => c.id === inv!.caseId)!;
  if (accept) {
    requireThat(c.status === "Aguardando aceite");
    c.clients = [...new Set([...c.clients, u.id])];
    c.status = "Ativo";
    c.updatedAt = now();
  }
  notify(
    db,
    inv!.lawyer,
    `Convite ${accept ? "aceito" : "recusado"} por ${u.name}`,
    "/advogado/convites",
    "Convites",
  );
  audit(db, u, accept ? "Aceitar convite" : "Recusar convite", iid);
}
export function sendMessage(
  db: DB,
  u: User,
  caseId: string,
  text: string,
  attachment?: string,
  replyTo?: string,
  failed = false,
) {
  const c = getCase(db, u, caseId, true);
  requireThat(text.trim() || attachment, "Escreva uma mensagem.");
  const doc = attachment
    ? db.documents.find((d) => d.id === attachment)
    : undefined;
  if (attachment)
    requireThat(
      doc &&
        doc.caseId === caseId &&
        canAccessDocument(u, doc, db) &&
        !doc.internal &&
        doc.shared,
      "Confirme o compartilhamento do anexo com os participantes deste processo.",
    );
  const m = {
    id: id(),
    caseId,
    author: u.id,
    text: text.trim(),
    at: now(),
    attachment,
    version: doc?.versions.at(-1)?.number,
    replyTo,
    status: failed ? ("Falhou" as const) : ("Enviando" as const),
  };
  db.messages.push(m);
  if (failed) return m.id;
  c.updatedAt = now();
  [...c.clients, ...c.lawyers]
    .filter((x) => x !== u.id)
    .forEach((x) =>
      notify(
        db,
        x,
        `${u.name}: ${text.slice(0, 80) || "Enviou um arquivo"}`,
        `/${db.users.find((z) => z.id === x)?.role}/processos/${c.id}/conversa`,
      ),
    );
  if (isMeetingRequest(text)) {
    createAppointment(db, u, {
      title: "Reunião: " + c.title,
      caseId: c.id,
      lawyerId: u.role === "advogado" ? u.id : c.lawyers[0],
      start: proposedMeetingDate(text),
      duration: 60,
      location: "A combinar",
      notes: text,
      sourceMessageId: m.id,
    });
    db.messages.push({
      id: id(),
      caseId,
      author: "ia",
      text: "Solicitação de reunião enviada ao advogado. Ele precisa conferir a data e confirmar na agenda. O encontro só será agendado após essa confirmação.",
      at: now(),
      status: "Entregue",
    });
  } else if (u.role === "cliente" && needsLawyer(text))
    escalate(db, u, c, text);
  return m.id;
}
export function retryMessage(db: DB, u: User, mid: string) {
  const m = db.messages.find(
    (m) => m.id === mid && m.author === u.id && m.status === "Falhou",
  );
  requireThat(m);
  getCase(db, u, m!.caseId, true);
  const newId = sendMessage(
    db,
    u,
    m!.caseId,
    m!.text,
    m!.attachment,
    m!.replyTo,
  );
  db.messages = db.messages.filter((x) => x.id !== mid);
  const sent = db.messages.find((x) => x.id === newId)!;
  sent.id = mid;
  db.appointments
    .filter((a) => a.sourceMessageId === newId)
    .forEach((a) => {
      a.sourceMessageId = mid;
    });
  return mid;
}
export function escalate(db: DB, u: User, c: LegalCase, text: string) {
  requireThat(canWriteCase(u, c));
  if (c.mode !== "Atendimento humano") c.mode = "Aguardando advogado";
  db.requests.unshift({
    id: id(),
    caseId: c.id,
    question: text,
    summary: "Pergunta encaminhada para avaliação profissional: " + text,
    at: now(),
    status: c.mode === "Atendimento humano" ? "Em atendimento" : "Aguardando",
    recipients: [...c.lawyers],
  });
  c.lawyers.forEach((x) =>
    notify(
      db,
      x,
      `Avaliação profissional solicitada em ${c.title}`,
      `/advogado/processos/${c.id}/conversa`,
    ),
  );
  audit(db, u, "Encaminhar pergunta", c.id);
}
export function claimCase(db: DB, u: User, cid: string, end = false) {
  const c = getCase(db, u, cid, true);
  requireThat(isLawyer(u));
  if (end) {
    requireThat(
      c.claimedBy === u.id,
      "Somente quem assumiu pode encerrar este atendimento.",
    );
    c.mode = "IA ativa";
    delete c.claimedBy;
  } else {
    requireThat(!c.claimedBy, "Outro profissional já assumiu o atendimento.");
    c.mode = "Atendimento humano";
    c.claimedBy = u.id;
    db.requests
      .filter((r) => r.caseId === cid && r.status === "Aguardando")
      .forEach((r) => (r.status = "Em atendimento"));
  }
  audit(
    db,
    u,
    end ? "Encerrar atendimento humano" : "Assumir atendimento",
    cid,
  );
}
export function closeCase(
  db: DB,
  u: User,
  cid: string,
  status: "Concluído" | "Cancelado",
) {
  const c = getCase(db, u, cid, true);
  requireThat(isLawyer(u));
  c.status = status;
  c.mode = "IA pausada";
  delete c.claimedBy;
  c.clients.forEach((x) =>
    notify(
      db,
      x,
      `${c.title}: ${status}. Histórico disponível para consulta.`,
      `/cliente/processos/${cid}/conversa`,
      "Processo concluído",
    ),
  );
  audit(db, u, status + " processo", cid);
}
export function saveUpdate(
  db: DB,
  u: User,
  input: Omit<Update, "id" | "author" | "history">,
  uid?: string,
) {
  getCase(db, u, input.caseId, true);
  requireThat(isLawyer(u));
  requireThat(
    input.title.trim() && input.description.trim() && input.date,
    "Preencha título, data e descrição.",
  );
  if (input.documentId) {
    const d = db.documents.find((d) => d.id === input.documentId);
    requireThat(
      d &&
        d.caseId === input.caseId &&
        canAccessDocument(u, d, db) &&
        (!input.public || (!d.internal && d.shared)),
      "Documento incompatível com a visibilidade do andamento.",
    );
  }
  const existing = db.updates.find((x) => x.id === uid);
  if (existing) {
    requireThat(existing.caseId === input.caseId);
    existing.history.push({
      at: now(),
      author: u.id,
      text: JSON.stringify({
        title: existing.title,
        description: existing.description,
        date: existing.date,
        public: existing.public,
        documentId: existing.documentId,
      }),
    });
    Object.assign(existing, input);
  } else db.updates.unshift({ ...input, id: id(), author: u.id, history: [] });
  if (input.public)
    db.cases
      .find((c) => c.id === input.caseId)!
      .clients.forEach((x) =>
        notify(
          db,
          x,
          "Novo andamento: " + input.title,
          `/cliente/processos/${input.caseId}/andamentos`,
        ),
      );
  audit(db, u, "Salvar andamento manual", input.caseId);
}
export function upload(
  db: DB,
  u: User,
  cid: string,
  file: { name: string; size: number; mime: string; content?: string },
  category: string,
  shared: boolean,
  versionOf?: string,
  internalThreadId?: string,
) {
  const thread = internalThreadId
    ? db.internal.find(
        (t) =>
          t.id === internalThreadId &&
          t.office === u.office &&
          t.participants.includes(u.id),
      )
    : undefined;
  if (internalThreadId) requireThat(thread && isLawyer(u));
  const c = internalThreadId ? undefined : getCase(db, u, cid, true);
  requireThat(
    file.size > 0 && file.size <= 5 * 1024 * 1024,
    "Use um arquivo de até 5 MB.",
  );
  requireThat(
    /\.(pdf|png|jpe?g|webp|mp3|wav|webm|ogg|mp4|txt)$/i.test(file.name),
    "Extensão de arquivo não permitida.",
  );
  requireThat(
    /^(application\/pdf|image\/(png|jpeg|webp)|audio\/(mpeg|mp3|wav|webm|ogg)|video\/(mp4|webm)|text\/plain)$/.test(
      file.mime,
    ),
    "Formato não permitido. Use PDF, imagem, áudio, vídeo ou TXT.",
  );
  const v = {
    id: id(),
    number: 1,
    name: file.name,
    size: file.size,
    mime: file.mime,
    content: file.content,
    at: now(),
    author: u.id,
  };
  if (versionOf) {
    const d = db.documents.find((d) => d.id === versionOf);
    requireThat(d && d.caseId === cid && canVersionDocument(u, d, db));
    v.number = d!.versions.length + 1;
    d!.versions.push(v);
    audit(db, u, "Nova versão", d!.id);
    return d!.id;
  }
  const d: Document = {
    id: id(),
    name: file.name,
    owner: internalThreadId || u.role === "cliente" ? u.id : c!.clients[0],
    caseId: internalThreadId ? undefined : cid,
    internalThreadId,
    category,
    shared: !internalThreadId && (u.role === "cliente" || shared),
    internal: !!internalThreadId,
    state:
      category === "Organização pendente"
        ? "Organização pendente"
        : "Disponível",
    versions: [v],
    allowClientVersion: u.role === "cliente",
  };
  db.documents.unshift(d);
  audit(db, u, "Enviar documento", d.id);
  return d.id;
}
export function share(db: DB, u: User, did: string, targetId: string) {
  const d = db.documents.find((d) => d.id === did);
  requireThat(d && canAccessDocument(u, d, db));
  const c = getCase(db, u, targetId, true);
  requireThat(u.role === "cliente" ? c.clients.includes(u.id) : isLawyer(u));
  requireThat(
    !d!.internal,
    "Documento interno não pode ser compartilhado por este fluxo.",
  );
  if (d!.caseId === targetId) {
    requireThat(isLawyer(u));
    d!.shared = true;
  } else {
    requireThat(
      d!.owner === u.id || c.clients.includes(d!.owner),
      "O destino deve pertencer ao mesmo titular.",
    );
    const v = d!.versions.at(-1)!;
    db.documents.unshift({
      ...d!,
      id: id(),
      caseId: targetId,
      shared: true,
      versions: [{ ...v, id: id(), number: 1, at: now(), author: u.id }],
    });
  }
  audit(db, u, "Compartilhar documento", did, `Destino: ${targetId}`);
}
export function deleteDocument(db: DB, u: User, did: string) {
  const d = db.documents.find((d) => d.id === did);
  requireThat(d && canEditDocument(u, d, db));
  d!.deleted = true;
  db.dataRequests
    .filter((r) => r.documentId === did && r.status === "Pendente")
    .forEach((r) => {
      r.status = "Aprovada";
      r.answer = "Remoção aprovada pelo advogado autorizado.";
    });
  audit(db, u, "Excluir documento", did);
}
export function requestDeletion(db: DB, u: User, did: string, reason: string) {
  const d = db.documents.find((d) => d.id === did);
  requireThat(d && u.role === "cliente" && canAccessDocument(u, d, db));
  requireThat(
    !db.dataRequests.some(
      (r) =>
        r.documentId === did && r.userId === u.id && r.status === "Pendente",
    ),
    "Já existe uma solicitação pendente.",
  );
  db.dataRequests.unshift({
    id: id(),
    userId: u.id,
    documentId: did,
    caseId: d!.caseId,
    type: "Exclusão de documento",
    reason,
    status: "Pendente",
    at: now(),
  });
  const c = db.cases.find((c) => c.id === d!.caseId);
  if (c?.status === "Ativo")
    c.lawyers.forEach((x) =>
      notify(
        db,
        x,
        "Solicitação de exclusão: " + d!.name,
        "/advogado/solicitacoes-documentos",
        "Documentos",
      ),
    );
  else
    db.tickets.unshift({
      id: "SUP-" + id().slice(0, 6),
      userId: u.id,
      title: "Solicitação de exclusão: " + d!.name,
      category: "Privacidade",
      status: "Aberto",
      priority: "Normal",
      messages: [
        {
          author: u.id,
          text: reason || "Solicito análise da exclusão do arquivo.",
          at: now(),
          internal: false,
        },
      ],
    });
  audit(db, u, "Solicitar exclusão", did);
}
