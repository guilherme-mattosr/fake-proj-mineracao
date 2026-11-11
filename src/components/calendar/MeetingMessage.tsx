import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import type { Appointment } from "../../domain/types";
import { decideAppointment } from "../../domain/calendar";
import { canWriteCase } from "../../domain/permissions";
import { transact, useStore } from "../../store/store";
import { appointmentTime, localDateTime } from "../../lib/calendar";
import { Badge, Field, Form, useFeedback } from "../ui";

export interface MeetingMessageProps {
  appointment: Appointment;
}
export function MeetingMessage({ appointment }: MeetingMessageProps) {
  const { db, user } = useStore();
  const { run, confirm } = useFeedback();
  const [confirming, setConfirming] = useState(false);
  const caseItem = db.cases.find((item) => item.id === appointment.caseId);
  const canConfirm =
    user!.id === appointment.lawyerId &&
    appointment.status === "Pendente" &&
    caseItem &&
    canWriteCase(user!, caseItem);
  return (
    <section
      className="meeting-message"
      aria-label="Reunião combinada na conversa"
    >
      <header>
        <CalendarDays size={18} />
        <strong>Reunião</strong>
        <Badge>{appointment.status}</Badge>
      </header>
      <p>
        {appointment.start
          ? appointmentTime(appointment.start)
          : "Data e horário a combinar"}{" "}
        · {appointment.duration} min
      </p>
      {canConfirm && !confirming && (
        <div className="meeting-message-actions">
          <button
            className="button primary"
            onClick={() => setConfirming(true)}
          >
            Confirmar reunião
          </button>
          <button
            className="button secondary"
            onClick={() =>
              confirm(
                "Recusar reunião",
                "O cliente receberá a decisão nesta conversa.",
                () =>
                  transact((d) =>
                    decideAppointment(d, user!, appointment.id, false),
                  ),
              )
            }
          >
            Recusar
          </button>
        </div>
      )}
      {canConfirm && confirming && (
        <Form
          onSubmit={(data) => {
            if (
              run(
                () =>
                  transact((d) =>
                    decideAppointment(
                      d,
                      user!,
                      appointment.id,
                      true,
                      new Date(String(data.get("start"))).toISOString(),
                    ),
                  ),
                "Reunião confirmada e registrada na agenda.",
              )
            )
              setConfirming(false);
          }}
        >
          <Field label="Data e horário da confirmação">
            <input
              name="start"
              type="datetime-local"
              required
              defaultValue={localDateTime(appointment.start)}
            />
          </Field>
          <div className="meeting-message-actions">
            <button className="button primary">Confirmar e agendar</button>
            <button
              type="button"
              className="button secondary"
              onClick={() => setConfirming(false)}
            >
              Voltar
            </button>
          </div>
        </Form>
      )}
      {appointment.status === "Confirmado" && (
        <Link
          to={`/${user!.role}/calendario?dia=${localDateTime(appointment.start).slice(0, 10)}`}
        >
          Ver na agenda
        </Link>
      )}
      {appointment.status === "Pendente" &&
        user!.id !== appointment.lawyerId && (
          <small>Aguardando confirmação do advogado.</small>
        )}
    </section>
  );
}
