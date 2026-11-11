import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowUp,
  FileText,
  Paperclip,
  Play,
  Reply,
  RotateCcw,
  Square,
} from "lucide-react";
import type { Message } from "../domain/types";
import { useStore } from "../store/store";
import { Avatar, Badge } from "./ui";
import { time } from "../lib/format";
export interface MessagesProps {
  messages: Message[];
  onOpen: (id: string, version?: number) => void;
  onRetry?: (m: Message) => void;
  onReply?: (m: Message) => void;
  renderExtra?: (message: Message) => ReactNode;
  footer?: ReactNode;
}
export function Messages({
  messages,
  onOpen,
  onRetry,
  onReply,
  renderExtra,
  footer,
}: MessagesProps) {
  const { db, user } = useStore();
  const container = useRef<HTMLDivElement>(null);
  const previousKey = useRef("");
  const atBottom = useRef(true);
  const scrollKey =
    "chat-scroll:" + user!.id + ":" + (messages[0]?.caseId || "empty");
  const [playing, setPlaying] = useState("");
  useEffect(() => {
    const el = container.current;
    if (!el) return;
    if (previousKey.current !== scrollKey) {
      const saved = sessionStorage.getItem(scrollKey);
      el.scrollTop = saved === null ? el.scrollHeight : Number(saved);
      previousKey.current = scrollKey;
    } else if (atBottom.current) el.scrollTop = el.scrollHeight;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  }, [messages.length, scrollKey]);
  return (
    <div
      ref={container}
      className="messages"
      aria-label="Histórico de mensagens"
      onScroll={(e) => {
        const el = e.currentTarget;
        sessionStorage.setItem(scrollKey, String(el.scrollTop));
        atBottom.current =
          el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      }}
    >
      <div className="chat-date">HISTÓRICO DO PROCESSO · DADOS FICTÍCIOS</div>
      {!messages.length && (
        <div className="empty">
          <h3>A conversa começa aqui</h3>
          <p>
            Envie a primeira mensagem para iniciar o atendimento neste processo.
          </p>
        </div>
      )}
      {messages.map((m) => {
        const author =
          m.author === "ia"
            ? "Assistente IA"
            : db.users.find((u) => u.id === m.author)?.name || "Participante";
        const own = m.author === user!.id;
        const doc = db.documents.find((d) => d.id === m.attachment);
        const v = doc?.versions.find((v) => v.number === m.version);
        const reply = messages.find((x) => x.id === m.replyTo);
        return (
          <article
            key={m.id}
            className={
              "message " + (own ? "own" : m.author === "ia" ? "ai" : "")
            }
          >
            <div className="message-avatar">
              {!own && <Avatar name={author} small />}
            </div>
            <div className="bubble">
              <div className="message-author">
                {author}
                {m.author === "ia" && <Badge>Automático</Badge>}
                {onReply && (
                  <button
                    className="message-reply"
                    aria-label={"Responder a mensagem de " + author}
                    onClick={() => onReply(m)}
                  >
                    <Reply size={14} />
                  </button>
                )}
              </div>
              {reply && <blockquote>{reply.text.slice(0, 120)}</blockquote>}
              {m.text && <p>{m.text}</p>}
              {renderExtra?.(m)}
              {m.attachment && (
                <button
                  className="attachment"
                  onClick={() => onOpen(m.attachment!, m.version)}
                >
                  <FileText size={24} />
                  <span>
                    {v?.name || "Arquivo indisponível"}
                    <small>Versão {m.version} · Abrir arquivo</small>
                  </span>
                </button>
              )}
              {m.text.startsWith("[Áudio demonstrativo]") && (
                <button
                  className="audio-demo"
                  onClick={() => setPlaying(playing === m.id ? "" : m.id)}
                >
                  {playing === m.id ? <Square size={15} /> : <Play size={15} />}
                  <span>
                    {playing === m.id
                      ? "Reproduzindo animação · sem áudio real"
                      : "Reprodução visual demonstrativa"}
                  </span>
                  <span className={playing === m.id ? "wave playing" : "wave"}>
                    ▂▅▃▇▄▂▆▄▃▅
                  </span>
                </button>
              )}
              {m.text.startsWith("[Vídeo demonstrativo]") && (
                <button
                  className={
                    "video-demo " + (playing === m.id ? "playing" : "")
                  }
                  onClick={() => setPlaying(playing === m.id ? "" : m.id)}
                >
                  <span>
                    {playing === m.id ? (
                      <Square size={28} />
                    ) : (
                      <Play size={28} />
                    )}
                  </span>
                  <small>
                    {playing === m.id
                      ? "Reproduzindo animação demonstrativa"
                      : "Reproduzir vídeo demonstrativo"}{" "}
                    · sem vídeo real
                  </small>
                </button>
              )}
              <div className="message-meta">
                <time dateTime={m.at}>{time(m.at)}</time>
                {own && (
                  <span>
                    {m.status}
                    {m.status === "Entregue" ? " · simulado" : ""}
                  </span>
                )}
                {m.policy && <span>Política v{m.policy}</span>}
              </div>
              {m.status === "Falhou" && onRetry && (
                <button className="text-link" onClick={() => onRetry(m)}>
                  <RotateCcw size={13} />
                  Tentar novamente
                </button>
              )}
            </div>
          </article>
        );
      })}
      {footer}
    </div>
  );
}
export interface ComposerProps {
  draft: string;
  setDraft: (s: string) => void;
  onSend: () => void;
  onAttach: () => void;
  onAudio: () => void;
  reply?: Message;
  onCancelReply: () => void;
  disabled?: boolean;
  mediaDisabled?: boolean;
}
export function Composer({
  draft,
  setDraft,
  onSend,
  onAttach,
  onAudio,
  reply,
  onCancelReply,
  disabled = false,
  mediaDisabled = false,
}: ComposerProps) {
  return (
    <div className="composer-wrap">
      {reply && (
        <div className="reply-preview">
          <span>Respondendo: {reply.text.slice(0, 100)}</span>
          <button className="text-link" onClick={onCancelReply}>
            Cancelar
          </button>
        </div>
      )}
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          onSend();
        }}
      >
        <button
          type="button"
          className="icon-button"
          aria-label="Anexar documento"
          onClick={onAttach}
          disabled={disabled || mediaDisabled}
          title={
            mediaDisabled
              ? "Indisponível até definição da política do escritório"
              : "Anexar documento"
          }
        >
          <Paperclip size={22} />
        </button>
        <textarea
          rows={1}
          aria-label="Mensagem"
          placeholder="Escreva sua mensagem..."
          value={draft}
          disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
        />
        <button
          type="button"
          className="audio-button"
          aria-label="Enviar áudio fictício"
          onClick={onAudio}
          disabled={disabled || mediaDisabled}
          title={
            mediaDisabled
              ? "Indisponível até definição da política do escritório"
              : "Enviar áudio fictício"
          }
        >
          Áudio
        </button>
        <button
          className="send-button"
          aria-label="Enviar mensagem"
          disabled={!draft.trim() || disabled}
        >
          <ArrowUp size={21} />
        </button>
      </form>
      <small className="composer-note">
        Assistente IA identificado. Mensagens e entregas simuladas neste
        navegador.
      </small>
    </div>
  );
}
