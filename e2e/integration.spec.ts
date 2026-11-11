import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { loginAdmin } from "./helpers";
async function login(page: Page, id: string) {
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
    .locator(".topbar")
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await login(page, id);
}
test("Arquivo reservado só fica visível após compartilhamento e permite revogação", async ({
  page,
}) => {
  await login(page, "a1");
  await page.goto("/advogado/processos/p1/documentos");
  await page
    .getByRole("button", { name: "Enviar documento", exact: true })
    .click();
  await page.getByLabel("Arquivo para envio").setInputFiles({
    name: "reservado-de-teste.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Arquivo reservado fictício."),
  });
  await page.getByRole("button", { name: "Confirmar envio" }).click();
  await expect(
    page.getByRole("button", { name: "Ações de reservado-de-teste.txt" }),
  ).toBeVisible();
  await switchUser(page, "c1");
  await page.goto("/cliente/documentos");
  await expect(
    page.getByText("reservado-de-teste.txt", { exact: true }),
  ).toHaveCount(0);
  await switchUser(page, "a1");
  await page.goto("/advogado/processos/p1/documentos");
  await page
    .getByRole("button", { name: "Ações de reservado-de-teste.txt" })
    .click();
  await page
    .getByRole("button", { name: "Compartilhar documento", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Processo de destino" })
    .selectOption("p1");
  await page.getByLabel("Confirmo o arquivo").check();
  await page
    .getByRole("button", { name: "Confirmar compartilhamento" })
    .click();
  await switchUser(page, "c1");
  await page.goto("/cliente/documentos");
  await expect(
    page.getByText("reservado-de-teste.txt", { exact: true }),
  ).toBeVisible();
  await switchUser(page, "a1");
  await page.goto("/advogado/processos/p1/documentos");
  await page
    .getByRole("button", { name: "Ações de reservado-de-teste.txt" })
    .click();
  await page.getByRole("button", { name: "Revogar compartilhamento" }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await page.getByRole("button", { name: "Fechar janela" }).click();
  await switchUser(page, "c1");
  await page.goto("/cliente/documentos");
  await expect(
    page.getByText("reservado-de-teste.txt", { exact: true }),
  ).toHaveCount(0);
});
test("Anexo interno funciona e permanece invisível na biblioteca do cliente", async ({
  page,
}) => {
  await login(page, "a1");
  await page.goto("/advogado/conversas-internas");
  await page.getByRole("button", { name: "Anexar documento" }).click();
  await page.getByLabel("Arquivo para envio").setInputFiles({
    name: "equipe-reservado.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Conteúdo interno fictício."),
  });
  await page.getByRole("button", { name: "Confirmar envio" }).click();
  await expect(
    page.locator(".attachment").filter({ hasText: "equipe-reservado.txt" }),
  ).toBeVisible();
  await switchUser(page, "c1");
  await page.goto("/cliente/documentos");
  await expect(page.getByText("equipe-reservado.txt")).toHaveCount(0);
});
test("Encaminhamento particular envia só a pergunta confirmada", async ({
  page,
}) => {
  await login(page, "c1");
  await page.goto("/cliente/assistente");
  await page
    .getByRole("textbox", { name: "Pergunta ao assistente" })
    .fill("Devo aceitar um acordo?");
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
  await page.getByRole("button", { name: "Encaminhar pergunta" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("combobox", { name: "Processo de destino" })
    .selectOption("p1");
  await dialog
    .getByLabel("Resumo para revisão")
    .fill("Resumo aprovado pelo cliente.");
  await dialog.getByLabel("Confirmo o conteúdo").check();
  await dialog
    .getByRole("button", { name: "Confirmar encaminhamento" })
    .click();
  await expect(
    page.getByText(/Resumo confirmado: Resumo aprovado pelo cliente/),
  ).toBeVisible();
  await switchUser(page, "a1");
  await page.goto("/advogado/processos/p1/conversa");
  await expect(
    page.getByText(/Resumo confirmado: Resumo aprovado pelo cliente/),
  ).toBeVisible();
});
test("Suporte separa respostas públicas e notas internas", async ({ page }) => {
  await login(page, "c1");
  await page.goto("/cliente/ajuda");
  await page.getByRole("button", { name: /Dúvida sobre o envio/ }).click();
  await page
    .getByLabel("Sua resposta")
    .fill("Preciso de uma orientação técnica.");
  await page
    .getByRole("button", { name: "Enviar resposta", exact: true })
    .click();
  await page.getByRole("button", { name: "Fechar janela" }).click();
  await switchUser(page, "ad1");
  await page.goto("/administracao/suporte");
  await page.getByRole("button", { name: /Dúvida sobre o envio/ }).click();
  await page.getByLabel("Resposta / nota").fill("Nota reservada ao suporte.");
  await page.getByLabel("Nota interna").check();
  await page
    .getByRole("button", { name: "Salvar atendimento e assumir" })
    .click();
  await page
    .getByLabel("Resposta / nota")
    .fill("Encontre o arquivo na aba Documentos.");
  await page.getByLabel("Nota interna").uncheck();
  await page
    .getByRole("button", { name: "Salvar atendimento e assumir" })
    .click();
  await page.getByRole("button", { name: "Fechar janela" }).click();
  await switchUser(page, "c1");
  await page.goto("/cliente/ajuda");
  await page.getByRole("button", { name: /Dúvida sobre o envio/ }).click();
  await expect(
    page.getByText("Encontre o arquivo na aba Documentos.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Nota reservada ao suporte.", { exact: true }),
  ).toHaveCount(0);
});
test("Pedido de exportação é analisado e pacote fica restrito ao titular", async ({
  page,
}) => {
  await login(page, "c1");
  await page.goto("/cliente/privacidade");
  await page.getByRole("button", { name: "Solicitar cópia dos dados" }).click();
  await page.getByLabel("Senha atual").fill("Demo@123");
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await switchUser(page, "ad1");
  await page.goto("/administracao/privacidade");
  await page.getByRole("button", { name: /Exportação de dados/ }).click();
  await page.getByLabel("Identidade demonstrativa").check();
  await page
    .getByRole("combobox", { name: "Situação", exact: true })
    .selectOption("Disponível");
  await page
    .getByLabel("Resposta e fundamento")
    .fill("Pedido demonstrativo validado pelo sócio.");
  await page.getByRole("button", { name: "Registrar análise" }).click();
  await page.getByRole("button", { name: "Fechar janela" }).click();
  await switchUser(page, "c1");
  await page.goto("/cliente/privacidade");
  await expect(
    page.getByRole("button", { name: "Baixar pacote" }),
  ).toBeVisible();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar pacote" }).click();
  expect((await dl).suggestedFilename()).toBe("meus-dados-elo.json");
});
test("Política exige aprovação e publicação; suspensão impede novas respostas", async ({
  page,
}) => {
  await login(page, "ad1");
  await page.goto("/administracao/ia");
  await page.getByRole("button", { name: "Nova política" }).click();
  await page
    .getByLabel("Texto da política")
    .fill("Política de teste mantendo fontes e encaminhamento obrigatórios.");
  await page.getByLabel("Confirmo os dados").check();
  await page.getByRole("button", { name: "Criar registro" }).click();
  await page.getByRole("button", { name: /Política v2/ }).click();
  await expect(
    page.getByRole("button", { name: "Publicar versão" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Submeter para aprovação" }).click();
  await page.getByRole("button", { name: "Aprovar versão" }).click();
  await page.getByRole("button", { name: "Publicar versão" }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await page.getByRole("button", { name: "Fechar janela" }).click();
  await page.goto("/administracao/monitoramento");
  await page.getByRole("button", { name: "Suspender função" }).click();
  await page.getByRole("button", { name: "Confirmar", exact: true }).click();
  await switchUser(page, "c1");
  await page.goto("/cliente/assistente");
  await page
    .getByRole("textbox", { name: "Pergunta ao assistente" })
    .fill("Qual o andamento?");
  await page.getByRole("button", { name: "Enviar pergunta" }).click();
  await expect(page.getByRole("status")).toContainText("suspenso");
});
test("Solicitação de arquivo é atendida no processo correto", async ({
  page,
}) => {
  await login(page, "c1");
  await page.goto("/cliente/documentos");
  await page.getByRole("button", { name: "Enviar arquivo solicitado" }).click();
  await page.getByLabel("Arquivo para envio").setInputFiles({
    name: "comprovante-teste.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Comprovante fictício."),
  });
  await page.getByRole("button", { name: "Confirmar envio" }).click();
  await expect(
    page.getByRole("button", { name: "Enviar arquivo solicitado" }),
  ).toHaveCount(0);
  await expect(
    page.locator(".doc-main").filter({ hasText: "comprovante-teste.txt" }),
  ).toBeVisible();
});
test("Cadastro do cliente, confirmação demonstrativa e conta sem processo", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Cliente", exact: true }).click();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByLabel("Nome completo").fill("Cliente de Teste");
  await page.getByLabel("Telefone", { exact: true }).fill("(11) 90000-1234");
  await page.getByLabel("E-mail", { exact: true }).fill("cadastro@teste.demo");
  await page.getByLabel("Senha", { exact: true }).fill("Teste@123");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByLabel("Código de confirmação").fill("123456");
  await page.getByRole("button", { name: "Confirmar código" }).click();
  await page.getByLabel("E-mail", { exact: true }).fill("cadastro@teste.demo");
  await page.getByLabel("Senha", { exact: true }).fill("Teste@123");
  await page.getByRole("button", { name: "Entrar na minha conta" }).click();
  await expect(page).toHaveURL(/cliente\/processos/);
  await page.goto("/cliente/assistente");
  await expect(
    page.getByRole("heading", { name: "Assistente indisponível" }),
  ).toBeVisible();
});
test("Falha offline mantém mensagem local e reenvia sem duplicar", async ({
  page,
  context,
}) => {
  await login(page, "c1");
  await page.goto("/cliente/processos/p1/conversa");
  await context.setOffline(true);
  await page
    .getByRole("textbox", { name: "Mensagem", exact: true })
    .fill("Mensagem de teste em falha de rede.");
  await page
    .getByRole("button", { name: "Enviar mensagem", exact: true })
    .click();
  await expect(
    page
      .locator(".message.own")
      .filter({ hasText: "Mensagem de teste em falha de rede." }),
  ).toContainText("Falhou");
  await context.setOffline(false);
  await page
    .getByRole("button", { name: "Tentar novamente", exact: true })
    .click();
  await expect(
    page
      .locator(".message.own")
      .filter({ hasText: "Mensagem de teste em falha de rede." }),
  ).toContainText("Entregue");
  await expect(
    page.getByText("Mensagem de teste em falha de rede.", { exact: true }),
  ).toHaveCount(1);
});
