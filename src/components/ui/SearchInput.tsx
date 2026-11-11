import { Search, X } from "lucide-react";
export interface SearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}
export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
}: SearchInputProps) {
  return (
    <div className="search">
      <Search size={18} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="Limpar pesquisa" onClick={() => onChange("")}>
          <X size={15} />
        </button>
      )}
    </div>
  );
}
