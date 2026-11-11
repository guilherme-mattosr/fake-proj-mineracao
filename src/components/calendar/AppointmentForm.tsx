import type { Appointment } from "../../domain/types";
import {
  createAppointment,
  editPersonalAppointment,
} from "../../domain/calendar";
import { transact, useStore } from "../../store/store";
import { Field, Form, Modal, useFeedback } from "../ui";
import { localDateTime } from "../../lib/calendar";

export interface AppointmentFormProps {
  onClose: () => void;
  appointment?: Appointment;
}
export function AppointmentForm({
  onClose,
  appointment,
}: AppointmentFormProps) {
  const { user } = useStore();
  const { run } = useFeedback();
  return (
    <Modal
      title={appointment ? "Editar compromisso" : "Novo compromisso"}
      onClose={onClose}
    >
      <Form
        onSubmit={(data) => {
          const input = {
            title: String(data.get("title")),
            lawyerId: user!.id,
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
              "Compromisso salvo.",
            )
          )
            onClose();
        }}
      >
        <Field label="Título">
          <input
            name="title"
            required
            maxLength={160}
            defaultValue={appointment?.title || ""}
          />
        </Field>
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
        <Field label="Local ou link">
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
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary">Salvar compromisso</button>
        </div>
      </Form>
    </Modal>
  );
}
