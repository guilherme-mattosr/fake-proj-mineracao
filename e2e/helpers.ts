import type { Page } from "@playwright/test";
export async function loginAdmin(page: Page, id = "ad1") {
  await page.getByRole("button", { name: "Advogado", exact: true }).click();
  await page
    .getByLabel("E-mail", { exact: true })
    .fill(id === "ad2" ? "helena@elo.demo" : "guilherme@elo.demo");
  await page.getByLabel("Senha", { exact: true }).fill("Demo@123");
  await page
    .getByLabel("Fator adicional (se ativado)", { exact: true })
    .fill("123456");
  await page
    .getByRole("button", { name: "Entrar na minha conta", exact: true })
    .click();
}
