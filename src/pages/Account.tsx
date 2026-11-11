import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, CheckCircle2, Download, Plus, ShieldCheck } from "lucide-react";
import { useStore, transact, logout, reset } from "../store/store";
import { audit, requireThat } from "../domain/actions";
import {
  Avatar,
  Badge,
  Empty,
  Field,
  Form,
  Info,
  Modal,
  PageHeading,
  Row,
  SearchInput,
  useFeedback,
} from "../components/ui";
import { date, download, id, includes, now, time } from "../lib/format";
import { canAccessCase, canAccessDocument } from "../domain/permissions";
export function Settings() {
  const { db, user } = useStore();
  const { run, confirm, toast } = useFeedback();
  const path = useLocation().pathname.split("/").at(-1)!;
  const [section, setSection] = useState(
    [
      "seguranca",
      "privacidade",
      "preferencias",
      "verificacao",
      "dados-profissionais",
    ].includes(path)
      ? path
      : "perfil",
  );
  const [sensitive, setSensitive] = useState("");
  const [revoked, setRevoked] = useState(false);
  const tabs = [
    ["perfil", "Perfil"],
    ["seguranca", "Segurança"],
    ["preferencias", "Notificações"],
    ["privacidade", "Privacidade"],
    ...(user!.role === "advogado"
      ? [["verificacao", "Verificação profissional"]]
      : []),
  ];
  return (
    <div className="page">
      <PageHeading
        title="Sua conta, suas preferências"
        description="Cuide do perfil e escolha como deseja usar o Elo Jurídico."
      />
      <div className="settings-layout">
        <aside className="panel settings-nav">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              className={section === key ? "active" : ""}
              onClick={() => setSection(key)}
            >
              {label}
            </button>
          ))}
          <button
            className="danger-text"
            onClick={() =>
              confirm(
                "Sair da conta",
                "Sua sessão será encerrada. Os dados fictícios permanecerão neste navegador.",
                logout,
              )
            }
          >
            Sair da conta
          </button>
        </aside>
        <section className="panel settings-content">
          {section === "perfil" || section === "dados-profissionais" ? (
            <>
              <div className="profile-heading">
                <Avatar name={user!.name} />
                <div>
                  <h2>{user!.name}</h2>
                  <small>{user!.email}</small>
                </div>
                <Badge>
                  {user!.role === "advogado"
                    ? user!.verified
                      ? "OAB aprovada na simulação"
                      : "OAB em análise"
                    : "Conta individual"}
                </Badge>
              </div>
              <Form
                onSubmit={(fd) =>
                  run(
                    () =>
                      transact((d) => {
                        const u = d.users.find((x) => x.id === user!.id)!;
                        u.name = String(fd.get("name"));
                        u.phone = String(fd.get("phone"));
                        audit(d, user!, "Editar perfil", u.id);
                      }),
                    "Perfil atualizado.",
                  )
                }
              >
                <Field label="Nome completo">
                  <input
                    name="name"
                    required
                    minLength={3}
                    defaultValue={user!.name}
                  />
                </Field>
                <Field label="Telefone">
                  <input
                    name="phone"
                    type="tel"
                    required
                    defaultValue={user!.phone}
                  />
                </Field>
                <Field
                  label="E-mail"
                  hint="Alteração de e-mail bloqueada até definição do fluxo de reconfirmação."
                >
                  <input value={user!.email} readOnly />
                </Field>
                {user!.oab && (
                  <Field label="OAB">
                    <input value={user!.oab} readOnly />
                  </Field>
                )}
                <button className="button primary">Salvar perfil</button>
              </Form>
              <div className="section-divider" />
              <h3>Dados da demonstração</h3>
              <p>
                Restaure os registros originais para reiniciar os testes. Isso
                remove as alterações locais desta aplicação e encerra sua
                sessão.
              </p>
              <button
                className="button danger-outline"
                onClick={() =>
                  confirm(
                    "Restaurar demonstração",
                    "Todas as alterações feitas no Elo Jurídico neste navegador serão substituídas pelos dados fictícios originais. Os arquivos reais do computador não serão alterados.",
                    () => {
                      reset();
                      window.location.hash = "";
                      window.location.assign("/login");
                    },
                    true,
                  )
                }
              >
                Restaurar dados fictícios
              </button>
            </>
          ) : section === "verificacao" ? (
            <>
              <ShieldCheck size={30} />
              <h2>Verificação profissional</h2>
              <Badge>
                {user!.verified
                  ? "Aprovada na simulação"
                  : user!.verificationState || "Em análise"}
              </Badge>
              <p>OAB {user!.oab}</p>
              {user!.verificationNote && <Info>{user!.verificationNote}</Info>}
              <Info>
                {user!.verified
                  ? "O cadastro fictício está liberado para os testes. Nenhuma consulta real à OAB foi realizada."
                  : "As funções profissionais serão liberadas após decisão administrativa. Acesse a demonstração de sócio para analisar esta conta."}
              </Info>
              <Link
                className="button secondary"
                to={"/" + user!.role + "/ajuda"}
              >
                Falar com suporte
              </Link>
              {!user!.verified && (
                <Form
                  onSubmit={(fd) =>
                    run(
                      () =>
                        transact((d) => {
                          const u = d.users.find((x) => x.id === user!.id)!;
                          u.oab = String(fd.get("oab"));
                          u.verificationState = "Em análise";
                          const proof = fd.get("proof");
                          if (proof instanceof File && proof.size > 0)
                            u.professionalEvidence = [
                              {
                                name: proof.name,
                                size: proof.size,
                                mime: proof.type,
                              },
                            ];
                          audit(d, user!, "Reenviar dados profissionais", u.id);
                        }),
                      "Dados reenviados para análise.",
                    )
                  }
                >
                  <Field label="Corrigir inscrição OAB">
                    <input
                      name="oab"
                      required
                      pattern="[0-9]{1,6}/[A-Z]{2}"
                      defaultValue={user!.oab}
                    />
                  </Field>
                  <Field label="Comprovante demonstrativo">
                    <input
                      name="proof"
                      type="file"
                      accept=".pdf,.png,.jpg"
                      required
                    />
                  </Field>
                  <button className="button primary">
                    Reenviar para análise
                  </button>
                </Form>
              )}
            </>
          ) : section === "seguranca" ? (
            <>
              <h2>Segurança da conta</h2>
              <Info>
                Credenciais e fatores são demonstrativos. Esta aplicação não
                implementa autenticação segura de produção.
              </Info>
              <Form
                onSubmit={(fd) =>
                  run(
                    () =>
                      transact((d) => {
                        requireThat(
                          fd.get("current") === user!.password,
                          "Senha atual incorreta.",
                        );
                        const next = String(fd.get("next"));
                        requireThat(
                          next.length >= 8,
                          "Use pelo menos 8 caracteres.",
                        );
                        d.users.find((u) => u.id === user!.id)!.password = next;
                        audit(d, user!, "Alterar senha", user!.id);
                      }),
                    "Senha demonstrativa alterada.",
                  )
                }
              >
                <Field label="Senha atual">
                  <input
                    name="current"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </Field>
                <Field label="Nova senha">
                  <input
                    name="next"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </Field>
                <button className="button primary">Alterar senha</button>
              </Form>
              <div className="section-divider" />
              <Row
                title="Proteção adicional"
                subtitle={user!.mfa ? "Ativada na simulação" : "Desativada"}
              >
                <button
                  className="button secondary"
                  disabled={user!.role === "administracao"}
                  title={
                    user!.role === "administracao"
                      ? "Fator obrigatório para administradores"
                      : undefined
                  }
                  onClick={() => setSensitive("mfa")}
                >
                  {user!.mfa ? "Desativar" : "Ativar"}
                </button>
              </Row>
              <Row
                title="Este navegador"
                subtitle="Sessão atual · demonstração local"
              >
                <Badge>Atual</Badge>
              </Row>
              {!revoked && (
                <Row
                  title="Dispositivo de teste"
                  subtitle="Sessão fictícia · último acesso 08/11/2026"
                >
                  <button
                    className="button secondary"
                    onClick={() => setSensitive("sessions")}
                  >
                    Encerrar outras sessões
                  </button>
                </Row>
              )}
              {revoked && <Info>Sessão fictícia revogada.</Info>}
            </>
          ) : section === "preferencias" ? (
            <>
              <h2>Preferências de notificações</h2>
              <p>
                As preferências controlam avisos opcionais. Os eventos continuam
                na central e os avisos de segurança são preservados.
              </p>
              {[
                "Convites",
                "Mensagens",
                "Documentos",
                "Processo concluído",
              ].map((cat) => (
                <label className="preference-row" key={cat}>
                  <span>
                    <strong>{cat}</strong>
                    <small>Avisos dentro do aplicativo</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={user!.preferences[cat] ?? true}
                    onChange={(e) =>
                      run(
                        () =>
                          transact((d) => {
                            d.users.find((u) => u.id === user!.id)!.preferences[
                              cat
                            ] = e.target.checked;
                            audit(d, user!, "Alterar preferência", cat);
                          }),
                        "Preferência salva.",
                      )
                    }
                  />
                </label>
              ))}
              <button
                className="button secondary"
                onClick={() =>
                  run(
                    () =>
                      transact((d) => {
                        d.users.find((u) => u.id === user!.id)!.preferences = {
                          Convites: true,
                          Mensagens: true,
                          Documentos: true,
                          "Processo concluído": true,
                        };
                      }),
                    "Padrão restaurado.",
                  )
                }
              >
                Restaurar padrão
              </button>
              <Info>
                Push e notificações do sistema operacional estão indisponíveis:
                esta demonstração utiliza apenas a central interna.
              </Info>
            </>
          ) : (
            <>
              <h2>Privacidade e dados</h2>
              <Info>
                O histórico do assistente pertence à conta. Um advogado não
                recebe o histórico particular do cliente. Encaminhar uma
                pergunta exige confirmação do conteúdo e destino.
              </Info>
              <label className="preference-row">
                <span>Estatísticas opcionais de uso (simuladas)</span>
                <input
                  type="checkbox"
                  checked={user!.preferences.analytics ?? false}
                  onChange={(e) =>
                    run(() =>
                      transact((d) => {
                        d.users.find(
                          (u) => u.id === user!.id,
                        )!.preferences.analytics = e.target.checked;
                        audit(d, user!, "Alterar privacidade", user!.id);
                      }),
                    )
                  }
                />
              </label>
              <div className="inline-actions">
                <button
                  className="button secondary"
                  onClick={() => setSensitive("export")}
                >
                  Solicitar cópia dos dados
                </button>
                <button
                  className="button danger-outline"
                  onClick={() => setSensitive("delete")}
                >
                  Solicitar exclusão da conta
                </button>
              </div>
              <Info>
                Pedidos passam por análise. Retenção, prazos e exclusão
                definitiva dependem de política aprovada; não são prometidos
                nesta demonstração.
              </Info>
              <h3>Seus pedidos</h3>
              {db.dataRequests
                .filter((r) => r.userId === user!.id && !r.documentId)
                .map((r) => (
                  <Row
                    title={r.type}
                    subtitle={`${date(r.at)} · ${r.answer || "Aguardando análise"}`}
                    key={r.id}
                  >
                    <Badge>{r.status}</Badge>
                    {r.status === "Pendente" && (
                      <button
                        className="text-link"
                        onClick={() =>
                          run(
                            () =>
                              transact((d) => {
                                d.dataRequests.find(
                                  (x) => x.id === r.id,
                                )!.status = "Cancelada";
                                audit(
                                  d,
                                  user!,
                                  "Cancelar pedido de dados",
                                  r.id,
                                );
                              }),
                            "Pedido cancelado.",
                          )
                        }
                      >
                        Cancelar
                      </button>
                    )}
                    {r.status === "Disponível" &&
                      r.type === "Exportação de dados" && (
                        <button
                          className="button secondary"
                          onClick={() =>
                            run(() => {
                              const ownCases = db.cases.filter((c) =>
                                canAccessCase(user!, c),
                              );
                              download(
                                "meus-dados-elo.json",
                                JSON.stringify(
                                  {
                                    perfil: {
                                      name: user!.name,
                                      email: user!.email,
                                      phone: user!.phone,
                                    },
                                    processos: ownCases,
                                    documentos: db.documents
                                      .filter((d) =>
                                        canAccessDocument(user!, d, db),
                                      )
                                      .map((d) => ({
                                        id: d.id,
                                        name: d.name,
                                        category: d.category,
                                      })),
                                    assistente: db.threads.filter(
                                      (t) => t.userId === user!.id,
                                    ),
                                  },
                                  null,
                                  2,
                                ),
                                "application/json",
                              );
                              transact((d) =>
                                audit(
                                  d,
                                  user!,
                                  "Baixar exportação pessoal",
                                  r.id,
                                ),
                              );
                            })
                          }
                        >
                          <Download size={15} />
                          Baixar pacote
                        </button>
                      )}
                  </Row>
                ))}
              <div className="inline-actions">
                <Link to="/sistema/privacidade">Política de privacidade</Link>
                <Link to="/sistema/termos">Termos</Link>
                <Link to="/sistema/transparencia">Transparência da IA</Link>
              </div>
            </>
          )}
        </section>
      </div>
      {sensitive && (
        <Modal
          title={
            sensitive === "delete"
              ? "Solicitar exclusão da conta"
              : "Confirmar identidade"
          }
          onClose={() => setSensitive("")}
        >
          <Info>
            {sensitive === "delete"
              ? "O pedido será registrado para análise. Processos ativos e obrigações de retenção podem impedir remoção imediata. Nenhum dado será apagado agora."
              : "Confirme sua senha demonstrativa para continuar."}
          </Info>
          <Form
            onSubmit={(fd) => {
              if (
                run(
                  () =>
                    transact((d) => {
                      requireThat(
                        fd.get("password") === user!.password,
                        "Senha incorreta.",
                      );
                      if (sensitive === "mfa")
                        d.users.find((u) => u.id === user!.id)!.mfa =
                          !user!.mfa;
                      else if (sensitive === "sessions") setRevoked(true);
                      else
                        d.dataRequests.unshift({
                          id: id(),
                          userId: user!.id,
                          type:
                            sensitive === "export"
                              ? "Exportação de dados"
                              : "Exclusão de conta",
                          reason: String(fd.get("reason") || ""),
                          status: "Pendente",
                          at: now(),
                        });
                      audit(
                        d,
                        user!,
                        "Ação de segurança/privacidade",
                        sensitive,
                      );
                    }),
                  "Solicitação registrada.",
                )
              ) {
                setSensitive("");
                toast("Operação demonstrativa registrada.");
              }
            }}
          >
            <Field label="Senha atual">
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
              />
            </Field>
            {sensitive === "delete" && (
              <Field label="Motivo (opcional)">
                <textarea name="reason" />
              </Field>
            )}
            <div className="modal-actions">
              <button className="button primary">Confirmar</button>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  );
}
export function Notifications() {
  const { db, user } = useStore();
  const { run } = useFeedback();
  const [filter, setFilter] = useState("Todas");
  const notices = db.notices.filter(
    (n) => n.userId === user!.id && (filter === "Todas" || !n.read),
  );
  return (
    <div className="page">
      <PageHeading
        title="Notificações"
        description="Cada evento leva ao processo, documento ou convite correspondente."
        action={
          <button
            className="button secondary"
            onClick={() =>
              run(
                () =>
                  transact((d) =>
                    d.notices
                      .filter((n) => n.userId === user!.id)
                      .forEach((n) => (n.read = true)),
                  ),
                "Notificações marcadas como lidas.",
              )
            }
          >
            <CheckCircle2 size={17} />
            Marcar todas como lidas
          </button>
        }
      />
      <div className="panel">
        <div className="tabs">
          {["Todas", "Não lidas"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={s === filter ? "active" : ""}
            >
              {s}
            </button>
          ))}
        </div>
        {notices.map((n) => (
          <Link
            className={"notice-row " + (n.read ? "" : "unread")}
            key={n.id}
            to={n.path}
            onClick={() =>
              run(() =>
                transact((d) => {
                  d.notices.find((x) => x.id === n.id)!.read = true;
                }),
              )
            }
          >
            <Bell size={21} />
            <div>
              <strong>{n.title}</strong>
              <small>
                {date(n.at)} às {time(n.at)} · {n.read ? "Lida" : "Não lida"}
                {user!.preferences[n.category] === false
                  ? " · Avisos opcionais desativados"
                  : ""}
              </small>
            </div>
          </Link>
        ))}
        {!notices.length && (
          <Empty
            title="Tudo em dia por aqui"
            text="Novos eventos aparecerão nesta central."
          />
        )}
      </div>
    </div>
  );
}
export function Support() {
  const { db, user } = useStore();
  const { run } = useFeedback();
  const [q, setQ] = useState("");
  const [create, setCreate] = useState(false);
  const [selected, setSelected] = useState("");
  const own = db.tickets.filter((t) => t.userId === user!.id);
  const ticket = own.find((t) => t.id === selected);
  const articles = [
    [
      "Como encontrar um arquivo?",
      "Os arquivos enviados pela conversa aparecem também em Documentos, no mesmo processo.",
    ],
    [
      "Quem pode ver meu assistente?",
      "O histórico particular é acessível apenas à sua conta. O encaminhamento compartilha só o conteúdo confirmado.",
    ],
    [
      "Como aceitar um convite?",
      "Abra Convites, confira o profissional e o processo e confirme o aceite.",
    ],
    [
      "Como funciona a IA?",
      "As respostas são simuladas. Perguntas que exigem avaliação profissional são encaminhadas aos advogados participantes.",
    ],
  ];
  return (
    <div className="page">
      <PageHeading
        title="Como podemos ajudar?"
        description="Orientações de uso e um canal para acompanhar suas solicitações."
        action={
          <button className="button primary" onClick={() => setCreate(true)}>
            <Plus size={18} />
            Novo chamado
          </button>
        }
      />
      <div className="panel help-panel">
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Buscar uma orientação"
        />
        {articles
          .filter((a) => includes(a.join(" "), q))
          .map(([title, text]) => (
            <details key={title}>
              <summary>{title}</summary>
              <p>{text}</p>
            </details>
          ))}
      </div>
      <section className="panel">
        <header className="section-head">
          <h2>Seus chamados</h2>
        </header>
        {own.map((t) => (
          <Row
            key={t.id}
            title={t.title}
            subtitle={`${t.id} · ${t.category}`}
            onClick={() => setSelected(t.id)}
          >
            <Badge>{t.status}</Badge>
          </Row>
        ))}
        {!own.length && (
          <Empty
            title="Você ainda não abriu chamados"
            text="Se precisar de ajuda com o aplicativo, crie uma solicitação."
          />
        )}
      </section>
      {create && (
        <Modal title="Novo chamado" onClose={() => setCreate(false)}>
          <Info>
            Envie apenas informações necessárias ao problema técnico. O suporte
            não recebe automaticamente seu histórico particular nem fornece
            orientação jurídica.
          </Info>
          <Form
            onSubmit={(fd) => {
              if (
                run(
                  () =>
                    transact((d) => {
                      const tid = "SUP-" + id().slice(0, 6);
                      d.tickets.unshift({
                        id: tid,
                        userId: user!.id,
                        title: String(fd.get("title")),
                        category: String(fd.get("category")),
                        status: "Aberto",
                        priority: "Normal",
                        messages: [
                          {
                            author: user!.id,
                            text:
                              String(fd.get("text")) +
                              (fd.get("attachment") instanceof File &&
                              (fd.get("attachment") as File).name
                                ? "\nEvidência demonstrativa: " +
                                  (fd.get("attachment") as File).name
                                : ""),
                            at: now(),
                            internal: false,
                          },
                        ],
                      });
                      audit(d, user!, "Abrir chamado", tid);
                    }),
                  "Chamado aberto com protocolo.",
                )
              )
                setCreate(false);
            }}
          >
            <Field label="Assunto">
              <input name="title" required minLength={3} />
            </Field>
            <Field label="Categoria">
              <select name="category">
                {[
                  "Acesso",
                  "Documentos",
                  "Cadastro",
                  "Privacidade",
                  "Outros",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Descrição">
              <textarea name="text" required rows={4} />
            </Field>
            <Field label="Evidência técnica (nome simulado)">
              <input
                type="file"
                name="attachment"
                accept=".png,.jpg,.txt,.pdf"
              />
            </Field>
            <div className="modal-actions">
              <button className="button primary">Abrir chamado</button>
            </div>
          </Form>
        </Modal>
      )}
      {ticket && (
        <Modal
          title={ticket.id + " · " + ticket.title}
          onClose={() => setSelected("")}
        >
          <Badge>{ticket.status}</Badge>
          {ticket.messages
            .filter((m) => !m.internal)
            .map((m, i) => (
              <div className="ticket-message" key={i}>
                <strong>{db.users.find((u) => u.id === m.author)?.name}</strong>
                <p>{m.text}</p>
                <small>
                  {date(m.at)} às {time(m.at)}
                </small>
              </div>
            ))}
          <Form
            onSubmit={(fd) =>
              run(
                () =>
                  transact((d) => {
                    const t = d.tickets.find(
                      (t) => t.id === ticket.id && t.userId === user!.id,
                    )!;
                    t.messages.push({
                      author: user!.id,
                      text: String(fd.get("text")),
                      at: now(),
                      internal: false,
                    });
                    t.status = "Aberto";
                    audit(d, user!, "Responder chamado", ticket.id);
                  }),
                "Resposta salva.",
              )
            }
          >
            <Field label="Sua resposta">
              <textarea name="text" required />
            </Field>
            <div className="inline-actions">
              <button className="button primary">Enviar resposta</button>
              <button
                type="button"
                className="button secondary"
                onClick={() =>
                  run(
                    () =>
                      transact((d) => {
                        const t = d.tickets.find((x) => x.id === ticket.id)!;
                        t.status =
                          t.status === "Resolvido" ? "Reaberto" : "Resolvido";
                        audit(d, user!, "Alterar estado do chamado", t.id);
                      }),
                    "Chamado atualizado.",
                  )
                }
              >
                {ticket.status === "Resolvido"
                  ? "Reabrir"
                  : "Encerrar atendimento"}
              </button>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  );
}
export function DocumentRequests() {
  const { db, user } = useStore();
  const { run, confirm } = useFeedback();
  const [selected, setSelected] = useState("");
  const requests = db.dataRequests.filter(
    (r) =>
      r.documentId &&
      (user!.role === "cliente"
        ? r.userId === user!.id
        : db.cases.some((c) => c.id === r.caseId && canAccessCase(user!, c))),
  );
  const r = requests.find((r) => r.id === selected);
  return (
    <div className="page">
      <PageHeading
        title="Solicitações sobre documentos"
        description="Acompanhe os pedidos sem alterar os arquivos antes da decisão."
      />
      <div className="panel">
        {requests.map((r) => (
          <Row
            key={r.id}
            title={
              db.documents.find((d) => d.id === r.documentId)?.name ||
              "Documento"
            }
            subtitle={`${r.type} · ${date(r.at)}`}
            onClick={() => setSelected(r.id)}
          >
            <Badge>{r.status}</Badge>
          </Row>
        ))}
        {!requests.length && (
          <Empty
            title="Nenhuma solicitação registrada"
            action={
              <Link
                className="button secondary"
                to={"/" + user!.role + "/documentos"}
              >
                Ver documentos
              </Link>
            }
          />
        )}
      </div>
      {r && (
        <Modal title="Detalhes da solicitação" onClose={() => setSelected("")}>
          <Badge>{r.status}</Badge>
          <p>Protocolo: {r.id}</p>
          <p>{r.reason || "Motivo não informado."}</p>
          <p>{r.answer}</p>
          <Link
            className="button secondary"
            to={"/" + user!.role + "/documentos?arquivo=" + r.documentId}
          >
            Abrir documento
          </Link>
          {r.status === "Pendente" && user!.role === "cliente" && (
            <>
              <button
                className="button secondary"
                onClick={() =>
                  confirm(
                    "Cancelar solicitação",
                    "O pedido de exclusão será cancelado. O documento continuará acessível.",
                    () =>
                      transact((d) => {
                        d.dataRequests.find((x) => x.id === r.id)!.status =
                          "Cancelada";
                        audit(
                          d,
                          user!,
                          "Cancelar solicitação documental",
                          r.id,
                        );
                      }),
                  )
                }
              >
                Cancelar solicitação
              </button>
              <Form
                onSubmit={(fd) =>
                  run(
                    () =>
                      transact((d) => {
                        d.dataRequests.find((x) => x.id === r.id)!.reason +=
                          "\nComplemento: " + String(fd.get("text"));
                        audit(d, user!, "Complementar solicitação", r.id);
                      }),
                    "Complemento salvo.",
                  )
                }
              >
                <Field label="Complementar pedido">
                  <textarea name="text" required />
                </Field>
                <button className="button primary">Enviar complemento</button>
              </Form>
            </>
          )}
          {r.status === "Pendente" && user!.role === "advogado" && (
            <Info>
              Para aprovar a remoção, abra Documentos e utilize Excluir no
              arquivo correspondente. A ação exige confirmação e permissão no
              processo ativo.
            </Info>
          )}
        </Modal>
      )}
    </div>
  );
}
