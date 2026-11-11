import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Plus, Users } from "lucide-react";
import { useStore, transact } from "../store/store";
import {
  canAccessCase,
  canAccessDocument,
  isLawyer,
} from "../domain/permissions";
import {
  Avatar,
  Badge,
  Empty,
  Info,
  Modal,
  PageHeading,
  Row,
  SearchInput,
  useFeedback,
  useLocalState,
} from "../components/ui";
import { CaseRow, ClientSummary, CreateCase } from "../components/cases";
import { DailyAppointments } from "../components/calendar/DailyAppointments";
import { date, includes } from "../lib/format";
import {
  acceptInvite,
  audit,
  claimCase,
  notify,
  requireThat,
} from "../domain/actions";
export function Dashboard() {
  const { db, user } = useStore();
  const [create, setCreate] = useState(false);
  const root = "/" + user!.role;
  const cases = db.cases.filter((c) => canAccessCase(user!, c));
  const active = cases.filter((c) => c.status === "Ativo");
  const requests = db.requests.filter(
    (r) => r.recipients.includes(user!.id) && r.status !== "Respondida",
  );
  const invitations = db.invitations.filter(
    (invitation) =>
      invitation.email === user!.email && invitation.status === "Pendente",
  );
  const recentCases = [...cases]
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
    .slice(0, 4);
  const recentClients = [...new Set(cases.flatMap((item) => item.clients))]
    .map((clientId) => db.users.find((person) => person.id === clientId))
    .filter((person) => person !== undefined)
    .slice(0, 4);
  return (
    <div className="page workspace-dashboard">
      <PageHeading
        eyebrow=""
        title={`Bom dia, ${user!.name.split(" ")[0]}.`}
        description={new Date().toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
        action={
          isLawyer(user!) ? (
            <button className="button primary" onClick={() => setCreate(true)}>
              <Plus size={18} />
              Novo processo
            </button>
          ) : (
            <Link className="button primary" to={root + "/convites"}>
              Ver convites
              <ArrowRight size={17} />
            </Link>
          )
        }
      />
      <nav className="dashboard-summary" aria-label="Resumo da atividade">
        <Link to={root + "/processos"}>
          <strong>{active.length}</strong>
          <span>Processos ativos</span>
        </Link>
        <Link
          to={
            root + (user!.role === "advogado" ? "/solicitacoes" : "/convites")
          }
        >
          <strong>
            {user!.role === "advogado" ? requests.length : invitations.length}
          </strong>
          <span>
            {user!.role === "advogado"
              ? "Solicitações pendentes"
              : "Convites pendentes"}
          </span>
        </Link>
        <Link to={root + "/documentos"}>
          <strong>
            {
              db.documents.filter((document) =>
                canAccessDocument(user!, document, db),
              ).length
            }
          </strong>
          <span>Documentos</span>
        </Link>
      </nav>
      <div className="dashboard-workspace">
        <div className="dashboard-main-column">
          <section className="panel dashboard-processes">
            <header className="section-head">
              <h2>Processos recentes</h2>
              <Link to={root + "/processos"}>
                Ver todos <ArrowUpRight size={16} />
              </Link>
            </header>
            {recentCases.map((item) => (
              <CaseRow key={item.id} item={item} />
            ))}
            {!cases.length && (
              <Empty
                title="Nenhum processo por aqui"
                text="Seus processos aparecerão aqui após o aceite de um convite."
                action={
                  <Link className="button secondary" to={root + "/convites"}>
                    Consultar convites
                  </Link>
                }
              />
            )}
          </section>
          {user!.role === "advogado" && recentClients.length > 0 && (
            <section className="dashboard-clients">
              <header className="section-head">
                <h2>Clientes</h2>
                <Link to="/advogado/clientes">
                  Ver todos <ArrowUpRight size={16} />
                </Link>
              </header>
              <div className="dashboard-client-list">
                {recentClients.map((client) => (
                  <Link key={client.id} to={"/advogado/clientes/" + client.id}>
                    <Avatar name={client.name} small />
                    <span>{client.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="dashboard-agenda-column">
          <DailyAppointments />
        </aside>
      </div>
      {create && <CreateCase onClose={() => setCreate(false)} />}
    </div>
  );
}
export interface CasesProps {
  clients?: boolean;
}
export function Cases({ clients = false }: CasesProps) {
  const { db, user } = useStore();
  const { clienteId } = useParams();
  const [q, setQ] = useLocalState(
    "search:" + user!.id + ":" + (clients ? "clients" : clienteId || "cases"),
    "",
  );
  const [filter, setFilter] = useLocalState(
    "filter:" + user!.id + ":" + (clients ? "clients" : clienteId || "cases"),
    "Todos",
  );
  const [sort, setSort] = useState("recent");
  const [count, setCount] = useState(8);
  const [create, setCreate] = useState(false);
  const [profile, setProfile] = useState(false);
  let cases = db.cases.filter(
    (c) =>
      (canAccessCase(user!, c) ||
        (isLawyer(user!) &&
          c.lawyers.includes(user!.id) &&
          c.status === "Aguardando aceite")) &&
      (!clienteId || c.clients.includes(clienteId)),
  );
  cases = cases.filter(
    (c) =>
      filter === "Todos" ||
      (filter === "Em andamento" && c.status === "Ativo") ||
      (filter === "Finalizados" &&
        ["Concluído", "Cancelado"].includes(c.status)) ||
      (filter === "Aguardando aceite" && c.status === "Aguardando aceite"),
  );
  const found = cases
    .filter((c) =>
      includes(
        c.title +
          " " +
          c.area +
          " " +
          c.number +
          " " +
          [...c.clients, ...c.lawyers]
            .map((id) => {
              const u = db.users.find((u) => u.id === id);
              return u?.name + " " + u?.email;
            })
            .join(" "),
        q,
      ),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.title.localeCompare(b.title)
        : b.updatedAt.localeCompare(a.updatedAt),
    );
  const client = db.users.find((u) => u.id === clienteId);
  const clientIds = [...new Set(found.flatMap((c) => c.clients))];
  return (
    <div className="page">
      <PageHeading
        title={client?.name || (clients ? "Clientes" : "Processos")}
        description={client ? `${client.email} · ${client.phone}` : undefined}
        action={
          isLawyer(user!) && (
            <button className="button primary" onClick={() => setCreate(true)}>
              <Plus size={18} />
              Novo processo
            </button>
          )
        }
      />
      {client && (
        <button className="text-link" onClick={() => setProfile(true)}>
          Ver dados do cliente
        </button>
      )}
      <div className="panel">
        <div className="list-toolbar">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder={
              clients
                ? "Buscar por cliente, e-mail ou processo"
                : "Buscar por título, número ou participante"
            }
          />
          <label className="sort-label">
            Ordenar
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recent">Mais recentes</option>
              <option value="name">Título A–Z</option>
            </select>
          </label>
        </div>
        <div className="tabs">
          {[
            "Todos",
            "Em andamento",
            "Finalizados",
            ...(user!.role === "advogado" ? ["Aguardando aceite"] : []),
          ].map((s) => (
            <button
              key={s}
              className={filter === s ? "active" : ""}
              onClick={() => {
                setFilter(s);
                setCount(8);
              }}
            >
              {s}
            </button>
          ))}
          <span className="tabs-count">
            {clients ? clientIds.length : found.length}{" "}
            {clients ? "clientes" : "processos"}
          </span>
        </div>
        {clients
          ? clientIds
              .slice(0, count)
              .map((id) => <ClientSummary key={id} id={id} />)
          : found.slice(0, count).map((c) => <CaseRow key={c.id} item={c} />)}
        {(clients ? !clientIds.length : !found.length) && (
          <Empty
            title={
              q
                ? "Nenhum resultado para esta busca"
                : "Nenhum processo neste filtro"
            }
            text="Ajuste os filtros ou consulte os convites disponíveis."
          />
        )}
        {(clients ? clientIds.length : found.length) > count && (
          <button
            className="button secondary load-more"
            onClick={() => setCount(count + 8)}
          >
            Carregar mais
          </button>
        )}
      </div>
      {create && (
        <CreateCase clientId={clienteId} onClose={() => setCreate(false)} />
      )}
      {profile && client && (
        <Modal title="Dados do cliente" onClose={() => setProfile(false)}>
          <Avatar name={client.name} />
          <h3>{client.name}</h3>
          <p>{client.email}</p>
          <p>{client.phone}</p>
        </Modal>
      )}
    </div>
  );
}
export function Invitations() {
  const { db, user } = useStore();
  const { conviteId } = useParams();
  const navigate = useNavigate();
  const { run, confirm, toast } = useFeedback();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [detail, setDetail] = useState(conviteId || "");
  const [create, setCreate] = useState(false);
  const [professional, setProfessional] = useState("");
  const list = db.invitations
    .filter((i) =>
      user!.role === "cliente"
        ? i.email === user!.email
        : i.lawyer === user!.id,
    )
    .filter(
      (i) =>
        filter === "Todos" ||
        (i.status === "Pendente" && Date.parse(i.expiresAt) < Date.now()
          ? "Expirado"
          : i.status) === filter,
    )
    .filter((i) =>
      includes(
        i.email + " " + db.cases.find((c) => c.id === i.caseId)?.title,
        q,
      ),
    );
  const inv = db.invitations.find(
    (i) =>
      i.id === detail &&
      (user!.role === "cliente"
        ? i.email === user!.email
        : i.lawyer === user!.id),
  );
  const c = db.cases.find((c) => c.id === inv?.caseId);
  const lawyer = db.users.find((u) => u.id === inv?.lawyer);
  const status =
    inv?.status === "Pendente" && Date.parse(inv.expiresAt) < Date.now()
      ? "Expirado"
      : inv?.status;
  return (
    <div className="page">
      <PageHeading
        title={user!.role === "cliente" ? "Convites" : "Convites enviados"}
        description="Acompanhe o início de cada vínculo profissional."
        action={
          isLawyer(user!) && (
            <button className="button primary" onClick={() => setCreate(true)}>
              <Plus size={18} />
              Novo processo
            </button>
          )
        }
      />
      {conviteId && !inv && (
        <Info>
          Este convite está indisponível ou é destinado a outra conta. Confira o
          e-mail usado para entrar antes de continuar.
        </Info>
      )}
      <div className="panel">
        <div className="list-toolbar">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Buscar convite ou processo"
          />
          <select
            aria-label="Situação do convite"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {[
              "Todos",
              "Pendente",
              "Aceito",
              "Recusado",
              "Expirado",
              "Cancelado",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        {list.map((i) => (
          <Row
            key={i.id}
            title={db.cases.find((c) => c.id === i.caseId)?.title || "Processo"}
            subtitle={`${i.email} · Enviado em ${date(i.sentAt)} · Válido até ${date(i.expiresAt)}`}
            onClick={() => setDetail(i.id)}
          >
            <Badge>
              {i.status === "Pendente" && Date.parse(i.expiresAt) < Date.now()
                ? "Expirado"
                : i.status}
            </Badge>
          </Row>
        ))}
        {!list.length && <Empty title="Nenhum convite encontrado" />}
      </div>
      {inv && c && (
        <Modal
          title="Detalhes do convite"
          onClose={() => {
            setDetail("");
            if (conviteId) navigate("/" + user!.role + "/convites");
          }}
        >
          <Badge>{status}</Badge>
          <h3>{c.title}</h3>
          <p>
            {c.area} · {c.number || "Número não informado"}
          </p>
          <button
            className="profile-inline"
            onClick={() => setProfessional(lawyer!.id)}
          >
            <Avatar name={lawyer!.name} />
            <span>
              {lawyer!.name}
              <small>
                {lawyer!.office || "Advogado individual"} · OAB {lawyer!.oab}
              </small>
            </span>
          </button>
          <p>
            Destinatário: <strong>{inv.email}</strong>
          </p>
          <p>Validade: {date(inv.expiresAt)}</p>
          <Info>
            O aceite libera apenas este processo. Sua biblioteca pessoal não
            será compartilhada.
          </Info>
          <div className="modal-actions">
            {status === "Pendente" &&
              (user!.role === "cliente" ? (
                <>
                  <button
                    className="button secondary"
                    onClick={() =>
                      confirm(
                        "Recusar convite",
                        "Este convite será recusado. Os demais vínculos continuam disponíveis.",
                        () => {
                          transact((d) =>
                            acceptInvite(d, user!, inv.id, false),
                          );
                          setDetail("");
                        },
                      )
                    }
                  >
                    Recusar
                  </button>
                  <button
                    className="button primary"
                    onClick={() => {
                      if (
                        run(
                          () =>
                            transact((d) =>
                              acceptInvite(d, user!, inv.id, true),
                            ),
                          "Convite aceito. A conversa está liberada.",
                        )
                      )
                        navigate("/cliente/processos/" + c.id + "/conversa");
                    }}
                  >
                    Aceitar convite
                  </button>
                </>
              ) : (
                <button
                  className="button danger"
                  onClick={() =>
                    confirm(
                      "Cancelar convite",
                      "O cliente não poderá aceitar esta solicitação.",
                      () =>
                        transact((d) => {
                          const i = d.invitations.find((i) => i.id === inv.id)!;
                          requireThat(i.status === "Pendente");
                          i.status = "Cancelado";
                          audit(d, user!, "Cancelar convite", inv.id);
                        }),
                      true,
                    )
                  }
                >
                  Cancelar convite
                </button>
              ))}
            {status === "Aceito" && (
              <Link
                className="button primary"
                to={"/" + user!.role + "/processos/" + c.id + "/conversa"}
                onClick={() => setDetail("")}
              >
                Abrir conversa
              </Link>
            )}
            {status === "Expirado" &&
              isLawyer(user!) &&
              c.status === "Aguardando aceite" && (
                <button
                  className="button primary"
                  onClick={() =>
                    run(
                      () =>
                        transact((d) => {
                          const original = d.invitations.find(
                            (x) => x.id === inv.id,
                          )!;
                          requireThat(
                            Date.parse(original.expiresAt) < Date.now(),
                          );
                          requireThat(
                            !d.invitations.some(
                              (i) =>
                                i.caseId === original.caseId &&
                                i.status === "Pendente" &&
                                Date.parse(i.expiresAt) > Date.now(),
                            ),
                            "Já existe um convite pendente e válido para este processo.",
                          );
                          const fresh = {
                            ...original,
                            id: crypto.randomUUID(),
                            sentAt: new Date().toISOString(),
                            expiresAt: new Date(
                              Date.now() + 30 * 86400000,
                            ).toISOString(),
                            status: "Pendente" as const,
                          };
                          d.invitations.unshift(fresh);
                          const dest = d.users.find(
                            (u) => u.email === fresh.email,
                          );
                          if (dest)
                            notify(
                              d,
                              dest.id,
                              "Novo convite: " + c.title,
                              "/cliente/convites/" + fresh.id,
                              "Convites",
                            );
                          audit(d, user!, "Reenviar convite", fresh.id);
                        }),
                      "Novo convite enviado.",
                    )
                  }
                >
                  Enviar novo convite
                </button>
              )}
            <button
              className="button secondary"
              onClick={() => {
                navigator.clipboard
                  .writeText(inv.email)
                  .then(() => toast("E-mail copiado."))
                  .catch(() => toast("Não foi possível copiar. " + inv.email));
              }}
            >
              Copiar e-mail
            </button>
          </div>
        </Modal>
      )}
      {professional && (
        <Modal title="Perfil profissional" onClose={() => setProfessional("")}>
          <h3>{lawyer?.name}</h3>
          <p>OAB {lawyer?.oab}</p>
          <Badge>
            {lawyer?.verified ? "OAB aprovada na simulação" : "Em análise"}
          </Badge>
          <p>{lawyer?.email}</p>
          <p>{lawyer?.phone}</p>
          <div className="inline-actions">
            <button
              className="text-link"
              onClick={() =>
                navigator.clipboard
                  .writeText(lawyer?.email || "")
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
                  .writeText(lawyer?.phone || "")
                  .then(() => toast("Telefone copiado."))
                  .catch(() => toast("Não foi possível copiar."))
              }
            >
              Copiar telefone
            </button>
          </div>
        </Modal>
      )}
      {create && <CreateCase onClose={() => setCreate(false)} />}
    </div>
  );
}
export function Requests() {
  const { db, user } = useStore();
  const { run } = useFeedback();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("Todos");
  const [sort, setSort] = useState("old");
  const requests = db.requests
    .filter(
      (r) =>
        r.recipients.includes(user!.id) &&
        db.cases.some((c) => c.id === r.caseId && canAccessCase(user!, c)),
    )
    .filter(
      (r) =>
        (filter === "Todos" || r.status === filter) &&
        includes(
          r.question + " " + db.cases.find((c) => c.id === r.caseId)?.title,
          q,
        ),
    )
    .sort((a, b) =>
      sort === "old" ? a.at.localeCompare(b.at) : b.at.localeCompare(a.at),
    );
  return (
    <div className="page">
      <PageHeading
        title="Solicitações da IA"
        description="Perguntas que precisam do seu olhar profissional. Ler não encerra uma solicitação."
      />
      <div className="panel">
        <div className="list-toolbar">
          <SearchInput
            value={q}
            onChange={setQ}
            placeholder="Buscar pergunta ou processo"
          />
          <select
            aria-label="Status da solicitação"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {["Todos", "Aguardando", "Em atendimento", "Respondida"].map(
              (s) => (
                <option key={s}>{s}</option>
              ),
            )}
          </select>
          <select
            aria-label="Ordenação"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="old">Mais antigas</option>
            <option value="new">Mais recentes</option>
          </select>
        </div>
        {requests.map((r) => {
          const c = db.cases.find((c) => c.id === r.caseId)!;
          return (
            <article className="request-row" key={r.id}>
              <div className="request-top">
                <span className="eyebrow">{c.title}</span>
                <Badge>{r.status}</Badge>
              </div>
              <h3>{r.question}</h3>
              <p>{r.summary}</p>
              <small>
                {date(r.at)} · {r.recipients.length} profissionais notificados
              </small>
              <div className="inline-actions">
                <Link
                  className="button secondary"
                  to={"/advogado/processos/" + c.id + "/conversa"}
                >
                  Ver conversa
                </Link>
                {c.status === "Ativo" &&
                  !c.claimedBy &&
                  r.status !== "Respondida" && (
                    <button
                      className="button primary"
                      onClick={() =>
                        run(
                          () => transact((d) => claimCase(d, user!, c.id)),
                          "Atendimento assumido. A IA está pausada.",
                        )
                      }
                    >
                      Assumir atendimento
                    </button>
                  )}
                {r.status === "Em atendimento" && (
                  <button
                    className="button secondary"
                    onClick={() =>
                      run(
                        () =>
                          transact((d) => {
                            const request = d.requests.find(
                              (x) => x.id === r.id,
                            )!;
                            requireThat(
                              d.messages.some(
                                (m) =>
                                  m.caseId === r.caseId &&
                                  m.author === user!.id &&
                                  m.at > r.at,
                              ),
                              "Responda na conversa antes de resolver.",
                            );
                            request.status = "Respondida";
                            audit(d, user!, "Resolver solicitação", r.id);
                          }),
                        "Solicitação resolvida.",
                      )
                    }
                  >
                    Marcar como respondida
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {!requests.length && (
          <Empty
            title="Nenhuma solicitação neste filtro"
            text="As perguntas encaminhadas aos seus processos aparecerão aqui."
          />
        )}
      </div>
    </div>
  );
}
export function Office() {
  const { db, user } = useStore();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState("");
  const members = db.users.filter(
    (u) => u.role === "advogado" && u.office === user!.office && user!.office,
  );
  return (
    <div className="page">
      <PageHeading
        title={user!.office || "Conta individual"}
        description="Colaboração entre profissionais com contas e autoria individuais."
      />
      {!user!.office ? (
        <Info>
          Você utiliza uma conta individual, com todas as funções profissionais
          básicas.
        </Info>
      ) : (
        <>
          <div className="office-banner">
            <BuildingIcon />
            <div>
              <h2>{user!.office}</h2>
              <p>{members.length} profissionais · Contas individuais</p>
            </div>
            <Link
              className="button secondary"
              to="/advogado/conversas-internas"
            >
              Conversas internas
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="panel">
            <div className="list-toolbar">
              <SearchInput
                value={q}
                onChange={setQ}
                placeholder="Buscar integrante"
              />
            </div>
            {members
              .filter((u) => includes(u.name + " " + u.oab, q))
              .map((u) => (
                <Row
                  key={u.id}
                  title={u.name}
                  subtitle={`OAB ${u.oab} · ${u.email}`}
                  onClick={() => setSelected(u.id)}
                >
                  <Badge>
                    {u.verified ? "Verificação aprovada" : "Em análise"}
                  </Badge>
                </Row>
              ))}
          </div>
          <Info>
            Convites e remoção de integrantes dependem da definição de papéis e
            transferência de processos. Essas ações estão bloqueadas na
            demonstração.
          </Info>
          <section className="panel">
            <header className="section-head">
              <h2>Processos em que você participa</h2>
            </header>
            {db.cases
              .filter((c) => canAccessCase(user!, c))
              .slice(0, 5)
              .map((c) => (
                <CaseRow key={c.id} item={c} />
              ))}
          </section>
          <section className="panel office-activity">
            <header className="section-head">
              <h2>Atividade recente da equipe</h2>
            </header>
            {db.audits
              .filter(
                (a) =>
                  members.some((u) => u.id === a.actor) &&
                  !a.action.includes("particular"),
              )
              .slice(0, 5)
              .map((a) => (
                <Row
                  key={a.id}
                  title={a.action}
                  subtitle={`${db.users.find((u) => u.id === a.actor)?.name} · ${date(a.at)}`}
                />
              ))}
            {!db.audits.some((a) => members.some((u) => u.id === a.actor)) && (
              <Empty
                title="Nenhuma atividade registrada ainda"
                text="As ações profissionais aparecerão aqui com autoria."
              />
            )}
          </section>
        </>
      )}
      {selected && (
        <Modal title="Perfil do integrante" onClose={() => setSelected("")}>
          <Avatar name={db.users.find((u) => u.id === selected)!.name} />
          <h3>{db.users.find((u) => u.id === selected)!.name}</h3>
          <p>OAB {db.users.find((u) => u.id === selected)!.oab}</p>
          <p>{db.users.find((u) => u.id === selected)!.email}</p>
        </Modal>
      )}
    </div>
  );
}
function BuildingIcon() {
  return <Users size={30} />;
}
