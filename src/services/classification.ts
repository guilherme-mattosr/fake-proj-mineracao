import type { DB } from "../domain/types";
import { includes } from "../lib/format";
export function classifyFile(db: DB, name: string) {
  return (
    db.categories
      .filter((c) => c.active && c.name !== "Organização pendente")
      .find((c) =>
        [c.name.replace(/s$/, ""), ...c.synonyms.split(",")]
          .map((t) => t.trim())
          .filter((t) => t.length > 2)
          .some((t) => includes(name, t)),
      )?.name || "Organização pendente"
  );
}
