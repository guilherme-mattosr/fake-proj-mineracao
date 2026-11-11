import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Download,
  FileText,
  Upload,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { Document } from "../domain/types";
import { canAccessDocument, canWriteCase } from "../domain/permissions";
import { useStore, transact } from "../store/store";
import { requireThat, share, upload, audit } from "../domain/actions";
import { Badge, Field, Form, Info, Modal, useFeedback } from "./ui";
import { date, download, size } from "../lib/format";
import { classifyFile } from "../services/classification";
function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    r.readAsDataURL(file);
  });
}
export interface UploadModalProps {
  caseId?: string;
  versionOf?: string;
  onClose: () => void;
  onUploaded?: (id: string) => void;
  official?: boolean;
  internalThreadId?: string;
  fulfilRequest?: string;
}
export function UploadModal({
  caseId,
  versionOf,
  onClose,
  onUploaded,
  official = false,
  internalThreadId,
  fulfilRequest,
}: UploadModalProps) {
  const { db, user } = useStore();
  const { run, toast } = useFeedback();
  const destinations = db.cases.filter((c) => canWriteCase(user!, c));
  const [target, setTarget] = useState(caseId || destinations[0]?.id || "");
  const [file, setFile] = useState<File>();
  const [category, setCategory] = useState("Organização pendente");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const abort = useRef(false);
  useEffect(
    () => () => {
      abort.current = true;
    },
    [],
  );
  const send = async (fd: FormData) => {
    if (!file) {
      setError("Selecione um arquivo.");
      return;
    }
    setError("");
    abort.current = false;
    setBusy(true);
    try {
      requireThat(
        file.size <= 5 * 1024 * 1024 && file.size > 0,
        "Use arquivos de até 5 MB.",
      );
      const content = await readFile(file);
      for (let n = 20; n <= 100; n += 20) {
        await new Promise((r) => setTimeout(r, 120));
        if (abort.current) return;
        setProgress(n);
      }
      let did = "";
      if (
        run(
          () =>
            transact((d) => {
              did = upload(
                d,
                user!,
                target,
                {
                  name: file.name,
                  size: file.size,
                  mime:
                    file.type ||
                    (file.name.endsWith(".pdf")
                      ? "application/pdf"
                      : "text/plain"),
                  content,
                },
                category,
                fd.get("shared") === "on",
                versionOf,
                internalThreadId,
              );
              if (fulfilRequest) {
                const r = d.fileRequests.find(
                  (r) =>
                    r.id === fulfilRequest &&
                    r.clientId === user!.id &&
                    r.caseId === target &&
                    r.status === "Pendente",
                );
                requireThat(r, "Solicitação de documento indisponível.");
                r!.status = "Atendida";
                audit(d, user!, "Atender solicitação de arquivo", r!.id);
              }
            }),
          versionOf
            ? "Nova versão salva."
            : "Documento enviado e disponível na biblioteca.",
        )
      ) {
        onUploaded?.(did);
        onClose();
      } else
        setError(
          "O envio não foi concluído. Verifique o formato, o espaço local e tente novamente.",
        );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={versionOf ? "Enviar nova versão" : "Enviar documento"}
      onClose={() => {
        abort.current = true;
        onClose();
      }}
    >
      <p className="muted">
        O arquivo será salvo no navegador e vinculado ao destino confirmado.
      </p>
      {!destinations.length && !internalThreadId ? (
        <Info>Não existe processo ativo habilitado para receber arquivos.</Info>
      ) : (
        <Form onSubmit={send}>
          {internalThreadId ? (
            <Info>
              Destino: conversa interna. O arquivo será reservado aos
              profissionais participantes.
            </Info>
          ) : (
            <Field label="Processo de destino">
              <select
                required
                value={target}
                disabled={!!caseId || !!versionOf || busy}
                onChange={(e) => setTarget(e.target.value)}
              >
                {destinations.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <label className="upload-drop">
            <Upload size={30} />
            <strong>{file?.name || "Selecione um arquivo"}</strong>
            <span>PDF, imagem, áudio, vídeo ou TXT · até 5 MB</span>
            <input
              aria-label="Arquivo para envio"
              type="file"
              required
              accept=".pdf,.png,.jpg,.jpeg,.webp,.mp3,.wav,.webm,.ogg,.mp4,.txt"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFile(f);
                if (f) setCategory(classifyFile(db, f.name));
              }}
            />
          </label>
          {file && (
            <p className="muted">
              {size(file.size)} · {file.type || "Formato a validar"}
            </p>
          )}
          {!versionOf && !internalThreadId && (
            <>
              <Field label="Classificação sugerida (simulada)">
                <select
                  value={category}
                  disabled={busy}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {db.categories
                    .filter((c) => c.active)
                    .map((c) => (
                      <option key={c.id}>{c.name}</option>
                    ))}
                </select>
              </Field>
              <Info>
                Se a classificação não identificar uma categoria, o arquivo
                ficará em Organização pendente.
              </Info>
              {user!.role === "advogado" && (
                <label className="check-field">
                  <input
                    type="checkbox"
                    name="shared"
                    disabled={busy}
                    defaultChecked={official}
                    required={official}
                  />
                  Confirmo que este arquivo poderá ser visto pelo cliente deste
                  processo.
                </label>
              )}
            </>
          )}
          {busy && (
            <div className="upload-progress" role="status">
              <progress max={100} value={progress} />
              <span>Enviando · {progress}%</span>
            </div>
          )}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div className="modal-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                abort.current = true;
                toast("Envio cancelado. Nenhum arquivo foi criado.");
                onClose();
              }}
            >
              <X size={16} />
              Cancelar
            </button>
            <button disabled={!file || busy} className="button primary">
              {busy
                ? "Enviando..."
                : error
                  ? "Tentar novamente"
                  : "Confirmar envio"}
            </button>
          </div>
        </Form>
      )}
    </Modal>
  );
}
export function downloadDocument(
  doc: Document,
  db: ReturnType<typeof useStore>["db"],
  user: NonNullable<ReturnType<typeof useStore>["user"]>,
  version?: number,
) {
  requireThat(canAccessDocument(user, doc, db));
  requireThat(
    doc.state !== "Indisponível" &&
      doc.state !== "Quarentena" &&
      doc.state !== "Processando",
    "Arquivo indisponível.",
  );
  const v = version
    ? doc.versions.find((v) => v.number === version)
    : doc.versions.at(-1);
  requireThat(v);
  requireThat(
    user.role === "advogado" || v!.number === doc.versions.at(-1)!.number,
    "Esta versão não está disponível.",
  );
  if (v!.content) {
    const a = document.createElement("a");
    a.href = v!.content;
    a.download = v!.name;
    a.click();
  } else
    download(
      doc.name.replace(/\.[^.]+$/, "") + "-demonstracao.txt",
      `DOCUMENTO FICTÍCIO — ELO JURÍDICO\n${doc.name}\nVersão ${v!.number}\nSem validade jurídica. Arquivo de demonstração.\nProcesso: ${doc.caseId || "Documentos pessoais"}`,
    );
  transact((d) =>
    audit(d, user, "Baixar documento", doc.id, "Versão " + v!.number),
  );
}
export interface ViewerProps {
  documentId: string;
  onClose: () => void;
  version?: number;
  chatLink?: () => void;
  onActions?: () => void;
}
export function Viewer({
  documentId,
  onClose,
  version,
  chatLink,
  onActions,
}: ViewerProps) {
  const navigate = useNavigate();
  const { db, user } = useStore();
  const { run } = useFeedback();
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const doc = db.documents.find(
    (d) => d.id === documentId && canAccessDocument(user!, d, db),
  );
  const v = version
    ? doc?.versions.find(
        (v) =>
          v.number === version &&
          (user!.role === "advogado" ||
            v.number === doc.versions.at(-1)!.number),
      )
    : doc?.versions.at(-1);
  const available =
    doc &&
    v &&
    !["Indisponível", "Quarentena", "Processando"].includes(doc.state);
  return (
    <Modal title={doc?.name || "Documento indisponível"} onClose={onClose} wide>
      {!available ? (
        <Info error>
          Este arquivo ou versão não está disponível para sua conta.
        </Info>
      ) : (
        <>
          <div className="document-toolbar">
            <button
              className="button secondary"
              onClick={() => {
                if (onActions) {
                  onActions();
                  return;
                }
                onClose();
                navigate("/" + user!.role + "/documentos?acoes=" + doc.id);
              }}
            >
              Ações do documento
            </button>
            <Badge>{doc.state}</Badge>
            <span>
              Versão {v.number} · {size(v.size)} · {date(v.at)}
            </span>
            <button
              className="button secondary"
              onClick={() =>
                run(() => downloadDocument(doc, db, user!, v.number))
              }
            >
              <Download size={16} />
              Baixar
            </button>
          </div>
          {v.content ? (
            <div className="actual-preview">
              {v.mime.startsWith("image/") ? (
                <img src={v.content} alt={doc.name} />
              ) : v.mime.startsWith("audio/") ? (
                <audio controls src={v.content} />
              ) : v.mime.startsWith("video/") ? (
                <video controls src={v.content} />
              ) : v.mime === "application/pdf" ? (
                <iframe title={"Prévia de " + doc.name} src={v.content} />
              ) : (
                <Info>Este formato não possui prévia. Utilize o download.</Info>
              )}
            </div>
          ) : (
            <>
              <Info>
                Prévia fictícia. O download contém um TXT identificado como
                demonstração.
              </Info>
              <div className="preview-controls">
                <button
                  className="icon-button"
                  aria-label="Página anterior"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={18} />
                </button>
                <span>Página {page} de 3</span>
                <button
                  className="icon-button"
                  aria-label="Próxima página"
                  disabled={page === 3}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Diminuir zoom"
                  disabled={zoom <= 50}
                  onClick={() => setZoom(zoom - 25)}
                >
                  <ZoomOut size={18} />
                </button>
                <span>{zoom}%</span>
                <button
                  className="icon-button"
                  aria-label="Aumentar zoom"
                  disabled={zoom >= 150}
                  onClick={() => setZoom(zoom + 25)}
                >
                  <ZoomIn size={18} />
                </button>
              </div>
              <div className="paper-scroll">
                <article
                  className="paper"
                  style={{ fontSize: zoom / 100 + "rem" }}
                >
                  <FileText size={28} />
                  <span className="eyebrow">
                    ELO JURÍDICO · DOCUMENTO FICTÍCIO
                  </span>
                  <h2>{doc.name.replace(".pdf", "")}</h2>
                  <p>
                    Versão {v.number} · Página {page}
                  </p>
                  <hr />
                  <p>
                    Este documento foi criado exclusivamente para demonstrar a
                    organização de arquivos no aplicativo.
                  </p>
                  <p>
                    As informações apresentadas não possuem validade jurídica e
                    não representam pessoas ou processos reais.
                  </p>
                  <div className="paper-lines" />
                  <p>
                    Contexto:{" "}
                    {db.cases.find((c) => c.id === doc.caseId)?.title ||
                      "Biblioteca pessoal"}
                  </p>
                  <small>Documento de demonstração · {date(v.at)}</small>
                </article>
              </div>
            </>
          )}
          {chatLink && (
            <button className="button secondary" onClick={chatLink}>
              Abrir conversa relacionada
            </button>
          )}
        </>
      )}
    </Modal>
  );
}
export interface ShareModalProps {
  documentId: string;
  onClose: () => void;
}
export function ShareModal({ documentId, onClose }: ShareModalProps) {
  const { db, user } = useStore();
  const { run } = useFeedback();
  const doc = db.documents.find(
    (d) => d.id === documentId && canAccessDocument(user!, d, db),
  );
  const cases = db.cases.filter(
    (c) =>
      canWriteCase(user!, c) &&
      doc &&
      (user!.role === "cliente"
        ? c.clients.includes(user!.id)
        : c.clients.includes(doc.owner)),
  );
  const [target, setTarget] = useState(cases[0]?.id || "");
  return (
    <Modal title="Compartilhar documento" onClose={onClose}>
      {!doc ? (
        <Info error>Documento indisponível.</Info>
      ) : (
        <>
          <h3>{doc.name}</h3>
          <p>Versão {doc.versions.at(-1)?.number}</p>
          <Info>
            Somente este arquivo será enviado. Mensagens, biblioteca pessoal e
            versões anteriores não serão compartilhadas. Cópias em outros
            processos não recebem alterações futuras.
          </Info>
          <Form
            onSubmit={() => {
              if (
                run(
                  () => transact((d) => share(d, user!, doc.id, target)),
                  "Documento compartilhado no destino confirmado.",
                )
              )
                onClose();
            }}
          >
            <Field label="Processo de destino">
              <select
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                <option value="">Selecione</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ·{" "}
                    {db.users.find((u) => u.id === c.lawyers[0])?.name}
                  </option>
                ))}
              </select>
            </Field>
            <label className="check-field">
              <input type="checkbox" required />
              Confirmo o arquivo, a versão e o destinatário acima.
            </label>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button disabled={!cases.length} className="button primary">
                Confirmar compartilhamento
              </button>
            </div>
          </Form>
        </>
      )}
    </Modal>
  );
}
