import type { DB, LegalCase, User } from "../domain/types";
import { canAccessCase, canAccessDocument } from "../domain/permissions";
export const needsLawyer = (text: string) =>
  /estrat[eé]gia|risc[oa]|chance|vit[oó]ria|ganhar|perder|valor|prov[aá]vel|acordo|aceit|audi[eê]ncia|devo|indeniza|prazo|recurso|opini[aã]o|aconselha|melhor|posso|recomend|vale a pena/i.test(
    text,
  );
export function answer(
  db: DB,
  user: User,
  c: LegalCase | undefined,
  question: string,
) {
  if (needsLawyer(question))
    return {
      text: "Esta pergunta exige avaliação profissional. Você pode encaminhar a dúvida ao advogado do processo.",
      escalate: true,
    };
  if (!c || !canAccessCase(user, c))
    return {
      text: "Posso explicar o funcionamento do aplicativo. Escolha um processo para consultar os andamentos e documentos autorizados. Não realizo pesquisa jurídica externa nesta demonstração.",
      escalate: false,
    };
  const updates = db.updates
    .filter((u) => u.caseId === c.id && u.public)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (/document|arquivo|contrato/i.test(question)) {
    const docs = db.documents.filter(
      (d) =>
        d.caseId === c.id &&
        canAccessDocument(user, d, db) &&
        d.state === "Disponível",
    );
    return {
      text: docs.length
        ? `Existem ${docs.length} documentos acessíveis neste processo. Você pode consultar “${docs[0].name}”, versão ${docs[0].versions.at(-1)?.number}, na área de documentos. O conteúdo não foi analisado por uma IA real.`
        : "Não há documento disponível que forneça base para esta resposta.",
      source: docs[0]?.id,
      escalate: false,
    };
  }
  const last = updates[0];
  return {
    text: last
      ? `O último andamento autorizado é “${last.title}”, registrado em ${last.date.split("-").reverse().join("/")}: ${last.description} Fonte: andamento manual de ${db.users.find((u) => u.id === last.author)?.name}.`
      : "Não encontrei um andamento publicado que sustente uma resposta. Consulte o advogado para obter mais informações.",
    escalate: false,
  };
}
