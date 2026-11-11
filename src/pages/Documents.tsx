import { useState } from "react";
import {
  useParams,
  useNavigate,
  useSearchParams,
  Link,
} from "react-router-dom";
import { FileText, Folder, Plus, MoreHorizontal, Download } from "lucide-react";
import { useStore, transact } from "../store/store";
import {
  canAccessCase,
  canAccessDocument,
  canEditDocument,
  canVersionDocument,
  canWriteCase,
  canRevokeDocument,
} from "../domain/permissions";
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
  useLocalState,
} from "../components/ui";
import {
  UploadModal,
  ShareModal,
  Viewer,
  downloadDocument,
} from "../components/documents";
import {
  audit,
  deleteDocument,
  requestDeletion,
  requireThat,
  notify,
} from "../domain/actions";
import { date, includes, size, id, now } from "../lib/format";
export function Documents() {
  const { db, user } = useStore();
  const { processoId, clienteId } = useParams();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { run, confirm } = useFeedback();
  const [q, setQ] = useLocalState("doc-search:" + user!.id, "");
  const [scope, setScope] = useState(processoId || "Todos");
  const [category, setCategory] = useState(params.get("categoria") || "Todas");
  const [sort, setSort] = useState("recent");
  const [uploading, setUploading] = useState(!!params.get("solicitacao"));
  const [fileRequestId, setFileRequestId] = useState(
    params.get("solicitacao") || "",
  );
  const [uploadTarget, setUploadTarget] = useState("");
  const [askFile, setAskFile] = useState(false);
  const [view, setView] = useState(params.get("arquivo") || "");
  const [menu, setMenu] = useState(params.get("acoes") || "");
  const [clientChooser, setClientChooser] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [shareId, setShareId] = useState("");
  const [versionId, setVersionId] = useState("");
  const [history, setHistory] = useState("");
  const [rename, setRename] = useState("");
  const [move, setMove] = useState("");
  const [request, setRequest] = useState("");
  const [oldVersion, setOldVersion] = useState<number>();
  const [visible, setVisible] = useState(12);
  const cases = db.cases.filter(
    (c) =>
      canAccessCase(user!, c) && (!clienteId || c.clients.includes(clienteId)),
  );
  const accessible = db.documents.filter(
    (d) =>
      canAccessDocument(user!, d, db) && (!clienteId || d.owner === clienteId),
  );
  const docs = accessible
    .filter(
      (d) =>
        (scope === "Todos" ||
          (scope === "Pessoais" && !d.caseId) ||
          d.caseId === scope) &&
        (category === "Todas" || d.category === category) &&
        includes(d.name + " " + d.category, q),
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : b.versions.at(-1)!.at.localeCompare(a.versions.at(-1)!.at),
    );
  const current = accessible.find((d) => d.id === menu);
  const historyDoc = accessible.find((d) => d.id === history);
  const selectedCase = cases.find((c) => c.id === scope);
  const pendingFileRequests = db.fileRequests.filter(
    (r) =>
      r.clientId === user!.id &&
      r.status === "Pendente" &&
      cases.some((c) => c.id === r.caseId && canWriteCase(user!, c)),
  );
  const activeRequest = pendingFileRequests.find((r) => r.id === fileRequestId);
  const closeView = () => {
    setView("");
    setOldVersion(undefined);
    if (params.has("arquivo")) {
      params.delete("arquivo");
      setParams(params, { replace: true });
    }
  };
  return (
    <div className="page">
      <PageHeading
        title="Documentos"
        description="Cada arquivo no seu contexto. Encontre, consulte e compartilhe com clareza."
        action={
          cases.some((c) => canWriteCase(user!, c)) && (
            <button
              className="button primary"
              onClick={() => setUploading(true)}
            >
              <Plus size={18} />
              Enviar documento
            </button>
          )
        }
      />
      {user!.role === "advogado" &&
        cases.some((c) => canWriteCase(user!, c)) && (
          <button className="text-link" onClick={() => setAskFile(true)}>
            Solicitar documento ao cliente
          </button>
        )}
      {pendingFileRequests.length > 0 && (
        <section className="panel file-requests">
          <header className="section-head">
            <h2>Documentos solicitados</h2>
          </header>
          {pendingFileRequests.map((r) => (
            <Row key={r.id} title={r.title} subtitle={r.description}>
              <button
                className="button secondary"
                onClick={() => {
                  setFileRequestId(r.id);
                  setUploadTarget(r.caseId);
                  setUploading(true);
                }}
              >
                Enviar arquivo solicitado
              </button>
            </Row>
          ))}
        </section>
      )}
      {user!.role === "advogado" && (
        <div className="document-client-bar">
          <button
            className="button secondary"
            onClick={() => setClientChooser(true)}
          >
            Escolher cliente
          </button>
          <span>
            {clienteId
              ? db.users.find((u) => u.id === clienteId)?.name
              : "Todos os clientes autorizados"}
          </span>
          {clienteId && (
            <Link to="/advogado/documentos">Voltar à biblioteca</Link>
          )}
        </div>
      )}
      <div className="document-layout">
        <aside className="folder-sidebar">
          <span className="eyebrow">BIBLIOTECA</span>
          <button
            className={scope === "Todos" ? "active" : ""}
            onClick={() => setScope("Todos")}
          >
            <Folder size={18} />
            Todos os documentos<span>{accessible.length}</span>
          </button>
          {user!.role === "cliente" && (
            <button
              className={scope === "Pessoais" ? "active" : ""}
              onClick={() => setScope("Pessoais")}
            >
              <Folder size={18} />
              Documentos pessoais
            </button>
          )}
          {user!.role === "advogado" && clienteId && (
            <button
              onClick={() => {
                setScope("Todos");
                setCategory("Documentos pessoais");
              }}
            >
              <Folder size={18} />
              Documentos pessoais liberados
            </button>
          )}
          <span className="eyebrow">POR PROCESSO</span>
          {cases.map((c) => (
            <button
              key={c.id}
              className={scope === c.id ? "active" : ""}
              onClick={() => setScope(c.id)}
            >
              <Folder size={17} />
              <span>{c.title}</span>
            </button>
          ))}
          <Link
            className="text-link"
            to={"/" + user!.role + "/solicitacoes-documentos"}
          >
            Solicitações sobre documentos
          </Link>
        </aside>
        <section className="panel document-panel">
          <header className="section-head">
            <div>
              <h2>
                {selectedCase?.title ||
                  (scope === "Pessoais"
                    ? "Documentos pessoais"
                    : "Todos os documentos")}
              </h2>
              <p>{docs.length} arquivos acessíveis</p>
            </div>
            <Badge>{selectedCase?.status || "Biblioteca"}</Badge>
          </header>
          <div className="list-toolbar">
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Buscar documento ou categoria"
            />
            <select
              aria-label="Ordenação dos documentos"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="recent">Mais recentes</option>
              <option value="name">Nome A–Z</option>
            </select>
          </div>
          <div className="category-strip">
            {["Todas", ...db.categories.map((c) => c.name)].map((cat) => (
              <button
                key={cat}
                className={category === cat ? "active" : ""}
                onClick={() => {
                  setCategory(cat);
                  setVisible(12);
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          {docs.slice(0, visible).map((d) => (
            <div className="document-row" key={d.id}>
              <button className="doc-main" onClick={() => setView(d.id)}>
                <span className="file-icon">
                  <FileText size={21} />
                </span>
                <span>
                  <strong>{d.name}</strong>
                  <small>
                    {d.category} · {size(d.versions.at(-1)!.size)} · v
                    {d.versions.at(-1)!.number}
                  </small>
                  <small>
                    {db.cases.find((c) => c.id === d.caseId)?.title ||
                      "Pessoal · somente você"}
                  </small>
                </span>
              </button>
              <div className="doc-meta">
                <Badge>
                  {d.state !== "Disponível"
                    ? d.state
                    : d.internal
                      ? "Somente equipe"
                      : d.shared
                        ? "Compartilhado"
                        : "Reservado"}
                </Badge>
                <small>{date(d.versions.at(-1)!.at)}</small>
              </div>
              <button
                className="icon-button desktop-download"
                aria-label={"Baixar " + d.name}
                onClick={() => run(() => downloadDocument(d, db, user!))}
              >
                <Download size={18} />
              </button>
              <button
                className="icon-button"
                aria-label={"Ações de " + d.name}
                onClick={() => setMenu(d.id)}
              >
                <MoreHorizontal size={21} />
              </button>
            </div>
          ))}
          {!docs.length && (
            <Empty
              title="Nenhum documento encontrado"
              text="Ajuste sua busca ou envie um arquivo a um processo ativo."
            />
          )}
          {docs.length > visible && (
            <button
              className="button secondary load-more"
              onClick={() => setVisible(visible + 12)}
            >
              Carregar mais documentos
            </button>
          )}
        </section>
      </div>
      {clientChooser && (
        <Modal
          title="Documentos por cliente"
          onClose={() => setClientChooser(false)}
        >
          <SearchInput
            value={clientSearch}
            onChange={setClientSearch}
            placeholder="Buscar cliente por nome ou e-mail"
          />
          {[
            ...new Set(
              db.cases
                .filter((c) => canAccessCase(user!, c))
                .flatMap((c) => c.clients),
            ),
          ]
            .map((cid) => db.users.find((u) => u.id === cid)!)
            .filter((u) => includes(u.name + " " + u.email, clientSearch))
            .map((u) => (
              <Row
                key={u.id}
                title={u.name}
                subtitle={`${db.cases.filter((c) => canAccessCase(user!, c) && c.clients.includes(u.id)).length} processos · ${db.documents.filter((d) => canAccessDocument(user!, d, db) && d.owner === u.id).length} documentos`}
                onClick={() => {
                  setClientChooser(false);
                  navigate("/advogado/documentos/clientes/" + u.id);
                }}
              />
            ))}
        </Modal>
      )}
      {uploading && (
        <UploadModal
          caseId={activeRequest?.caseId || uploadTarget || selectedCase?.id}
          fulfilRequest={activeRequest?.id}
          onClose={() => {
            setUploading(false);
            setFileRequestId("");
            setUploadTarget("");
          }}
        />
      )}
      {askFile && (
        <Modal title="Solicitar documento" onClose={() => setAskFile(false)}>
          <Form
            onSubmit={(fd) => {
              if (
                run(
                  () =>
                    transact((d) => {
                      const cid = String(fd.get("caseId"));
                      const c = d.cases.find(
                        (c) => c.id === cid && canWriteCase(user!, c),
                      );
                      requireThat(c && user!.role === "advogado");
                      const rid = id();
                      c!.clients.forEach((clientId) => {
                        d.fileRequests.unshift({
                          id: rid + "-" + clientId,
                          caseId: cid,
                          clientId,
                          title: String(fd.get("title")),
                          description: String(fd.get("description")),
                          status: "Pendente",
                          at: now(),
                          author: user!.id,
                        });
                        notify(
                          d,
                          clientId,
                          "Documento solicitado: " + String(fd.get("title")),
                          "/cliente/documentos?solicitacao=" +
                            rid +
                            "-" +
                            clientId,
                          "Documentos",
                        );
                      });
                      audit(d, user!, "Solicitar documento", cid);
                    }),
                  "Solicitação disponível para os clientes do processo.",
                )
              )
                setAskFile(false);
            }}
          >
            <Field label="Processo">
              <select name="caseId" required defaultValue={selectedCase?.id}>
                {cases
                  .filter((c) => canWriteCase(user!, c))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Documento necessário">
              <input name="title" required />
            </Field>
            <Field label="Orientação ao cliente">
              <textarea name="description" required />
            </Field>
            <button className="button primary">Enviar solicitação</button>
          </Form>
        </Modal>
      )}
      {versionId && (
        <UploadModal
          caseId={accessible.find((d) => d.id === versionId)?.caseId}
          versionOf={versionId}
          onClose={() => setVersionId("")}
        />
      )}
      {view && (
        <Viewer
          documentId={view}
          version={oldVersion}
          onClose={closeView}
          onActions={() => {
            const did = view;
            closeView();
            setMenu(did);
          }}
          chatLink={
            accessible.find((d) => d.id === view)?.caseId
              ? () => {
                  const d = accessible.find((d) => d.id === view)!;
                  navigate(
                    "/" + user!.role + "/processos/" + d.caseId + "/conversa",
                  );
                }
              : undefined
          }
        />
      )}
      {current && (
        <Modal title={current.name} onClose={() => setMenu("")}>
          <div className="action-list">
            <button
              onClick={() => {
                setView(current.id);
                setMenu("");
              }}
            >
              Abrir documento
            </button>
            <button
              onClick={() => run(() => downloadDocument(current, db, user!))}
            >
              Baixar documento
            </button>
            {!current.internal && (
              <button
                onClick={() => {
                  setShareId(current.id);
                  setMenu("");
                }}
              >
                Compartilhar documento
              </button>
            )}
            {canVersionDocument(user!, current, db) && (
              <button
                onClick={() => {
                  setVersionId(current.id);
                  setMenu("");
                }}
              >
                Enviar nova versão
              </button>
            )}
            {user!.role === "advogado" && (
              <button
                onClick={() => {
                  setHistory(current.id);
                  setMenu("");
                }}
              >
                Histórico de versões
              </button>
            )}
            {canEditDocument(user!, current, db) && (
              <>
                <button
                  onClick={() => {
                    setRename(current.id);
                    setMenu("");
                  }}
                >
                  Renomear
                </button>
                <button
                  onClick={() => {
                    setMove(current.id);
                    setMenu("");
                  }}
                >
                  Mover categoria
                </button>
                {canRevokeDocument(user!, current, db) && (
                  <button
                    onClick={() =>
                      confirm(
                        "Revogar acesso do cliente",
                        "O arquivo ficará reservado à equipe. Cópias já baixadas não serão removidas.",
                        () =>
                          transact((d) => {
                            const doc = d.documents.find(
                              (d) => d.id === current.id,
                            )!;
                            requireThat(canRevokeDocument(user!, doc, d));
                            doc.shared = false;
                            audit(d, user!, "Revogar compartilhamento", doc.id);
                          }),
                      )
                    }
                  >
                    Revogar compartilhamento
                  </button>
                )}
                <button
                  className="danger-text"
                  onClick={() =>
                    confirm(
                      "Excluir documento",
                      "O documento será removido da biblioteca. As mensagens e os metadados históricos serão preservados.",
                      () => {
                        transact((d) => deleteDocument(d, user!, current.id));
                        setMenu("");
                      },
                      true,
                    )
                  }
                >
                  Excluir documento
                </button>
              </>
            )}
            {user!.role === "cliente" && (
              <button
                className="danger-text"
                onClick={() => {
                  setRequest(current.id);
                  setMenu("");
                }}
              >
                Solicitar exclusão
              </button>
            )}
          </div>
        </Modal>
      )}
      {shareId && (
        <ShareModal documentId={shareId} onClose={() => setShareId("")} />
      )}
      {(rename || move) && (
        <Modal
          title={rename ? "Renomear documento" : "Mover categoria"}
          onClose={() => {
            setRename("");
            setMove("");
          }}
        >
          <Form
            onSubmit={(fd) => {
              if (
                run(
                  () =>
                    transact((d) => {
                      const doc = d.documents.find(
                        (x) => x.id === (rename || move),
                      )!;
                      requireThat(canEditDocument(user!, doc, d));
                      const val = String(fd.get("value")).trim();
                      requireThat(val, "Preencha o valor.");
                      if (rename) doc.name = val;
                      else {
                        doc.category = val;
                        if (
                          doc.state === "Disponível" ||
                          doc.state === "Organização pendente"
                        )
                          doc.state =
                            val === "Organização pendente"
                              ? "Organização pendente"
                              : "Disponível";
                      }
                      audit(
                        d,
                        user!,
                        rename ? "Renomear documento" : "Mover categoria",
                        doc.id,
                      );
                    }),
                  "Documento atualizado.",
                )
              ) {
                setRename("");
                setMove("");
              }
            }}
          >
            <Field label={rename ? "Nome do documento" : "Categoria"}>
              {rename ? (
                <input
                  name="value"
                  required
                  defaultValue={accessible.find((d) => d.id === rename)?.name}
                />
              ) : (
                <select name="value">
                  {db.categories
                    .filter((c) => c.active)
                    .map((c) => (
                      <option key={c.id}>{c.name}</option>
                    ))}
                </select>
              )}
            </Field>
            <Info>
              Referências históricas e versões anteriores serão preservadas.
            </Info>
            <div className="modal-actions">
              <button className="button primary">Salvar alteração</button>
            </div>
          </Form>
        </Modal>
      )}
      {historyDoc && (
        <Modal title="Histórico de versões" onClose={() => setHistory("")}>
          <h3>{historyDoc.name}</h3>
          {[...historyDoc.versions].reverse().map((v) => (
            <Row
              key={v.id}
              title={`Versão ${v.number} · ${v.name}`}
              subtitle={`${date(v.at)} · ${db.users.find((u) => u.id === v.author)?.name} · ${size(v.size)}`}
              onClick={() => {
                setOldVersion(v.number);
                setView(historyDoc.id);
                setHistory("");
              }}
            />
          ))}
          <Info>
            Restauração bloqueada: a política de retenção e restauração ainda
            não foi aprovada.
          </Info>
          <h3>Referências no chat</h3>
          {db.messages
            .filter((m) => m.attachment === historyDoc.id)
            .map((m) => (
              <p key={m.id}>
                Versão {m.version} · {date(m.at)} · {m.text || "Anexo"}
              </p>
            ))}
        </Modal>
      )}
      {request && (
        <Modal title="Solicitar exclusão" onClose={() => setRequest("")}>
          <Info>
            O documento permanece disponível até análise. Processos ativos
            encaminham o pedido aos advogados; os demais, ao suporte.
          </Info>
          <Form
            onSubmit={(fd) => {
              if (
                run(
                  () =>
                    transact((d) =>
                      requestDeletion(
                        d,
                        user!,
                        request,
                        String(fd.get("reason")),
                      ),
                    ),
                  "Solicitação registrada.",
                )
              )
                setRequest("");
            }}
          >
            <Field label="Motivo (opcional)">
              <textarea name="reason" rows={3} />
            </Field>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setRequest("")}
              >
                Cancelar
              </button>
              <button className="button primary">Solicitar exclusão</button>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  );
}
