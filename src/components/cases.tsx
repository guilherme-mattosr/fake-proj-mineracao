import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  MessageSquare,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useState } from "react";
import type { LegalCase } from "../domain/types";
import { useStore, transact } from "../store/store";
import { Avatar, Badge, Field, Form, Modal, useFeedback } from "./ui";
import { date } from "../lib/format";
import { createCase } from "../domain/actions";
export interface CaseRowProps {
  item: LegalCase;
}
export function CaseRow({ item }: CaseRowProps) {
  const { db, user } = useStore();
  const client = db.users.find((u) => u.id === item.clients[0]);
  const law = db.users.find((u) => u.id === item.lawyers[0]);
  const unread = db.notices.filter(
    (n) =>
      n.userId === user!.id &&
      !n.read &&
      n.path.includes("/processos/" + item.id + "/"),
  ).length;
  return (
    <Link
      className="case-row"
      to={`/${user!.role}/processos/${item.id}/conversa`}
    >
      <span className="case-symbol">
        <MessageSquare size={21} />
      </span>
      <div className="case-row-main">
        <strong>{item.title}</strong>
        <span>
          {user!.role === "advogado"
            ? client?.name || "Aguardando cliente"
            : law?.name}{" "}
          <i>·</i> {item.area}
        </span>
        <small>{item.number || "Número não informado"}</small>
      </div>
      <div className="case-status">
        {unread > 0 && (
          <span
            className="unread-pill"
            aria-label={`${unread} eventos não lidos`}
          >
            {unread}
          </span>
        )}
        <Badge>{item.status === "Ativo" ? item.mode : item.status}</Badge>
        <small>{date(item.updatedAt)}</small>
      </div>
      <ArrowUpRight size={18} />
    </Link>
  );
}
export interface ClientSummaryProps {
  id: string;
}
export function ClientSummary({ id }: ClientSummaryProps) {
  const { db, user } = useStore();
  const u = db.users.find((u) => u.id === id)!;
  const cases = db.cases.filter(
    (c) => c.clients.includes(id) && c.lawyers.includes(user!.id),
  );
  return (
    <Link className="client-summary" to={"/advogado/clientes/" + id}>
      <Avatar name={u.name} />
      <div>
        <strong>{u.name}</strong>
        <small>
          {cases.length} processo{cases.length !== 1 ? "s" : ""} · {u.email}
        </small>
      </div>
      <MoreHorizontal size={19} />
    </Link>
  );
}
export interface CreateCaseProps {
  onClose: () => void;
  clientId?: string;
}
export function CreateCase({ onClose, clientId }: CreateCaseProps) {
  const { db, user } = useStore();
  const { run, toast } = useFeedback();
  const [lawyers, setLawyers] = useState<string[]>([]);
  return (
    <Modal title="Novo processo" onClose={onClose}>
      <p className="muted">
        Organize o atendimento e envie um convite ao cliente. O acesso será
        liberado após o aceite.
      </p>
      <Form
        onSubmit={(fd) => {
          if (
            run(() =>
              transact((d) =>
                createCase(d, user!, {
                  title: String(fd.get("title")),
                  area: String(fd.get("area")),
                  email: String(fd.get("email")),
                  number: String(fd.get("number")),
                  description: String(fd.get("description")),
                  lawyers,
                }),
              ),
            )
          ) {
            toast("Processo criado e convite disponível para o cliente.");
            onClose();
          }
        }}
      >
        <Field label="E-mail do cliente">
          <input
            name="email"
            type="email"
            required
            defaultValue={db.users.find((u) => u.id === clientId)?.email}
            placeholder="cliente@email.com"
          />
        </Field>
        <Field label="Título do processo">
          <input
            name="title"
            required
            minLength={3}
            placeholder="Ex.: Revisão de contrato"
          />
        </Field>
        <div className="form-grid">
          <Field label="Área do direito">
            <select required name="area">
              <option value="">Selecione a área</option>
              {[
                "Cível",
                "Trabalhista",
                "Família",
                "Consumidor",
                "Sucessões",
                "Imobiliário",
                "Empresarial",
                "Previdenciário",
                "Outra",
              ].map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </Field>
          <Field label="Número (opcional)">
            <input name="number" placeholder="Ainda não informado" />
          </Field>
        </div>
        <Field label="Descrição interna (opcional)">
          <textarea name="description" rows={3} />
        </Field>
        {user!.office && (
          <fieldset>
            <legend>Advogados participantes</legend>
            {db.users
              .filter(
                (u) =>
                  u.office === user!.office && u.id !== user!.id && u.verified,
              )
              .map((u) => (
                <label className="check-field" key={u.id}>
                  <input
                    type="checkbox"
                    checked={lawyers.includes(u.id)}
                    onChange={(e) =>
                      setLawyers(
                        e.target.checked
                          ? [...lawyers, u.id]
                          : lawyers.filter((x) => x !== u.id),
                      )
                    }
                  />
                  {u.name} · OAB {u.oab}
                </label>
              ))}
          </fieldset>
        )}
        <div className="info">
          O convite tem validade de 30 dias e não compartilha documentos
          pessoais.
        </div>
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" type="submit">
            <Plus size={17} />
            Criar e enviar convite
          </button>
        </div>
      </Form>
    </Modal>
  );
}
