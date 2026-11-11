import { expect, test } from "@playwright/test";
import { loginAdmin } from "./helpers";
test("Todas as áreas administrativas abrem sem erro de console", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/login");
  await loginAdmin(page);
  for (const route of [
    "",
    "usuarios",
    "oab",
    "processos",
    "administradores",
    "suporte",
    "armazenamento",
    "auditoria",
    "incidentes",
    "privacidade",
    "ia",
    "monitoramento",
    "categorias",
    "configuracoes",
    "notificacoes",
    "ajuda",
  ]) {
    await page.goto("/administracao/" + route);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(
      page.getByText("Não foi possível abrir esta área", { exact: true }),
    ).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
test("Navegação do cliente e estados gerais não expõem outras contas", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("/login");
  await page.getByLabel("Conta de demonstração").selectOption("c1");
  await page.getByRole("button", { name: "Acessar demonstração" }).click();
  for (const route of [
    "inicio",
    "processos",
    "convites",
    "documentos",
    "assistente",
    "notificacoes",
    "configuracoes",
    "seguranca",
    "privacidade",
    "ajuda",
    "solicitacoes-documentos",
  ]) {
    await page.goto("/cliente/" + route);
    await expect(page.locator("h1").first()).toBeVisible();
  }
  for (const route of [
    "termos",
    "privacidade",
    "transparencia",
    "sem-conexao",
    "manutencao",
    "atualizacao",
    "acesso-negado",
  ]) {
    await page.goto("/sistema/" + route);
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(errors).toEqual([]);
});
