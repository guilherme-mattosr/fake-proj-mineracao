import { initials } from "../../lib/format";
export interface AvatarProps {
  name: string;
  small?: boolean;
}
export function Avatar({ name, small = false }: AvatarProps) {
  return (
    <span className={"avatar " + (small ? "small" : "")}>{initials(name)}</span>
  );
}
