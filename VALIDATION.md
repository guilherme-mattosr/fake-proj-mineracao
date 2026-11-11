# Validação — Elo Jurídico

Atualizado em 11/11/2026 no Windows, com Node.js 24.21.0 e Chrome instalado. Nenhum serviço externo foi necessário para executar os fluxos da demonstração.

| Verificação                                                               | Resultado                                             |
| ------------------------------------------------------------------------- | ----------------------------------------------------- |
| TypeScript (`npm.cmd run typecheck`)                                      | Aprovado                                              |
| ESLint (`npm.cmd run lint`)                                               | Aprovado, sem erros ou avisos de código               |
| Vitest (`npm.cmd test`)                                                   | 57 testes de regras aprovados                         |
| Playwright, suíte funcional completa                                      | 32 testes aprovados                                   |
| Playwright, celular compacto 375 × 667                                    | Teste adicional aprovado                              |
| Responsividade após ajuste de altura do chat                              | 375, 768, 1024 e 1440 px verificados                  |
| axe: login, painel, documentos, chat, assistente, configurações e diálogo | Sem violações WCAG A/AA detectadas nas telas testadas |
| Teclado: fechar diálogo com Escape e restaurar foco                       | Aprovado                                              |
| Console em navegação de áreas administrativas e do cliente                | Sem erros detectados                                  |
| Build de produção (`npm.cmd run build`)                                   | Aprovado; saída em `dist/`                            |
| Auditoria npm, dependências de produção e desenvolvimento                 | Zero vulnerabilidades reportadas                      |

A rodada final executou os 32 testes de navegador com sucesso em 2 minutos, com o código estabilizado. Com os 57 testes de regras, são 89 testes distintos aprovados. Lint sem erros ou avisos, build de produção e `format:check` aprovados.

## Alterações de 11/11/2026

- Agenda: pedido no chat, confirmação exclusiva do advogado, recusa, cancelamento, conflitos de horário, edição de compromissos pessoais, persistência e lembrete diário.
- Reconhecimento local de pedidos evita tratar “onde encontro os documentos” como uma solicitação de reunião; datas incompletas ficam para conferência explícita.
- Compromissos pessoais isolados de clientes; migração do armazenamento antigo sem apagar processos e contas; mensagens falhas só criam pedidos após reenvio.
- Entrada administrativa pela opção Advogado, com credenciais e fator demonstrativos; nenhum seletor ou atalho administrativo no login.
- Navegação Conversas removida; rota antiga redireciona para Processos.
- Componentes de UI separados em arquivos, com interfaces de props nomeadas; ferramentas de formatação configuradas.
- Agenda verificada em 375, 768 e 1440 px, com axe sem violações WCAG A/AA detectadas. Capturas desktop e celular inspecionadas em `docs/previews/calendar-1440.png` e `docs/previews/calendar-375.png`.
- A agenda e a identificação de pedidos continuam locais: sem IA real, calendário externo ou envio de notificações fora do aplicativo.

## Fluxos cobertos

- Cadastro, confirmação de e-mail demonstrativa, criação de processo, convite e aceite com troca de perfil.
- Persistência após recarregar, rascunhos por processo e retorno entre abas da conversa.
- Resposta factual com fonte, encaminhamento para todos os advogados e identificação de quem assume.
- Colaboração de vários profissionais no grupo e pausa da IA durante atendimento humano.
- Andamento público e interno, autoria, histórico de alterações e bloqueios após conclusão/cancelamento.
- Upload do chat na biblioteca, classificação pendente, versões históricas e restrições de compartilhamento.
- Solicitação de exclusão pelo cliente e remoção por advogado autorizado.
- Arquivo enviado pelo advogado permanece reservado até liberação explícita; revogação retira o acesso. Arquivos originados pelo próprio cliente não recebem uma ação enganosa de revogar seu acesso.
- Integridade referencial dos dados fictícios; processos aguardando aceite não contêm mensagens de um cliente ainda não vinculado.
- Conversas/anexos internos invisíveis ao cliente; assistente particular isolado da conta profissional.
- Encaminhamento confirmado apenas da pergunta escolhida, sem transferir o histórico particular.
- Respostas públicas de suporte separadas de notas internas.
- Pedido de exportação, análise administrativa e disponibilização ao titular autenticado.
- Aprovação e publicação de política, suspensão da IA e auditoria identificada do sócio.
- Solicitação de arquivo e envio no processo correto.
- Falha de rede, ausência de notificações indevidas antes do reenvio e reenvio sem duplicar a mensagem.
- Rotas administrativas e recursos de outro cliente indisponíveis para usuários sem vínculo.
- Telas sem processo, buscas sem resultado e mensagens de indisponibilidade.

## Revisão visual e limites

Capturas do painel foram inspecionadas em 375, 768, 1024 e 1440 px. O chat foi inspecionado em 375 × 667 px, com o compositor acima da navegação inferior. As capturas ficam em `docs/previews/` quando preservadas; relatórios e rastros temporários ficam nas pastas ignoradas `playwright-report/` e `test-results/`.

Testes automatizados e axe não substituem testes com leitores de tela, dispositivos físicos, teclado virtual ou avaliação de usabilidade. Não houve validação em Safari/iOS nem certificação de conformidade integral das 88 etapas. Não existe avaliação de segurança de backend, autenticação real, tribunais, IA real ou armazenamento em nuvem porque estão fora desta demonstração.

O aviso `NO_COLOR/FORCE_COLOR` observado pertence ao processo de testes/servidor e não ao console da aplicação. O documento de requisitos original foi apenas lido, sem alteração.

Os limites de cada requisito, incluindo bloqueios por política e integrações futuras, estão em `IMPLEMENTATION_CHECKLIST.md`.
