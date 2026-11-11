import { useState } from "react";
import { LockKeyhole, Plus } from "lucide-react";
import { useStore, transact } from "../store/store";
import { audit, requireThat } from "../domain/actions";
import { Composer, Messages } from "../components/chat";
import {
  Empty,
  Field,
  Form,
  Info,
  Modal,
  PageHeading,
  useFeedback,
  useLocalState,
} from "../components/ui";
import { id, now } from "../lib/format";
import { SystemPage } from "./System";
import { Link } from "react-router-dom";
import { canAccessCase } from "../domain/permissions";
import { UploadModal, Viewer } from "../components/documents";
export function Internal() {
  const { db, user } = useStore();
  const { run, confirm } = useFeedback();
  const threads = db.internal.filter(
    (t) =>
      user!.office &&
      t.office === user!.office &&
      t.participants.includes(user!.id),
  );
  const [selected, setSelected] = useState(threads[0]?.id || "");
  const [draft, setDraft] = useLocalState(
    "internal-draft:" + user!.id + ":" + selected,
    "",
  );
  const [create, setCreate] = useState(false);
  const [reply, setReply] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [view, setView] = useState<{ id: string; version?: number }>();
  const thread = threads.find((t) => t.id === selected);
  if (!user!.office || user!.role !== "advogado")
    return <SystemPage kind="acesso-negado" />;
  const send = (text = draft, attachment?: string) => {
    if (
      run(() =>
        transact((d) => {
          const t = d.internal.find(
            (t) =>
              t.id === selected &&
              t.participants.includes(user!.id) &&
              t.office === user!.office,
          );
          requireThat(t && (text.trim() || attachment));
          const doc = attachment
            ? d.documents.find(
                (d) => d.id === attachment && d.internalThreadId === t!.id,
              )
            : undefined;
          if (attachment) requireThat(doc);
          t!.messages.push({
            id: id(),
            caseId: t!.id,
            author: user!.id,
            text,
            at: now(),
            status: "Entregue",
            attachment,
            version: doc?.versions.at(-1)?.number,
            replyTo: reply,
          });
          audit(d, user!, "Mensagem interna", t!.id);
        }),
      )
    ) {
      setDraft("");
      setReply(undefined);
    }
  };
  return (
    <div className="page">
      <PageHeading
        title="Conversas internas"
        description="Um espaço reservado entre os profissionais do escritório."
        action={
          <button className="button primary" onClick={() => setCreate(true)}>
            <Plus size={18} />
            Nova conversa
          </button>
        }
      />
      <Info>
        <LockKeyhole size={15} /> Clientes e assistentes não têm acesso a estas
        conversas. Os anexos permanecem reservados aos profissionais
        participantes.
      </Info>
      <div className="internal-layout">
        <aside className="panel">
          {threads.map((t) => (
            <button
              className={"history-row " + (t.id === selected ? "selected" : "")}
              key={t.id}
              onClick={() => setSelected(t.id)}
            >
              <strong>{t.title}</strong>
              <small>
                {t.participants
                  .map(
                    (id) =>
                      db.users.find((u) => u.id === id)?.name.split(" ")[0],
                  )
                  .join(", ")}
              </small>
            </button>
          ))}
        </aside>
        <section className="chat-panel">
          {thread ? (
            <>
              <header className="internal-header">
                <LockKeyhole size={18} />
                <h2>{thread.title}</h2>
                {thread.caseId && (
                  <Link
                    className="text-link"
                    to={"/advogado/processos/" + thread.caseId + "/dados"}
                  >
                    Abrir processo
                  </Link>
                )}
              </header>
              <Messages
                messages={thread.messages}
                onOpen={(id, version) => setView({ id, version })}
                onReply={(m) => setReply(m.id)}
              />
              {reply && (
                <div className="info">
                  Respondendo à mensagem selecionada{" "}
                  <button
                    className="text-link"
                    onClick={() => setReply(undefined)}
                  >
                    Cancelar
                  </button>
                </div>
              )}
              <Composer
                draft={draft}
                setDraft={setDraft}
                onAttach={() => setUploading(true)}
                onAudio={() =>
                  confirm(
                    "Enviar áudio fictício",
                    "Uma mensagem de áudio demonstrativo será adicionada à conversa interna, sem gravação real.",
                    () =>
                      send(
                        "[Áudio demonstrativo] Mensagem reservada à equipe.",
                      ),
                  )
                }
                disabled={false}
                onCancelReply={() => setReply(undefined)}
                onSend={() => send()}
              />
              <small className="internal-limits">
                Conversa e anexos internos não são utilizados como fonte pela
                IA.
              </small>
            </>
          ) : (
            <Empty title="Selecione ou crie uma conversa interna" />
          )}
        </section>
      </div>
      {uploading && thread && (
        <UploadModal
          internalThreadId={thread.id}
          onClose={() => setUploading(false)}
          onUploaded={(did) => send("", did)}
        />
      )}
      {view && (
        <Viewer
          documentId={view.id}
          version={view.version}
          onClose={() => setView(undefined)}
        />
      )}
      {create && (
        <Modal title="Nova conversa interna" onClose={() => setCreate(false)}>
          <Form
            onSubmit={(fd) => {
              const tid = id();
              if (
                run(
                  () =>
                    transact((d) => {
                      const members = fd.getAll("member").map(String);
                      requireThat(
                        members.length,
                        "Selecione ao menos um colega.",
                      );
                      requireThat(
                        members.every((id) =>
                          d.users.some(
                            (u) =>
                              u.id === id &&
                              u.office === user!.office &&
                              u.verified,
                          ),
                        ),
                      );
                      d.internal.unshift({
                        id: tid,
                        office: user!.office!,
                        title: String(fd.get("title")),
                        caseId: String(fd.get("caseId") || "") || undefined,
                        participants: [user!.id, ...members],
                        messages: [],
                      });
                      audit(d, user!, "Criar conversa interna", tid);
                    }),
                  "Conversa interna criada.",
                )
              ) {
                setSelected(tid);
                setCreate(false);
              }
            }}
          >
            <Field label="Título">
              <input name="title" required />
            </Field>
            <Field label="Processo relacionado (opcional)">
              <select name="caseId">
                <option value="">Sem processo relacionado</option>
                {db.cases
                  .filter((c) => canAccessCase(user!, c))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </select>
            </Field>
            <fieldset>
              <legend>Participantes</legend>
              {db.users
                .filter(
                  (u) =>
                    u.office === user!.office &&
                    u.id !== user!.id &&
                    u.verified,
                )
                .map((u) => (
                  <label className="check-field" key={u.id}>
                    <input type="checkbox" name="member" value={u.id} />
                    {u.name}
                  </label>
                ))}
            </fieldset>
            <div className="modal-actions">
              <button className="button primary">Criar conversa</button>
            </div>
          </Form>
        </Modal>
      )}
    </div>
  );
}
