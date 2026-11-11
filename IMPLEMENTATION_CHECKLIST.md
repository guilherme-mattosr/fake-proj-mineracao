# Checklist de implementação — Elo Jurídico

## Auditoria e decisões

- Diretório inicialmente vazio em 09/11/2026. Nenhum componente preexistente foi substituído. Sem AGENTS.md no diretório ou pai imediato. Git indisponível no PATH do ambiente.
- O Word original foi preservado. Extração integral em `requirements-source.txt`: 88 páginas funcionais e 452 requisitos, incluindo 10 gerais.
- React + TypeScript + Vite + React Router; CSS separado, Lucide, estado via useSyncExternalStore e repositório local transacional.
- Grupos incluídos conforme pedido mais recente e ADV 31/32, apesar da exclusão no resumo inicial do Word. Chamadas continuam fora do escopo.
- Etapas próximas usam abas e diálogos, evitando páginas duplicadas. Os códigos abaixo são páginas/etapas funcionais, não 88 layouts desconectados.
- Contas individuais; sócios com acesso administrativo completo; administrador não vê chats jurídicos nem histórico particular por padrão.
- Vínculo com escritório existente não é concedido por digitar seu nome no cadastro. Gestão de equipe bloqueada até a definição dos papéis.
- Sem backend, nuvem, envio de e-mail, tribunais, cobrança ou API de IA. Uploads até 5 MB são um limite técnico da simulação local, não limite comercial.

## Legenda e limites

**Simulado**: implementado no frontend, com dados locais e sem promessa de comportamento de produção.
**Parcial**: o comportamento exato tem a limitação descrita, mesmo quando o fluxo principal funciona.
**Bloqueado por decisão/integração**: operação não é apresentada como concluída; depende de política, autorização ou serviço ausente.

Nenhum estado abaixo equivale a aprovação de regras jurídicas/comerciais. Permanecem abertas: método definitivo de OAB, confiança da IA, retenção e restauração, papéis de escritório, reabertura de processos, pesquisa/elaboração jurídica e operação definitiva de suporte.

## Arquitetura e matriz de permissões

| Perfil | Escopo de leitura | Alterações permitidas |
|---|---|---|
| Advogado individual | Seus processos e arquivos autorizados | Processo, convite, atendimento, andamentos e documentos ativos |
| Advogado de escritório | Processos de que participa; equipe e conversas internas autorizadas | Funções profissionais e colaboração; autoria individual |
| Cliente | Seus processos aceitos, documentos liberados e assistente particular | Mensagens/envios em ativos, convites próprios e solicitações de análise |
| Sócio | Metadados operacionais, contas, chamados e auditoria | Decisões administrativas justificadas e registradas com ator/data/horário/alvo/resultado |

Regras centrais: `src/domain/permissions.ts` e `src/domain/actions.ts`. Estado: `src/store/`. Integração futura de IA/classificação: `src/services/`. Dados fictícios: `src/data/seed.ts`.

## Páginas e etapas

| Código | Página/etapa | Rota / apresentação | Estado | Arquivo responsável |
|---|---|---|---|---|
| ADV 01 | Acesso e recuperação de conta | `/login` · Acesso e recuperação simulados | Simulado | `src/pages/Auth.tsx` |
| ADV 02 | Clientes | `/advogado/clientes` · Lista de clientes | Simulado | `src/pages/Workspace.tsx` |
| ADV 03 | Processos do cliente | `/advogado/clientes/:clienteId` · Processos do cliente | Simulado | `src/pages/Workspace.tsx` |
| ADV 04 | Criar processo e enviar convite | `/advogado/processos` · Modal Novo processo | Simulado | `src/components/cases.tsx` |
| ADV 05 | Solicitações enviadas | `/advogado/convites` · Lista e detalhe em modal | Simulado | `src/pages/Workspace.tsx` |
| ADV 06 | Conversa do processo | `/advogado/processos/:id/conversa` · Conversa oficial | Simulado | `src/pages/Process.tsx` |
| ADV 07 | Solicitações encaminhadas pela IA | `/advogado/solicitacoes` · Fila persistente da IA | Simulado | `src/pages/Workspace.tsx` |
| ADV 08 | Dados do processo | `/advogado/processos/:id/dados` · Dados e participantes | Simulado; decisões bloqueadas | `src/pages/Process.tsx` |
| ADV 09 | Documentos por cliente | `/advogado/documentos` · Seletor Documentos por cliente | Simulado | `src/pages/Documents.tsx` |
| ADV 10 | Documentos do cliente | `/advogado/documentos/clientes/:id` · Biblioteca autorizada do cliente | Simulado | `src/pages/Documents.tsx` |
| ADV 11 | Categorias de documentos | `/advogado/documentos` · Categorias como filtros | Simulado | `src/pages/Documents.tsx` |
| ADV 12 | Arquivos da categoria | `/advogado/documentos` · Arquivos filtrados e menu de ações | Simulado | `src/pages/Documents.tsx` |
| ADV 13 | Documento aberto | `/advogado/documentos?arquivo=:id` · Visualizador em diálogo | Simulado | `src/components/documents.tsx` |
| ADV 14 | Assistente do advogado | `/advogado/assistente` · Assistente profissional | Parcial — ver requisitos | `src/pages/Assistant.tsx` |
| ADV 15 | Histórico do assistente | `/advogado/assistente` · Modal Histórico | Simulado; decisões bloqueadas | `src/pages/Assistant.tsx` |
| ADV 16 | Perfil e configurações | `/advogado/configuracoes` · Perfil e abas | Simulado | `src/pages/Account.tsx` |
| ADV 17 | Cadastro do advogado | `/login` · Criar conta → Advogado | Simulado | `src/pages/Auth.tsx` |
| ADV 18 | Dados profissionais e escritório | `/login` · Dados profissionais no cadastro | Parcial — ver requisitos | `src/pages/Auth.tsx` |
| ADV 19 | Verificação de e-mail | `/login` · Confirmação de e-mail demonstrativa | Simulado | `src/pages/Auth.tsx` |
| ADV 20 | Situação da verificação profissional | `/advogado/verificacao` · Estado e reenvio para análise | Parcial — ver requisitos | `src/pages/Account.tsx` |
| ADV 21 | Central de notificações | `/advogado/notificacoes` · Central por conta | Simulado; decisões bloqueadas | `src/pages/Account.tsx` |
| ADV 22 | Enviar e classificar documento | `/advogado/documentos` · Modal Enviar documento | Simulado | `src/components/documents.tsx` |
| ADV 23 | Compartilhar documento | `/advogado/documentos` · Modal Compartilhar | Simulado | `src/components/documents.tsx` |
| ADV 24 | Histórico de versões do documento | `/advogado/documentos` · Modal Histórico de versões | Simulado; decisões bloqueadas | `src/pages/Documents.tsx` |
| ADV 25 | Editar processo | `/advogado/processos/:id/dados` · Modal Editar processo | Simulado | `src/pages/Process.tsx` |
| ADV 26 | Escritório e equipe | `/advogado/escritorio` · Escritório, processos e atividade | Simulado; decisões bloqueadas | `src/pages/Workspace.tsx` |
| ADV 27 | Membros do escritório | `/advogado/escritorio/membros` · Lista e perfil do integrante | Simulado; decisões bloqueadas | `src/pages/Workspace.tsx` |
| ADV 28 | Segurança da conta | `/advogado/seguranca` · Senha, fator e sessão fictícia | Simulado | `src/pages/Account.tsx` |
| ADV 29 | Privacidade e dados da conta | `/advogado/privacidade` · Preferências e pedidos | Simulado | `src/pages/Account.tsx` |
| ADV 30 | Ajuda e suporte | `/advogado/ajuda` · FAQ e chamados integrados | Simulado | `src/pages/Account.tsx` |
| ADV 31 | Conversa interna entre advogados | `/advogado/conversas-internas` · Conversas e anexos reservados | Simulado; decisões bloqueadas | `src/pages/Internal.tsx` |
| ADV 32 | Grupo do processo | `/advogado/processos/:id/grupo` · Variação da conversa com múltiplos autores | Simulado; decisões bloqueadas | `src/pages/Process.tsx` |
| ADV 33 | Andamentos manuais do processo | `/advogado/processos/:id/andamentos` · Linha do tempo e modal de edição | Simulado | `src/pages/Process.tsx` |
| CLI 01 | Acesso e recuperação de conta | `/login` · Acesso → Cliente | Simulado | `src/pages/Auth.tsx` |
| CLI 02 | Processos | `/cliente/processos` · Lista, busca e filtros | Simulado | `src/pages/Workspace.tsx` |
| CLI 03 | Lista de convites | `/cliente/convites` · Lista de convites | Simulado | `src/pages/Workspace.tsx` |
| CLI 04 | Detalhes do convite | `/cliente/convites/:id` · Detalhe em modal | Simulado | `src/pages/Workspace.tsx` |
| CLI 05 | Conversa do processo | `/cliente/processos/:id/conversa` · Conversa oficial | Simulado | `src/pages/Process.tsx` |
| CLI 06 | Detalhes do processo | `/cliente/processos/:id/dados` · Dados públicos e participantes | Simulado | `src/pages/Process.tsx` |
| CLI 07 | Perfil do advogado | `/cliente/processos/:id/dados` · Perfil profissional no diálogo Participantes | Simulado | `src/pages/Process.tsx` |
| CLI 08 | Documentos | `/cliente/documentos` · Biblioteca e solicitações de arquivo | Simulado | `src/pages/Documents.tsx` |
| CLI 09 | Categorias de documentos | `/cliente/documentos` · Categorias por contexto | Simulado | `src/pages/Documents.tsx` |
| CLI 10 | Lista de arquivos | `/cliente/documentos` · Arquivos e menus autorizados | Simulado | `src/pages/Documents.tsx` |
| CLI 11 | Visualizador de documento | `/cliente/documentos?arquivo=:id` · Visualizador | Simulado | `src/components/documents.tsx` |
| CLI 12 | Assistente particular | `/cliente/assistente` · Assistente particular | Simulado; decisões bloqueadas | `src/pages/Assistant.tsx` |
| CLI 13 | Histórico do assistente | `/cliente/assistente` · Modal Histórico | Simulado | `src/pages/Assistant.tsx` |
| CLI 14 | Notificações | `/cliente/notificacoes` · Central por conta | Simulado | `src/pages/Account.tsx` |
| CLI 15 | Perfil e configurações | `/cliente/configuracoes` · Perfil e configurações | Simulado | `src/pages/Account.tsx` |
| CLI 16 | Enviar documento | `/cliente/documentos` · Modal Enviar documento | Simulado | `src/components/documents.tsx` |
| CLI 17 | Enviar documento salvo a outro processo | `/cliente/documentos` · Modal Compartilhar arquivo | Simulado | `src/components/documents.tsx` |
| CLI 18 | Enviar nova versão | `/cliente/documentos` · Modal Nova versão | Simulado | `src/components/documents.tsx` |
| CLI 19 | Solicitar exclusão de documento | `/cliente/documentos` · Modal Solicitar exclusão | Simulado | `src/pages/Documents.tsx` |
| CLI 20 | Encaminhar pergunta ao advogado | `/cliente/assistente` · Prévia e confirmação de encaminhamento | Simulado | `src/pages/Assistant.tsx` |
| CLI 21 | Cadastro e primeiro acesso | `/login` · Cadastro → Cliente | Simulado | `src/pages/Auth.tsx` |
| CLI 22 | Verificação de e-mail | `/login` · Código demonstrativo e reenvio | Simulado | `src/pages/Auth.tsx` |
| CLI 23 | Preferências de notificações | `/cliente/preferencias` · Preferências internas | Simulado; decisões bloqueadas | `src/pages/Account.tsx` |
| CLI 24 | Segurança da conta | `/cliente/seguranca` · Credenciais e sessão fictícia | Simulado | `src/pages/Account.tsx` |
| CLI 25 | Privacidade e uso de dados | `/cliente/privacidade` · Privacidade e IA | Simulado | `src/pages/Account.tsx` |
| CLI 26 | Exportação e exclusão da conta | `/cliente/privacidade` · Pedidos e download de exportação autorizada | Simulado | `src/pages/Account.tsx` |
| CLI 27 | Ajuda e suporte | `/cliente/ajuda` · FAQ e chamados | Simulado | `src/pages/Account.tsx` |
| CLI 28 | Conta sem processo ativo | `/cliente/inicio` · Estado vazio; assistente bloqueado sem vínculo | Simulado | `src/pages/Workspace.tsx` |
| CLI 29 | Histórico de solicitações sobre documentos | `/cliente/solicitacoes-documentos` · Pedidos, complementos e cancelamento | Simulado | `src/pages/Account.tsx` |
| SYS 01 | Abertura e direcionamento inicial | `/` · Redirecionamento e proteção por sessão | Parcial — ver requisitos | `src/App.tsx` |
| SYS 02 | Termos de uso | `/sistema/termos` · Texto explicativo de demonstração | Parcial — ver requisitos | `src/pages/System.tsx` |
| SYS 03 | Política de privacidade | `/sistema/privacidade` · Texto explicativo de demonstração | Parcial — ver requisitos | `src/pages/System.tsx` |
| SYS 04 | Consentimento e transparência da IA | `/sistema/transparencia` · Ciência, limites e privacidade | Simulado | `src/pages/System.tsx` |
| SYS 05 | Sessão expirada | `/sistema/sessao-expirada` · Encerramento e retorno ao acesso | Parcial — ver requisitos | `src/pages/System.tsx` |
| SYS 06 | Sem conexão | `/sistema/sem-conexao` · Estado offline; reenvio no chat | Simulado | `src/pages/System.tsx` |
| SYS 07 | Manutenção e indisponibilidade | `/sistema/manutencao` · Estado demonstrativo, sem previsão inventada | Parcial — ver requisitos | `src/pages/System.tsx` |
| SYS 08 | Atualização obrigatória | `/sistema/atualizacao` · Instruções da versão web | Simulado; decisões bloqueadas | `src/pages/System.tsx` |
| SYS 09 | Acesso negado ou conteúdo indisponível | `/sistema/acesso-negado` · Recurso indisponível sem expor existência | Simulado | `src/pages/System.tsx` |
| ADM 01 | Acesso administrativo | `/login` · Acesso administrativo | Simulado; decisões bloqueadas | `src/pages/Auth.tsx` |
| ADM 02 | Painel operacional | `/administracao` · Lista, indicadores ou detalhe em diálogo | Simulado | `src/pages/Admin.tsx` |
| ADM 03 | Fila de verificação da OAB | `/administracao/oab` · Lista, indicadores ou detalhe em diálogo | Simulado | `src/pages/Admin.tsx` |
| ADM 04 | Análise da verificação profissional | `/administracao/oab` · Lista, indicadores ou detalhe em diálogo | Parcial — ver requisitos | `src/pages/Admin.tsx` |
| ADM 05 | Usuários e contas | `/administracao/usuarios` · Lista, indicadores ou detalhe em diálogo | Simulado; decisões bloqueadas | `src/pages/Admin.tsx` |
| ADM 06 | Detalhes da conta | `/administracao/usuarios` · Lista, indicadores ou detalhe em diálogo | Simulado | `src/pages/Admin.tsx` |
| ADM 07 | Processos e vínculos | `/administracao/processos` · Lista, indicadores ou detalhe em diálogo | Simulado; decisões bloqueadas | `src/pages/Admin.tsx` |
| ADM 08 | Administradores do sistema | `/administracao/administradores` · Lista, indicadores ou detalhe em diálogo | Parcial — ver requisitos | `src/pages/Admin.tsx` |
| ADM 09 | Fila de suporte | `/administracao/suporte` · Lista, indicadores ou detalhe em diálogo | Simulado; decisões bloqueadas | `src/pages/Admin.tsx` |
| ADM 10 | Atendimento do chamado | `/administracao/suporte` · Lista, indicadores ou detalhe em diálogo | Simulado | `src/pages/Admin.tsx` |
| ADM 11 | Armazenamento e arquivos | `/administracao/armazenamento` · Lista, indicadores ou detalhe em diálogo | Simulado | `src/pages/Admin.tsx` |
| ADM 12 | Logs e auditoria | `/administracao/auditoria` · Lista, indicadores ou detalhe em diálogo | Simulado | `src/pages/Admin.tsx` |
| ADM 13 | Incidentes de segurança | `/administracao/incidentes` · Lista, indicadores ou detalhe em diálogo | Simulado | `src/pages/Admin.tsx` |
| ADM 14 | Solicitações de privacidade | `/administracao/privacidade` · Lista, indicadores ou detalhe em diálogo | Parcial — ver requisitos | `src/pages/Admin.tsx` |
| ADM 15 | Políticas e limites da IA | `/administracao/ia` · Lista, indicadores ou detalhe em diálogo | Simulado | `src/pages/Admin.tsx` |
| ADM 16 | Monitoramento da atuação da IA | `/administracao/monitoramento` · Lista, indicadores ou detalhe em diálogo | Parcial — ver requisitos | `src/pages/Admin.tsx` |
| ADM 17 | Categorias e parâmetros documentais | `/administracao/categorias` · Lista, indicadores ou detalhe em diálogo | Simulado | `src/pages/Admin.tsx` |

## Requisitos individuais

| Requisito | Descrição original | Estado | Página/arquivo | Limitação ou comportamento |
|---|---|---|---|---|
| ADV 01.01 | Validar credenciais e abrir a página Clientes | Simulado | ADV 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 01.02 | Iniciar cadastro com dados pessoais e profissionais | Simulado | ADV 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 01.03 | Enviar processo de recuperação para o e-mail cadastrado | Simulado | ADV 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 01.04 | Retomar um convite ou etapa interrompida após autenticação | Simulado | ADV 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 01.05 | Bloquear tentativas abusivas sem revelar se um e-mail existe | Simulado | ADV 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 02.01 | Pesquisar e filtrar clientes | Simulado | ADV 02 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 02.02 | Abrir os processos de um cliente | Simulado | ADV 02 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 02.03 | Iniciar a criação de processo e convite | Simulado | ADV 02 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 02.04 | Abrir a fila de solicitações da IA | Simulado | ADV 02 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 02.05 | Abrir perfil e configurações | Simulado | ADV 02 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 02.06 | Manter posição, busca e filtro ao retornar | Simulado | ADV 02 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 03.01 | Abrir a conversa de um processo | Simulado | ADV 03 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 03.02 | Abrir detalhes e documentos do processo | Simulado | ADV 03 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 03.03 | Pesquisar e filtrar | Simulado | ADV 03 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 03.04 | Criar um novo processo para o mesmo cliente | Simulado | ADV 03 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 03.05 | Consultar processos concluídos em modo somente leitura | Simulado | ADV 03 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 04.01 | Validar campos obrigatórios | Simulado | ADV 04 · `src/components/cases.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 04.02 | Localizar conta pelo e-mail sem expor dados indevidos | Simulado | ADV 04 · `src/components/cases.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 04.03 | Criar o processo em estado Aguardando aceite | Simulado | ADV 04 · `src/components/cases.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 04.04 | Enviar convite ao aplicativo do cliente | Simulado | ADV 04 · `src/components/cases.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 04.05 | Exibir confirmação e permitir abrir Solicitações enviadas | Simulado | ADV 04 · `src/components/cases.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 04.06 | Cancelar antes do envio sem criar vínculo | Simulado | ADV 04 · `src/components/cases.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 05.01 | Abrir os detalhes da solicitação | Simulado | ADV 05 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 05.02 | Cancelar convite pendente | Simulado | ADV 05 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 05.03 | Enviar novo convite depois de expirado | Simulado | ADV 05 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 05.04 | Abrir o processo após aceite | Simulado | ADV 05 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 05.05 | Copiar o e-mail de destino | Simulado | ADV 05 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 06.01 | Ler e enviar mensagens | Simulado | ADV 06 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 06.02 | Abrir anexos | Simulado | ADV 06 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 06.03 | Assumir o atendimento e pausar a IA | Simulado | ADV 06 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 06.04 | Encerrar o atendimento humano | Simulado | ADV 06 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 06.05 | Receber rascunho e resumo da pergunta encaminhada pelo cliente | Simulado | ADV 06 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 06.06 | Abrir detalhes e documentos sem perder o rascunho | Simulado | ADV 06 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 06.07 | Concluir processo mediante confirmação | Simulado | ADV 06 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 07.01 | Pesquisar e ordenar solicitações | Simulado | ADV 07 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 07.02 | Abrir a conversa correta | Simulado | ADV 07 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 07.03 | Assumir atendimento | Simulado | ADV 07 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 07.04 | Marcar como resolvida após resposta | Simulado | ADV 07 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 07.05 | Manter sinalização até a resolução, mesmo que outro processo tenha mensagem mais recente | Simulado | ADV 07 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 08.01 | Editar os campos autorizados | Simulado | ADV 08 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 08.02 | Abrir conversa, andamentos e documentos | Simulado | ADV 08 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 08.03 | Administrar participantes quando autorizado | Bloqueado por decisão/integração | ADV 08 · `src/pages/Process.tsx` | Papéis e transferência de participantes ainda pendentes; gestão bloqueada. |
| ADV 08.04 | Concluir o processo mediante confirmação | Simulado | ADV 08 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 08.05 | Consultar vínculo e histórico básico | Simulado | ADV 08 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 08.06 | Copiar número do processo | Simulado | ADV 08 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 09.01 | Pesquisar cliente | Simulado | ADV 09 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 09.02 | Abrir a estrutura documental do cliente | Simulado | ADV 09 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 09.03 | Acessar clientes com processos concluídos para consulta | Simulado | ADV 09 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 09.04 | Iniciar envio manual de arquivo com destino obrigatório | Simulado | ADV 09 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 10.01 | Abrir documentos pessoais | Simulado | ADV 10 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 10.02 | Abrir categorias de um processo | Simulado | ADV 10 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 10.03 | Consultar arquivos de processo concluído | Simulado | ADV 10 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 10.04 | Enviar novo documento escolhendo o destino | Simulado | ADV 10 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 10.05 | Retornar mantendo a seleção do cliente | Simulado | ADV 10 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 11.01 | Abrir categoria | Simulado | ADV 11 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 11.02 | Criar ou selecionar categoria no envio | Simulado | ADV 11 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 11.03 | Pesquisar categoria | Simulado | ADV 11 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 11.04 | Mostrar Organização pendente quando a IA não classificar | Simulado | ADV 11 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 11.05 | Voltar para o contexto anterior | Simulado | ADV 11 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 12.01 | Abrir e baixar | Simulado | ADV 12 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 12.02 | Compartilhar com o cliente | Simulado | ADV 12 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 12.03 | Renomear | Simulado | ADV 12 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 12.04 | Mover para outra categoria | Simulado | ADV 12 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 12.05 | Excluir conforme política | Simulado | ADV 12 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 12.06 | Enviar nova versão | Simulado | ADV 12 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 12.07 | Adicionar documento | Simulado | ADV 12 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 13.01 | Navegar no documento | Simulado | ADV 13 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 13.02 | Baixar | Simulado | ADV 13 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 13.03 | Compartilhar com o cliente | Simulado | ADV 13 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 13.04 | Renomear, mover ou excluir | Simulado | ADV 13 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 13.05 | Abrir conversa ou resposta que citou o arquivo | Simulado | ADV 13 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 13.06 | Consultar histórico de versões quando disponível | Simulado | ADV 13 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 14.01 | Selecionar contexto | Simulado | ADV 14 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 14.02 | Perguntar e continuar conversa | Simulado | ADV 14 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 14.03 | Localizar e explicar informações de documentos | Parcial | ADV 14 · `src/pages/Assistant.tsx` | Consulta metadados autorizados e andamentos fictícios; não extrai nem analisa texto real de PDFs. |
| ADV 14.04 | Abrir o arquivo citado no trecho correspondente | Parcial | ADV 14 · `src/pages/Assistant.tsx` | Abre arquivo citado; não localiza trecho textual real ou página exata em PDF enviado. |
| ADV 14.05 | Interromper resposta | Simulado | ADV 14 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 14.06 | Iniciar nova conversa | Simulado | ADV 14 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 14.07 | Abrir histórico | Simulado | ADV 14 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 15.01 | Pesquisar | Simulado | ADV 15 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 15.02 | Abrir conversa mantendo o contexto original | Simulado | ADV 15 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 15.03 | Iniciar nova conversa | Simulado | ADV 15 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 15.04 | Renomear ou excluir histórico somente se a política for aprovada | Bloqueado por decisão/integração | ADV 15 · `src/pages/Assistant.tsx` | Renomear/excluir histórico depende da política de retenção; bloqueado. |
| ADV 16.01 | Editar dados permitidos | Simulado | ADV 16 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 16.02 | Acompanhar situação da verificação da OAB | Simulado | ADV 16 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 16.03 | Alterar senha e configurar segurança | Simulado | ADV 16 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 16.04 | Ativar ou desativar categorias de notificações | Simulado | ADV 16 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 16.05 | Abrir escritório e equipe | Simulado | ADV 16 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 16.06 | Solicitar suporte e cópia de dados | Simulado | ADV 16 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 16.07 | Sair da conta | Simulado | ADV 16 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 17.01 | Validar os dados obrigatórios | Simulado | ADV 17 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 17.02 | Verificar se o e-mail já possui conta | Simulado | ADV 17 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 17.03 | Criar cadastro ainda não habilitado profissionalmente | Simulado | ADV 17 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 17.04 | Enviar verificação de e-mail | Simulado | ADV 17 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 17.05 | Salvar o progresso permitido e continuar | Simulado | ADV 17 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 18.01 | Validar o formato da inscrição | Simulado | ADV 18 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 18.02 | Consultar duplicidade de OAB | Simulado | ADV 18 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 18.03 | Anexar comprovantes | Parcial | ADV 18 · `src/pages/Auth.tsx` | Comprovantes profissionais simulados por metadados; sem processamento/consulta real de OAB. |
| ADV 18.04 | Salvar dados profissionais | Simulado | ADV 18 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 18.05 | Enviar cadastro para verificação | Simulado | ADV 18 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 19.01 | Confirmar código | Simulado | ADV 19 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 19.02 | Reenviar após o intervalo permitido | Simulado | ADV 19 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 19.03 | Trocar o e-mail mediante validação | Simulado | ADV 19 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 19.04 | Retomar o fluxo após confirmação | Simulado | ADV 19 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 20.01 | Atualizar o estado da análise | Simulado | ADV 20 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 20.02 | Abrir os campos que exigem correção | Simulado | ADV 20 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 20.03 | Reenviar evidências | Parcial | ADV 20 · `src/pages/Account.tsx` | Reenvio registra metadados da evidência para nova análise simulada. |
| ADV 20.04 | Abrir suporte | Simulado | ADV 20 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 20.05 | Liberar funções profissionais após aprovação | Simulado | ADV 20 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 21.01 | Abrir o destino correto | Simulado | ADV 21 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 21.02 | Marcar como lida ao abrir | Simulado | ADV 21 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 21.03 | Marcar todas como lidas | Simulado | ADV 21 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 21.04 | Filtrar e atualizar a lista | Simulado | ADV 21 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 21.05 | Remover notificações locais conforme política | Bloqueado por decisão/integração | ADV 21 · `src/pages/Account.tsx` | Remoção de notificações aguarda política; central preserva eventos. |
| ADV 22.01 | Selecionar ou capturar arquivo | Simulado | ADV 22 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 22.02 | Validar formato e tamanho | Simulado | ADV 22 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 22.03 | Executar análise e sugerir categoria | Simulado | ADV 22 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 22.04 | Alterar destino ou categoria | Simulado | ADV 22 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 22.05 | Confirmar upload | Simulado | ADV 22 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 22.06 | Cancelar sem criar documento | Simulado | ADV 22 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 23.01 | Selecionar processo quando houver mais de um | Simulado | ADV 23 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 23.02 | Confirmar destinatário e versão | Simulado | ADV 23 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 23.03 | Compartilhar e registrar auditoria | Simulado | ADV 23 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 23.04 | Cancelar | Simulado | ADV 23 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 23.05 | Revogar acesso quando permitido | Simulado | ADV 23 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 24.01 | Abrir e baixar uma versão | Simulado | ADV 24 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 24.02 | Enviar nova versão | Simulado | ADV 24 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 24.03 | Comparar metadados | Simulado | ADV 24 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 24.04 | Consultar onde a versão foi citada | Simulado | ADV 24 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 24.05 | Restaurar versão apenas se a política permitir | Bloqueado por decisão/integração | ADV 24 · `src/pages/Documents.tsx` | Restauração bloqueada até definição da retenção de versões. |
| ADV 25.01 | Editar campos permitidos | Simulado | ADV 25 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 25.02 | Validar número e dados | Simulado | ADV 25 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 25.03 | Salvar alterações | Simulado | ADV 25 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 25.04 | Descartar mudanças | Simulado | ADV 25 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 25.05 | Consultar registro anterior | Simulado | ADV 25 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 26.01 | Consultar integrantes | Simulado | ADV 26 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 26.02 | Abrir conversas internas | Simulado | ADV 26 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 26.03 | Abrir processos em que participa | Simulado | ADV 26 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 26.04 | Iniciar convite de profissional quando autorizado | Bloqueado por decisão/integração | ADV 26 · `src/pages/Workspace.tsx` | Convite de integrante aguarda papéis e autorização do escritório. |
| ADV 26.05 | Consultar atividade recente do escritório | Simulado | ADV 26 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 27.01 | Pesquisar integrante | Simulado | ADV 27 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 27.02 | Abrir perfil profissional | Simulado | ADV 27 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 27.03 | Convidar advogado quando autorizado | Bloqueado por decisão/integração | ADV 27 · `src/pages/Workspace.tsx` | Convite de integrante aguarda política do escritório. |
| ADV 27.04 | Cancelar convite pendente | Bloqueado por decisão/integração | ADV 27 · `src/pages/Workspace.tsx` | Sem convites de equipe autorizados nesta versão; não há operação disponível. |
| ADV 27.05 | Remover integrante mediante confirmação e regra de transferência | Bloqueado por decisão/integração | ADV 27 · `src/pages/Workspace.tsx` | Remoção bloqueada até regra de transferência e responsável mínimo. |
| ADV 28.01 | Alterar senha | Simulado | ADV 28 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 28.02 | Ativar ou desativar autenticação adicional | Simulado | ADV 28 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 28.03 | Revogar uma sessão | Simulado | ADV 28 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 28.04 | Encerrar todas as outras sessões | Simulado | ADV 28 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 28.05 | Reautenticar antes de ação sensível | Simulado | ADV 28 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 29.01 | Registrar preferências opcionais | Simulado | ADV 29 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 29.02 | Solicitar exportação | Simulado | ADV 29 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 29.03 | Solicitar exclusão da conta | Simulado | ADV 29 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 29.04 | Acompanhar pedido | Simulado | ADV 29 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 29.05 | Cancelar pedido quando permitido | Simulado | ADV 29 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 30.01 | Pesquisar artigos | Simulado | ADV 30 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 30.02 | Criar chamado com descrição e anexo | Simulado | ADV 30 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 30.03 | Consultar respostas | Simulado | ADV 30 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 30.04 | Responder ao chamado | Simulado | ADV 30 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 30.05 | Encerrar atendimento | Simulado | ADV 30 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 30.06 | Reabrir conforme política | Simulado | ADV 30 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 31.01 | Enviar e receber mensagens | Simulado | ADV 31 · `src/pages/Internal.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 31.02 | Anexar documento interno | Simulado | ADV 31 · `src/pages/Internal.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 31.03 | Responder a mensagem específica | Simulado | ADV 31 · `src/pages/Internal.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 31.04 | Abrir processo relacionado | Simulado | ADV 31 · `src/pages/Internal.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 31.05 | Adicionar participante quando autorizado | Bloqueado por decisão/integração | ADV 31 · `src/pages/Internal.tsx` | Adicionar participante bloqueado até autorização interna aprovada. |
| ADV 31.06 | Consultar histórico | Simulado | ADV 31 · `src/pages/Internal.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 32.01 | Enviar mensagens e anexos | Simulado | ADV 32 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 32.02 | Consultar participantes | Simulado | ADV 32 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 32.03 | Adicionar ou remover participante quando autorizado | Bloqueado por decisão/integração | ADV 32 · `src/pages/Process.tsx` | Alterar participantes bloqueado até matriz interna aprovada. |
| ADV 32.04 | Assumir atendimento | Simulado | ADV 32 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 32.05 | Encerrar atendimento humano | Simulado | ADV 32 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 32.06 | Abrir documentos e dados do processo | Simulado | ADV 32 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 33.01 | Adicionar atualização | Simulado | ADV 33 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 33.02 | Editar informação permitida | Simulado | ADV 33 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 33.03 | Relacionar documento | Simulado | ADV 33 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 33.04 | Definir visibilidade | Simulado | ADV 33 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 33.05 | Publicar para o cliente | Simulado | ADV 33 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADV 33.06 | Consultar histórico de alterações | Simulado | ADV 33 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 01.01 | Autenticar e abrir Processos | Simulado | CLI 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 01.02 | Criar conta sem exigir OAB ou cobrança | Simulado | CLI 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 01.03 | Recuperar senha | Simulado | CLI 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 01.04 | Retomar o detalhe do convite após autenticação | Simulado | CLI 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 01.05 | Manter conta mesmo sem processo ativo | Simulado | CLI 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 02.01 | Pesquisar e filtrar | Simulado | CLI 02 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 02.02 | Abrir conversa | Simulado | CLI 02 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 02.03 | Abrir convites | Simulado | CLI 02 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 02.04 | Abrir perfil | Simulado | CLI 02 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 02.05 | Consultar processos concluídos | Simulado | CLI 02 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 02.06 | Manter busca e posição ao retornar | Simulado | CLI 02 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 03.01 | Abrir detalhe | Simulado | CLI 03 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 03.02 | Consultar convites aceitos, recusados, cancelados e expirados | Simulado | CLI 03 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 03.03 | Atualizar a lista | Simulado | CLI 03 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 03.04 | Voltar sem alterar o convite | Simulado | CLI 03 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 04.01 | Aceitar e liberar o processo | Simulado | CLI 04 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 04.02 | Recusar após confirmação | Simulado | CLI 04 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 04.03 | Abrir perfil profissional quando permitido | Simulado | CLI 04 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 04.04 | Orientar troca de conta quando o e-mail não corresponder | Simulado | CLI 04 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 05.01 | Enviar texto e anexos | Simulado | CLI 05 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 05.02 | Reproduzir mídia e abrir documentos | Simulado | CLI 05 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 05.03 | Continuar escrevendo enquanto aguarda o advogado | Simulado | CLI 05 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 05.04 | Abrir detalhes e documentos | Simulado | CLI 05 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 05.05 | Preservar rascunho ao navegar | Simulado | CLI 05 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 05.06 | Consultar histórico concluído | Simulado | CLI 05 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 06.01 | Copiar número | Simulado | CLI 06 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 06.02 | Abrir conversa | Simulado | CLI 06 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 06.03 | Consultar andamentos manuais publicados | Simulado | CLI 06 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 06.04 | Abrir documentos do processo | Simulado | CLI 06 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 06.05 | Abrir perfil dos responsáveis | Simulado | CLI 06 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 07.01 | Copiar telefone e e-mail | Simulado | CLI 07 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 07.02 | Abrir aplicativo externo de telefone ou e-mail quando permitido | Simulado | CLI 07 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 07.03 | Voltar ao processo ou convite | Simulado | CLI 07 · `src/pages/Process.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 08.01 | Abrir documentos pessoais | Simulado | CLI 08 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 08.02 | Abrir categorias de um processo | Simulado | CLI 08 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 08.03 | Responder a solicitação de documento | Simulado | CLI 08 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 08.04 | Iniciar envio escolhendo destino | Simulado | CLI 08 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 08.05 | Consultar processos concluídos | Simulado | CLI 08 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 09.01 | Abrir categoria | Simulado | CLI 09 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 09.02 | Pesquisar | Simulado | CLI 09 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 09.03 | Iniciar envio para o processo | Simulado | CLI 09 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 09.04 | Voltar para a lista de documentos | Simulado | CLI 09 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 10.01 | Abrir e baixar | Simulado | CLI 10 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 10.02 | Enviar para outro processo | Simulado | CLI 10 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 10.03 | Enviar nova versão | Simulado | CLI 10 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 10.04 | Solicitar exclusão | Simulado | CLI 10 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 10.05 | Adicionar novo documento quando habilitado | Simulado | CLI 10 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 11.01 | Navegar e ampliar | Simulado | CLI 11 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 11.02 | Baixar | Simulado | CLI 11 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 11.03 | Enviar para outro processo | Simulado | CLI 11 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 11.04 | Enviar nova versão quando permitido | Simulado | CLI 11 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 11.05 | Solicitar exclusão | Simulado | CLI 11 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 11.06 | Voltar ao chat ou à lista de origem | Simulado | CLI 11 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 12.01 | Perguntar sobre termos e funcionamento geral | Simulado | CLI 12 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 12.02 | Pesquisar legislação dentro do escopo aprovado | Bloqueado por decisão/integração | CLI 12 · `src/pages/Assistant.tsx` | Pesquisa legislativa e elaboração jurídica não têm escopo aprovado; não executadas. |
| CLI 12.03 | Selecionar processo para consultar dados do caso | Simulado | CLI 12 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 12.04 | Continuar conversa | Simulado | CLI 12 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 12.05 | Interromper resposta | Simulado | CLI 12 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 12.06 | Encaminhar pergunta confirmada | Simulado | CLI 12 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 12.07 | Abrir histórico | Simulado | CLI 12 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 13.01 | Pesquisar | Simulado | CLI 13 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 13.02 | Abrir mantendo contexto original | Simulado | CLI 13 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 13.03 | Iniciar nova conversa | Simulado | CLI 13 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 13.04 | Voltar ao assistente | Simulado | CLI 13 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 14.01 | Abrir o destino correto | Simulado | CLI 14 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 14.02 | Marcar como lida | Simulado | CLI 14 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 14.03 | Atualizar lista | Simulado | CLI 14 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 14.04 | Respeitar categorias desativadas pelo usuário | Simulado | CLI 14 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 15.01 | Editar dados permitidos | Simulado | CLI 15 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 15.02 | Alterar senha e segurança | Simulado | CLI 15 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 15.03 | Ativar ou desativar categorias de notificações | Simulado | CLI 15 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 15.04 | Consultar explicação sobre IA e dados | Simulado | CLI 15 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 15.05 | Abrir suporte | Simulado | CLI 15 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 15.06 | Solicitar cópia ou exclusão conforme processo administrativo | Simulado | CLI 15 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 15.07 | Sair | Simulado | CLI 15 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 16.01 | Selecionar PDF, imagem, vídeo ou áudio permitido | Simulado | CLI 16 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 16.02 | Escolher processo quando o fluxo começou em Documentos | Simulado | CLI 16 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 16.03 | Usar destino preenchido quando começou no chat | Simulado | CLI 16 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 16.04 | Confirmar ou cancelar | Simulado | CLI 16 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 16.05 | Tentar novamente após falha | Simulado | CLI 16 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 17.01 | Selecionar destino | Simulado | CLI 17 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 17.02 | Confirmar o arquivo e responsável | Simulado | CLI 17 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 17.03 | Enviar somente o documento escolhido | Simulado | CLI 17 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 17.04 | Cancelar antes do compartilhamento | Simulado | CLI 17 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 18.01 | Selecionar nova versão | Simulado | CLI 18 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 18.02 | Conferir destino | Simulado | CLI 18 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 18.03 | Confirmar atualização | Simulado | CLI 18 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 18.04 | Cancelar | Simulado | CLI 18 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 18.05 | Tentar novamente | Simulado | CLI 18 · `src/components/documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 19.01 | Enviar solicitação | Simulado | CLI 19 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 19.02 | Cancelar | Simulado | CLI 19 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 19.03 | Consultar confirmação e situação do pedido | Simulado | CLI 19 · `src/pages/Documents.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 20.01 | Selecionar destino | Simulado | CLI 20 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 20.02 | Gerar e revisar prévia | Simulado | CLI 20 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 20.03 | Confirmar envio | Simulado | CLI 20 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 20.04 | Voltar sem enviar | Simulado | CLI 20 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 20.05 | Abrir conversa após conclusão | Simulado | CLI 20 · `src/pages/Assistant.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 21.01 | Validar dados | Simulado | CLI 21 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 21.02 | Criar conta | Simulado | CLI 21 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 21.03 | Enviar verificação de e-mail | Simulado | CLI 21 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 21.04 | Retomar convite compatível | Simulado | CLI 21 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 21.05 | Continuar para completar perfil | Simulado | CLI 21 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 22.01 | Confirmar código | Simulado | CLI 22 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 22.02 | Reenviar | Simulado | CLI 22 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 22.03 | Trocar e-mail | Simulado | CLI 22 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 22.04 | Retomar convite após confirmação | Simulado | CLI 22 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 23.01 | Ativar ou desativar categoria | Simulado | CLI 23 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 23.02 | Salvar preferências | Simulado | CLI 23 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 23.03 | Restaurar padrão | Simulado | CLI 23 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 23.04 | Solicitar permissão do sistema operacional | Bloqueado por decisão/integração | CLI 23 · `src/pages/Account.tsx` | Push/SO indisponível; preferências e central internas estão funcionais. |
| CLI 24.01 | Alterar senha | Simulado | CLI 24 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 24.02 | Revogar sessão | Simulado | CLI 24 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 24.03 | Encerrar outras sessões | Simulado | CLI 24 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 24.04 | Ativar proteção adicional | Simulado | CLI 24 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 24.05 | Reautenticar | Simulado | CLI 24 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 25.01 | Consultar explicações | Simulado | CLI 25 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 25.02 | Alterar preferências opcionais | Simulado | CLI 25 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 25.03 | Abrir política de privacidade | Simulado | CLI 25 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 25.04 | Iniciar exportação ou exclusão | Simulado | CLI 25 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 26.01 | Solicitar exportação | Simulado | CLI 26 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 26.02 | Confirmar identidade | Simulado | CLI 26 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 26.03 | Solicitar exclusão | Simulado | CLI 26 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 26.04 | Cancelar pedido permitido | Simulado | CLI 26 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 26.05 | Baixar pacote quando pronto | Simulado | CLI 26 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 27.01 | Pesquisar artigos | Simulado | CLI 27 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 27.02 | Criar chamado | Simulado | CLI 27 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 27.03 | Anexar evidência técnica | Simulado | CLI 27 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 27.04 | Consultar e responder | Simulado | CLI 27 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 27.05 | Encerrar atendimento | Simulado | CLI 27 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 28.01 | Consultar processos antigos | Simulado | CLI 28 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 28.02 | Aceitar novo convite | Simulado | CLI 28 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 28.03 | Acessar documentos permitidos | Simulado | CLI 28 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 28.04 | Abrir perfil e suporte | Simulado | CLI 28 · `src/pages/Workspace.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 29.01 | Consultar detalhes | Simulado | CLI 29 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 29.02 | Cancelar enquanto permitido | Simulado | CLI 29 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 29.03 | Enviar complemento | Simulado | CLI 29 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 29.04 | Abrir documento quando disponível | Simulado | CLI 29 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| CLI 29.05 | Criar nova solicitação | Simulado | CLI 29 · `src/pages/Account.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 01.01 | Verificar sessão | Simulado | SYS 01 · `src/App.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 01.02 | Carregar perfil e permissões | Simulado | SYS 01 · `src/App.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 01.03 | Identificar convite ou notificação de origem | Parcial | SYS 01 · `src/App.tsx` | Retorno por URL e notificações internas; sem universal/deep links nativos. |
| SYS 01.04 | Direcionar para autenticação ou página correta | Simulado | SYS 01 · `src/App.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 02.01 | Ler e pesquisar | Parcial | SYS 02 · `src/pages/System.tsx` | Conteúdo demonstrativo; documento jurídico vigente não foi fornecido. |
| SYS 02.02 | Baixar cópia | Parcial | SYS 02 · `src/pages/System.tsx` | Download do texto demonstrativo, não de termos jurídicos aprovados. |
| SYS 02.03 | Registrar aceite | Parcial | SYS 02 · `src/pages/System.tsx` | Ciência demonstrativa auditada; aceite jurídico definitivo depende de termos aprovados. |
| SYS 02.04 | Recusar e sair quando o aceite for obrigatório | Parcial | SYS 02 · `src/pages/System.tsx` | Recusar encerra a sessão; bloqueio por versão jurídica exige documento aprovado. |
| SYS 03.01 | Pesquisar conteúdo | Parcial | SYS 03 · `src/pages/System.tsx` | Pesquisa em explicações de demonstração, sem política jurídica publicada. |
| SYS 03.02 | Baixar cópia | Parcial | SYS 03 · `src/pages/System.tsx` | Download do texto explicativo; política definitiva pendente. |
| SYS 03.03 | Abrir canal de privacidade | Simulado | SYS 03 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 03.04 | Voltar para a página anterior | Simulado | SYS 03 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 04.01 | Confirmar ciência | Simulado | SYS 04 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 04.02 | Abrir detalhes de privacidade | Simulado | SYS 04 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 04.03 | Continuar ou cancelar a função | Simulado | SYS 04 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 04.04 | Revisar consentimento quando aplicável | Simulado | SYS 04 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 05.01 | Limpar dados sensíveis da tela | Simulado | SYS 05 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 05.02 | Preservar rascunho local seguro quando permitido | Parcial | SYS 05 · `src/pages/System.tsx` | Rascunhos locais por conta/processo; sem armazenamento seguro de produção. |
| SYS 05.03 | Autenticar novamente | Simulado | SYS 05 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 05.04 | Retomar o destino autorizado | Parcial | SYS 05 · `src/pages/System.tsx` | Retomada usa rotas autorizadas; não há tokens nem expiração de servidor. |
| SYS 06.01 | Tentar reconectar | Simulado | SYS 06 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 06.02 | Manter rascunhos | Simulado | SYS 06 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 06.03 | Reenviar itens seguros após confirmação | Simulado | SYS 06 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 06.04 | Cancelar upload pendente | Simulado | SYS 06 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 07.01 | Atualizar estado | Parcial | SYS 07 · `src/pages/System.tsx` | Estado de manutenção demonstrativo, sem serviço remoto de status. |
| SYS 07.02 | Tentar novamente | Simulado | SYS 07 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 07.03 | Abrir canal de suporte | Simulado | SYS 07 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 07.04 | Sair com segurança | Simulado | SYS 07 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 08.01 | Abrir a loja oficial | Bloqueado por decisão/integração | SYS 08 · `src/pages/System.tsx` | Projeto web local sem aplicativo/loja oficial fornecida; não inventar URL. |
| SYS 08.02 | Verificar novamente a versão | Parcial | SYS 08 · `src/pages/System.tsx` | Sem mecanismo nativo de versão mínima; orientações da versão web. |
| SYS 08.03 | Exibir instruções alternativas | Parcial | SYS 08 · `src/pages/System.tsx` | Orientações para recarregar a versão web; sem distribuição em loja. |
| SYS 09.01 | Retornar com segurança | Simulado | SYS 09 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 09.02 | Ir para página inicial | Simulado | SYS 09 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 09.03 | Abrir suporte | Simulado | SYS 09 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| SYS 09.04 | Atualizar permissão e tentar novamente | Simulado | SYS 09 · `src/pages/System.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 01.01 | Autenticar | Simulado | ADM 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 01.02 | Exigir fator adicional | Simulado | ADM 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 01.03 | Recuperar acesso por fluxo interno | Bloqueado por decisão/integração | ADM 01 · `src/pages/Auth.tsx` | Recuperação administrativa real depende de fluxo interno aprovado e serviço externo. |
| ADM 01.04 | Bloquear tentativas abusivas | Simulado | ADM 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 01.05 | Registrar acesso | Simulado | ADM 01 · `src/pages/Auth.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 02.01 | Filtrar por período e situação | Simulado | ADM 02 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 02.02 | Abrir fila correspondente | Simulado | ADM 02 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 02.03 | Atualizar indicadores | Simulado | ADM 02 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 02.04 | Exportar relatório permitido | Simulado | ADM 02 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 03.01 | Pesquisar e filtrar | Simulado | ADM 03 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 03.02 | Atribuir análise | Simulado | ADM 03 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 03.03 | Abrir cadastro | Simulado | ADM 03 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 03.04 | Marcar possível duplicidade | Simulado | ADM 03 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 03.05 | Atualizar fila | Simulado | ADM 03 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 04.01 | Validar evidências | Parcial | ADM 04 · `src/pages/Admin.tsx` | Análise de evidências fictícias/metadados; sem verificação real da OAB. |
| ADM 04.02 | Solicitar correção | Simulado | ADM 04 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 04.03 | Aprovar | Simulado | ADM 04 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 04.04 | Rejeitar | Simulado | ADM 04 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 04.05 | Registrar nota interna | Simulado | ADM 04 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 04.06 | Concluir análise | Simulado | ADM 04 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 05.01 | Pesquisar e filtrar | Simulado | ADM 05 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 05.02 | Abrir conta | Simulado | ADM 05 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 05.03 | Suspender preventivamente quando autorizado | Simulado | ADM 05 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 05.04 | Iniciar recuperação assistida | Bloqueado por decisão/integração | ADM 05 · `src/pages/Admin.tsx` | Recuperação assistida por e-mail está desabilitada com explicação. |
| ADM 05.05 | Exportar lista limitada | Simulado | ADM 05 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 06.01 | Atualizar estado permitido | Simulado | ADM 06 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 06.02 | Reenviar verificação | Simulado | ADM 06 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 06.03 | Suspender ou reativar com justificativa | Simulado | ADM 06 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 06.04 | Abrir escritório, chamado ou auditoria | Simulado | ADM 06 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 06.05 | Registrar nota interna | Simulado | ADM 06 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 07.01 | Pesquisar por identificador | Simulado | ADM 07 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 07.02 | Consultar histórico do vínculo | Simulado | ADM 07 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 07.03 | Invalidar convite comprometido | Simulado | ADM 07 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 07.04 | Corrigir estado técnico mediante procedimento | Bloqueado por decisão/integração | ADM 07 · `src/pages/Admin.tsx` | Correção técnica de vínculos bloqueada sem procedimento aprovado. |
| ADM 07.05 | Abrir auditoria | Simulado | ADM 07 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 08.01 | Cadastrar conta administrativa individual | Simulado | ADM 08 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 08.02 | Ativar ou desativar acesso | Simulado | ADM 08 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 08.03 | Redefinir proteção por fluxo seguro | Parcial | ADM 08 · `src/pages/Admin.tsx` | Redefinição simulada mantém MFA e revoga sessões; não implementa recuperação segura real. |
| ADM 08.04 | Consultar ações realizadas | Simulado | ADM 08 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 08.05 | Encerrar sessões administrativas | Simulado | ADM 08 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 09.01 | Pesquisar e filtrar | Simulado | ADM 09 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 09.02 | Atribuir responsável | Simulado | ADM 09 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 09.03 | Alterar prioridade com motivo | Simulado | ADM 09 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 09.04 | Abrir chamado | Simulado | ADM 09 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 09.05 | Responder em lote apenas quando seguro | Bloqueado por decisão/integração | ADM 09 · `src/pages/Admin.tsx` | Operações em lote não disponibilizadas; atendimento individual com auditoria. |
| ADM 10.01 | Responder | Simulado | ADM 10 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 10.02 | Solicitar informação | Simulado | ADM 10 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 10.03 | Adicionar nota interna | Simulado | ADM 10 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 10.04 | Escalar | Simulado | ADM 10 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 10.05 | Vincular incidente | Simulado | ADM 10 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 10.06 | Resolver e reabrir | Simulado | ADM 10 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 11.01 | Pesquisar por identificador técnico | Simulado | ADM 11 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 11.02 | Reprocessar arquivo seguro | Simulado | ADM 11 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 11.03 | Isolar arquivo suspeito | Simulado | ADM 11 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 11.04 | Restaurar disponibilidade autorizada | Simulado | ADM 11 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 11.05 | Gerar relatório | Simulado | ADM 11 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 12.01 | Pesquisar e combinar filtros | Simulado | ADM 12 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 12.02 | Abrir evento | Simulado | ADM 12 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 12.03 | Exportar conjunto autorizado | Simulado | ADM 12 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 12.04 | Preservar evidência | Simulado | ADM 12 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 12.05 | Vincular evento a incidente | Simulado | ADM 12 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 13.01 | Criar incidente | Simulado | ADM 13 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 13.02 | Classificar gravidade | Simulado | ADM 13 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 13.03 | Atribuir responsáveis | Simulado | ADM 13 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 13.04 | Registrar contenção | Simulado | ADM 13 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 13.05 | Vincular logs e chamados | Simulado | ADM 13 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 13.06 | Encerrar com revisão | Simulado | ADM 13 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 14.01 | Validar pedido | Simulado | ADM 14 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 14.02 | Solicitar informação | Simulado | ADM 14 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 14.03 | Localizar dados | Simulado | ADM 14 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 14.04 | Aprovar, cumprir ou recusar com fundamento | Parcial | ADM 14 · `src/pages/Admin.tsx` | Exportação demonstrativa e recusa fundamentada; exclusão definitiva aguarda retenção. |
| ADM 14.05 | Gerar resposta e evidência | Simulado | ADM 14 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 15.01 | Criar rascunho de política | Simulado | ADM 15 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 15.02 | Simular exemplos | Simulado | ADM 15 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 15.03 | Submeter para aprovação | Simulado | ADM 15 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 15.04 | Publicar versão | Simulado | ADM 15 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 15.05 | Reverter para versão segura | Simulado | ADM 15 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 15.06 | Consultar histórico | Simulado | ADM 15 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 16.01 | Analisar indicador | Simulado | ADM 16 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 16.02 | Abrir caso autorizado | Parcial | ADM 16 · `src/pages/Admin.tsx` | Amostras limitadas a metadados operacionais; nenhum conteúdo particular exposto. |
| ADM 16.03 | Classificar falha | Simulado | ADM 16 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 16.04 | Encaminhar correção | Simulado | ADM 16 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 16.05 | Suspender função em incidente | Simulado | ADM 16 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 16.06 | Gerar relatório | Simulado | ADM 16 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 17.01 | Criar categoria | Simulado | ADM 17 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 17.02 | Editar nome e descrição | Simulado | ADM 17 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 17.03 | Adicionar sinônimos | Simulado | ADM 17 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 17.04 | Desativar sem apagar arquivos | Simulado | ADM 17 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 17.05 | Testar classificação | Simulado | ADM 17 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| ADM 17.06 | Publicar alteração | Simulado | ADM 17 · `src/pages/Admin.tsx` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| GER 01 | Isolamento de dadosO sistema deve aplicar permissões no servidor para impedir acesso entre clientes, processos e advogados sem vínculo autorizado. | Parcial | GER 01 · `src/domain/permissions.ts; src/domain/actions.ts; src/components; src/store` | Permissões locais nas rotas e operações; isolamento no servidor exige backend futuro. |
| GER 02 | Identificação da IAToda mensagem automática deve ser identificada como Assistente IA. Mensagens humanas devem mostrar o profissional responsável. | Simulado | GER 02 · `src/domain/permissions.ts; src/domain/actions.ts; src/components; src/store` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| GER 03 | ResponsividadeAs mesmas funções devem existir no celular e no computador. O computador pode usar painéis lado a lado sem criar funções exclusivas. | Simulado | GER 03 · `src/domain/permissions.ts; src/domain/actions.ts; src/components; src/store` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| GER 04 | AcessibilidadeControles devem possuir rótulos, área de toque adequada, contraste e estados que não dependam somente de cor. | Simulado | GER 04 · `src/domain/permissions.ts; src/domain/actions.ts; src/components; src/store` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| GER 05 | Rascunhos e retornoBusca, filtro, posição da lista e texto ainda não enviado devem ser preservados quando o usuário abre uma página relacionada e retorna. | Simulado | GER 05 · `src/domain/permissions.ts; src/domain/actions.ts; src/components; src/store` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| GER 06 | NotificaçõesCada notificação deve abrir o convite, conversa, documento ou processo correto e refletir o estado atual do item. | Simulado | GER 06 · `src/domain/permissions.ts; src/domain/actions.ts; src/components; src/store` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| GER 07 | AuditoriaO sistema deve registrar acessos, compartilhamentos, alterações, versões, respostas da IA e intervenções humanas necessárias à investigação. | Simulado | GER 07 · `src/domain/permissions.ts; src/domain/actions.ts; src/components; src/store` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| GER 08 | FalhasPáginas devem tratar carregamento, ausência de dados, busca sem resultado, falta de conexão, nova tentativa e indisponibilidade de arquivo. | Simulado | GER 08 · `src/domain/permissions.ts; src/domain/actions.ts; src/components; src/store` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| GER 09 | Privacidade do assistenteO histórico particular do cliente não pode ser exibido ao advogado nem enviado sem confirmação explícita do conteúdo escolhido. | Simulado | GER 09 · `src/domain/permissions.ts; src/domain/actions.ts; src/components; src/store` | Dados fictícios persistidos; permissões locais e navegação integrada. |
| GER 10 | Processo concluídoConclusão deve bloquear novas mensagens e anexos no processo, mantendo histórico e documentos disponíveis conforme a política de retenção. | Simulado | GER 10 · `src/domain/permissions.ts; src/domain/actions.ts; src/components; src/store` | Dados fictícios persistidos; permissões locais e navegação integrada. |

## Validação

Os comandos e evidências finais estão em `VALIDATION.md`. Testes de regras em `src/domain/rules.test.ts`; testes de navegador em `e2e/`. O checklist registra cobertura e limites por requisito; testes automatizados cobrem fluxos críticos e não certificam integralmente todos os estados de todas as 88 etapas.

## Continuidade

Preservar os módulos existentes ao integrar backend. Substituir armazenamento, sessão e serviços simulados por contratos autenticados, autorizações no servidor, auditoria imutável e armazenamento de arquivos apropriado. Resolver as decisões pendentes antes de habilitar os controles correspondentes.
