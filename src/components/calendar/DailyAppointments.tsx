import { Link } from "react-router-dom";
import { CalendarDays, ArrowUpRight } from "lucide-react";
import { useStore } from "../../store/store";
import { canSeeAppointment } from "../../domain/calendar";
import { dayKey } from "../../lib/calendar";

export interface DailyAppointmentsProps {
  date?: Date;
}
export function DailyAppointments({
  date = new Date(),
}: DailyAppointmentsProps) {
  const { db, user } = useStore();
  const items = db.appointments
    .filter(
      (a) =>
        canSeeAppointment(user!, a) &&
        a.status === "Confirmado" &&
        a.start &&
        dayKey(new Date(a.start)) === dayKey(date),
    )
    .sort((a, b) => a.start!.localeCompare(b.start!));
  const pending = db.appointments.filter(
    (a) => canSeeAppointment(user!, a) && a.status === "Pendente",
  ).length;
  return (
    <section className="panel daily-agenda">
      <header className="section-head">
        <div>
          <h2>Compromissos do dia</h2>
          <p>
            {date.toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
        <Link to={`/${user!.role}/calendario`}>
          Abrir agenda <ArrowUpRight size={15} />
        </Link>
      </header>
      <div className="agenda-day-list">
        {items.map((appointment) => (
          <Link
            className="agenda-entry"
            key={appointment.id}
            to={`/${user!.role}/calendario?dia=${dayKey(date)}`}
          >
            <time dateTime={appointment.start}>
              {new Date(appointment.start!).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
            <span>
              <strong>{appointment.title}</strong>
              <small>
                {appointment.duration} min
                {appointment.location && ` · ${appointment.location}`}
              </small>
            </span>
          </Link>
        ))}
      </div>
      {!items.length && (
        <div className="agenda-empty">
          <CalendarDays size={24} />
          <p>Nenhum compromisso para hoje</p>
        </div>
      )}
      {pending > 0 && (
        <Link className="agenda-pending" to={`/${user!.role}/calendario`}>
          {pending}{" "}
          {pending === 1
            ? "reunião aguarda confirmação"
            : "reuniões aguardam confirmação"}
          <ArrowUpRight size={15} />
        </Link>
      )}
    </section>
  );
}
