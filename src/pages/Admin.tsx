import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Download,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  FileWarning,
  LifeBuoy,
} from "lucide-react";
import { useStore, transact } from "../store/store";
import { audit, notify, requireThat } from "../domain/actions";
import {
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
import { date, download, id, includes, now, size, time } from "../lib/format";
import { needsLawyer } from "../services/assistant";
import { classifyFile } from "../services/classification";
import type { DB } from "../domain/types";
const titles: Record<string, string> = {
  "": "Painel operacional",
  usuarios: "Usuários e contas",
  oab: "Verificação profissional",
  processos: "Processos e vínculos",
  administradores: "Administradores do sistema",
  suporte: "Central de suporte",
  armazenamento: "Armazenamento e arquivos",
  auditoria: "Logs e auditoria",
  incidentes: "Incidentes de segurança",
  privacidade: "Solicitações de privacidade",
  ia: "Políticas da IA",
  monitoramento: "Monitoramento da IA",
  categorias: "Categorias documentais",
};
export function Admin() {
  const { db, user } = useStore();
  const { run, confirm, toast } = useFeedback();
  const location = useLocation();
  const key = location.pathname.split("/")[2] || "";
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Todas");
  const [selected, setSelected] = useState(
    new URLSearchParams(location.search).get("conta") || "",
  );
  const [auditError, setAuditError] = useState("");
  const [create, setCreate] = useState(false);
  const [limit, setLimit] = useState(15);
  const [period, setPeriod] = useState("all");
  const [example, setExample] = useState("");
  const actorId = user!.id;
  useEffect(() => {
    if (!q.trim()) return;
    const t = setTimeout(() => {
      try {
        transact((d) => {
          const actor = d.users.find(
            (u) => u.id === actorId && u.active && u.role === "administracao",
          );
          requireThat(actor);
          audit(
            d,
            actor!,
            "Pesquisar área administrativa",
            key,
            `Busca com ${q.length} caracteres; termo omitido por minimização.`,
          );
        });
      } catch (e) {
        setAuditError((e as Error).message);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [q, key, actorId]);
  const act = (
    action: string,
    resource: string,
    fn: (d: DB) => void,
    reason?: string,
  ) =>
    run(
      () =>
        transact((d) => {
          requireThat(
            user!.role === "administracao" &&
              d.users.some((u) => u.id === user!.id && u.active),
          );
          fn(d);
          audit(d, user!, action, resource, reason);
        }),
      "Operação administrativa registrada.",
    );
  const exportData = (data: unknown) => {
    if (act("Exportar relatório", key, () => {}))
      download(
        "elo-" + (key || "operacao") + "-demonstracao.json",
        JSON.stringify(data, null, 2),
        "application/json",
      );
  };
  const ownStatus = (status: string) => filter === "Todas" || filter === status;
  const account = db.users.find((u) => u.id === selected);
  const ticket = db.tickets.find((t) => t.id === selected);
  const doc = db.documents.find((d) => d.id === selected);
  const incident = db.incidents.find((i) => i.id === selected);
  const request = db.dataRequests.find((r) => r.id === selected);
  const log = db.audits.find((a) => a.id === selected);
  const category = db.categories.find((c) => c.id === selected);
  const policy = db.policies.find((p) => String(p.version) === selected);
  const legalCase = db.cases.find((c) => c.id === selected);
  const accounts = db.users.filter(
    (u) =>
      (key === "oab"
        ? u.role === "advogado"
        : key === "administradores"
          ? u.role === "administracao"
          : true) &&
      includes(u.name + " " + u.email + " " + u.oab, q) &&
      ownStatus(
        key === "oab"
          ? u.verified
            ? "Aprovado"
            : u.verificationState || "Pendente"
          : u.active
            ? "Ativa"
            : "Suspensa",
      ),
  );
  const statusOptions =
    key === "oab"
      ? [
          "Pendente",
          "Em análise",
          "Correção necessária",
          "Rejeitado",
          "Aprovado",
        ]
      : key === "usuarios" || key === "administradores"
        ? ["Ativa", "Suspensa"]
        : key === "suporte"
          ? [
              "Aberto",
              "Em análise",
              "Em atendimento",
              "Aguardando usuário",
              "Resolvido",
              "Reaberto",
              "Escalado",
            ]
          : key === "armazenamento"
            ? [
                "Disponível",
                "Processando",
                "Organização pendente",
                "Indisponível",
                "Quarentena",
              ]
            : key === "privacidade"
              ? [
                  "Pendente",
                  "Em análise",
                  "Disponível",
                  "Concluída",
                  "Recusada",
                  "Cancelada",
                ]
              : key === "incidentes"
                ? [
                    "Aberto",
                    "Investigando",
                    "Contido",
                    "Monitorando",
                    "Encerrado",
                  ]
                : key === "processos"
                  ? [
                      "Ativo",
                      "Aguardando aceite",
                      "Concluído",
                      "Cancelado",
                      "Suspenso",
                    ]
                  : [];
  const logs = db.audits.filter(
    (l) =>
      includes(
        l.action +
          " " +
          l.resource +
          " " +
          db.users.find((u) => u.id === l.actor)?.name,
        q,
      ) &&
      (period === "all" ||
        Date.parse(l.at) > Date.now() - Number(period) * 86400000),
  );
  const recent = (s: string) =>
    period === "all" || Date.parse(s) > Date.now() - Number(period) * 86400000;
  const resultCount =
    key === "processos"
      ? db.cases.filter(
          (c) => includes(c.id + " " + c.number, q) && ownStatus(c.status),
        ).length
      : key === "suporte"
        ? db.tickets.filter(
            (t) => includes(t.title + " " + t.id, q) && ownStatus(t.status),
          ).length
        : key === "armazenamento"
          ? db.documents.filter(
              (d) => !d.deleted && includes(d.id, q) && ownStatus(d.state),
            ).length
          : key === "incidentes"
            ? db.incidents.filter(
                (i) => includes(i.title + " " + i.id, q) && ownStatus(i.status),
              ).length
            : key === "ia"
              ? db.policies.filter((p) => includes(p.text, q)).length
              : key === "categorias"
                ? db.categories.filter((c) =>
                    includes(c.name + " " + c.synonyms, q),
                  ).length
                : undefined;
  return (
    <div className="page">
      {auditError && <Info error>{auditError}</Info>}
      <PageHeading
        eyebrow="OPERAÇÃO · ACESSO INDIVIDUAL AUDITADO"
        title={titles[key] || "Administração"}
        description="Informações operacionais com acesso limitado à finalidade de cada ação."
        action={
          <div className="inline-actions">
            {["administradores", "incidentes", "categorias", "ia"].includes(
              key,
            ) && (
              <button
                className="button primary"
                onClick={() => setCreate(true)}
              >
                <Plus size={17} />
                {key === "ia" ? "Nova política" : "Adicionar"}
              </button>
            )}
            <button
              className="button secondary"
              onClick={() => {
                setLimit(15);
                toast("Indicadores atualizados com os dados locais.");
              }}
            >
              <RefreshCw size={16} />
              Atualizar
            </button>
          </div>
        }
      />
      {key === "" ? (
        <>
          <div className="list-toolbar panel">
            <Field label="Período dos indicadores">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="all">Todo o período</option>
                <option value="1">Últimas 24 horas</option>
                <option value="7">Últimos 7 dias</option>
                <option value="30">Últimos 30 dias</option>
              </select>
            </Field>
            <Field label="Situação dos indicadores">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>Todas</option>
                <option>Pendentes</option>
              </select>
            </Field>
          </div>
          <div className="overview-stats">
            {(
              [
                [
                  ShieldCheck,
                  "OAB pendentes",
                  db.users.filter(
                    (u) =>
                      u.role === "advogado" &&
                      !u.verified &&
                      recent("2026-11-09T12:00:00Z"),
                  ).length,
                  "oab",
                ],
                [
                  LifeBuoy,
                  "Chamados no período",
                  db.tickets.filter(
                    (t) =>
                      (filter === "Todas" || t.status !== "Resolvido") &&
                      recent(t.messages[0]?.at || now()),
                  ).length,
                  "suporte",
                ],
                [
                  Users,
                  "Pedidos de privacidade",
                  db.dataRequests.filter(
                    (r) =>
                      !r.documentId &&
                      (filter === "Todas" || r.status === "Pendente") &&
                      recent(r.at),
                  ).length,
                  "privacidade",
                ],
                [
                  FileWarning,
                  "Arquivos no período",
                  db.documents.filter(
                    (d) =>
                      !d.deleted &&
                      (filter === "Todas" || d.state !== "Disponível") &&
                      recent(d.versions.at(-1)!.at),
                  ).length,
                  "armazenamento",
                ],
              ] as const
            ).map(([Icon, title, num, path]) => (
              <Link
                className="stat"
                to={"/administracao/" + path}
                key={title as string}
              >
                <div>
                  <span>{title as string}</span>
                  <Icon size={21} />
                </div>
                <strong>{String(num).padStart(2, "0")}</strong>
                <small>
                  Abrir fila <ArrowRight size={14} />
                </small>
              </Link>
            ))}
          </div>
          <Info>
            Os sócios usam contas individuais com acesso administrativo
            completo. Conversas e conteúdo jurídico não são exibidos por padrão.
          </Info>
          <div className="dashboard-columns">
            <section className="panel">
              <header className="section-head">
                <h2>Atividade administrativa recente</h2>
                <Link to="/administracao/auditoria">Abrir auditoria</Link>
              </header>
              {db.audits
                .filter(
                  (a) =>
                    db.users.find((u) => u.id === a.actor)?.role ===
                    "administracao",
                )
                .slice(0, 6)
                .map((a) => (
                  <Row
                    key={a.id}
                    title={a.action}
                    subtitle={`${db.users.find((u) => u.id === a.actor)?.name} · ${date(a.at)} ${time(a.at)}`}
                  >
                    <Badge>{a.result}</Badge>
                  </Row>
                ))}
            </section>
            <section className="attention-panel">
              <Activity size={26} />
              <h2>Assistente IA</h2>
              <p>
                {db.aiEnabled ? "Simulação habilitada." : "Função suspensa."}{" "}
                Política publicada v
                {db.policies.find((p) => p.status === "Publicada")?.version ||
                  1}
                .
              </p>
              <Link to="/administracao/monitoramento">
                Consultar monitoramento
                <ArrowRight size={17} />
              </Link>
            </section>
          </div>
          <button
            className="button secondary"
            onClick={() =>
              exportData({
                users: db.users.length,
                cases: db.cases.length,
                files: db.documents.length,
                tickets: db.tickets.length,
              })
            }
          >
            <Download size={17} />
            Exportar indicadores
          </button>
        </>
      ) : (
        <>
          <div className="panel admin-list">
            <div className="list-toolbar">
              <SearchInput
                value={q}
                onChange={setQ}
                placeholder="Buscar nesta área"
              />
              {statusOptions.length > 0 && (
                <select
                  value={filter}
                  aria-label="Filtrar situação"
                  onChange={(e) => setFilter(e.target.value)}
                >
                  {["Todas", ...statusOptions].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              )}
              {key === "auditoria" && (
                <select
                  aria-label="Período dos eventos"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                >
                  <option value="all">Todo o período</option>
                  <option value="1">Últimas 24 horas</option>
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                </select>
              )}
              <button
                className="button secondary"
                onClick={() => {
                  if (key === "auditoria") exportData(logs);
                  else if (["usuarios", "administradores", "oab"].includes(key))
                    exportData(
                      accounts.map((u) => ({
                        id: u.id,
                        name: u.name,
                        role: u.role,
                        active: u.active,
                        verified: u.verified,
                      })),
                    );
                  else if (key === "armazenamento")
                    exportData(
                      db.documents
                        .filter(
                          (d) =>
                            !d.deleted &&
                            includes(d.id, q) &&
                            ownStatus(d.state),
                        )
                        .map((d) => ({
                          id: d.id,
                          owner: d.owner,
                          state: d.state,
                          bytes: d.versions.at(-1)?.size,
                          versions: d.versions.length,
                        })),
                    );
                  else if (key === "suporte")
                    exportData(
                      db.tickets
                        .filter(
                          (t) =>
                            includes(t.id + " " + t.title, q) &&
                            ownStatus(t.status),
                        )
                        .map((t) => ({
                          id: t.id,
                          status: t.status,
                          priority: t.priority,
                          category: t.category,
                        })),
                    );
                  else if (key === "processos")
                    exportData(
                      db.cases
                        .filter(
                          (c) =>
                            includes(c.id + " " + c.number, q) &&
                            ownStatus(c.status),
                        )
                        .map((c) => ({
                          id: c.id,
                          status: c.status,
                          createdAt: c.createdAt,
                          clients: c.clients,
                          lawyers: c.lawyers,
                        })),
                    );
                  else if (key === "monitoramento")
                    exportData({
                      responses: db.messages.filter((m) => m.author === "ia")
                        .length,
                      requests: db.requests.length,
                      enabled: db.aiEnabled,
                    });
                  else if (key === "categorias")
                    exportData(
                      db.categories.filter((c) => includes(c.name, q)),
                    );
                  else if (key === "ia") exportData(db.policies);
                  else if (key === "incidentes")
                    exportData(
                      db.incidents.filter(
                        (i) =>
                          includes(i.title + " " + i.id, q) &&
                          ownStatus(i.status),
                      ),
                    );
                  else if (key === "privacidade")
                    exportData(
                      db.dataRequests
                        .filter((r) => !r.documentId && ownStatus(r.status))
                        .map((r) => ({
                          id: r.id,
                          type: r.type,
                          status: r.status,
                          at: r.at,
                        })),
                    );
                }}
              >
                <Download size={16} />
                Exportar
              </button>
            </div>
            {resultCount === 0 && (
              <Empty
                title="Nenhum resultado neste filtro"
                text="Ajuste a pesquisa ou a situação selecionada."
              />
            )}
            {["usuarios", "administradores", "oab"].includes(key) ? (
              <>
                {accounts.slice(0, limit).map((u) => (
                  <Row
                    key={u.id}
                    title={u.name}
                    subtitle={`${u.email} · ${u.oab ? "OAB " + u.oab : u.role}`}
                    onClick={() => {
                      act("Consultar conta", u.id, () => {});
                      setSelected(u.id);
                    }}
                  >
                    <Badge>
                      {key === "oab"
                        ? u.verified
                          ? "Aprovado"
                          : u.verificationState || "Pendente"
                        : u.active
                          ? "Ativa"
                          : "Suspensa"}
                    </Badge>
                  </Row>
                ))}
                {!accounts.length && <Empty />}
              </>
            ) : key === "processos" ? (
              <>
                {db.cases
                  .filter(
                    (c) =>
                      includes(c.id + " " + c.number, q) && ownStatus(c.status),
                  )
                  .slice(0, limit)
                  .map((c) => (
                    <Row
                      key={c.id}
                      title={c.number || "Sem número"}
                      subtitle={`ID ${c.id} · ${c.clients.length} clientes · ${c.lawyers.length} advogados · Criado ${date(c.createdAt)}`}
                      onClick={() => {
                        act("Consultar vínculo técnico", c.id, () => {});
                        setSelected(c.id);
                      }}
                    >
                      <Badge>{c.status}</Badge>
                    </Row>
                  ))}
              </>
            ) : key === "suporte" ? (
              <>
                {db.tickets
                  .filter(
                    (t) =>
                      includes(t.title + " " + t.id, q) && ownStatus(t.status),
                  )
                  .slice(0, limit)
                  .map((t) => (
                    <Row
                      key={t.id}
                      title={t.title}
                      subtitle={`${t.id} · ${db.users.find((u) => u.id === t.userId)?.name} · ${t.priority}`}
                      onClick={() => setSelected(t.id)}
                    >
                      <Badge>{t.status}</Badge>
                    </Row>
                  ))}
              </>
            ) : key === "armazenamento" ? (
              <>
                {db.documents
                  .filter(
                    (d) =>
                      !d.deleted && includes(d.id, q) && ownStatus(d.state),
                  )
                  .slice(0, limit)
                  .map((d) => (
                    <Row
                      key={d.id}
                      title={"Arquivo " + d.id}
                      subtitle={`${size(d.versions.at(-1)!.size)} · ${d.versions.length} versão(ões) · Conta ${d.owner}`}
                      onClick={() => {
                        act("Consultar metadados de arquivo", d.id, () => {});
                        setSelected(d.id);
                      }}
                    >
                      <Badge>{d.state}</Badge>
                    </Row>
                  ))}
              </>
            ) : key === "auditoria" ? (
              <>
                {logs.slice(0, limit).map((a) => (
                  <Row
                    key={a.id}
                    title={a.action}
                    subtitle={`${db.users.find((u) => u.id === a.actor)?.name || a.actor} · ${date(a.at)} às ${time(a.at)} · ${a.resource}`}
                    onClick={() => setSelected(a.id)}
                  >
                    <Badge>{a.result}</Badge>
                  </Row>
                ))}
                {!logs.length && <Empty />}
              </>
            ) : key === "incidentes" ? (
              <>
                {db.incidents
                  .filter(
                    (i) =>
                      includes(i.title + " " + i.id, q) && ownStatus(i.status),
                  )
                  .map((i) => (
                    <Row
                      key={i.id}
                      title={i.title}
                      subtitle={`${i.id} · Gravidade ${i.severity}`}
                      onClick={() => setSelected(i.id)}
                    >
                      <Badge>{i.status}</Badge>
                    </Row>
                  ))}
              </>
            ) : key === "privacidade" ? (
              <>
                {db.dataRequests
                  .filter(
                    (r) =>
                      !r.documentId &&
                      includes(
                        r.type +
                          " " +
                          db.users.find((u) => u.id === r.userId)?.name,
                        q,
                      ) &&
                      ownStatus(r.status),
                  )
                  .map((r) => (
                    <Row
                      key={r.id}
                      title={r.type}
                      subtitle={`${db.users.find((u) => u.id === r.userId)?.name} · ${date(r.at)}`}
                      onClick={() => setSelected(r.id)}
                    >
                      <Badge>{r.status}</Badge>
                    </Row>
                  ))}
                {!db.dataRequests.some((r) => !r.documentId) && (
                  <Empty
                    title="Nenhum pedido de privacidade"
                    text="Pedidos criados nas configurações das contas aparecerão aqui."
                  />
                )}
              </>
            ) : key === "ia" ? (
              <>
                {db.policies
                  .filter((p) => includes(p.text, q))
                  .map((p) => (
                    <Row
                      key={p.version}
                      title={"Política v" + p.version}
                      subtitle={`${date(p.at)} · ${db.users.find((u) => u.id === p.author)?.name}`}
                      onClick={() => setSelected(String(p.version))}
                    >
                      <Badge>{p.status}</Badge>
                    </Row>
                  ))}
                <div className="admin-section">
                  <h3>Simular classificação</h3>
                  <Field label="Exemplo de pergunta">
                    <input
                      value={example}
                      onChange={(e) => setExample(e.target.value)}
                    />
                  </Field>
                  {example && (
                    <Info>
                      {needsLawyer(example)
                        ? "Encaminhar para avaliação dos advogados."
                        : "Consultar fontes autorizadas; responder apenas quando houver base suficiente."}
                    </Info>
                  )}
                  <Info>
                    As regras mínimas de privacidade, identificação e
                    encaminhamento permanecem obrigatórias. O texto da política
                    é versionado; não executa instruções arbitrárias.
                  </Info>
                </div>
              </>
            ) : key === "monitoramento" ? (
              <div className="admin-section">
                <div className="overview-stats">
                  <div className="stat">
                    <span>Respostas simuladas</span>
                    <strong>
                      {db.messages.filter((m) => m.author === "ia").length}
                    </strong>
                  </div>
                  <div className="stat">
                    <span>Encaminhamentos</span>
                    <strong>{db.requests.length}</strong>
                  </div>
                  <div className="stat">
                    <span>Política ativa</span>
                    <strong>
                      v
                      {db.policies.find((p) => p.status === "Publicada")
                        ?.version || 1}
                    </strong>
                  </div>
                </div>
                <Info>
                  Amostras de conteúdo e históricos particulares não são
                  exibidos. Apenas indicadores e metadados autorizados.
                </Info>
                <button
                  className="button danger-outline"
                  onClick={() =>
                    confirm(
                      db.aiEnabled
                        ? "Suspender Assistente IA"
                        : "Reativar Assistente IA",
                      "A função de resposta simulada será " +
                        (db.aiEnabled ? "suspensa" : "reativada") +
                        ". O histórico permanece preservado.",
                      () => {
                        act(
                          "Alterar disponibilidade da IA",
                          "Assistente IA",
                          (d) => {
                            d.aiEnabled = !d.aiEnabled;
                          },
                        );
                      },
                    )
                  }
                >
                  {db.aiEnabled ? "Suspender função" : "Reativar função"}
                </button>
                <h3 className="monitoring-title">
                  Eventos operacionais autorizados
                </h3>
                {db.audits
                  .filter(
                    (a) =>
                      includes(a.action + " " + a.resource, q) &&
                      /IA|Encaminhar/.test(a.action),
                  )
                  .slice(0, limit)
                  .map((a) => (
                    <Row
                      key={a.id}
                      title={a.action}
                      subtitle={`Recurso ${a.resource} · ${date(a.at)} ${time(a.at)} · sem conteúdo jurídico`}
                      onClick={() => setSelected(a.id)}
                    />
                  ))}
                <Info>
                  Classifique uma ocorrência pelos metadados. Nenhuma conversa
                  particular é aberta para avaliação.
                </Info>
              </div>
            ) : key === "categorias" ? (
              <>
                {db.categories
                  .filter((c) => includes(c.name + " " + c.synonyms, q))
                  .map((c) => (
                    <Row
                      key={c.id}
                      title={c.name}
                      subtitle={c.description}
                      onClick={() => setSelected(c.id)}
                    >
                      <Badge>{c.active ? "Ativa" : "Inativa"}</Badge>
                    </Row>
                  ))}
                <div className="admin-section">
                  <Field label="Testar classificação pelo nome do arquivo">
                    <input
                      value={example}
                      onChange={(e) => setExample(e.target.value)}
                      placeholder="Ex.: contrato-assinado.pdf"
                    />
                  </Field>
                  {example && (
                    <Info>Categoria sugerida: {classifyFile(db, example)}</Info>
                  )}
                </div>
              </>
            ) : (
              <Empty />
            )}
            {[
              "usuarios",
              "administradores",
              "oab",
              "processos",
              "suporte",
              "armazenamento",
              "auditoria",
            ].includes(key) && (
              <button
                className="button secondary load-more"
                disabled={
                  (key === "auditoria"
                    ? logs.length
                    : key === "armazenamento"
                      ? db.documents.length
                      : key === "processos"
                        ? db.cases.length
                        : key === "suporte"
                          ? db.tickets.length
                          : accounts.length) <= limit
                }
                onClick={() => setLimit(limit + 15)}
              >
                Carregar mais
              </button>
            )}
          </div>
        </>
      )}
      {account && ["usuarios", "oab", "administradores"].includes(key) && (
        <Modal title={account.name} onClose={() => setSelected("")}>
          <p>
            {account.email} · {account.role}
          </p>
          <Badge>{account.active ? "Ativa" : "Suspensa"}</Badge>
          {account.oab && (
            <p>
              OAB {account.oab} ·{" "}
              {account.verified ? "Aprovada na simulação" : "Em análise"}
            </p>
          )}
          <Info>
            Dados e evidências fictícios. Não existe consulta real à OAB.
            Conversas e documentos jurídicos não são acessados aqui.
          </Info>
          {key === "oab" && (
            <Info>
              Evidências demonstrativas:{" "}
              {account.professionalEvidence
                ?.map((p) => p.name + " (" + size(p.size) + ")")
                .join(", ") ||
                "Comprovante fictício de referência para análise manual."}
              {account.reviewOwner && (
                <p>
                  Análise atribuída a{" "}
                  {db.users.find((u) => u.id === account.reviewOwner)?.name}.
                </p>
              )}
            </Info>
          )}
          <Form
            onSubmit={(fd) => {
              const decision = String(fd.get("decision"));
              const reason = String(fd.get("reason"));
              if (
                act(
                  "Decisão administrativa: " + decision,
                  account.id,
                  (d) => {
                    const u = d.users.find((u) => u.id === account.id)!;
                    requireThat(reason.trim(), "Informe a justificativa.");
                    if (decision === "Redefinir proteção demonstrativa") {
                      u.mfa = true;
                      u.sessionVersion = (u.sessionVersion || 0) + 1;
                    } else if (decision === "Aprovar OAB") {
                      u.verified = true;
                      u.verificationState = "Aprovado";
                      u.verificationNote = reason;
                    } else if (
                      decision === "Rejeitar OAB" ||
                      decision === "Solicitar correção"
                    ) {
                      u.verified = false;
                      u.verificationState =
                        decision === "Rejeitar OAB"
                          ? "Rejeitado"
                          : "Correção necessária";
                      u.verificationNote = reason;
                    } else if (decision === "Atribuir análise") {
                      u.reviewOwner = user!.id;
                      u.verificationState = "Em análise";
                    } else if (decision === "Possível duplicidade") {
                      u.verificationState = "Em análise";
                      u.verificationNote =
                        "Correção de dados necessária; entre em contato com o suporte.";
                    } else if (decision === "Encerrar sessões demonstrativas") {
                      u.sessionVersion = (u.sessionVersion || 0) + 1;
                    } else if (decision === "Suspender conta") {
                      requireThat(
                        u.id !== user!.id,
                        "Não suspenda a própria conta nesta demonstração.",
                      );
                      u.active = false;
                    } else if (decision === "Reativar conta") u.active = true;
                    else if (decision === "Reenviar verificação")
                      u.emailVerified = false;
                    if (
                      decision !== "Nota interna" &&
                      decision !== "Atribuir análise" &&
                      decision !== "Possível duplicidade"
                    )
                      notify(
                        d,
                        u.id,
                        "Atualização administrativa: " +
                          decision +
                          (decision === "Nota interna" ? "" : ". " + reason),
                        "/" + u.role + "/configuracoes",
                        "Segurança",
                      );
                  },
                  reason,
                )
              )
                setSelected("");
            }}
          >
            <Field label="Ação">
              <select name="decision">
                {(key === "oab"
                  ? [
                      "Aprovar OAB",
                      "Solicitar correção",
                      "Rejeitar OAB",
                      "Atribuir análise",
                      "Possível duplicidade",
                    ]
                  : [
                      "Nota interna",
                      account.active ? "Suspender conta" : "Reativar conta",
                      "Reenviar verificação",
                      "Recuperação assistida",
                      "Encerrar sessões demonstrativas",
                      ...(key === "administradores"
                        ? ["Redefinir proteção demonstrativa"]
                        : []),
                    ]
                ).map((s) => (
                  <option key={s} disabled={s === "Recuperação assistida"}>
                    {s === "Recuperação assistida"
                      ? "Recuperação assistida · depende de serviço de e-mail"
                      : s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Justificativa / nota interna">
              <textarea name="reason" required rows={3} />
            </Field>
            <label className="check-field">
              <input required type="checkbox" />
              Confirmo o recurso, a ação e a justificativa.
            </label>
            <div className="modal-actions">
              <button className="button primary">Registrar decisão</button>
            </div>
          </Form>
          <Link
            className="text-link"
            to="/administracao/auditoria"
            onClick={() => setSelected("")}
          >
            Consultar auditoria
          </Link>
          <div className="inline-actions">
            <Link to="/administracao/suporte" onClick={() => setSelected("")}>
              Abrir suporte
            </Link>
            {account.office && <span>Escritório: {account.office}</span>}
          </div>
        </Modal>
      )}
      {legalCase && key === "processos" && (
        <Modal
          title="Vínculo técnico do processo"
          onClose={() => setSelected("")}
        >
          <p>ID {legalCase.id}</p>
          <p>Estado: {legalCase.status}</p>
          <p>Criado em {date(legalCase.createdAt)}</p>
          <p>
            Advogados:{" "}
            {legalCase.lawyers
              .map((id) => db.users.find((u) => u.id === id)?.name)
              .join(", ")}
          </p>
          <Info>
            O mérito, mensagens e documentos não são exibidos. Correções
            técnicas precisam de procedimento aprovado e estão bloqueadas.
          </Info>
          {db.invitations
            .filter((i) => i.caseId === legalCase.id)
            .map((i) => (
              <Row
                key={i.id}
                title={i.email}
                subtitle={`${i.status} · ${date(i.sentAt)}`}
              >
                {i.status === "Pendente" && (
                  <button
                    className="button danger-outline"
                    onClick={() =>
                      confirm(
                        "Invalidar convite",
                        "Este convite será cancelado por suspeita de comprometimento. O vínculo já aceito não será alterado.",
                        () =>
                          act(
                            "Invalidar convite comprometido",
                            i.id,
                            (d) => {
                              d.invitations.find((x) => x.id === i.id)!.status =
                                "Cancelado";
                            },
                            "Confirmação administrativa de comprometimento.",
                          ),
                      )
                    }
                  >
                    Invalidar convite
                  </button>
                )}
              </Row>
            ))}
        </Modal>
      )}
      {ticket && key === "suporte" && (
        <Modal
          title={ticket.id + " · " + ticket.title}
          onClose={() => setSelected("")}
        >
          <Badge>{ticket.status}</Badge>
          {ticket.messages.map((m, i) => (
            <div
              key={i}
              className={
                "ticket-message " + (m.internal ? "internal-note" : "")
              }
            >
              <strong>
                {db.users.find((u) => u.id === m.author)?.name}
                {m.internal ? " · Nota interna" : ""}
              </strong>
              <p>{m.text}</p>
              <small>
                {date(m.at)} {time(m.at)}
              </small>
            </div>
          ))}
          <Form
            onSubmit={(fd) => {
              act(
                "Atualizar chamado",
                ticket.id,
                (d) => {
                  const t = d.tickets.find((t) => t.id === ticket.id)!;
                  t.messages.push({
                    author: user!.id,
                    text: String(fd.get("text")),
                    at: now(),
                    internal: fd.get("internal") === "on",
                  });
                  t.status = String(fd.get("status"));
                  t.priority = String(fd.get("priority"));
                  const related = d.incidents.find(
                    (i) => i.id === String(fd.get("incident")),
                  );
                  if (related)
                    related.history.push(
                      now() + " — chamado vinculado: " + t.id,
                    );
                  t.assigned = user!.id;
                  if (fd.get("internal") !== "on")
                    notify(
                      d,
                      t.userId,
                      "Resposta ao chamado " + t.id,
                      "/" +
                        db.users.find((u) => u.id === t.userId)?.role +
                        "/ajuda",
                    );
                },
                String(fd.get("text")),
              );
            }}
          >
            <Field label="Resposta / nota">
              <textarea name="text" required />
            </Field>
            <label className="check-field">
              <input name="internal" type="checkbox" />
              Nota interna · não enviar ao usuário
            </label>
            <div className="form-grid">
              <Field label="Situação">
                <select name="status" defaultValue={ticket.status}>
                  {[
                    "Aberto",
                    "Em atendimento",
                    "Aguardando usuário",
                    "Escalado",
                    "Resolvido",
                    "Reaberto",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Prioridade">
                <select name="priority" defaultValue={ticket.priority}>
                  {["Baixa", "Normal", "Alta"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
            <button className="button primary">
              Salvar atendimento e assumir
            </button>
            <Field label="Vincular incidente (opcional)">
              <select name="incident">
                <option value="">Sem vínculo</option>
                {db.incidents.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title}
                  </option>
                ))}
              </select>
            </Field>
          </Form>
        </Modal>
      )}
      {doc && key === "armazenamento" && (
        <Modal title={"Metadados · " + doc.id} onClose={() => setSelected("")}>
          <p>Conta: {doc.owner}</p>
          <p>Tamanho: {size(doc.versions.at(-1)!.size)}</p>
          <Badge>{doc.state}</Badge>
          <Info>
            O conteúdo do arquivo não é exibido. Reprocessamento altera somente
            o estado técnico e preserva as versões.
          </Info>
          <Form
            onSubmit={(fd) => {
              act(
                "Alterar disponibilidade de arquivo",
                doc.id,
                (d) => {
                  d.documents.find((x) => x.id === doc.id)!.state = String(
                    fd.get("state"),
                  ) as typeof doc.state;
                },
                String(fd.get("reason")),
              );
            }}
          >
            <Field label="Novo estado">
              <select name="state" defaultValue={doc.state}>
                {[
                  "Disponível",
                  "Organização pendente",
                  "Quarentena",
                  "Indisponível",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Justificativa e autorização">
              <textarea name="reason" required />
            </Field>
            <label className="check-field">
              <input required type="checkbox" />
              Confirmo o reprocessamento/restauração autorizada.
            </label>
            <button className="button primary">
              Aplicar alteração técnica
            </button>
          </Form>
        </Modal>
      )}
      {log && key === "auditoria" && (
        <Modal title="Detalhes do evento" onClose={() => setSelected("")}>
          <dl>
            <dt>Responsável</dt>
            <dd>{db.users.find((u) => u.id === log.actor)?.name}</dd>
            <dt>Data e horário</dt>
            <dd>
              {date(log.at)} {time(log.at)}
            </dd>
            <dt>Ação</dt>
            <dd>{log.action}</dd>
            <dt>Recurso</dt>
            <dd>{log.resource}</dd>
            <dt>Resultado</dt>
            <dd>{log.result}</dd>
            <dt>Justificativa</dt>
            <dd>{log.reason || "Não aplicável"}</dd>
            <dt>Identificador</dt>
            <dd>{log.id}</dd>
          </dl>
          <Info>
            Registro imutável pela interface. A proteção real contra adulteração
            depende do backend.
          </Info>
          <Form
            onSubmit={(fd) => {
              const iid = String(fd.get("incident"));
              act("Vincular evidência de auditoria", log.id, (d) => {
                const inc = d.incidents.find((i) => i.id === iid);
                requireThat(inc, "Escolha um incidente.");
                inc!.history.push(now() + " — evidência preservada: " + log.id);
              });
            }}
          >
            <Field label="Vincular a incidente">
              <select name="incident" required>
                <option value="">Selecione</option>
                {db.incidents.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title}
                  </option>
                ))}
              </select>
            </Field>
            <button className="button secondary">
              Preservar e vincular evento
            </button>
          </Form>
        </Modal>
      )}
      {log && key === "monitoramento" && (
        <Modal
          title="Analisar ocorrência da IA"
          onClose={() => setSelected("")}
        >
          <p>
            {log.action} · Recurso {log.resource}
          </p>
          <Info>
            Amostra limitada a metadados operacionais. Conteúdo sensível
            permanece indisponível.
          </Info>
          <Form
            onSubmit={(fd) => {
              if (
                act(
                  "Classificar falha e encaminhar correção",
                  log.id,
                  (d) => {
                    d.incidents.unshift({
                      id: "INC-" + id().slice(0, 6),
                      title: "Revisão da IA: " + String(fd.get("cause")),
                      severity: "Moderada",
                      status: "Aberto",
                      owner: user!.id,
                      history: [
                        now() +
                          " — evento " +
                          log.id +
                          " · " +
                          String(fd.get("note")),
                      ],
                    });
                  },
                  String(fd.get("note")),
                )
              )
                setSelected("");
            }}
          >
            <Field label="Origem da ocorrência">
              <select name="cause">
                <option>Modelo simulado</option>
                <option>Documento</option>
                <option>Configuração</option>
              </select>
            </Field>
            <Field label="Descrição técnica para correção">
              <textarea name="note" required />
            </Field>
            <button className="button primary">
              Classificar e criar incidente
            </button>
          </Form>
        </Modal>
      )}
      {incident && key === "incidentes" && (
        <Modal title={incident.title} onClose={() => setSelected("")}>
          <p>
            Responsável: {db.users.find((u) => u.id === incident.owner)?.name}
          </p>
          {incident.history.map((h, i) => (
            <p className="history-entry" key={i}>
              {h}
            </p>
          ))}
          <Form
            onSubmit={(fd) =>
              act(
                "Atualizar incidente",
                incident.id,
                (d) => {
                  const i = d.incidents.find((x) => x.id === incident.id)!;
                  i.status = String(fd.get("status"));
                  i.severity = String(fd.get("severity"));
                  i.owner = user!.id;
                  i.history.push(
                    now() + " · " + user!.name + " · " + String(fd.get("note")),
                  );
                },
                String(fd.get("note")),
              )
            }
          >
            <Field label="Estado">
              <select name="status" defaultValue={incident.status}>
                {[
                  "Aberto",
                  "Investigando",
                  "Contido",
                  "Monitorando",
                  "Encerrado",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Gravidade">
              <select name="severity" defaultValue={incident.severity}>
                {["Baixa", "Moderada", "Alta", "Crítica"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Contenção / revisão / evidência">
              <textarea name="note" required />
            </Field>
            <button className="button primary">Registrar e assumir</button>
          </Form>
        </Modal>
      )}
      {request && key === "privacidade" && (
        <Modal title={request.type} onClose={() => setSelected("")}>
          <p>Titular: {db.users.find((u) => u.id === request.userId)?.name}</p>
          <p>{request.reason || "Sem observação adicional."}</p>
          <Badge>{request.status}</Badge>
          <Info>
            Exportações demonstrativas contêm apenas dados do titular
            autenticado e seus vínculos. Exclusão definitiva permanece bloqueada
            até aprovação da retenção.
          </Info>
          <Form
            onSubmit={(fd) =>
              act(
                "Analisar solicitação de privacidade",
                request.id,
                (d) => {
                  const r = d.dataRequests.find((r) => r.id === request.id)!;
                  r.status = String(fd.get("status"));
                  r.answer = String(fd.get("answer"));
                  if (r.status === "Disponível")
                    requireThat(
                      r.type === "Exportação de dados",
                      "Disponibilização aplica-se apenas à exportação.",
                    );
                  const u = d.users.find((u) => u.id === r.userId)!;
                  notify(
                    d,
                    u.id,
                    "Atualização do pedido: " + r.type,
                    "/" + u.role + "/privacidade",
                    "Segurança",
                  );
                },
                String(fd.get("answer")),
              )
            }
          >
            <label className="check-field">
              <input type="checkbox" required />
              Identidade demonstrativa e finalidade conferidas
            </label>
            <Field label="Situação">
              <select name="status">
                {[
                  "Em análise",
                  "Aguardando titular",
                  ...(request.type === "Exportação de dados"
                    ? ["Disponível"]
                    : []),
                  "Recusada",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Resposta e fundamento">
              <textarea name="answer" required />
            </Field>
            <button className="button primary">Registrar análise</button>
          </Form>
        </Modal>
      )}
      {policy && key === "ia" && (
        <Modal
          title={"Política v" + policy.version}
          onClose={() => setSelected("")}
        >
          <Badge>{policy.status}</Badge>
          <p>{policy.text}</p>
          <Info>
            Regras mínimas de segurança e privacidade permanecem obrigatórias
            nesta demonstração.
          </Info>
          <div className="inline-actions">
            {policy.status === "Rascunho" && (
              <button
                className="button primary"
                onClick={() =>
                  act("Submeter política", String(policy.version), (d) => {
                    d.policies.find(
                      (p) => p.version === policy.version,
                    )!.status = "Em aprovação";
                  })
                }
              >
                Submeter para aprovação
              </button>
            )}
            {policy.status === "Em aprovação" && (
              <button
                className="button primary"
                onClick={() =>
                  act("Aprovar política", String(policy.version), (d) => {
                    d.policies.find(
                      (p) => p.version === policy.version,
                    )!.status = "Aprovada";
                  })
                }
              >
                Aprovar versão
              </button>
            )}
            {["Aprovada", "Anterior"].includes(policy.status) && (
              <button
                className="button primary"
                onClick={() =>
                  confirm(
                    "Publicar política",
                    "Esta versão se tornará a política vigente. A versão anterior será preservada.",
                    () =>
                      act("Publicar política", String(policy.version), (d) => {
                        d.policies
                          .filter((p) => p.status === "Publicada")
                          .forEach((p) => (p.status = "Anterior"));
                        d.policies.find(
                          (p) => p.version === policy.version,
                        )!.status = "Publicada";
                      }),
                  )
                }
              >
                Publicar versão
              </button>
            )}
          </div>
        </Modal>
      )}
      {category && key === "categorias" && (
        <Modal title="Editar categoria" onClose={() => setSelected("")}>
          <Form
            onSubmit={(fd) => {
              if (
                act(
                  "Publicar categoria",
                  category.id,
                  (d) => {
                    const c = d.categories.find((c) => c.id === category.id)!;
                    c.name = String(fd.get("name"));
                    c.description = String(fd.get("description"));
                    c.synonyms = String(fd.get("synonyms"));
                    c.active = fd.get("active") === "on";
                  },
                  "Taxonomia validada por " + user!.name,
                )
              )
                setSelected("");
            }}
          >
            <Field label="Nome">
              <input name="name" required defaultValue={category.name} />
            </Field>
            <Field label="Descrição">
              <textarea
                name="description"
                defaultValue={category.description}
              />
            </Field>
            <Field label="Sinônimos">
              <input name="synonyms" defaultValue={category.synonyms} />
            </Field>
            <label className="check-field">
              <input
                name="active"
                type="checkbox"
                defaultChecked={category.active}
              />
              Categoria ativa
            </label>
            <Info>Alterações não movem nem renomeiam arquivos existentes.</Info>
            <button className="button primary">Validar e publicar</button>
          </Form>
        </Modal>
      )}
      {create && (
        <Modal
          title={
            key === "administradores"
              ? "Nova conta administrativa"
              : key === "incidentes"
                ? "Novo incidente"
                : key === "ia"
                  ? "Rascunho de política"
                  : "Nova categoria"
          }
          onClose={() => setCreate(false)}
        >
          <Form
            onSubmit={(fd) => {
              if (
                act("Criar registro administrativo", key, (d) => {
                  if (key === "administradores") {
                    const email = String(fd.get("email")).trim().toLowerCase();
                    requireThat(
                      !d.users.some((u) => u.email === email),
                      "E-mail indisponível.",
                    );
                    d.users.push({
                      id: id(),
                      name: String(fd.get("name")),
                      email,
                      role: "administracao",
                      password: String(fd.get("password")),
                      phone: "",
                      verified: true,
                      emailVerified: true,
                      active: true,
                      mfa: true,
                      preferences: {},
                    });
                  } else if (key === "incidentes")
                    d.incidents.unshift({
                      id: "INC-" + id().slice(0, 6),
                      title: String(fd.get("name")),
                      severity: String(fd.get("severity")),
                      status: "Aberto",
                      owner: user!.id,
                      history: [now() + " — " + String(fd.get("description"))],
                    });
                  else if (key === "ia")
                    d.policies.push({
                      version:
                        Math.max(...d.policies.map((p) => p.version)) + 1,
                      text: String(fd.get("description")),
                      status: "Rascunho",
                      at: now(),
                      author: user!.id,
                    });
                  else
                    d.categories.push({
                      id: id(),
                      name: String(fd.get("name")),
                      description: String(fd.get("description")),
                      synonyms: "",
                      active: true,
                    });
                })
              )
                setCreate(false);
            }}
          >
            {key !== "ia" && (
              <Field label={key === "incidentes" ? "Título" : "Nome"}>
                <input name="name" required minLength={3} />
              </Field>
            )}
            {key === "administradores" ? (
              <>
                <Field label="E-mail individual">
                  <input name="email" type="email" required />
                </Field>
                <Field label="Senha demonstrativa">
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={8}
                  />
                </Field>
                <Info>
                  Fator adicional da demonstração: 123456. A conta terá acesso
                  administrativo completo.
                </Info>
              </>
            ) : (
              <Field
                label={
                  key === "ia" ? "Texto da política" : "Descrição / evidências"
                }
              >
                <textarea name="description" required rows={4} />
              </Field>
            )}
            {key === "incidentes" && (
              <Field label="Gravidade">
                <select name="severity">
                  {["Baixa", "Moderada", "Alta", "Crítica"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            )}
            <label className="check-field">
              <input type="checkbox" required />
              Confirmo os dados e a criação deste registro.
            </label>
            <div className="modal-actions">
              <button className="button primary">Criar registro</button>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  );
}
