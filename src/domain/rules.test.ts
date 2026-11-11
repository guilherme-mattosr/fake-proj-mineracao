import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSeed } from "../data/seed";
import type { DB, User } from "./types";
import {
  acceptInvite,
  claimCase,
  closeCase,
  createCase,
  deleteDocument,
  requestDeletion,
  saveUpdate,
  sendMessage,
  retryMessage,
  share,
  upload,
  audit,
} from "./actions";
import {
  allowedPath,
  canAccessCase,
  canAccessDocument,
  canEditDocument,
  canUseAssistant,
  canVersionDocument,
  canRevokeDocument,
  canWriteCase,
} from "./permissions";
import { answer, needsLawyer } from "../services/assistant";
let db: DB, lawyer: User, client: User, other: User;
beforeEach(() => {
  db = createSeed();
  lawyer = db.users.find((u) => u.id === "a1")!;
  client = db.users.find((u) => u.id === "c1")!;
  other = db.users.find((u) => u.id === "c2")!;
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-09T15:00:00Z"));
});
describe("Isolamento de contas e processos", () => {
  it("todos os registros fictícios mantêm referências válidas e coerentes", () => {
    const userIds = new Set(db.users.map((u) => u.id)),
      caseIds = new Set(db.cases.map((c) => c.id));
    expect(
      db.documents.every(
        (d) =>
          userIds.has(d.owner) &&
          (!d.caseId || caseIds.has(d.caseId)) &&
          d.versions.every((v) => userIds.has(v.author)),
      ),
    ).toBe(true);
    expect(
      db.cases.every((c) =>
        [...c.clients, ...c.lawyers].every((id) => userIds.has(id)),
      ),
    ).toBe(true);
    expect(
      db.messages.every(
        (m) =>
          caseIds.has(m.caseId) && (m.author === "ia" || userIds.has(m.author)),
      ),
    ).toBe(true);
    expect(
      db.invitations.every(
        (i) => caseIds.has(i.caseId) && userIds.has(i.lawyer),
      ),
    ).toBe(true);
  });
  it("cliente só acessa seus processos aceitos", () => {
    expect(canAccessCase(client, db.cases[0])).toBe(true);
    expect(canAccessCase(other, db.cases[0])).toBe(false);
    expect(() => sendMessage(db, other, "p1", "Olá")).toThrow();
  });
  it("advogado individual não acessa processos do escritório", () => {
    const u = db.users.find((u) => u.id === "a4")!;
    expect(canAccessCase(u, db.cases[0])).toBe(false);
    expect(canAccessCase(u, db.cases[9])).toBe(true);
  });
  it("administrador não recebe acesso padrão a conversas e arquivos", () => {
    const admin = db.users.find((u) => u.id === "ad1")!;
    expect(canAccessCase(admin, db.cases[0])).toBe(false);
    expect(canAccessDocument(admin, db.documents[0], db)).toBe(false);
    expect(allowedPath(client, "/administracao")).toBe(false);
  });
  it("advogado não aprovado fica bloqueado", () => {
    lawyer.verified = false;
    expect(canAccessCase(lawyer, db.cases[0])).toBe(false);
    expect(() =>
      createCase(db, lawyer, {
        title: "Teste",
        area: "Cível",
        email: "ana@elo.demo",
        number: "",
        description: "",
        lawyers: [],
      }),
    ).toThrow();
  });
  it("conta suspensa não recebe acesso", () => {
    client.active = false;
    expect(canAccessCase(client, db.cases[0])).toBe(false);
    expect(canUseAssistant(client, db)).toBe(false);
  });
  it("biblioteca pessoal não é liberada pelo vínculo", () => {
    const personal = db.documents.find((d) => d.id === "personal1")!;
    expect(canAccessDocument(client, personal, db)).toBe(true);
    expect(canAccessDocument(lawyer, personal, db)).toBe(false);
  });
  it("cliente não vê documentos internos e reservados de outro autor", () => {
    expect(
      canAccessDocument(
        client,
        db.documents.find((d) => d.id === "d0-2")!,
        db,
      ),
    ).toBe(false);
  });
  it("históricos particulares são associados a uma conta", () => {
    db.threads.push({
      id: "t",
      userId: client.id,
      caseId: "p1",
      title: "Privado",
      at: new Date().toISOString(),
      messages: [],
    });
    expect(db.threads.filter((t) => t.userId === lawyer.id)).toHaveLength(0);
  });
});
describe("Convites e criação", () => {
  it("cria processo pendente e convite de 30 dias sem acesso ao cliente", () => {
    const cid = createCase(db, lawyer, {
      title: "Novo trabalho",
      email: "ana@elo.demo",
      area: "Cível",
      number: "",
      description: "",
      lawyers: ["a2", "a3"],
    });
    const c = db.cases.find((c) => c.id === cid)!;
    const inv = db.invitations.find((i) => i.caseId === cid)!;
    expect(c.status).toBe("Aguardando aceite");
    expect(c.clients).toEqual([]);
    expect(Date.parse(inv.expiresAt) - Date.parse(inv.sentAt)).toBe(
      30 * 86400000,
    );
    expect(canAccessCase(client, c)).toBe(false);
  });
  it("aceite libera o processo somente para o destinatário", () => {
    acceptInvite(db, client, "i1", true);
    const c = db.cases.find((c) => c.id === "p5")!;
    expect(c.status).toBe("Ativo");
    expect(c.clients).toEqual(["c1"]);
    expect(canWriteCase(client, c)).toBe(true);
    expect(
      canAccessCase(
        db.users.find((u) => u.id === "c5")!,
        c,
      ),
    ).toBe(false);
  });
  it("recusa preserva processo sem criar vínculo", () => {
    acceptInvite(db, client, "i1", false);
    expect(db.invitations[0].status).toBe("Recusado");
    expect(db.cases.find((c) => c.id === "p5")!.clients).toEqual([]);
  });
  it("outro e-mail e convite expirado não podem aceitar", () => {
    expect(() => acceptInvite(db, other, "i1", true)).toThrow();
    db.invitations[0].expiresAt = "2026-11-01T00:00:00Z";
    expect(() => acceptInvite(db, client, "i1", true)).toThrow();
  });
  it("não aceita convite duas vezes", () => {
    acceptInvite(db, client, "i1", true);
    expect(() => acceptInvite(db, client, "i1", true)).toThrow();
  });
  it("cliente não cria processo e advogado não adiciona profissional sem vínculo", () => {
    const input = {
      title: "Teste",
      email: "ana@elo.demo",
      area: "Cível",
      number: "",
      description: "",
      lawyers: [],
    };
    expect(() => createCase(db, client, input)).toThrow();
    expect(() =>
      createCase(db, lawyer, { ...input, lawyers: ["a4"] }),
    ).toThrow();
  });
});
describe("IA e atendimento humano", () => {
  it("falha não notifica nem encaminha até reenvio confirmado", () => {
    const notices = db.notices.length,
      requests = db.requests.length;
    const mid = sendMessage(
      db,
      client,
      "p1",
      "Devo aceitar o acordo?",
      undefined,
      undefined,
      true,
    );
    expect(db.notices.length).toBe(notices);
    expect(db.requests.length).toBe(requests);
    expect(db.messages.find((m) => m.id === mid)?.status).toBe("Falhou");
    retryMessage(db, client, mid);
    expect(db.requests.length).toBe(requests + 1);
    expect(db.messages.filter((m) => m.id === mid)).toHaveLength(1);
  });
  it.each([
    "Devo aceitar o acordo?",
    "Qual a chance de vitória?",
    "Há risco de perder?",
    "Como devo agir na audiência?",
    "Qual o valor provável?",
    "Qual a estratégia?",
  ])("encaminha avaliação profissional: %s", (q) =>
    expect(needsLawyer(q)).toBe(true),
  );
  it("notifica todos os advogados participantes", () => {
    sendMessage(db, client, "p1", "Devo aceitar um acordo?");
    const r = db.requests[0];
    expect(r.recipients).toEqual(["a1", "a2"]);
    expect(db.cases[0].mode).toBe("Aguardando advogado");
    expect(
      db.notices.some((n) => n.userId === "a2" && n.path.includes("p1")),
    ).toBe(true);
  });
  it("primeiro profissional assume e outros ainda podem participar", () => {
    claimCase(db, lawyer, "p1");
    const otherLawyer = db.users.find((u) => u.id === "a2")!;
    expect(() => claimCase(db, otherLawyer, "p1")).toThrow();
    expect(() =>
      sendMessage(db, otherLawyer, "p1", "Estou acompanhando."),
    ).not.toThrow();
    expect(db.cases[0].claimedBy).toBe("a1");
  });
  it("somente quem assumiu encerra o atendimento sem concluir processo", () => {
    claimCase(db, lawyer, "p1");
    expect(() => claimCase(db, db.users[1], "p1", true)).toThrow();
    claimCase(db, lawyer, "p1", true);
    expect(db.cases[0].mode).toBe("IA ativa");
    expect(db.cases[0].status).toBe("Ativo");
  });
  it("não modifica atendimento humano em pergunta de alto risco", () => {
    claimCase(db, lawyer, "p1");
    sendMessage(db, client, "p1", "Devo aceitar o acordo?");
    expect(db.cases[0].mode).toBe("Atendimento humano");
  });
  it("resposta factual usa apenas andamentos públicos salvos", () => {
    const result = answer(db, client, db.cases[0], "Qual é o andamento?");
    expect(result.text).toContain("Documentação recebida");
    expect(result.text).not.toContain("Preparação interna");
    expect(result.text).toContain("Fonte:");
  });
  it("sem fonte não inventa atualização", () => {
    db.updates = [];
    expect(answer(db, client, db.cases[0], "Andamento?").text).toContain(
      "Não encontrei",
    );
  });
  it("contexto de outro cliente não é consultado", () => {
    expect(answer(db, client, db.cases[1], "Andamento?").text).not.toContain(
      "Documentação recebida",
    );
  });
});
describe("Documentos, versões e compartilhamento", () => {
  it("arquivo reservado enviado pelo advogado não é liberado pelo titular do processo", () => {
    const did = upload(
      db,
      lawyer,
      "p1",
      { name: "reservado.txt", size: 20, mime: "text/plain" },
      "Contratos",
      false,
    );
    const d = db.documents.find((d) => d.id === did)!;
    expect(d.owner).toBe(client.id);
    expect(canAccessDocument(client, d, db)).toBe(false);
    share(db, lawyer, did, "p1");
    expect(canAccessDocument(client, d, db)).toBe(true);
    expect(canRevokeDocument(lawyer, d, db)).toBe(true);
    d.shared = false;
    expect(canAccessDocument(client, d, db)).toBe(false);
  });
  it("advogado não oferece revogar acesso do cliente ao próprio arquivo enviado por ele", () => {
    const did = upload(
      db,
      client,
      "p1",
      { name: "cliente.txt", size: 20, mime: "text/plain" },
      "Comprovantes",
      true,
    );
    expect(
      canRevokeDocument(
        lawyer,
        db.documents.find((d) => d.id === did)!,
        db,
      ),
    ).toBe(false);
  });
  it("anexo interno é reservado aos participantes e não entra no processo oficial", () => {
    const did = upload(
      db,
      lawyer,
      "",
      { name: "nota.txt", size: 100, mime: "text/plain" },
      "Equipe",
      false,
      undefined,
      "int1",
    );
    const doc = db.documents.find((d) => d.id === did)!;
    expect(canAccessDocument(lawyer, doc, db)).toBe(true);
    expect(canAccessDocument(client, doc, db)).toBe(false);
    expect(
      canAccessDocument(
        db.users.find((u) => u.id === "a4")!,
        doc,
        db,
      ),
    ).toBe(false);
    expect(() => share(db, lawyer, did, "p1")).toThrow();
    expect(() => sendMessage(db, lawyer, "p1", "", did)).toThrow();
  });
  const file = {
    name: "arquivo.pdf",
    size: 1024,
    mime: "application/pdf",
    content: "data:application/pdf;base64,JVBERg==",
  };
  it("upload fica acessível apesar de classificação pendente", () => {
    const did = upload(db, client, "p1", file, "Organização pendente", true);
    const d = db.documents.find((d) => d.id === did)!;
    expect(d.state).toBe("Organização pendente");
    expect(canAccessDocument(client, d, db)).toBe(true);
  });
  it("anexo do chat corresponde ao mesmo documento e versão", () => {
    const did = upload(db, client, "p1", file, "Comprovantes", true);
    const mid = sendMessage(db, client, "p1", "", did);
    expect(db.messages.find((m) => m.id === mid)?.attachment).toBe(did);
    expect(db.messages.find((m) => m.id === mid)?.version).toBe(1);
  });
  it("não anexa documento de outro processo ou reservado", () => {
    expect(() =>
      sendMessage(db, lawyer, "p2", "", db.documents[0].id),
    ).toThrow();
    db.documents[0].shared = false;
    expect(() =>
      sendMessage(db, lawyer, "p1", "", db.documents[0].id),
    ).toThrow();
  });
  it("recusa arquivos vazios, formatos inválidos e tamanho acima do limite local", () => {
    expect(() =>
      upload(db, client, "p1", { ...file, size: 0 }, "Contratos", true),
    ).toThrow();
    expect(() =>
      upload(
        db,
        client,
        "p1",
        { ...file, mime: "application/x-msdownload" },
        "Contratos",
        true,
      ),
    ).toThrow();
    expect(() =>
      upload(
        db,
        client,
        "p1",
        { ...file, size: 6 * 1024 * 1024 },
        "Contratos",
        true,
      ),
    ).toThrow();
  });
  it("cliente solicita remoção sem apagar o documento", () => {
    const d = db.documents[0];
    requestDeletion(db, client, d.id, "Arquivo duplicado");
    expect(d.deleted).toBeUndefined();
    expect(db.dataRequests[0].status).toBe("Pendente");
    expect(() => deleteDocument(db, client, d.id)).toThrow();
    expect(() => requestDeletion(db, client, d.id, "")).toThrow();
  });
  it("advogado autorizado remove e conclui pedido", () => {
    const d = db.documents[0];
    requestDeletion(db, client, d.id, "");
    deleteDocument(db, lawyer, d.id);
    expect(canAccessDocument(client, d, db)).toBe(false);
    expect(db.dataRequests[0].status).toBe("Aprovada");
    expect(db.audits[0].actor).toBe(lawyer.id);
  });
  it("compartilha cópia isolada de um único arquivo", () => {
    const personal = db.documents.find((d) => d.id === "personal1")!;
    share(db, client, personal.id, "p11");
    const copied = db.documents[0];
    expect(copied.id).not.toBe(personal.id);
    expect(copied.caseId).toBe("p11");
    expect(personal.caseId).toBeUndefined();
    expect(copied.versions).toHaveLength(1);
    expect(copied.versions[0].id).not.toBe(personal.versions[0].id);
  });
  it("não compartilha com processo de outro cliente ou encerrado", () => {
    expect(() => share(db, client, "personal1", "p2")).toThrow();
    db.cases[10].status = "Concluído";
    expect(() => share(db, client, "personal1", "p11")).toThrow();
  });
  it("nova versão preserva metadados e referência do anexo anterior", () => {
    const did = upload(db, client, "p1", file, "Comprovantes", true);
    const mid = sendMessage(db, client, "p1", "", did);
    const d = db.documents.find((d) => d.id === did)!;
    const original = structuredClone(d.versions[0]);
    upload(
      db,
      client,
      "p1",
      { ...file, name: "novo.pdf" },
      "Comprovantes",
      true,
      did,
    );
    expect(d.versions[0]).toEqual(original);
    expect(d.versions[1].number).toBe(2);
    expect(db.messages.find((m) => m.id === mid)?.version).toBe(1);
  });
  it("cliente só versiona documento habilitado", () => {
    expect(canVersionDocument(client, db.documents[0], db)).toBe(false);
    expect(canVersionDocument(client, db.documents[1], db)).toBe(true);
  });
});
describe("Andamentos e encerramento", () => {
  it("preserva autoria e histórico ao editar andamento", () => {
    saveUpdate(db, lawyer, {
      caseId: "p1",
      title: "Primeiro",
      description: "Descrição pública",
      date: "2026-11-09",
      public: true,
    });
    const u = db.updates[0];
    saveUpdate(
      db,
      db.users[1],
      {
        caseId: "p1",
        title: "Corrigido",
        description: "Revisão",
        date: "2026-11-09",
        public: false,
      },
      u.id,
    );
    expect(u.author).toBe(lawyer.id);
    expect(u.history[0].author).toBe("a2");
    expect(u.history[0].text).toContain("Primeiro");
  });
  it("não publica documento interno como fonte pública", () => {
    expect(() =>
      saveUpdate(db, lawyer, {
        caseId: "p1",
        title: "Teste",
        description: "Teste",
        date: "2026-11-09",
        public: true,
        documentId: "d0-2",
      }),
    ).toThrow();
  });
  it.each(["Concluído", "Cancelado"] as const)(
    "%s bloqueia mensagem, anexo, andamento e exclusão",
    (status) => {
      closeCase(db, lawyer, "p1", status);
      expect(canWriteCase(client, db.cases[0])).toBe(false);
      expect(canAccessCase(client, db.cases[0])).toBe(true);
      expect(() => sendMessage(db, client, "p1", "Teste")).toThrow();
      expect(() =>
        saveUpdate(db, lawyer, {
          caseId: "p1",
          title: "Novo",
          description: "Novo",
          date: "2026-11-09",
          public: true,
        }),
      ).toThrow();
      expect(canEditDocument(lawyer, db.documents[0], db)).toBe(false);
    },
  );
  it("cliente não conclui processo", () => {
    expect(() => closeCase(db, client, "p1", "Concluído")).toThrow();
  });
  it("pedido sem processo ativo vai ao suporte", () => {
    closeCase(db, lawyer, "p1", "Concluído");
    requestDeletion(db, client, db.documents[0].id, "Remoção");
    expect(db.tickets[0].category).toBe("Privacidade");
  });
  it("auditoria registra ator, momento, alvo, ação e resultado", () => {
    audit(
      db,
      db.users.find((u) => u.id === "ad2")!,
      "Aprovar cadastro",
      "a5",
      "Evidência demonstrativa",
    );
    expect(db.audits[0]).toMatchObject({
      actor: "ad2",
      resource: "a5",
      action: "Aprovar cadastro",
      result: "Sucesso",
      at: "2026-11-09T15:00:00.000Z",
    });
  });
});
