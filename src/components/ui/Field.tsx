import { useId, isValidElement, cloneElement } from "react";
import type { ReactNode, ReactElement } from "react";
export interface FieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
}
export function Field({ label, children, hint }: FieldProps) {
  const fieldId = useId();
  const hintId = useId();
  const native =
    isValidElement(children) &&
    typeof children.type === "string" &&
    ["input", "select", "textarea"].includes(children.type);
  const control = native
    ? cloneElement(
        children as ReactElement<{ id?: string; "aria-describedby"?: string }>,
        { id: fieldId, "aria-describedby": hint ? hintId : undefined },
      )
    : children;
  return (
    <div className="field">
      {native ? <label htmlFor={fieldId}>{label}</label> : <span>{label}</span>}
      {control}
      {hint && <small id={hintId}>{hint}</small>}
    </div>
  );
}
