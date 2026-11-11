/** Reconhecimento local: datas ambíguas ficam para confirmação explícita. */
export function isMeetingRequest(text: string) {
  return (
    (/\bagendar\b|\bmarcar.{0,30}(reuni[aã]o|encontro|hor[aá]rio|conversa)/i.test(
      text,
    ) ||
      (/\b(reuni[aã]o|encontro)\b/i.test(text) &&
        /\b(quero|solicito|solicitar|preciso|podemos|vamos|gostaria|proponho)\b/i.test(
          text,
        ))) &&
    !/\b(n[aã]o|cancelar|desmarcar|recusar)\b/i.test(text)
  );
}
export function proposedMeetingDate(text: string): string | undefined {
  const date = text.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  const time = text.match(/\b([01]?\d|2[0-3])(?:h|:)([0-5]\d)?\b/i);
  if (!date || !time) return undefined;
  const result = new Date(
    Number(date[3]),
    Number(date[2]) - 1,
    Number(date[1]),
    Number(time[1]),
    Number(time[2] || 0),
  );
  if (
    result.getDate() !== Number(date[1]) ||
    result.getMonth() !== Number(date[2]) - 1 ||
    result.getTime() <= Date.now()
  )
    return undefined;
  return result.toISOString();
}
