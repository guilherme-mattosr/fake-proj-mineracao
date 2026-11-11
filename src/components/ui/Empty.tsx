import type { ReactNode } from "react";
import { FileText } from "lucide-react";
export interface EmptyProps {
  title?: string;
  text?: string;
  action?: ReactNode;
}
export function Empty({
  title = "Nenhum resultado encontrado",
  text = "Tente outro termo ou ajuste os filtros.",
  action,
}: EmptyProps) {
  return (
    <div className="empty">
      <FileText size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
