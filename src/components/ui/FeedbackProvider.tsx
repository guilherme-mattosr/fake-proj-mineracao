import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { Modal } from "./Modal";
export interface FeedbackProviderProps {
  children: ReactNode;
}
type Feedback = {
  toast: (text: string) => void;
  confirm: (
    title: string,
    text: string,
    action: () => void,
    danger?: boolean,
  ) => void;
  run: (fn: () => void, success?: string) => boolean;
};
const FeedbackContext = createContext<Feedback>(null!);
export const useFeedback = () => useContext(FeedbackContext);
export function FeedbackProvider({ children }: FeedbackProviderProps) {
  const [toast, setToast] = useState("");
  const [confirmation, setConfirmation] = useState<{
    title: string;
    text: string;
    action: () => void;
    danger?: boolean;
  }>();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  const run = (fn: () => void, success?: string) => {
    try {
      fn();
      if (success) setToast(success);
      return true;
    } catch (e) {
      setToast((e as Error).message);
      return false;
    }
  };
  return (
    <FeedbackContext.Provider
      value={{
        toast: setToast,
        confirm: (title, text, action, danger) =>
          setConfirmation({ title, text, action, danger }),
        run,
      }}
    >
      {children}
      {toast && (
        <div role="status" className="toast">
          <Check size={18} />
          <span>{toast}</span>
          <button aria-label="Fechar aviso" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {confirmation && (
        <Modal
          title={confirmation.title}
          onClose={() => setConfirmation(undefined)}
        >
          <p>{confirmation.text}</p>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setConfirmation(undefined)}
            >
              Cancelar
            </button>
            <button
              className={
                "button " + (confirmation.danger ? "danger" : "primary")
              }
              onClick={() => {
                if (run(confirmation.action)) setConfirmation(undefined);
              }}
            >
              Confirmar
            </button>
          </div>
        </Modal>
      )}
    </FeedbackContext.Provider>
  );
}
