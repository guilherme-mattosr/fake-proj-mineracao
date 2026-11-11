import { useEffect, useRef, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  FileText,
  Info as InfoIcon,
  LockKeyhole,
  Plus,
  Users,
  Sparkles,
} from "lucide-react";
import type { Message } from "../domain/types";
import { useStore, transact, snapshot } from "../store/store";
import {
  canAccessCase,
  canWriteCase,
  isLawyer,
  canAccessDocument,
} from "../domain/permissions";
import {
  audit,
  claimCase,
  closeCase,
  getCase,
  requireThat,
  saveUpdate,
  sendMessage,
  retryMessage,
} from "../domain/actions";
import {
  Avatar,
  Badge,
  Empty,
  Field,
  Form,
  Info,
  Modal,
  PageHeading,
  useFeedback,
  useLocalState,
} from "../components/ui";
import { Composer, Messages } from "../components/chat";
import { UploadModal, Viewer } from "../components/documents";
import { answer } from "../services/assistant";
import { date, id, now } from "../lib/format";
import { Documents } from "./Documents";
import { SystemPage } from "./System";
import { AppointmentForm } from "../components/calendar/AppointmentForm";
import { isMeetingRequest } from "../services/meetingIntent";
export function Process() {
  const { processoId } = useParams();
  const { db, user } = useStore();
  const location = useLocation();
  const { run, confirm, toast } = useFeedback();
  const c = db.cases.find(
    (c) => c.id === processoId && canAccessCase(user!, c),
  );
  const base = "/" + user!.role + "/processos/" + processoId;
  const tab = location.pathname.endsWith("/andamentos")
    ? "andamentos"
    : location.pathname.endsWith("/documentos")
      ? "documentos"
      : location.pathname.endsWith("/dados")
        ? "dados"
        : "conversa";
  const [draft, setDraft] = useLocalState(
    "draft:" + user!.id + ":" + processoId,
    "",
  );
  const [reply, setReply] = useState<Message>();
  const [uploading, setUploading] = useState(false);
  const [viewer, setViewer] = useState<{ id: string; version?: number }>();
  const [editing, setEditing] = useState(false);
  const [updateEdit, setUpdateEdit] = useState<string>();
  const [updateModal, setUpdateModal] = useState(false);
  const [history, setHistory] = useState("");
  const [caseHistory, setCaseHistory] = useState(false);
  const [participants, setParticipants] = useState(false);
  const [meeting, setMeeting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(
    () => () => {
      clearTimeout(timer.current);
    },
    [],
  );
  useEffect(() => {
    const current = snapshot();
    const allowed = current.cases.some(
      (c) => c.id === processoId && canAccessCase(user!, c),
    );
    const targets = current.notices.filter(
      (n) =>
        n.userId === user!.id &&
        !n.read &&
        n.path.includes("/processos/" + processoId + "/"),
    );
    if (allowed && targets.length)
      transact((d) => {
        targets.forEach((n) => {
          const notice = d.notices.find((x) => x.id === n.id);
          if (notice) notice.read = true;
        });
      });
  }, [processoId, user]);
  if (!c) return <SystemPage kind="acesso-negado" />;
  const write = canWriteCase(user!, c);
  const lawyer = isLawyer(user!);
  const messages = db.messages.filter(
    (m) =>
      m.caseId === c.id && (m.status !== "Falhou" || m.author === user!.id),
  );
  const updates = db.updates
    .filter((u) => u.caseId === c.id && (lawyer || u.public))
    .sort((a, b) => b.date.localeCompare(a.date));
  const deliver = (mid: string) => {
    setTimeout(
      () =>
        run(() =>
          transact((d) => {
            const m = d.messages.find((m) => m.id === mid);
            if (m?.status === "Enviando") m.status = "Enviada";
          }),
        ),
      120,
    );
    setTimeout(
      () =>
        run(() =>
          transact((d) => {
            const m = d.messages.find((m) => m.id === mid);
            if (m && m.status === "Enviada") m.status = "Entregue";
          }),
        ),
      350,
    );
  };
  const simulateAI = (text: string) => {
    if (isMeetingRequest(text)) return;
    if (
      user!.role !== "cliente" ||
      !db.aiEnabled ||
      c.mode !== "IA ativa" ||
      !user!.preferences.aiAware
    )
      return;
    setGenerating(true);
    timer.current = setTimeout(() => {
      setGenerating(false);
      run(() =>
        transact((d) => {
          const current = d.cases.find((x) => x.id === c.id);
          if (
            !current ||
            !canWriteCase(user!, current) ||
            current.mode !== "IA ativa" ||
            !d.aiEnabled
          )
            return;
          const result = answer(d, user!, current, text);
          if (result.escalate) return;
          d.messages.push({
            id: id(),
            caseId: c.id,
            author: "ia",
            text: result.text,
            at: now(),
            status: "Entregue",
            policy:
              d.policies.find((p) => p.status === "Publicada")?.version || 1,
          });
          audit(d, user!, "Resposta simulada da IA", c.id);
        }),
      );
    }, 1100);
  };
  const send = (text = draft, attachment?: string) => {
    if (!text.trim() && !attachment) return;
    let mid = "";
    const before = snapshot().cases.find((x) => x.id === c.id);
    if (
      run(() =>
        transact((d) => {
          mid = sendMessage(
            d,
            user!,
            c.id,
            text,
            attachment,
            reply?.id,
            !navigator.onLine,
          );
        }),
      )
    ) {
      setDraft("");
      setReply(undefined);
      if (navigator.onLine) deliver(mid);
      if (navigator.onLine && before?.mode === "IA ativa") simulateAI(text);
    }
  };
  const update = db.updates.find((u) => u.id === updateEdit);
  return (
    <div className="process-page">
      <header className="process-heading">
        <Link
          className="icon-button"
          aria-label="Voltar aos processos"
          to={"/" + user!.role + "/processos"}
        >
          <ArrowLeft size={20} />
        </Link>
        <span className="case-symbol">
          <FileText size={23} />
        </span>
        <div>
          <h1>{c.title}</h1>
          <p>
            {c.area} <span>·</span> {c.number || "Número não informado"}
          </p>
        </div>
        <Badge>{c.status}</Badge>
        {write && (
          <button className="button secondary" onClick={() => setMeeting(true)}>
            Solicitar reunião
          </button>
        )}
        <button
          className="icon-button"
          aria-label="Ver participantes"
          onClick={() => setParticipants(true)}
        >
          <Users size={21} />
        </button>
      </header>
      {meeting && (
        <AppointmentForm caseItem={c} onClose={() => setMeeting(false)} />
      )}
      <div className="process-tabs tabs">
        {[
          ["conversa", "Conversa"],
          ["andamentos", "Andamentos"],
          ["documentos", "Documentos"],
          ["dados", "Dados do processo"],
        ].map(([path, label]) => (
          <Link
            key={path}
            className={tab === path ? "active" : ""}
            to={base + "/" + path}
          >
            {label}
          </Link>
        ))}
      </div>
      {tab === "documentos" ? (
        <Documents />
      ) : tab === "conversa" ? (
        <div className="chat-layout">
          <section className="chat-panel">
            <div className="chat-state">
              <span>
                {c.mode === "Atendimento humano" ? (
                  <>
                    <Avatar
                      small
                      name={
                        db.users.find((u) => u.id === c.claimedBy)?.name ||
                        "Advogado"
                      }
                    />
                    <strong>
                      Atendimento com{" "}
                      {db.users.find((u) => u.id === c.claimedBy)?.name}
                    </strong>
                  </>
                ) : (
                  <>
                    <Sparkles size={17} />
                    <strong>{lawyer ? c.mode : "Assistente IA"}</strong>
                  </>
                )}
              </span>
              {lawyer &&
                write &&
                (!c.claimedBy ? (
                  <button
                    className="button secondary small-button"
                    onClick={() =>
                      run(
                        () => transact((d) => claimCase(d, user!, c.id)),
                        "Você assumiu o atendimento. A IA está pausada.",
                      )
                    }
                  >
                    Assumir atendimento
                  </button>
                ) : c.claimedBy === user!.id ? (
                  <button
                    className="button secondary small-button"
                    onClick={() =>
                      run(
                        () => transact((d) => claimCase(d, user!, c.id, true)),
                        "Atendimento humano encerrado.",
                      )
                    }
                  >
                    Encerrar atendimento
                  </button>
                ) : (
                  <Badge>IA pausada</Badge>
                ))}
            </div>
            {!user!.preferences.aiAware && (
              <Info>
                Assistente IA: respostas simuladas, com fontes salvas e sem
                opinião profissional definitiva.{" "}
                <Link to="/sistema/transparencia">Conhecer limites</Link>
                <button
                  className="button secondary"
                  onClick={() =>
                    run(() =>
                      transact((d) => {
                        d.users.find(
                          (u) => u.id === user!.id,
                        )!.preferences.aiAware = true;
                        audit(
                          d,
                          user!,
                          "Registrar ciência da IA",
                          "Transparência demo v1",
                        );
                      }),
                    )
                  }
                >
                  Estou ciente
                </button>
              </Info>
            )}
            <Messages
              messages={messages}
              onOpen={(id, version) => setViewer({ id, version })}
              onReply={write ? setReply : undefined}
              onRetry={(m) => {
                if (!navigator.onLine) {
                  toast("Sem conexão. Tente novamente quando a rede voltar.");
                  return;
                }
                if (
                  run(() =>
                    transact((d) => {
                      retryMessage(d, user!, m.id);
                    }),
                  )
                ) {
                  deliver(m.id);
                  simulateAI(m.text);
                }
              }}
            />
            {generating && c.mode === "IA ativa" && (
              <div className="generating" role="status">
                <Sparkles size={16} />
                Assistente IA gerando resposta...
                <button
                  onClick={() => {
                    clearTimeout(timer.current);
                    setGenerating(false);
                    toast("Geração interrompida.");
                  }}
                >
                  Interromper
                </button>
              </div>
            )}
            {write ? (
              <Composer
                draft={draft}
                setDraft={setDraft}
                onSend={() => send()}
                onAttach={() => setUploading(true)}
                onAudio={() =>
                  confirm(
                    "Enviar áudio fictício",
                    "Será adicionada uma mensagem de áudio demonstrativo, sem gravar o microfone.",
                    () =>
                      send(
                        "[Áudio demonstrativo] Mensagem de voz simulada, sem gravação real.",
                      ),
                  )
                }
                reply={reply}
                onCancelReply={() => setReply(undefined)}
              />
            ) : (
              <div className="read-only">
                <LockKeyhole size={18} />
                <div>
                  <strong>Histórico somente para consulta</strong>
                  <span>
                    Processo {c.status.toLowerCase()}. Novas mensagens e anexos
                    estão bloqueados.
                  </span>
                </div>
              </div>
            )}
          </section>
          <aside className="chat-context">
            <h3>Neste processo</h3>
            <span className="eyebrow">PARTICIPANTES</span>
            {[...c.clients, ...c.lawyers].map((uid) => {
              const u = db.users.find((u) => u.id === uid)!;
              return (
                <button
                  key={uid}
                  className="participant"
                  onClick={() => setParticipants(true)}
                >
                  <Avatar small name={u.name} />
                  <span>
                    {u.name}
                    <small>
                      {u.role === "advogado" ? "OAB " + u.oab : "Cliente"}
                    </small>
                  </span>
                </button>
              );
            })}
            <div className="context-section">
              <span className="eyebrow">ÚLTIMO ANDAMENTO PÚBLICO</span>
              <h4>
                {updates.find((u) => u.public)?.title ||
                  "Nenhum andamento publicado"}
              </h4>
              <p>{updates.find((u) => u.public)?.description}</p>
              <Link to={base + "/andamentos"}>Ver linha do tempo</Link>
            </div>
            <div className="context-section">
              <span className="eyebrow">DOCUMENTOS</span>
              {db.documents
                .filter(
                  (d) => d.caseId === c.id && canAccessDocument(user!, d, db),
                )
                .slice(0, 3)
                .map((d) => (
                  <button
                    className="context-doc"
                    key={d.id}
                    onClick={() => setViewer({ id: d.id })}
                  >
                    <FileText size={17} />
                    <span>{d.name}</span>
                  </button>
                ))}
              <Link to={base + "/documentos"}>Abrir documentos</Link>
            </div>
            <p className="context-disclaimer">
              <InfoIcon size={15} />
              Atualizações manuais. Sem conexão com tribunais.
            </p>
          </aside>
        </div>
      ) : tab === "andamentos" ? (
        <div className="page">
          <PageHeading
            eyebrow="LINHA DO TEMPO"
            title="Andamentos do processo"
            description="Informações registradas manualmente pelos profissionais participantes."
            action={
              lawyer &&
              write && (
                <button
                  className="button primary"
                  onClick={() => {
                    setUpdateEdit(undefined);
                    setUpdateModal(true);
                  }}
                >
                  <Plus size={18} />
                  Registrar andamento
                </button>
              )
            }
          />
          <div className="timeline">
            {updates.map((u) => (
              <article key={u.id} className="timeline-item">
                <div className="timeline-dot" />
                <time>{date(u.date)}</time>
                <div className="panel">
                  <div className="request-top">
                    <h3>{u.title}</h3>
                    <Badge>
                      {u.public ? "Visível ao cliente" : "Somente equipe"}
                    </Badge>
                  </div>
                  <p>{u.description}</p>
                  <small>
                    Registrado por{" "}
                    {db.users.find((x) => x.id === u.author)?.name}
                  </small>
                  {u.documentId && (
                    <button
                      className="context-doc"
                      onClick={() => setViewer({ id: u.documentId! })}
                    >
                      <FileText size={16} />
                      Documento relacionado
                    </button>
                  )}
                  {lawyer && (
                    <div className="inline-actions">
                      {write && (
                        <button
                          className="text-link"
                          onClick={() => {
                            setUpdateEdit(u.id);
                            setUpdateModal(true);
                          }}
                        >
                          Editar andamento
                        </button>
                      )}
                      <button
                        className="text-link"
                        onClick={() => setHistory(u.id)}
                      >
                        Histórico de alterações ({u.history.length})
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
            {!updates.length && (
              <Empty
                title="Nenhum andamento registrado"
                text="As atualizações publicadas pelos advogados aparecerão aqui."
              />
            )}
          </div>
        </div>
      ) : (
        <div className="page">
          <PageHeading
            title="Dados do processo"
            description="Informações administrativas e participantes autorizados."
            action={
              lawyer &&
              write && (
                <button
                  className="button primary"
                  onClick={() => setEditing(true)}
                >
                  Editar processo
                </button>
              )
            }
          />
          <div className="details-grid">
            <section className="panel detail-panel">
              <h2>Informações gerais</h2>
              <dl>
                {lawyer && (
                  <>
                    <dt>Histórico administrativo</dt>
                    <dd>
                      <button
                        className="text-link"
                        onClick={() => setCaseHistory(true)}
                      >
                        Consultar versões anteriores ({c.history?.length || 0})
                      </button>
                    </dd>
                  </>
                )}
                <dt>Título</dt>
                <dd>{c.title}</dd>
                <dt>Área</dt>
                <dd>{c.area}</dd>
                <dt>Número do processo</dt>
                <dd>
                  {c.number || "Não informado"}{" "}
                  <button
                    className="text-link"
                    onClick={() =>
                      navigator.clipboard
                        .writeText(c.number || "Não informado")
                        .then(() => toast("Número copiado."))
                        .catch(() => toast("Não foi possível copiar."))
                    }
                  >
                    Copiar
                  </button>
                </dd>
                <dt>Criado em</dt>
                <dd>{date(c.createdAt)}</dd>
                <dt>Situação processual</dt>
                <dd>
                  <Badge>{c.status}</Badge>
                </dd>
                <dt>Atendimento</dt>
                <dd>
                  {c.mode}
                  {c.claimedBy &&
                    " · " + db.users.find((u) => u.id === c.claimedBy)?.name}
                </dd>
                {lawyer && (
                  <>
                    <dt>Descrição interna</dt>
                    <dd>{c.description || "Não informada"}</dd>
                  </>
                )}
              </dl>
            </section>
            <section className="panel detail-panel">
              <h2>Participantes</h2>
              {[...c.clients, ...c.lawyers].map((uid) => {
                const u = db.users.find((u) => u.id === uid)!;
                return (
                  <div className="participant" key={uid}>
                    <Avatar name={u.name} />
                    <div>
                      <strong>{u.name}</strong>
                      <p>
                        {u.role === "advogado" ? "OAB " + u.oab : "Cliente"}
                      </p>
                      {u.role === "advogado" && (
                        <a href={"mailto:" + u.email}>{u.email}</a>
                      )}
                    </div>
                  </div>
                );
              })}
              {lawyer && (
                <Info>
                  Gestão de participantes bloqueada até aprovação dos papéis do
                  escritório e regras de transferência.
                </Info>
              )}
            </section>
          </div>
          {lawyer && write && (
            <section className="danger-zone">
              <div>
                <h3>Encerrar este processo</h3>
                <p>
                  O histórico permanece disponível. Novas mensagens, documentos
                  e alterações serão bloqueados.
                </p>
              </div>
              <button
                className="button secondary"
                onClick={() =>
                  confirm(
                    "Concluir processo",
                    "A conversa ficará somente para consulta. A IA e todos os novos envios serão bloqueados. A reabertura ainda não está disponível.",
                    () =>
                      transact((d) => closeCase(d, user!, c.id, "Concluído")),
                  )
                }
              >
                Concluir processo
                <Check size={16} />
              </button>
              <button
                className="button danger-outline"
                onClick={() =>
                  confirm(
                    "Cancelar processo",
                    "O processo será cancelado e passará a permitir apenas consulta. O histórico será preservado.",
                    () =>
                      transact((d) => closeCase(d, user!, c.id, "Cancelado")),
                    true,
                  )
                }
              >
                Cancelar processo
              </button>
            </section>
          )}
        </div>
      )}
      {uploading && (
        <UploadModal
          caseId={c.id}
          official
          onClose={() => setUploading(false)}
          onUploaded={(did) => send("", did)}
        />
      )}
      {viewer && (
        <Viewer
          documentId={viewer.id}
          version={viewer.version}
          onClose={() => setViewer(undefined)}
        />
      )}
      {participants && (
        <Modal
          title="Participantes do processo"
          onClose={() => setParticipants(false)}
        >
          {[...c.clients, ...c.lawyers].map((uid) => {
            const u = db.users.find((x) => x.id === uid)!;
            return (
              <div key={uid} className="participant">
                <Avatar name={u.name} />
                <div>
                  <strong>{u.name}</strong>
                  <small>
                    {u.role === "advogado"
                      ? `OAB ${u.oab} · ${u.verified ? "Aprovada na simulação" : "Em análise"}`
                      : "Cliente"}
                  </small>
                  {u.role === "advogado" && (
                    <>
                      <a href={"mailto:" + u.email}>{u.email}</a>
                      <a href={"tel:" + u.phone.replace(/\D/g, "")}>
                        {u.phone}
                      </a>
                      <div className="inline-actions">
                        <button
                          className="text-link"
                          onClick={() =>
                            navigator.clipboard
                              .writeText(u.email)
                              .then(() => toast("E-mail copiado."))
                              .catch(() => toast("Não foi possível copiar."))
                          }
                        >
                          Copiar e-mail
                        </button>
                        <button
                          className="text-link"
                          onClick={() =>
                            navigator.clipboard
                              .writeText(u.phone)
                              .then(() => toast("Telefone copiado."))
                              .catch(() => toast("Não foi possível copiar."))
                          }
                        >
                          Copiar telefone
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </Modal>
      )}
      {editing && (
        <Modal title="Editar processo" onClose={() => setEditing(false)}>
          <Form
            onSubmit={(fd) => {
              if (
                run(
                  () =>
                    transact((d) => {
                      const item = getCase(d, user!, c.id, true);
                      requireThat(isLawyer(user!));
                      item.history ??= [];
                      item.history.push({
                        at: now(),
                        author: user!.id,
                        title: item.title,
                        area: item.area,
                        number: item.number,
                        description: item.description,
                      });
                      item.title = String(fd.get("title")).trim();
                      item.area = String(fd.get("area")).trim();
                      item.number = String(fd.get("number"));
                      item.description = String(fd.get("description"));
                      requireThat(
                        item.title && item.area,
                        "Preencha título e área.",
                      );
                      audit(
                        d,
                        user!,
                        "Editar processo",
                        c.id,
                        "Dados administrativos alterados; versão anterior preservada no processo.",
                      );
                    }),
                  "Processo atualizado.",
                )
              )
                setEditing(false);
            }}
          >
            <Field label="Título">
              <input name="title" required defaultValue={c.title} />
            </Field>
            <Field label="Área">
              <input name="area" required defaultValue={c.area} />
            </Field>
            <Field label="Número">
              <input name="number" defaultValue={c.number} />
            </Field>
            <Field label="Descrição interna">
              <textarea name="description" defaultValue={c.description} />
            </Field>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setEditing(false)}
              >
                Descartar
              </button>
              <button className="button primary">Salvar alterações</button>
            </div>
          </Form>
        </Modal>
      )}
      {updateModal && (
        <Modal
          title={update ? "Editar andamento" : "Registrar andamento"}
          onClose={() => setUpdateModal(false)}
        >
          <Form
            onSubmit={(fd) => {
              if (
                run(
                  () =>
                    transact((d) =>
                      saveUpdate(
                        d,
                        user!,
                        {
                          caseId: c.id,
                          title: String(fd.get("title")),
                          description: String(fd.get("description")),
                          date: String(fd.get("date")),
                          public: fd.get("public") === "on",
                          documentId: String(fd.get("doc")) || undefined,
                        },
                        update?.id,
                      ),
                    ),
                  "Andamento salvo.",
                )
              )
                setUpdateModal(false);
            }}
          >
            <Field label="Título">
              <input name="title" required defaultValue={update?.title} />
            </Field>
            <Field label="Data do andamento">
              <input
                name="date"
                type="date"
                required
                defaultValue={
                  update?.date ||
                  new Date().toLocaleDateString("en-CA", {
                    timeZone: "America/Sao_Paulo",
                  })
                }
              />
            </Field>
            <Field label="Descrição">
              <textarea
                name="description"
                required
                rows={4}
                defaultValue={update?.description}
              />
            </Field>
            <Field label="Documento relacionado (opcional)">
              <select name="doc" defaultValue={update?.documentId || ""}>
                <option value="">Sem documento</option>
                {db.documents
                  .filter(
                    (d) => d.caseId === c.id && canAccessDocument(user!, d, db),
                  )
                  .map((d) => (
                    <option value={d.id} key={d.id}>
                      {d.name}
                      {d.internal ? " · interno" : ""}
                    </option>
                  ))}
              </select>
            </Field>
            <label className="check-field">
              <input
                type="checkbox"
                name="public"
                defaultChecked={update?.public ?? true}
              />
              Publicar para o cliente e autorizar como fonte da IA
            </label>
            <div className="modal-actions">
              <button className="button primary">Salvar andamento</button>
            </div>
          </Form>
        </Modal>
      )}
      {history && (
        <Modal title="Histórico de alterações" onClose={() => setHistory("")}>
          {db.updates
            .find((u) => u.id === history)
            ?.history.map((h, i) => (
              <div className="history-entry" key={i}>
                <strong>
                  {date(h.at)} · {db.users.find((u) => u.id === h.author)?.name}
                </strong>
                <pre>{h.text}</pre>
              </div>
            ))}
          {!db.updates.find((u) => u.id === history)?.history.length && (
            <p>Não houve edição deste andamento.</p>
          )}
        </Modal>
      )}
      {caseHistory && (
        <Modal
          title="Histórico dos dados do processo"
          onClose={() => setCaseHistory(false)}
        >
          {c.history?.length ? (
            [...c.history].reverse().map((h, i) => (
              <div className="history-entry" key={i}>
                <strong>
                  {date(h.at)} · {db.users.find((u) => u.id === h.author)?.name}
                </strong>
                <p>
                  {h.title} · {h.area} · {h.number || "Número não informado"}
                </p>
                <p>{h.description}</p>
              </div>
            ))
          ) : (
            <Empty
              title="Nenhuma alteração administrativa"
              text="As versões anteriores serão preservadas após a edição dos dados do processo."
            />
          )}
        </Modal>
      )}
    </div>
  );
}
