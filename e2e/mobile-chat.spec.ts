import { test, expect } from "@playwright/test";
test("Chat em celular compacto mantém compositor acima da navegação", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/login");
  await page.getByLabel("Conta de demonstração").selectOption("c1");
  await page.getByRole("button", { name: "Acessar demonstração" }).click();
  await page.goto("/cliente/processos/p1/conversa");
  const field = page.getByRole("textbox", { name: "Mensagem", exact: true });
  await expect(field).toBeVisible();
  const header = await page.locator(".conversation-header").boundingBox();
  expect(header!.height).toBeLessThanOrEqual(64);
  const messages = await page.locator(".messages").boundingBox();
  expect(messages!.height).toBeGreaterThan(300);
  const input = await field.boundingBox(),
    nav = await page.locator(".bottom-nav").boundingBox();
  expect(input!.y + input!.height).toBeLessThanOrEqual(nav!.y);
  await page.screenshot({
    path: "test-results/chat-375-667.png",
    fullPage: true,
  });
});
