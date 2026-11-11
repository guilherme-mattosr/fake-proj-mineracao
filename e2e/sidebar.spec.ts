import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

async function openWorkspace(page: Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Acessar demonstração" }).click();
  await expect(
    page.getByRole("heading", { name: "Bom dia, Mariana." }),
  ).toBeVisible();
}

test("Menu compacto preserva navegação e preferência em desktop e tablet", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await openWorkspace(page);
  const sidebar = page.getByRole("complementary", {
    name: "Navegação lateral",
  });
  await expect(
    sidebar.getByRole("link", { name: "Assistente profissional", exact: true }),
  ).toBeHidden();
  await page.screenshot({
    path: "docs/previews/prototype-dashboard-expanded.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Recolher menu lateral" }).click();
  await expect(
    page.getByRole("button", { name: "Expandir menu lateral" }),
  ).toHaveAttribute("aria-expanded", "false");
  for (const width of [1440, 1024, 768]) {
    await page.setViewportSize({ width, height: 960 });
    expect((await sidebar.boundingBox())!.width).toBe(76);
    const main = await page.locator(".main-shell").boundingBox();
    expect(main!.x).toBe(76);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.screenshot({
    path: "docs/previews/prototype-dashboard-compact.png",
    fullPage: true,
    animations: "disabled",
  });
  await sidebar.getByRole("link", { name: "Processos", exact: true }).click();
  await expect(page).toHaveURL(/\/advogado\/processos$/);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Expandir menu lateral" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mais ferramentas" }).click();
  await sidebar
    .getByRole("link", { name: "Assistente profissional", exact: true })
    .click();
  await expect(page).toHaveURL(/\/advogado\/assistente$/);
  await page.getByRole("button", { name: "Expandir menu lateral" }).click();
  await expect(sidebar.locator(".brand-name")).toBeVisible();
  await page.getByRole("button", { name: "Mais ferramentas" }).click();
  await expect(
    sidebar.getByRole("link", { name: "Assistente profissional", exact: true }),
  ).toBeHidden();
});

test("Drawer móvel fecha com Escape, restaura foco e não herda modo compacto", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await openWorkspace(page);
  await page.getByRole("button", { name: "Recolher menu lateral" }).click();
  await page.setViewportSize({ width: 375, height: 812 });
  const sidebar = page.locator(".sidebar");
  await expect(sidebar).toHaveAttribute("inert", "");
  await page.screenshot({
    path: "docs/previews/prototype-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  const trigger = page.getByRole("button", {
    name: "Abrir navegação",
    exact: true,
  });
  await trigger.click();
  await expect(sidebar).not.toHaveAttribute("inert", "");
  await expect(sidebar.locator(".brand-name")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Fechar navegação", exact: true }).first(),
  ).toBeFocused();
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(sidebar).toHaveAttribute("inert", "");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await sidebar.getByRole("link", { name: "Calendário", exact: true }).click();
  await expect(page).toHaveURL(/\/advogado\/calendario$/);
  await expect(sidebar).toHaveAttribute("inert", "");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Filtros compactos de documentos mantêm categoria e acessibilidade", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await openWorkspace(page);
  await page.goto("/advogado/documentos");
  await page
    .getByLabel("Categoria dos documentos", { exact: true })
    .selectOption("Contratos");
  await expect(page.locator(".document-row").first()).toBeVisible();
  const categories = await page
    .locator(".document-row .doc-main small:first-of-type")
    .allTextContents();
  expect(categories.every((category) => category.startsWith("Contratos"))).toBe(
    true,
  );
  await page.screenshot({
    path: "docs/previews/prototype-documents.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Recolher menu lateral" }).click();
  await page.getByRole("button", { name: "Mais ferramentas" }).click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
