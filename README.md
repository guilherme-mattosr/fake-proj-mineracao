# Elo Jurídico

## Agenda e organização dos componentes

- A área redundante **Conversas** foi retirada. As conversas continuam dentro de cada processo; URLs antigas de `/conversas` redirecionam para `/processos`.
- **Calendário** está disponível para advogados e clientes. O advogado cria, edita e cancela compromissos pessoais. Reuniões com clientes começam durante a conversa do processo.
- Pedidos de reunião no chat são identificados por regras locais de simulação de IA. Exemplo: `Quero marcar uma reunião em 10/01/2027 às 14h30`. O advogado confere o horário e confirma no cartão da conversa, registrando o encontro na agenda após verificar conflitos. A decisão aparece no chat e nas notificações.
- A tela inicial mostra os compromissos confirmados do dia e a quantidade de solicitações pendentes. A agenda usa o fuso do dispositivo e persiste no navegador, sem sincronização com Google Calendar, Outlook ou serviços externos.
- Administradores entram pela opção **Advogado**, informando seu e-mail e senha. Não há seletor de perfil nem atalho de demonstração administrativo. O fator adicional demonstrativo continua sendo `123456`.
- Componentes básicos reutilizáveis estão em `src/components/ui/`, cada um em seu arquivo e com interface de props nomeada. Componentes da agenda ficam em `src/components/calendar/`, regras em `src/domain/calendar.ts`, reconhecimento de pedidos em `src/services/meetingIntent.ts` e formatação de datas em `src/lib/calendar.ts`.
- ESLint: `npm.cmd run lint` / `npm.cmd run lint:fix`. Prettier: `npm.cmd run format` / `npm.cmd run format:check`.

Frontend local para comunicação entre clientes e advogados, processos, grupos, documentos, andamentos manuais e atendimento assistido por IA simulada. Inclui ambiente de escritório e painel dos sócios administradores.

## Executar

Validado com Node.js **24.21.0** e npm. Também é compatível com a série 22 a partir de 22.12; consulte os requisitos das dependências para outras séries. No PowerShell do Windows, use `npm.cmd` se a política de execução bloquear `npm.ps1`.

```powershell
npm.cmd install
npm.cmd run dev
```

Abra o endereço local informado pelo Vite, normalmente **http://127.0.0.1:5173**. O funcionamento da demonstração não depende de contas ou serviços externos. Depois de instalar as dependências, os dados e arquivos ficam no navegador.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
npm.cmd run preview
```

Os testes de navegador usam o Chrome instalado (`channel: chrome`). Se usar Chromium do Playwright, ajuste `playwright.config.ts`, remova `channel` e instale o navegador com `npx.cmd playwright install chromium`. O servidor de testes é iniciado e encerrado pelo Playwright. O relatório pode ser aberto com `npx.cmd playwright show-report`.

Para servir `dist/` em outro servidor, configure o fallback das rotas da SPA para `index.html`. `vite preview` já permite testar essas rotas localmente.

## Contas de demonstração

Na tela de acesso, escolha uma conta em **Explore a demonstração**. Esse atalho é exclusivo do protótipo e não representa autenticação segura. O formulário normal valida perfil e senha. O acesso normal abre Clientes para o advogado e Processos para o cliente; o atalho de demonstração abre a visão geral.

| Conta                | E-mail             | Perfil                                      |
| -------------------- | ------------------ | ------------------------------------------- |
| Mariana Almeida      | mariana@elo.demo   | Advogada · Almeida & Costa                  |
| Rafael Costa         | rafael@elo.demo    | Advogado · mesmo escritório, conta própria  |
| Beatriz Santos       | beatriz@elo.demo   | Advogada · mesmo escritório                 |
| Lucas Ferreira       | lucas@elo.demo     | Advogado individual                         |
| Camila Rocha         | camila@elo.demo    | Advogada com OAB pendente                   |
| Ana Beatriz Oliveira | ana@elo.demo       | Cliente com processos e convite pendente    |
| Pedro Henrique Lima  | pedro@elo.demo     | Cliente com processo em grupo               |
| Carolina Martins     | carolina@elo.demo  | Cliente com atendimento humano              |
| João Rodrigues       | joao@elo.demo      | Cliente com processo ativo                  |
| Fernanda Alves       | fernanda@elo.demo  | Cliente sem vínculo ativo                   |
| Roberto Mendes       | roberto@elo.demo   | Cliente com processo concluído              |
| Juliana Souza        | juliana@elo.demo   | Cliente com processo ativo                  |
| Daniel Pereira       | daniel@elo.demo    | Cliente com processo cancelado              |
| Sofia Ribeiro        | sofia@elo.demo     | Cliente com processo ativo                  |
| Thiago Nunes         | thiago@elo.demo    | Cliente com advogado individual e histórico |
| Clara Dias           | clara@elo.demo     | Cliente sem processo ativo                  |
| Guilherme Mattos     | guilherme@elo.demo | Sócio administrador                         |
| Helena Azevedo       | helena@elo.demo    | Sócia administradora, conta própria         |

Senha inicial de cada conta fictícia: **`Demo@123`**. Fator administrativo e confirmação de e-mail demonstrativos: **`123456`**. As contas são individuais; não há uma conta de escritório compartilhada. Senhas iguais são apenas um facilitador dos dados de teste e devem ser substituídas por autenticação real antes da produção.

## Fluxos para apresentar

1. Entre como Mariana, crie um processo para `ana@elo.demo` e selecione os colegas participantes.
2. Saia e entre como Ana. Confira o convite e aceite para liberar a conversa.
3. Pergunte “Qual é o último andamento?”. Depois pergunte “Devo aceitar o acordo?”. A segunda pergunta cria uma solicitação aos advogados, sem aviso automático no chat.
4. Entre como Mariana e assuma o atendimento. Rafael vê quem assumiu e continua podendo participar. A IA pausa até Mariana encerrar o atendimento.
5. Envie um arquivo pelo chat. Ele aparece também em Documentos. Um nome desconhecido fica em **Organização pendente**; um nome como `contrato.pdf` recebe uma sugestão revisável.
6. Registre um andamento público e outro interno. Ana verá somente o público. Informações internas não alimentam o assistente particular.
7. Ana pode solicitar a exclusão de um arquivo; Mariana analisa e efetiva a remoção com confirmação e permissão. Compartilhar um arquivo com outro processo cria uma cópia isolada da versão confirmada.
8. Crie uma conversa interna com colegas e anexe um arquivo. Ana não acessa a conversa nem o anexo.
9. Conclua um processo em Dados do processo. O histórico permanece, mas mensagens, novos arquivos e alterações ficam bloqueados.
10. Entre como sócio para analisar a OAB de Camila, responder chamados, analisar exportações, publicar políticas simuladas e consultar a auditoria identificada.

## Estrutura

```text
src/
  components/     UI, layout, diálogos, chat, documentos e formulários
  data/           Dados fictícios coerentes entre os perfis
  domain/         Tipos, matriz de permissões, ações e testes de regras
  lib/            Formatação, identificadores e downloads locais
  pages/          Advogado, cliente, administração, acesso e sistema
  services/       Assistente e classificação substituíveis por serviços reais
  store/          Repositório, transações e sincronização entre abas
  styles/         Design system e regras para celular/tablet/desktop
e2e/              Playwright, integração, responsividade e axe
scripts/          Geração do inventário rastreável
```

## Dados, arquivos e restauração

- `localStorage`: banco demonstrativo `elo-juridico:db:v1`, incluindo conteúdos dos arquivos selecionados como data URLs.
- `sessionStorage`: sessão da aba, buscas, filtros, posições e rascunhos separados por conta/contexto. O cadastro preserva somente campos não secretos, não senha ou aceite.
- Alterações são publicadas no estado após a gravação local bem-sucedida. Falta de espaço informa o erro sem afirmar que o envio foi concluído.
- Uploads aceitam PDF, PNG/JPEG/WebP, áudio, vídeo e TXT de até **5 MB**. O espaço real disponível depende do navegador; um arquivo pode exceder a quota local mesmo estando abaixo desse tamanho.
- Arquivos fictícios iniciais têm prévia simulada e download TXT claramente identificado. Arquivos enviados têm download do conteúdo selecionado e prévia quando o navegador suporta o formato.
- A restauração está em **Configurações → Perfil → Restaurar dados fictícios**. Ela pede confirmação, substitui apenas os dados desta aplicação, limpa os rascunhos e encerra a sessão. Não altera arquivos do computador.

## Limites da demonstração

Não utilize dados reais. `localStorage`, senhas locais e verificações de rota **não são segurança de produção**. O banco completo está no navegador e pode ser inspecionado ou adulterado por quem controla o dispositivo. A sincronização entre abas simula colaboração; não oferece transações concorrentes de um servidor.

A IA usa regras locais, andamentos públicos e metadados autorizados. Não extrai texto real de PDFs, não pesquisa legislação, não cria peças e não emite avaliação profissional. Toda resposta automática é identificada. O histórico particular é filtrado por conta; apenas o conteúdo confirmado pelo cliente é encaminhado.

E-mail, recuperação, MFA, OAB, notificações e auditoria são simulações locais. Evidências profissionais são representadas por metadados. Logs são imutáveis pela interface, não contra alteração do armazenamento. Não existem tribunais, backend, nuvem, pagamentos, planos ou chamadas de voz/vídeo.

Retenção, restauração de versões, reabertura, gestão de participantes e papéis internos permanecem dependentes de decisão de produto. Controles correspondentes estão bloqueados ou têm seu limite explicado. Os textos de termos e privacidade são explicativos de demonstração; não são documentos jurídicos aprovados.

O inventário completo de **88 etapas e 452 requisitos**, com rotas, arquivos e limitações por item, está em [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md). A extração integral do Word está em `requirements-source.txt`, sem alterar o documento original. Para regenerar o inventário após atualizar o mapeamento: `python scripts/generate_checklist.py`.

## Integração futura

Preserve os contratos em `domain/types.ts` e as regras centrais. Substitua `store/repository.ts` por chamadas autenticadas, aplique permissões no servidor e use armazenamento de arquivos apropriado. Implemente recuperação/MFA reais, auditoria imutável, retenção aprovada e notificações. O serviço de IA deve revalidar autorização das fontes, citar a versão utilizada e respeitar atendimento humano ativo.
