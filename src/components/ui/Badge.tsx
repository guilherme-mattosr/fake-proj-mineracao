import type { ReactNode } from "react";
export interface BadgeProps {
  children: ReactNode;
}
export function Badge({ children }: BadgeProps) {
  const s = String(children);
  return (
    <span
      className={
        "badge " +
        (/Ativo|Aceito|Aprovad|Disponível|Publicad|Resolvid|verificada/.test(s)
          ? "positive"
          : /Aguard|Pendente|análise|Organiza|Processando/.test(s)
            ? "pending"
            : /Cancel|Recus|Falh|Suspens|Quarentena|Rejeit/.test(s)
              ? "negative"
              : "neutral")
      }
    >
      {children}
    </span>
  );
}
