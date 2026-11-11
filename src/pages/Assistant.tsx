import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUp,
  History,
  LockKeyhole,
  Plus,
  Send,
  Sparkles,
} from "lucide-react";
import { useStore, transact } from "../store/store";
import {
  canAccessCase,
  canUseAssistant,
  canWriteCase,
} from "../domain/permissions";
import {
  audit,
  escalate,
  getCase,
  requireThat,
  sendMessage,
} from "../domain/actions";
import { answer } from "../services/assistant";
import {
  Badge,
  Empty,
  Field,
  Form,
  Info,
  Modal,
  PageHeading,
  SearchInput,
  useFeedback,
  useLocalState,
} from "../components/ui";
import { Viewer } from "../components/documents";
import { date, id, includes, now, time } from "../lib/format";
export function Assistant() {
  const { db, user } = useStore();
  const { run, confirm, toast } = useFeedback();
  const navigate = useNavigate();
  const [context, setContext] = useState("");
  const [threadId, setThreadId] = useState("");
  const [draft, setDraft] = useLocalState("assistant-draft:" + user!.id, "");
  const [history, setHistory] = useState(false);
  const [q, setQ] = useState("");
  const [generating, setGenerating] = useState(false);
  const [forward, setForward] = useState("");
  const [viewer, setViewer] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const can = canUseAssistant(user!, db);
  const cases = db.cases.filter((c) => canAccessCase(user!, c));
  const active = cases.filter((c) => canWriteCase(user!, c));
  const threads = db.threads.filter(
    (t) =>
      t.userId === user!.id &&
      (!t.caseId || cases.some((c) => c.id === t.caseId)),
  );
  const thread = threads.find((t) => t.id === threadId);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "end" });
  }, [thread?.messages.length, generating]);
  const newThread = () => {
    clearTimeout(timer.current);
    setGenerating(false);
    setThreadId("");
    setDraft("");
  };
  const send = (text = draft) => {
    if (!text.trim() || generating) return;
    const chosen = thread?.caseId || context;
    if (
      chosen &&
      !db.cases.some((c) => c.id === chosen && canWriteCase(user!, c))
    ) {
      toast("Escolha um processo ativo para continuar.");
      return;
    }
    if (!user!.preferences.aiAware) {
      toast(
        "Confirme a ciência dos limites do Assistente IA antes de continuar.",
      );
      return;
    }
    if (!db.aiEnabled) {
      toast("O Assistente IA está suspenso na política administrativa.");
      return;
    }
    const tid = thread?.id || id();
    if (
      !run(() =>
        transact((d) => {
          requireThat(canUseAssistant(user!, d));
          let t = d.threads.find((t) => t.id === tid && t.userId === user!.id);
          if (!t) {
            t = {
              id: tid,
              userId: user!.id,
              caseId: chosen,
              title: text.slice(0, 70),
              at: now(),
              messages: [],
            };
            d.threads.unshift(t);
          }
          t.messages.push({ id: id(), author: user!.id, text, at: now() });
        }),
      )
    )
      return;
    setThreadId(tid);
    setDraft("");
    setGenerating(true);
    timer.current = setTimeout(() => {
      setGenerating(false);
      run(() =>
        transact((d) => {
          requireThat(canUseAssistant(user!, d) && d.aiEnabled);
          const t = d.threads.find(
            (t) => t.id === tid && t.userId === user!.id,
          );
          if (!t) return;
          const c = d.cases.find(
            (c) => c.id === t.caseId && canAccessCase(user!, c),
          );
          if (t.caseId && !c) return;
          const result = answer(d, user!, c, text);
          t.messages.push({
            id: id(),
            author: "ia",
            text: result.text,
            at: now(),
            source: result.source,
          });
          audit(
            d,
            user!,
            "Consulta particular ao assistente",
            tid,
            "Somente metadados.",
          );
        }),
      );
    }, 1100);
  };
  return (
    <div className="page assistant-page">
      <PageHeading
        eyebrow="INFORMAÇÃO COM CONTEXTO"
        title={
          user!.role === "cliente"
            ? "Seu assistente particular"
            : "Assistente profissional"
        }
        description={
          user!.role === "cliente"
            ? "Uma conversa privada. Só você decide o que encaminhar ao advogado."
            : "Encontre informações nos processos e documentos autorizados."
        }
        action={
          <div className="inline-actions">
            <button
              className="button secondary"
              onClick={() => setHistory(true)}
            >
              <History size={17} />
              Histórico
            </button>
            <button className="button primary" onClick={newThread}>
              <Plus size={18} />
              Nova conversa
            </button>
          </div>
        }
      />
      {!user!.preferences.aiAware && (
        <Info>
          As respostas do Assistente IA são simuladas e dependem de fontes
          autorizadas. Ele não substitui avaliação profissional.{" "}
          <Link to="/sistema/transparencia">Conhecer os limites</Link>
          <button
            className="button secondary"
            onClick={() =>
              run(
                () =>
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
                "Ciência registrada.",
              )
            }
          >
            Estou ciente dos limites
          </button>
        </Info>
      )}
      {!can ? (
        <Empty
          title="Assistente indisponível"
          text="É necessário ter ao menos um processo ativo. Seu histórico permanece bloqueado enquanto não houver vínculo habilitado."
          action={
            <Link
              className="button secondary"
              to={"/" + user!.role + "/convites"}
            >
              Consultar convites
            </Link>
          }
        />
      ) : (
        <section className="assistant-workspace">
          <div className="assistant-context">
            <Sparkles size={20} />
            <strong>Assistente IA</strong>
            <Badge>Simulação</Badge>
            <select
              aria-label="Contexto do assistente"
              value={thread?.caseId || context}
              onChange={(e) => {
                const value = e.target.value;
                if (thread)
                  confirm(
                    "Trocar contexto",
                    "Uma conversa separada será iniciada para evitar misturar informações de processos.",
                    () => {
                      newThread();
                      setContext(value);
                    },
                  );
                else setContext(value);
              }}
            >
              <option value="">Perguntas gerais sobre o aplicativo</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} · {c.status}
                </option>
              ))}
            </select>
          </div>
          <div className="assistant-messages">
            {!thread?.messages.length ? (
              <div className="assistant-welcome">
                <div className="assistant-orb">
                  <Sparkles size={32} />
                </div>
                <span className="eyebrow">ASSISTENTE IA</span>
                <h2>O que vamos esclarecer hoje?</h2>
                <p>
                  Consulte informações e documentos do contexto selecionado.
                  <br />
                  Perguntas que exigem avaliação profissional devem ser
                  encaminhadas ao advogado.
                </p>
                <div className="suggestions">
                  {[
                    "Qual é o último andamento?",
                    "Quais documentos estão disponíveis?",
                    "Como funciona o aplicativo?",
                  ].map((s) => (
                    <button key={s} onClick={() => send(s)}>
                      <Sparkles size={16} />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              thread.messages.map((m) => (
                <article
                  className={
                    "assistant-message " + (m.author === "ia" ? "ai" : "own")
                  }
                  key={m.id}
                >
                  <strong>
                    {m.author === "ia" ? "Assistente IA" : user!.name}
                  </strong>
                  <p>{m.text}</p>
                  <small>{time(m.at)}</small>
                  {m.source && (
                    <button
                      className="text-link"
                      onClick={() => setViewer(m.source!)}
                    >
                      Abrir documento citado
                    </button>
                  )}
                  {user!.role === "cliente" && m.author !== "ia" && (
                    <button
                      className="text-link forward"
                      onClick={() => setForward(m.text)}
                    >
                      <Send size={13} />
                      Encaminhar pergunta
                    </button>
                  )}
                </article>
              ))
            )}
            {generating && (
              <div className="generating" role="status">
                <Sparkles size={17} />
                Gerando resposta...
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
            <div ref={end} />
          </div>
          <form
            className="assistant-composer"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <textarea
              aria-label="Pergunta ao assistente"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Pergunte ao Assistente IA..."
              rows={2}
            />
            <button
              className="send-button"
              aria-label="Enviar pergunta"
              disabled={!draft.trim() || generating}
            >
              <ArrowUp size={20} />
            </button>
          </form>
          <div className="assistant-privacy">
            <LockKeyhole size={14} />
            {user!.role === "cliente"
              ? "Seu histórico particular não é exibido aos advogados."
              : "Consultas isoladas por conta e processo."}{" "}
            A IA pode não ter base suficiente.
          </div>
        </section>
      )}
      {history && (
        <Modal
          title="Histórico do assistente"
          onClose={() => setHistory(false)}
        >
          {!can ? (
            <Info>Histórico bloqueado sem processo ativo.</Info>
          ) : (
            <>
              <SearchInput
                value={q}
                onChange={setQ}
                placeholder="Buscar conversa ou contexto"
              />
              <button
                className="text-link"
                onClick={() => {
                  newThread();
                  setHistory(false);
                }}
              >
                Iniciar nova conversa
              </button>
              {threads
                .filter((t) =>
                  includes(
                    t.title +
                      " " +
                      db.cases.find((c) => c.id === t.caseId)?.title,
                    q,
                  ),
                )
                .map((t) => (
                  <button
                    className="history-row"
                    key={t.id}
                    onClick={() => {
                      clearTimeout(timer.current);
                      setGenerating(false);
                      setThreadId(t.id);
                      setContext(t.caseId);
                      setHistory(false);
                    }}
                  >
                    <strong>{t.title}</strong>
                    <small>
                      {db.cases.find((c) => c.id === t.caseId)?.title ||
                        "Perguntas gerais"}{" "}
                      · {date(t.at)}
                    </small>
                  </button>
                ))}
              {!threads.filter((t) =>
                includes(
                  t.title +
                    " " +
                    db.cases.find((c) => c.id === t.caseId)?.title,
                  q,
                ),
              ).length && (
                <Empty
                  title={
                    q
                      ? "Nenhuma conversa encontrada"
                      : "Seu histórico começa na primeira pergunta"
                  }
                />
              )}
              <Info>
                Renomear e excluir históricos depende da política definitiva de
                retenção.
              </Info>
            </>
          )}
        </Modal>
      )}
      {forward && (
        <Modal
          title="Encaminhar pergunta ao advogado"
          onClose={() => setForward("")}
        >
          <Info>
            Somente a pergunta e o resumo confirmado abaixo serão enviados. O
            restante do histórico particular permanece privado.
          </Info>
          <Form
            onSubmit={(fd) => {
              const cid = String(fd.get("case"));
              const question = String(fd.get("question"));
              const summary = String(fd.get("summary"));
              if (
                run(
                  () =>
                    transact((d) => {
                      const c = getCase(d, user!, cid, true);
                      const mid = sendMessage(
                        d,
                        user!,
                        cid,
                        `Pergunta encaminhada: ${question}\nResumo confirmado: ${summary}`,
                      );
                      d.messages.find((m) => m.id === mid)!.status = "Entregue";
                      if (
                        !d.requests.some(
                          (r) =>
                            r.caseId === cid &&
                            r.question.includes(question) &&
                            r.status !== "Respondida",
                        )
                      )
                        escalate(d, user!, c, question);
                    }),
                  "Pergunta encaminhada, sem compartilhar seu histórico.",
                )
              ) {
                setForward("");
                navigate("/cliente/processos/" + cid + "/conversa");
              }
            }}
          >
            <Field label="Processo de destino">
              <select name="case" required defaultValue={context}>
                {active.map((c) => (
                  <option value={c.id} key={c.id}>
                    {c.title} ·{" "}
                    {db.users.find((u) => u.id === c.lawyers[0])?.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Pergunta original">
              <textarea name="question" required defaultValue={forward} />
            </Field>
            <Field label="Resumo para revisão">
              <textarea
                name="summary"
                required
                defaultValue={
                  "Solicito avaliação profissional sobre: " + forward
                }
              />
            </Field>
            <label className="check-field">
              <input required type="checkbox" />
              Confirmo o conteúdo e o processo de destino.
            </label>
            <div className="modal-actions">
              <button className="button primary" disabled={!active.length}>
                Confirmar encaminhamento
              </button>
            </div>
          </Form>
        </Modal>
      )}
      {viewer && <Viewer documentId={viewer} onClose={() => setViewer("")} />}
    </div>
  );
}
