import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Scale, RefreshCw } from "lucide-react";
import { useStore, transact, logout } from "../store/store";
import { audit } from "../domain/actions";
import { Field, Info, SearchInput, useFeedback } from "../components/ui";
import { download, includes } from "../lib/format";
const contents: Record<string, { title: string; text: string[] }> = {
  termos: {
    title: "Termos de uso · demonstração",
    text: [
      "Esta aplicação é um protótipo funcional local, com dados fictícios. Não existe documento jurídico de termos aprovado fornecido para este projeto.",
      "Não utilize dados reais ou documentos confidenciais. Contas, senhas e informações são armazenadas no próprio navegador.",
      "O sistema não fornece aconselhamento jurídico, não realiza pagamentos e não possui integração com tribunais.",
    ],
  },
  privacidade: {
    title: "Privacidade · demonstração",
    text: [
      "Texto explicativo da demonstração. A política jurídica definitiva, as bases e os prazos de retenção precisam ser aprovados antes da produção.",
      "Os dados desta demonstração permanecem no navegador. O isolamento por perfil simula permissões, mas não substitui controles de servidor.",
      "O assistente particular não compartilha seu histórico com os advogados. Uma pergunta pode ser encaminhada mediante confirmação do conteúdo e do processo de destino.",
      "Você pode solicitar exportação e exclusão em Configurações → Privacidade. Pedidos passam por análise simulada.",
    ],
  },
  transparencia: {
    title: "Conheça o Assistente IA",
    text: [
      "Toda resposta automática aparece identificada como Assistente IA. Nesta versão, as respostas são geradas por regras locais, sem API ou IA real.",
      "O assistente utiliza apenas andamentos públicos salvos e metadados de documentos autorizados. Não realiza pesquisa jurídica externa nem avalia chances ou estratégias.",
      "Perguntas que exigem avaliação profissional criam solicitações aos advogados participantes. A IA pausa enquanto há atendimento humano ativo.",
      "A ciência registrada aqui se refere ao funcionamento da demonstração. Não substitui uma base legal nem a política definitiva do produto.",
    ],
  },
};
export interface SystemPageProps {
  kind: string;
}
export function SystemPage({ kind }: SystemPageProps) {
  const { user } = useStore();
  const navigate = useNavigate();
  const { run, toast } = useFeedback();
  const [q, setQ] = useState("");
  const [retry, setRetry] = useState(false);
  useEffect(() => {
    if (kind === "sessao-expirada") logout();
  }, [kind]);
  const content = contents[kind];
  const home = user
    ? "/" + user.role + (user.role === "administracao" ? "" : "/inicio")
    : "/login";
  const titles: Record<string, string> = {
    "acesso-negado": "Este conteúdo não está disponível",
    "sessao-expirada": "Sua sessão foi encerrada",
    "sem-conexao": "Você está sem conexão",
    manutencao: "Serviço temporariamente indisponível",
    atualizacao: "Atualização necessária",
  };
  return (
    <div className="system-page">
      <Link className="system-brand" to={home}>
        <Scale />
        elo jurídico
      </Link>
      <section className="panel system-panel">
        {content ? (
          <>
            <span className="eyebrow">
              INFORMAÇÃO E TRANSPARÊNCIA · VERSÃO DEMO 1
            </span>
            <h1>{content.title}</h1>
            <SearchInput
              value={q}
              onChange={setQ}
              placeholder="Pesquisar neste conteúdo"
            />
            {content.text
              .filter((t) => includes(t, q))
              .map((t) => (
                <p key={t}>{t}</p>
              ))}
            <Info>
              Documento explicativo de demonstração, sem validade como política
              jurídica publicada.
            </Info>
            <div className="inline-actions">
              <button
                className="button secondary"
                onClick={() =>
                  download(
                    kind + "-demonstracao.txt",
                    content.title + "\n\n" + content.text.join("\n\n"),
                  )
                }
              >
                Baixar cópia
              </button>
              {kind !== "privacidade" && user && (
                <button
                  className="button primary"
                  onClick={() =>
                    run(
                      () =>
                        transact((d) => {
                          audit(
                            d,
                            user,
                            "Registrar ciência da demonstração",
                            kind + " v1",
                          );
                        }),
                      "Ciência registrada com sua conta, versão e data.",
                    )
                  }
                >
                  Confirmar ciência
                </button>
              )}
              <Link className="button secondary" to={home}>
                Voltar ao aplicativo
              </Link>
              {kind !== "privacidade" && (
                <Link to="/sistema/privacidade">Consultar privacidade</Link>
              )}
              {user && (
                <Link to={"/" + user.role + "/configuracoes"}>
                  Dados e privacidade
                </Link>
              )}
              <button
                className="text-link"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                Recusar e sair
              </button>
            </div>
          </>
        ) : (
          <>
            <LockKeyhole size={34} />
            <h1>{titles[kind] || titles["acesso-negado"]}</h1>
            <p>
              {kind === "sem-conexao"
                ? "Rascunhos foram preservados neste navegador. Mensagens pendentes precisam de nova tentativa."
                : kind === "atualizacao"
                  ? "Esta demonstração web não possui aplicativo em loja. Recarregue para verificar a versão disponível."
                  : "Confira seu acesso ou volte para uma área disponível da sua conta."}
            </p>
            {retry && (
              <Info>
                {navigator.onLine
                  ? "Conexão disponível. Retorne ao aplicativo."
                  : "A conexão continua indisponível. Tente novamente mais tarde."}
              </Info>
            )}
            <div className="inline-actions">
              <Link className="button primary" to={home}>
                Ir para o início
              </Link>
              <button
                className="button secondary"
                onClick={() => {
                  setRetry(true);
                  toast("Estado da demonstração verificado.");
                }}
              >
                <RefreshCw size={17} />
                Tentar novamente
              </button>
              {kind === "sessao-expirada" && (
                <Link to="/login">Entrar novamente</Link>
              )}
            </div>
            <Field label="Precisa de ajuda?">
              <Link to={user ? "/" + user.role + "/ajuda" : "/login"}>
                Abrir canal de suporte
              </Link>
            </Field>
          </>
        )}
      </section>
    </div>
  );
}
