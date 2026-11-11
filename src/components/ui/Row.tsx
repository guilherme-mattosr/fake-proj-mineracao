import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { Avatar } from "./Avatar";
export interface RowProps {
  title: string;
  subtitle?: string;
  onClick?: () => void;
  children?: ReactNode;
}
export function Row({ title, subtitle, onClick, children }: RowProps) {
  return (
    <div className="list-row">
      {onClick ? (
        <button className="row-main" onClick={onClick}>
          <Avatar name={title} />
          <span>
            <strong>{title}</strong>
            {subtitle && <small>{subtitle}</small>}
          </span>
        </button>
      ) : (
        <div className="row-main">
          <span>
            <strong>{title}</strong>
            {subtitle && <small>{subtitle}</small>}
          </span>
        </div>
      )}
      <div className="row-end">
        {children}
        {onClick && <ChevronRight size={16} />}
      </div>
    </div>
  );
}
