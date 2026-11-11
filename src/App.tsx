import { Component, Suspense, lazy, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  BrowserRouter,
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { FeedbackProvider, Info } from "./components/ui";
import { Layout } from "./components/Layout";
import { ScrollMemory } from "./components/ScrollMemory";
import { Auth } from "./pages/Auth";
import { useStore, reset } from "./store/store";
import {
  Dashboard,
  Cases,
  Invitations,
  Requests,
  Office,
} from "./pages/Workspace";
import { SystemPage } from "./pages/System";
import { Process } from "./pages/Process";
import { Documents } from "./pages/Documents";
import { Assistant } from "./pages/Assistant";
import { Internal } from "./pages/Internal";
import { Calendar } from "./pages/Calendar";
import { loginHref, usesHashRouting } from "./lib/routing";
import {
  DocumentRequests,
  Notifications,
  Settings,
  Support,
} from "./pages/Account";
const Admin = lazy(() =>
  import("./pages/Admin").then((m) => ({ default: m.Admin })),
);
const ApplicationRouter = usesHashRouting ? HashRouter : BrowserRouter;
function Home() {
  const { user } = useStore();
  return (
    <Navigate
      replace
      to={
        user
          ? "/" + user.role + (user.role === "administracao" ? "" : "/inicio")
          : "/login"
      }
    />
  );
}
export interface GuardProps {
  role: string;
}
function Guard({ role }: GuardProps) {
  const { user } = useStore();
  const location = useLocation();
  if (!user)
    return (
      <Navigate
        to={"/login?retorno=" + encodeURIComponent(location.pathname)}
        replace
      />
    );
  if (user.role !== role) return <SystemPage kind="acesso-negado" />;
  if (!user.emailVerified)
    return (
      <Navigate
        to={"/login?retorno=" + encodeURIComponent(location.pathname)}
        replace
      />
    );
  if (
    role === "advogado" &&
    (!user.verified || !user.emailVerified) &&
    ![
      "/advogado/configuracoes",
      "/advogado/verificacao",
      "/advogado/ajuda",
    ].includes(location.pathname)
  )
    return <Navigate to="/advogado/verificacao" replace />;
  return <Layout />;
}
function SystemRoute() {
  const location = useLocation();
  return <SystemPage kind={location.pathname.split("/")[2]} />;
}
function Connectivity() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const fn = () => setOnline(navigator.onLine);
    window.addEventListener("online", fn);
    window.addEventListener("offline", fn);
    return () => {
      window.removeEventListener("online", fn);
      window.removeEventListener("offline", fn);
    };
  }, []);
  return !online ? (
    <div className="offline-banner" role="status">
      Sem conexão. Os dados locais estão disponíveis; mensagens podem exigir
      nova tentativa.
    </div>
  ) : null;
}
interface ErrorBoundaryProps {
  children: ReactNode;
}
class ErrorBoundary extends Component<ErrorBoundaryProps, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="system-page">
        <div className="panel system-panel">
          <h1>Não foi possível abrir esta área</h1>
          <p>
            Recarregue a aplicação. Se os dados locais estiverem incompatíveis,
            restaure a demonstração.
          </p>
          <button
            className="button primary"
            onClick={() => window.location.reload()}
          >
            Tentar novamente
          </button>
          <button
            className="button secondary"
            onClick={() => {
              if (
                window.confirm(
                  "Substituir todas as alterações locais pelos dados fictícios originais?",
                )
              ) {
                reset();
                window.location.assign(loginHref());
              }
            }}
          >
            Restaurar dados
          </button>
        </div>
      </div>
    ) : (
      this.props.children
    );
  }
}
function LoadWarning() {
  const { loadError } = useStore();
  return loadError ? (
    <Info error>
      {loadError}{" "}
      <button
        onClick={() => {
          if (
            window.confirm(
              "Restaurar os dados originais e descartar alterações locais?",
            )
          )
            reset();
        }}
      >
        Restaurar demonstração
      </button>
    </Info>
  ) : null;
}
export default function App() {
  return (
    <ErrorBoundary>
      <ApplicationRouter>
        <ScrollMemory />
        <FeedbackProvider>
          <a
            className="skip-link"
            href="#main-content"
            onClick={(event) => {
              event.preventDefault();
              const main = document.getElementById("main-content");
              main?.focus();
              main?.scrollIntoView();
            }}
          >
            Pular para conteúdo
          </a>
          <Connectivity />
          <LoadWarning />
          <Suspense
            fallback={
              <div className="empty" role="status">
                Carregando ambiente...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/cadastro" element={<Auth />} />
              <Route path="/sistema/:tipo" element={<SystemRoute />} />
              {(["advogado", "cliente"] as const).map((role) => (
                <Route
                  key={role}
                  path={"/" + role}
                  element={<Guard role={role} />}
                >
                  <Route index element={<Navigate to="inicio" replace />} />
                  <Route path="inicio" element={<Dashboard />} />
                  {role === "advogado" && (
                    <>
                      <Route path="clientes" element={<Cases clients />} />
                      <Route path="clientes/:clienteId" element={<Cases />} />
                      <Route path="escritorio" element={<Office />} />
                      <Route path="escritorio/membros" element={<Office />} />
                      <Route path="conversas-internas" element={<Internal />} />
                      <Route path="solicitacoes" element={<Requests />} />
                    </>
                  )}
                  <Route path="processos" element={<Cases />} />
                  <Route
                    path="conversas"
                    element={<Navigate to="../processos" replace />}
                  />
                  <Route path="calendario" element={<Calendar />} />
                  <Route path="processos/:processoId" element={<Process />} />
                  <Route
                    path="processos/:processoId/:secao"
                    element={<Process />}
                  />
                  <Route path="convites" element={<Invitations />} />
                  <Route path="convites/:conviteId" element={<Invitations />} />
                  <Route path="documentos" element={<Documents />} />
                  <Route
                    path="documentos/clientes/:clienteId"
                    element={<Documents />}
                  />
                  <Route
                    path="solicitacoes-documentos"
                    element={<DocumentRequests />}
                  />
                  <Route path="assistente" element={<Assistant />} />
                  <Route path="assistente/historico" element={<Assistant />} />
                  <Route path="notificacoes" element={<Notifications />} />
                  {[
                    "configuracoes",
                    "perfil",
                    "seguranca",
                    "privacidade",
                    "preferencias",
                    "verificacao",
                    "dados-profissionais",
                  ].map((s) => (
                    <Route key={s} path={s} element={<Settings />} />
                  ))}
                  <Route path="ajuda" element={<Support />} />
                  <Route
                    path="*"
                    element={<SystemPage kind="acesso-negado" />}
                  />
                </Route>
              ))}
              <Route
                path="/administracao"
                element={<Guard role="administracao" />}
              >
                <Route index element={<Admin />} />
                <Route path="notificacoes" element={<Notifications />} />
                <Route path="configuracoes" element={<Settings />} />
                <Route path="ajuda" element={<Support />} />
                {[
                  "usuarios",
                  "oab",
                  "processos",
                  "administradores",
                  "suporte",
                  "armazenamento",
                  "auditoria",
                  "incidentes",
                  "privacidade",
                  "ia",
                  "monitoramento",
                  "categorias",
                ].map((s) => (
                  <Route key={s} path={s} element={<Admin key={s} />} />
                ))}
                <Route path="*" element={<SystemPage kind="acesso-negado" />} />
              </Route>
              <Route path="*" element={<SystemPage kind="acesso-negado" />} />
            </Routes>
          </Suspense>
        </FeedbackProvider>
      </ApplicationRouter>
    </ErrorBoundary>
  );
}
