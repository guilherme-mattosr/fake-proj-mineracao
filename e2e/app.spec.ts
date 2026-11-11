import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { loginAdmin } from "./helpers";
async function login(page: Page, id = "a1") {
  await page.goto("/login");
  if (id.startsWith("ad")) {
    await loginAdmin(page, id);
    await expect(page).not.toHaveURL(/login/);
    return;
  }
  await page.getByLabel("Conta de demonstração").selectOption(id);
  await page.getByRole("button", { name: "Acessar demonstração" }).click();
  await expect(page).not.toHaveURL(/login/);
}
async function switchUser(page: Page, id: string) {
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await login(page, id);
}
test("Criação, aceite do convite e dados compartilhados entre perfis", async ({
  page,
}) => {
  await login(page);
  await page.getByRole("button", { name: "Novo processo" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("E-mail do cliente").fill("ana@elo.demo");
  await dialog
    .getByLabel("Título do processo")
    .fill("Contrato de teste integrado");
  await dialog.getByLabel("Área do direito").selectOption("Cível");
  await dialog.getByRole("button", { name: "Criar e enviar convite" }).click();
  await switchUser(page, "c1");
  await page.goto("/cliente/convites");
  await page
    .getByRole("button", { name: /Contrato de teste integrado/ })
    .click();
  await page.getByRole("button", { name: "Aceitar convite" }).click();
  await expect(
    page.getByRole("heading", {
      name: "Contrato de teste integrado",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Mensagem", exact: true })
    .fill("Olá, esta mensagem deve persistir.");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByText("Olá, esta mensagem deve persistir.", { exact: true }),
  ).toBeVisible();
});
test("Resposta factual da IA e encaminhamento sem aviso automático no chat", async ({
  page,
}) => {
  await login(page, "c1");
  await page.goto("/cliente/processos/p1/conversa");
  await page
    .getByRole("textbox", { name: "Mensagem", exact: true })
    .fill("Qual é o último andamento?");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(page.getByText(/O último andamento autorizado é/)).toBeVisible();
  const before = await page.locator(".message.ai").count();
  await page
    .getByRole("textbox", { name: "Mensagem", exact: true })
    .fill("Devo aceitar a proposta de acordo?");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(page.locator(".message.ai")).toHaveCount(before);
  await switchUser(page, "a1");
  await page.goto("/advogado/solicitacoes");
  await expect(
    page
      .getByRole("article")
      .filter({ hasText: "Revisão de contrato de trabalho" })
      .getByRole("heading", {
        name: "Devo aceitar a proposta de acordo?",
        exact: true,
      }),
  ).toBeVisible();
});
test("Grupo: primeiro profissional assume e outros continuam participando", async ({
  page,
}) => {
  await login(page);
  await page.goto("/advogado/processos/p2/conversa");
  await page
    .getByRole("button", { name: "Assumir atendimento", exact: true })
    .click();
  await expect(page.getByText("Atendimento com Mariana Almeida")).toBeVisible();
  await switchUser(page, "a2");
  await page.goto("/advogado/processos/p2/conversa");
  await expect(page.getByText("Atendimento com Mariana Almeida")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Assumir atendimento", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("textbox", { name: "Mensagem", exact: true })
    .fill("Rafael também está acompanhando o grupo.");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(
    page.getByText("Rafael também está acompanhando o grupo.", { exact: true }),
  ).toBeVisible();
});
test("Andamento público e interno com isolamento do cliente", async ({
  page,
}) => {
  await login(page);
  await page.goto("/advogado/processos/p1/andamentos");
  await page.getByRole("button", { name: "Registrar andamento" }).click();
  await page
    .getByLabel("Título", { exact: true })
    .fill("Andamento público de teste");
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Informação publicada pelo advogado.");
  await page.getByRole("button", { name: "Salvar andamento" }).click();
  await page.getByRole("button", { name: "Registrar andamento" }).click();
  await page
    .getByLabel("Título", { exact: true })
    .fill("Nota interna de teste");
  await page
    .getByLabel("Descrição", { exact: true })
    .fill("Somente profissionais.");
  await page.getByLabel("Publicar para o cliente").uncheck();
  await page.getByRole("button", { name: "Salvar andamento" }).click();
  await switchUser(page, "c1");
  await page.goto("/cliente/processos/p1/andamentos");
  await expect(
    page.getByRole("heading", { name: "Andamento público de teste" }),
  ).toBeVisible();
  await expect(page.getByText("Nota interna de teste")).toHaveCount(0);
});
test("Conclusão bloqueia compositor e preserva o histórico", async ({
  page,
}) => {
  await login(page);
  await page.goto("/advogado/processos/p1/dados");
  await page
    .getByRole("button", { name: "Concluir processo", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await page.goto("/advogado/processos/p1/conversa");
  await expect(page.getByText("Histórico somente para consulta")).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Mensagem", exact: true }),
  ).toHaveCount(0);
  await expect(page.locator(".message")).not.toHaveCount(0);
});
test("Upload do chat e classificação pendente aparecem na biblioteca", async ({
  page,
}) => {
  await login(page, "c1");
  await page.goto("/cliente/processos/p1/conversa");
  await page.getByRole("button", { name: "Anexar documento" }).click();
  await page.getByLabel("Arquivo para envio").setInputFiles({
    name: "evidencia-nova.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Documento fictício de teste."),
  });
  await page.getByRole("button", { name: "Confirmar envio" }).click();
  await expect(
    page.locator(".attachment").filter({ hasText: "evidencia-nova.txt" }),
  ).toBeVisible();
  await page.goto("/cliente/documentos");
  await expect(
    page.locator(".doc-main").filter({ hasText: "evidencia-nova.txt" }),
  ).toBeVisible();
});
test("Solicitação de exclusão e aprovação por advogado", async ({ page }) => {
  await login(page, "c1");
  await page.goto("/cliente/documentos");
  await page
    .getByRole("button", {
      name: "Ações de Contrato de honorários.pdf",
      exact: true,
    })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Solicitar exclusão", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Solicitar exclusão", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Solicitação registrada",
  );
  await switchUser(page, "a1");
  await page.goto("/advogado/solicitacoes-documentos");
  await expect(
    page.getByRole("button", { name: /Contrato de honorários.pdf/ }),
  ).toBeVisible();
  await page.goto("/advogado/processos/p1/documentos");
  await page
    .getByRole("button", {
      name: "Ações de Contrato de honorários.pdf",
      exact: true,
    })
    .click();
  await page
    .getByRole("button", { name: "Excluir documento", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Ações de Contrato de honorários.pdf",
      exact: true,
    }),
  ).toHaveCount(0);
});
test("Assistente particular não aparece para advogado", async ({ page }) => {
  await login(page, "c1");
  await page.goto("/cliente/assistente");
  await page
    .getByRole("textbox", { name: "Pergunta ao assistente" })
    .fill("Minha pergunta particular confidencial de teste");
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
  await expect(
    page.getByText("Minha pergunta particular confidencial de teste", {
      exact: true,
    }),
  ).toBeVisible();
  await switchUser(page, "a1");
  await page.goto("/advogado/assistente");
  await page.getByRole("button", { name: "Histórico", exact: true }).click();
  await expect(
    page.getByText("Minha pergunta particular confidencial de teste", {
      exact: true,
    }),
  ).toHaveCount(0);
});
test("Conversa interna preserva autoria e não libera rota para cliente", async ({
  page,
}) => {
  await login(page);
  await page.goto("/advogado/conversas-internas");
  await page
    .getByRole("textbox", { name: "Mensagem", exact: true })
    .fill("Anotação reservada da equipe.");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(
    page.getByText("Anotação reservada da equipe.", { exact: true }),
  ).toBeVisible();
  await switchUser(page, "c1");
  await page.goto("/advogado/conversas-internas");
  await expect(
    page.getByText("Este conteúdo não está disponível", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Anotação reservada da equipe.", { exact: true }),
  ).toHaveCount(0);
});
test("Rotas administrativas protegidas e processo de outro cliente indisponível", async ({
  page,
}) => {
  await login(page, "c1");
  await page.goto("/administracao/auditoria");
  await expect(
    page.getByText("Este conteúdo não está disponível", { exact: true }),
  ).toBeVisible();
  await page.goto("/cliente/processos/p2/conversa");
  await expect(
    page.getByText("Este conteúdo não está disponível", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Inventário familiar", { exact: true }),
  ).toHaveCount(0);
});
test("Ação do sócio gera auditoria identificada", async ({ page }) => {
  await login(page, "ad2");
  await page.goto("/administracao/oab");
  await page.getByRole("button", { name: /Camila Rocha/ }).click();
  await page
    .getByRole("combobox", { name: "Ação", exact: true })
    .selectOption("Aprovar OAB");
  await page
    .getByLabel("Justificativa / nota interna")
    .fill("Evidência fictícia conferida.");
  await page.getByLabel("Confirmo o recurso").check();
  await page.getByRole("button", { name: "Registrar decisão" }).click();
  await page.goto("/administracao/auditoria");
  await expect(
    page.getByRole("button", {
      name: /Decisão administrativa: Aprovar OAB.*Helena Azevedo/,
    }),
  ).toBeVisible();
});
test("Rascunho isolado por processo e preservado ao navegar", async ({
  page,
}) => {
  await login(page, "c1");
  await page.goto("/cliente/processos/p1/conversa");
  await page
    .getByRole("textbox", { name: "Mensagem", exact: true })
    .fill("Rascunho do processo um");
  await page.getByRole("link", { name: "Andamentos", exact: true }).click();
  await page.getByRole("link", { name: "Conversa", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Mensagem", exact: true }),
  ).toHaveValue("Rascunho do processo um");
  await page.goto("/cliente/processos/p11/conversa");
  await expect(
    page.getByRole("textbox", { name: "Mensagem", exact: true }),
  ).toHaveValue("");
});
for (const width of [375, 768, 1024, 1440])
  test(`Responsividade ${width}px: sem overflow e sem erros no console`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.setViewportSize({ width, height: 900 });
    await login(page);
    await expect(
      page.getByRole("heading", { name: "Bom dia, Mariana." }),
    ).toBeVisible();
    for (const path of [
      "/advogado/inicio",
      "/advogado/clientes",
      "/advogado/processos/p1/conversa",
      "/advogado/documentos",
      "/advogado/assistente",
      "/advogado/configuracoes",
    ]) {
      await page.goto(path);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    await page.goto("/advogado/inicio");
    await page.screenshot({
      path: `test-results/dashboard-${width}.png`,
      fullPage: true,
    });
    expect(errors).toEqual([]);
  });
