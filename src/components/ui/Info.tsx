import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
export interface InfoProps {
  children: ReactNode;
  error?: boolean;
}
export function Info({ children, error = false }: InfoProps) {
  return (
    <div className={"info " + (error ? "error" : "")}>
      <AlertCircle size={18} />
      <div>{children}</div>
    </div>
  );
}
