import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginAdmin } from "./helpers";

async function login(page: Page, uid: string) {
  await page.goto("/login");
  await page.getByLabel("Conta de demonstração").selectOption(uid);
  await page.getByRole("button", { name: "Acessar demonstração" }).click();
  await expect(page).not.toHaveURL(/login/);
}
test("Pedido no chat, confirmação e persistência na agenda do cliente", async ({
  page,
}) => {
  await login(page, "c1");
  await page.goto("/cliente/processos/p1/conversa");
  await page
    .getByRole("textbox", { name: "Mensagem", exact: true })
    .fill("Quero marcar uma reunião em 10/01/2027 às 14h30");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(
    page.getByText(/Solicitação de reunião enviada ao advogado/),
  ).toBeVisible();
  await page.goto("/cliente/calendario");
  await expect(
    page.locator(".appointment-card").getByText("Pendente", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Confirmar reunião", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await login(page, "a1");
  await page.goto("/advogado/processos/p1/conversa");
  await page
    .getByRole("button", { name: "Confirmar reunião", exact: true })
    .click();
  await page
    .getByLabel("Data e horário da confirmação")
    .fill("2027-01-10T14:30");
  await page.getByRole("button", { name: "Confirmar e agendar" }).click();
  await expect(
    page.locator(".meeting-message").getByText("Confirmado", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/Reunião confirmada por Mariana Almeida/),
  ).toBeVisible();
  await page.goto("/advogado/calendario?dia=2027-01-10");
  await expect(
    page.locator(".appointment-card").getByText("Confirmado", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.locator(".appointment-card").getByText("Confirmado", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await login(page, "c1");
  await page.goto("/cliente/calendario?dia=2027-01-10");
  await expect(
    page.locator(".appointment-card").getByText("Confirmado", { exact: true }),
  ).toBeVisible();
});
test("Compromisso pessoal, lembrete diário, edição e layout móvel acessível", async ({
  page,
}) => {
  await login(page, "a1");
  await page.goto("/advogado/calendario");
  await page
    .getByRole("button", { name: "Novo compromisso", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Título", { exact: true })
    .fill("Revisar documentos do dia");
  const start = await page.evaluate(() => {
    const d = new Date();
    d.setHours(23, 45, 0, 0);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  });
  await dialog.getByLabel("Data e horário", { exact: true }).fill(start);
  await dialog.getByRole("button", { name: "Salvar compromisso" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto("/advogado/inicio");
  await expect(
    page
      .locator(".daily-agenda")
      .getByText("Revisar documentos do dia", { exact: false }),
  ).toBeVisible();
  await page.goto("/advogado/calendario");
  await page.getByRole("button", { name: "Editar", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Título", { exact: true })
    .fill("Revisão atualizada");
  await page.getByRole("button", { name: "Salvar compromisso" }).click();
  await expect(
    page.getByRole("heading", { name: "Revisão atualizada" }),
  ).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze())
      .violations,
  ).toEqual([]);
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 850 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: "docs/previews/calendar-1440.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({
    path: "docs/previews/calendar-375.png",
    fullPage: true,
    animations: "disabled",
  });
});
test("Login administrativo usa Advogado e navegação antiga redireciona para processos", async ({
  page,
}) => {
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: "Administrador", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByLabel("Conta de demonstração").locator('option[value="ad1"]'),
  ).toHaveCount(0);
  await loginAdmin(page);
  await expect(page).toHaveURL(/\/administracao/);
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await login(page, "a1");
  await page.goto("/advogado/conversas");
  await expect(page).toHaveURL(/\/advogado\/processos$/);
  await expect(
    page
      .locator(".sidebar")
      .getByRole("link", { name: "Conversas", exact: true }),
  ).toHaveCount(0);
});
