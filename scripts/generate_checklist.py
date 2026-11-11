"""Regenera o inventário rastreável a partir da extração do Word, sem alterar a fonte."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent
lines = (ROOT / 'requirements-source.txt').read_text(encoding='utf-8').splitlines()
pages = list(dict.fromkeys((line, lines[i+1]) for i, line in enumerate(lines)
                          if re.fullmatch(r'(ADV|CLI|SYS|ADM) \d{2}', line)))
requirements = [line for line in lines if re.match(r'^(ADV|CLI|SYS|ADM) \d{2}\.\d{2} ', line) or re.match(r'^GER \d{2}', line)]

adv = [
 ('Auth.tsx','/login','Acesso e recuperação simulados'),
 ('Workspace.tsx','/advogado/clientes','Lista de clientes'),
 ('Workspace.tsx','/advogado/clientes/:clienteId','Processos do cliente'),
 ('../components/cases.tsx','/advogado/processos','Modal Novo processo'),
 ('Workspace.tsx','/advogado/convites','Lista e detalhe em modal'),
 ('Process.tsx','/advogado/processos/:id/conversa','Conversa oficial'),
 ('Workspace.tsx','/advogado/solicitacoes','Fila persistente da IA'),
 ('Process.tsx','/advogado/processos/:id/dados','Dados e participantes'),
 ('Documents.tsx','/advogado/documentos','Seletor Documentos por cliente'),
 ('Documents.tsx','/advogado/documentos/clientes/:id','Biblioteca autorizada do cliente'),
 ('Documents.tsx','/advogado/documentos','Categorias como filtros'),
 ('Documents.tsx','/advogado/documentos','Arquivos filtrados e menu de ações'),
 ('../components/documents.tsx','/advogado/documentos?arquivo=:id','Visualizador em diálogo'),
 ('Assistant.tsx','/advogado/assistente','Assistente profissional'),
 ('Assistant.tsx','/advogado/assistente','Modal Histórico'),
 ('Account.tsx','/advogado/configuracoes','Perfil e abas'),
 ('Auth.tsx','/login','Criar conta → Advogado'),
 ('Auth.tsx','/login','Dados profissionais no cadastro'),
 ('Auth.tsx','/login','Confirmação de e-mail demonstrativa'),
 ('Account.tsx','/advogado/verificacao','Estado e reenvio para análise'),
 ('Account.tsx','/advogado/notificacoes','Central por conta'),
 ('../components/documents.tsx','/advogado/documentos','Modal Enviar documento'),
 ('../components/documents.tsx','/advogado/documentos','Modal Compartilhar'),
 ('Documents.tsx','/advogado/documentos','Modal Histórico de versões'),
 ('Process.tsx','/advogado/processos/:id/dados','Modal Editar processo'),
 ('Workspace.tsx','/advogado/escritorio','Escritório, processos e atividade'),
 ('Workspace.tsx','/advogado/escritorio/membros','Lista e perfil do integrante'),
 ('Account.tsx','/advogado/seguranca','Senha, fator e sessão fictícia'),
 ('Account.tsx','/advogado/privacidade','Preferências e pedidos'),
 ('Account.tsx','/advogado/ajuda','FAQ e chamados integrados'),
 ('Internal.tsx','/advogado/conversas-internas','Conversas e anexos reservados'),
 ('Process.tsx','/advogado/processos/:id/grupo','Variação da conversa com múltiplos autores'),
 ('Process.tsx','/advogado/processos/:id/andamentos','Linha do tempo e modal de edição'),
]
cli = [
 ('Auth.tsx','/login','Acesso → Cliente'),
 ('Workspace.tsx','/cliente/processos','Lista, busca e filtros'),
 ('Workspace.tsx','/cliente/convites','Lista de convites'),
 ('Workspace.tsx','/cliente/convites/:id','Detalhe em modal'),
 ('Process.tsx','/cliente/processos/:id/conversa','Conversa oficial'),
 ('Process.tsx','/cliente/processos/:id/dados','Dados públicos e participantes'),
 ('Process.tsx','/cliente/processos/:id/dados','Perfil profissional no diálogo Participantes'),
 ('Documents.tsx','/cliente/documentos','Biblioteca e solicitações de arquivo'),
 ('Documents.tsx','/cliente/documentos','Categorias por contexto'),
 ('Documents.tsx','/cliente/documentos','Arquivos e menus autorizados'),
 ('../components/documents.tsx','/cliente/documentos?arquivo=:id','Visualizador'),
 ('Assistant.tsx','/cliente/assistente','Assistente particular'),
 ('Assistant.tsx','/cliente/assistente','Modal Histórico'),
 ('Account.tsx','/cliente/notificacoes','Central por conta'),
 ('Account.tsx','/cliente/configuracoes','Perfil e configurações'),
 ('../components/documents.tsx','/cliente/documentos','Modal Enviar documento'),
 ('../components/documents.tsx','/cliente/documentos','Modal Compartilhar arquivo'),
 ('../components/documents.tsx','/cliente/documentos','Modal Nova versão'),
 ('Documents.tsx','/cliente/documentos','Modal Solicitar exclusão'),
 ('Assistant.tsx','/cliente/assistente','Prévia e confirmação de encaminhamento'),
 ('Auth.tsx','/login','Cadastro → Cliente'),
 ('Auth.tsx','/login','Código demonstrativo e reenvio'),
 ('Account.tsx','/cliente/preferencias','Preferências internas'),
 ('Account.tsx','/cliente/seguranca','Credenciais e sessão fictícia'),
 ('Account.tsx','/cliente/privacidade','Privacidade e IA'),
 ('Account.tsx','/cliente/privacidade','Pedidos e download de exportação autorizada'),
 ('Account.tsx','/cliente/ajuda','FAQ e chamados'),
 ('Workspace.tsx','/cliente/inicio','Estado vazio; assistente bloqueado sem vínculo'),
 ('Account.tsx','/cliente/solicitacoes-documentos','Pedidos, complementos e cancelamento'),
]
sys = [
 ('../App.tsx','/','Redirecionamento e proteção por sessão'),
 ('System.tsx','/sistema/termos','Texto explicativo de demonstração'),
 ('System.tsx','/sistema/privacidade','Texto explicativo de demonstração'),
 ('System.tsx','/sistema/transparencia','Ciência, limites e privacidade'),
 ('System.tsx','/sistema/sessao-expirada','Encerramento e retorno ao acesso'),
 ('System.tsx','/sistema/sem-conexao','Estado offline; reenvio no chat'),
 ('System.tsx','/sistema/manutencao','Estado demonstrativo, sem previsão inventada'),
 ('System.tsx','/sistema/atualizacao','Instruções da versão web'),
 ('System.tsx','/sistema/acesso-negado','Recurso indisponível sem expor existência'),
]
adm_paths=['login','','oab','oab','usuarios','usuarios','processos','administradores','suporte','suporte','armazenamento','auditoria','incidentes','privacidade','ia','monitoramento','categorias']
adm=[('Auth.tsx' if i==0 else 'Admin.tsx','/login' if i==0 else '/administracao'+('/'+path if path else ''),'Acesso administrativo' if i==0 else 'Lista, indicadores ou detalhe em diálogo') for i,path in enumerate(adm_paths)]
mapping={f'{prefix} {i:02}':value for prefix,group in [('ADV',adv),('CLI',cli),('SYS',sys),('ADM',adm)] for i,value in enumerate(group,1)}

blocked = {
 'ADV 08.03':'Papéis e transferência de participantes ainda pendentes; gestão bloqueada.',
 'ADV 15.04':'Renomear/excluir histórico depende da política de retenção; bloqueado.',
 'ADV 21.05':'Remoção de notificações aguarda política; central preserva eventos.',
 'ADV 24.05':'Restauração bloqueada até definição da retenção de versões.',
 'ADV 26.04':'Convite de integrante aguarda papéis e autorização do escritório.',
 'ADV 27.03':'Convite de integrante aguarda política do escritório.',
 'ADV 27.04':'Sem convites de equipe autorizados nesta versão; não há operação disponível.',
 'ADV 27.05':'Remoção bloqueada até regra de transferência e responsável mínimo.',
 'ADV 31.05':'Adicionar participante bloqueado até autorização interna aprovada.',
 'ADV 32.03':'Alterar participantes bloqueado até matriz interna aprovada.',
 'CLI 12.02':'Pesquisa legislativa e elaboração jurídica não têm escopo aprovado; não executadas.',
 'CLI 23.04':'Push/SO indisponível; preferências e central internas estão funcionais.',
 'SYS 08.01':'Projeto web local sem aplicativo/loja oficial fornecida; não inventar URL.',
 'ADM 01.03':'Recuperação administrativa real depende de fluxo interno aprovado e serviço externo.',
 'ADM 05.04':'Recuperação assistida por e-mail está desabilitada com explicação.',
 'ADM 07.04':'Correção técnica de vínculos bloqueada sem procedimento aprovado.',
 'ADM 09.05':'Operações em lote não disponibilizadas; atendimento individual com auditoria.',
}
partial = {
 'ADV 14.03':'Consulta metadados autorizados e andamentos fictícios; não extrai nem analisa texto real de PDFs.',
 'ADV 14.04':'Abre arquivo citado; não localiza trecho textual real ou página exata em PDF enviado.',
 'ADV 18.03':'Comprovantes profissionais simulados por metadados; sem processamento/consulta real de OAB.',
 'ADV 20.03':'Reenvio registra metadados da evidência para nova análise simulada.',
 'SYS 01.03':'Retorno por URL e notificações internas; sem universal/deep links nativos.',
 'SYS 02.01':'Conteúdo demonstrativo; documento jurídico vigente não foi fornecido.',
 'SYS 02.02':'Download do texto demonstrativo, não de termos jurídicos aprovados.',
 'SYS 02.03':'Ciência demonstrativa auditada; aceite jurídico definitivo depende de termos aprovados.',
 'SYS 02.04':'Recusar encerra a sessão; bloqueio por versão jurídica exige documento aprovado.',
 'SYS 03.01':'Pesquisa em explicações de demonstração, sem política jurídica publicada.',
 'SYS 03.02':'Download do texto explicativo; política definitiva pendente.',
 'SYS 05.02':'Rascunhos locais por conta/processo; sem armazenamento seguro de produção.',
 'SYS 05.04':'Retomada usa rotas autorizadas; não há tokens nem expiração de servidor.',
 'SYS 07.01':'Estado de manutenção demonstrativo, sem serviço remoto de status.',
 'SYS 08.02':'Sem mecanismo nativo de versão mínima; orientações da versão web.',
 'SYS 08.03':'Orientações para recarregar a versão web; sem distribuição em loja.',
 'ADM 04.01':'Análise de evidências fictícias/metadados; sem verificação real da OAB.',
 'ADM 08.03':'Redefinição simulada mantém MFA e revoga sessões; não implementa recuperação segura real.',
 'ADM 14.04':'Exportação demonstrativa e recusa fundamentada; exclusão definitiva aguarda retenção.',
 'ADM 16.02':'Amostras limitadas a metadados operacionais; nenhum conteúdo particular exposto.',
 'GER 01':'Permissões locais nas rotas e operações; isolamento no servidor exige backend futuro.',
}

header = '''# Checklist de implementação — Elo Jurídico

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
'''

def source(page):
    filename=mapping[page][0]
    return str((Path('src/pages')/filename).as_posix()).replace('src/pages/../','src/')

out=header
for code,title in pages:
    filename,route,kind=mapping[code]
    page_blocked=any(k.startswith(code+'.') for k in blocked)
    page_partial=any(k.startswith(code+'.') for k in partial)
    status='Simulado; decisões bloqueadas' if page_blocked else 'Parcial — ver requisitos' if page_partial else 'Simulado'
    out+=f'| {code} | {title} | `{route}` · {kind} | {status} | `{source(code)}` |\n'
out+='\n## Requisitos individuais\n\n| Requisito | Descrição original | Estado | Página/arquivo | Limitação ou comportamento |\n|---|---|---|---|---|\n'
for line in requirements:
    match=re.match(r'^((?:ADV|CLI|SYS|ADM) \d{2}\.\d{2}|GER \d{2})\s+(.*)$',line)
    code,description=match.groups()
    page=code.split('.')[0]
    state='Bloqueado por decisão/integração' if code in blocked else 'Parcial' if code in partial else 'Simulado'
    note=blocked.get(code) or partial.get(code) or 'Dados fictícios persistidos; permissões locais e navegação integrada.'
    file=source(page) if page in mapping else 'src/domain/permissions.ts; src/domain/actions.ts; src/components; src/store'
    out+=f'| {code} | {description.replace("|","/")} | {state} | {page} · `{file}` | {note} |\n'
out+='''
## Validação

Os comandos e evidências finais estão em `VALIDATION.md`. Testes de regras em `src/domain/rules.test.ts`; testes de navegador em `e2e/`. O checklist registra cobertura e limites por requisito; testes automatizados cobrem fluxos críticos e não certificam integralmente todos os estados de todas as 88 etapas.

## Continuidade

Preservar os módulos existentes ao integrar backend. Substituir armazenamento, sessão e serviços simulados por contratos autenticados, autorizações no servidor, auditoria imutável e armazenamento de arquivos apropriado. Resolver as decisões pendentes antes de habilitar os controles correspondentes.
'''
(ROOT/'IMPLEMENTATION_CHECKLIST.md').write_text(out,encoding='utf-8')
print(f'Inventário atualizado: {len(pages)} etapas, {len(requirements)} requisitos; {len(blocked)} bloqueios e {len(partial)} limitações explícitas.')
