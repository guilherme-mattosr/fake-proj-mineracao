import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

async function login(page: Page, userId: string) {
  await page.goto("/login");
  await page.getByLabel("Conta de demonstração").selectOption(userId);
  await page.getByRole("button", { name: "Acessar demonstração" }).click();
  await expect(page).not.toHaveURL(/login/);
}

test("Conversas compactas dos dois perfis e detalhes recolhíveis", async ({
  page,
}) => {
  for (const profile of [
    { id: "a1", role: "advogado" },
    { id: "c1", role: "cliente" },
  ]) {
    await login(page, profile.id);
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 375, height: 667 },
    ]) {
      await page.setViewportSize(viewport);
      await page.goto(`/${profile.role}/processos/p1/conversa`);
      await expect(
        page.getByRole("textbox", { name: "Mensagem", exact: true }),
      ).toBeVisible();
      expect(
        (await page.locator(".conversation-header").boundingBox())!.height,
      ).toBeLessThanOrEqual(64);
      expect(
        (await page.locator(".messages").boundingBox())!.height,
      ).toBeGreaterThan(300);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      const ownMessage = await page
        .locator(".message.own .bubble")
        .first()
        .boundingBox();
      const receivedMessage = await page
        .locator(".message:not(.own) .bubble")
        .first()
        .boundingBox();
      expect(ownMessage!.x).toBeGreaterThan(receivedMessage!.x);
      await expect(
        page.getByRole("button", { name: /Solicitar reuni/ }),
      ).toHaveCount(0);
      await page
        .getByRole("button", { name: "Detalhes do processo", exact: true })
        .click();
      await expect(page.locator("#process-context")).toBeVisible();
      await page.getByRole("button", { name: "Fechar detalhes" }).click();
      await expect(page.locator("#process-context")).toHaveCount(0);
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .analyze();
      expect(result.violations).toEqual([]);
      await page.screenshot({
        path: `docs/previews/conversation-${profile.role}-${viewport.width}.png`,
        fullPage: true,
        animations: "disabled",
      });
    }
    await page
      .getByRole("button", { name: "Sair da conta", exact: true })
      .click();
  }
});

test("Reuniões começam no chat e calendário cria apenas compromisso pessoal", async ({
  page,
}) => {
  await login(page, "a1");
  await page.goto("/advogado/calendario");
  await page
    .getByRole("button", { name: "Novo compromisso", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("Processo", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("dialog")
      .getByLabel("Advogado responsável", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await page.goto("/advogado/processos/p1/conversa");
  await page
    .getByRole("textbox", { name: "Mensagem", exact: true })
    .fill("Vamos marcar uma reunião?");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  // Pedidos da versão anterior também podem ser confirmados pela conversa.
  await page.evaluate(() => {
    const key = "elo-juridico:db:v1";
    const data = JSON.parse(localStorage.getItem(key)!);
    data.appointments.forEach((appointment: { sourceMessageId?: string }) => {
      delete appointment.sourceMessageId;
    });
    data.messages.forEach((message: { appointmentId?: string }) => {
      delete message.appointmentId;
    });
    localStorage.setItem(key, JSON.stringify(data));
  });
  await page.reload();
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
  await page.reload();
  await expect(page.locator(".meeting-message")).toHaveCount(1);
  await expect(
    page.locator(".meeting-message").getByText("Confirmado", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await login(page, "c1");
  await page.goto("/cliente/calendario?dia=2027-01-10");
  await expect(
    page.getByRole("button", { name: /Solicitar reuni|Novo compromisso/ }),
  ).toHaveCount(0);
  await expect(
    page.locator(".appointment-card").getByText("Confirmado", { exact: true }),
  ).toBeVisible();
});
