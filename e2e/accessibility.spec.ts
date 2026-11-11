import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("Acessibilidade: login, painel, documentos, chat, assistente e diálogo", async ({
  page,
}) => {
  await page.goto("/login");
  const check = async () => {
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  };
  await check();
  await page.getByRole("button", { name: "Acessar demonstração" }).click();
  for (const path of [
    "/advogado/inicio",
    "/advogado/documentos",
    "/advogado/processos/p1/conversa",
    "/advogado/assistente",
    "/advogado/configuracoes",
  ]) {
    await page.goto(path);
    await check();
  }
  await page.goto("/advogado/inicio");
  await page.getByRole("button", { name: "Novo processo" }).click();
  await check();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Novo processo" }),
  ).toBeFocused();
});
