import { useState } from "react";
import type { Appointment, LegalCase } from "../../domain/types";
import {
  createAppointment,
  editPersonalAppointment,
} from "../../domain/calendar";
import { canWriteCase } from "../../domain/permissions";
import { transact, useStore } from "../../store/store";
import { Field, Form, Modal, useFeedback } from "../ui";
import { localDateTime } from "../../lib/calendar";

export interface AppointmentFormProps {
  onClose: () => void;
  caseItem?: LegalCase;
  appointment?: Appointment;
}
export function AppointmentForm({
  onClose,
  caseItem,
  appointment,
}: AppointmentFormProps) {
  const { db, user } = useStore();
  const { run } = useFeedback();
  const [caseId, setCaseId] = useState(caseItem?.id || "");
  const cases = db.cases.filter((c) => canWriteCase(user!, c));
  const selected = cases.find((c) => c.id === caseId);
  return (
    <Modal
      title={appointment ? "Editar compromisso" : "Novo compromisso"}
      onClose={onClose}
    >
      <Form
        onSubmit={(data) => {
          const input = {
            title: String(data.get("title")),
            caseId: caseId || undefined,
            lawyerId: String(data.get("lawyer") || user!.id),
            start: new Date(String(data.get("start"))).toISOString(),
            duration: Number(data.get("duration")),
            location: String(data.get("location")),
            notes: String(data.get("notes")),
          };
          if (
            run(
              () =>
                transact((d) => {
                  if (appointment)
                    editPersonalAppointment(d, user!, appointment.id, input);
                  else createAppointment(d, user!, input);
                }),
              selected
                ? "Solicitação enviada para confirmação do advogado."
                : "Compromisso salvo.",
            )
          )
            onClose();
        }}
      >
        {!appointment && (
          <Field label="Processo">
            <select
              value={caseId}
              onChange={(e) => setCaseId(e.target.value)}
              required={user!.role === "cliente"}
              disabled={!!caseItem}
            >
              <option value="">
                {user!.role === "advogado"
                  ? "Compromisso pessoal"
                  : "Selecione o processo"}
              </option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Título">
          <input
            name="title"
            required
            maxLength={160}
            defaultValue={
              appointment?.title ||
              (caseItem ? "Reunião: " + caseItem.title : "")
            }
          />
        </Field>
        {selected && (
          <Field label="Advogado responsável">
            <select
              name="lawyer"
              key={caseId}
              defaultValue={
                selected.lawyers.includes(user!.id)
                  ? user!.id
                  : selected.lawyers[0]
              }
            >
              {selected.lawyers.map((uid) => (
                <option key={uid} value={uid}>
                  {db.users.find((u) => u.id === uid)?.name}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Data e horário">
          <input
            name="start"
            type="datetime-local"
            required
            defaultValue={localDateTime(appointment?.start)}
          />
        </Field>
        <Field label="Duração em minutos">
          <input
            name="duration"
            type="number"
            min={15}
            max={480}
            required
            defaultValue={appointment?.duration || 60}
          />
        </Field>
        <Field label="Local ou link da reunião">
          <input
            name="location"
            maxLength={300}
            defaultValue={appointment?.location || ""}
          />
        </Field>
        <Field label="Observações">
          <textarea
            name="notes"
            maxLength={2000}
            defaultValue={appointment?.notes || ""}
          />
        </Field>
        {selected && (
          <p className="muted">
            O horário proposto só entra na agenda após a confirmação do
            advogado. Horários exibidos no fuso deste dispositivo.
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary">
            {selected ? "Solicitar reunião" : "Salvar compromisso"}
          </button>
        </div>
      </Form>
    </Modal>
  );
}
