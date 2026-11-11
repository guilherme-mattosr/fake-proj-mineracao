import { createSeed } from "../data/seed";
import type { DB } from "../domain/types";
export const STORAGE_KEY = "elo-juridico:db:v1";
export function readDB(): DB {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createSeed();
  const db = JSON.parse(raw);
  if (db.schema !== 1 || !Array.isArray(db.users) || !Array.isArray(db.cases))
    throw new Error(
      "Os dados locais não são compatíveis. Restaure a demonstração para continuar.",
    );
  db.fileRequests ??= [];
  db.appointments ??= [];
  return db;
}
export function persist(db: DB) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    throw new Error(
      "Não foi possível salvar. O armazenamento do navegador pode estar cheio. Baixe os arquivos maiores e tente novamente.",
    );
  }
}
