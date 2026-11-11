import type { ReactNode, FormEvent } from "react";
export interface FormProps {
  children: ReactNode;
  onSubmit: (data: FormData) => void;
  onChange?: (event: FormEvent<HTMLFormElement>) => void;
}
export function Form({ children, onSubmit, onChange }: FormProps) {
  return (
    <form
      onChange={onChange}
      onSubmit={(e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
    >
      {children}
    </form>
  );
}
