import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Appointment } from "../domain/types";
import { canSeeAppointment, cancelAppointment } from "../domain/calendar";
import { transact, useStore } from "../store/store";
import { Badge, Empty, PageHeading, useFeedback } from "../components/ui";
import { AppointmentForm } from "../components/calendar/AppointmentForm";
import { appointmentTime, dayKey } from "../lib/calendar";

interface AppointmentCardProps {
  item: Appointment;
  onEdit: (item: Appointment) => void;
}
function AppointmentCard({ item, onEdit }: AppointmentCardProps) {
  const { db, user } = useStore();
  const { confirm } = useFeedback();
  return (
    <article className="panel appointment-card">
      <div className="section-head">
        <h3>{item.title}</h3>
        <Badge>{item.status}</Badge>
      </div>
      <p>
        {item.start
          ? appointmentTime(item.start)
          : "Data e horário a confirmar"}{" "}
        · {item.duration} minutos
      </p>
      <p>{item.location || "Local a combinar"}</p>
      <p className="muted">
        {item.kind === "Pessoal"
          ? "Compromisso pessoal"
          : `Advogado: ${db.users.find((u) => u.id === item.lawyerId)?.name} · Solicitante: ${db.users.find((u) => u.id === item.requestedBy)?.name}`}
      </p>
      {item.notes && <p className="appointment-notes">{item.notes}</p>}
      {item.caseId && (
        <Link to={`/${user!.role}/processos/${item.caseId}/conversa`}>
          {item.status === "Pendente"
            ? "Ver solicitação na conversa"
            : "Abrir processo"}
        </Link>
      )}
      <div className="appointment-actions">
        {item.kind === "Pessoal" && item.status === "Confirmado" && (
          <button className="button secondary" onClick={() => onEdit(item)}>
            Editar
          </button>
        )}
        {["Pendente", "Confirmado"].includes(item.status) && (
          <button
            className="button secondary"
            onClick={() =>
              confirm(
                "Cancelar compromisso",
                "Confirma o cancelamento? Os participantes serão notificados.",
                () => transact((d) => cancelAppointment(d, user!, item.id)),
                true,
              )
            }
          >
            Cancelar compromisso
          </button>
        )}
      </div>
    </article>
  );
}
export function Calendar() {
  const { db, user } = useStore();
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(() => {
    const value = params.get("dia") || "";
    const date = new Date(value + "T12:00:00");
    return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      Number.isFinite(date.getTime()) &&
      dayKey(date) === value
      ? value
      : dayKey(new Date());
  });
  const [month, setMonth] = useState(() => new Date(selected + "T12:00:00"));
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Appointment>();
  const items = db.appointments.filter((a) => canSeeAppointment(user!, a));
  const pending = items.filter((a) => a.status === "Pendente");
  const daily = items
    .filter(
      (a) =>
        a.status === "Confirmado" &&
        a.start &&
        dayKey(new Date(a.start)) === selected,
    )
    .sort((a, b) => a.start!.localeCompare(b.start!));
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const history = items.filter((a) =>
    ["Cancelado", "Recusado"].includes(a.status),
  );
  return (
    <div className="page">
      <PageHeading
        title="Calendário"
        description="Reuniões confirmadas, solicitações e compromissos em um só lugar."
        action={
          user!.role === "advogado" && (
            <button
              className="button primary"
              onClick={() => setCreating(true)}
            >
              <Plus size={18} />
              Novo compromisso
            </button>
          )
        }
      />
      <div className="calendar-layout">
        <section className="panel calendar-month">
          <header className="section-head">
            <button
              className="icon-button"
              aria-label="Mês anterior"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
              }
            >
              <ChevronLeft />
            </button>
            <h2>
              {month.toLocaleDateString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </h2>
            <button
              className="icon-button"
              aria-label="Próximo mês"
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
              }
            >
              <ChevronRight />
            </button>
          </header>
          <button
            className="text-link"
            onClick={() => {
              setMonth(new Date());
              setSelected(dayKey(new Date()));
            }}
          >
            Hoje
          </button>
          <div className="calendar-grid">
            {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
              <span className="calendar-weekday" key={d}>
                {d}
              </span>
            ))}
            {Array.from({ length: first.getDay() }, (_, i) => (
              <span key={`blank${i}`} />
            ))}
            {Array.from({ length: count }, (_, i) => {
              const date = new Date(
                  month.getFullYear(),
                  month.getMonth(),
                  i + 1,
                ),
                key = dayKey(date);
              const n = items.filter(
                (a) =>
                  a.status === "Confirmado" &&
                  a.start &&
                  dayKey(new Date(a.start)) === key,
              ).length;
              return (
                <button
                  key={key}
                  className={`calendar-day ${key === selected ? "selected" : ""} ${key === dayKey(new Date()) ? "today" : ""}`}
                  aria-label={`${date.toLocaleDateString("pt-BR")}, ${n} compromisso(s)`}
                  aria-pressed={key === selected}
                  onClick={() => setSelected(key)}
                >
                  {i + 1}
                  {n > 0 && <small>{n}</small>}
                </button>
              );
            })}
          </div>
          <p className="muted">
            Horários no fuso do dispositivo. Pedidos pendentes ainda não
            reservam horário.
          </p>
        </section>
        <section>
          <h2>
            Agenda de{" "}
            {new Date(selected + "T12:00:00").toLocaleDateString("pt-BR")}
          </h2>
          {daily.map((a) => (
            <AppointmentCard key={a.id} item={a} onEdit={setEditing} />
          ))}
          {!daily.length && (
            <Empty
              title="Dia livre"
              text="Nenhum compromisso confirmado nesta data."
            />
          )}
        </section>
      </div>
      <section className="calendar-requests">
        <h2>Solicitações de reunião ({pending.length})</h2>
        <p className="muted">
          O advogado confirma o horário da reunião na conversa do processo.
        </p>
        {pending.map((a) => (
          <AppointmentCard key={a.id} item={a} onEdit={setEditing} />
        ))}
        {!pending.length && (
          <Empty
            title="Nenhuma solicitação pendente"
            text="As reuniões combinadas na conversa do processo aparecem aqui."
          />
        )}
      </section>
      {!!history.length && (
        <details>
          <summary>Histórico de cancelamentos e recusas</summary>
          {history.map((a) => (
            <AppointmentCard key={a.id} item={a} onEdit={setEditing} />
          ))}
        </details>
      )}
      {(creating || editing) && (
        <AppointmentForm
          appointment={editing}
          onClose={() => {
            setCreating(false);
            setEditing(undefined);
          }}
        />
      )}
    </div>
  );
}
