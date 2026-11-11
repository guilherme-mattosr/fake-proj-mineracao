import {
  NavLink,
  Outlet,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Bell,
  BriefcaseBusiness,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useStore, logout } from "../store/store";
import { Sidebar } from "./navigation/Sidebar";

export function Layout() {
  const { user, db } = useStore();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(
    () => window.matchMedia("(max-width: 767px)").matches,
  );
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("elo-ui:sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const navigate = useNavigate();
  const location = useLocation();
  const conversation = /\/processos\/[^/]+(?:\/(?:conversa|grupo))?\/?$/.test(
    location.pathname,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const resize = () => {
      setMobile(query.matches);
      setOpen(false);
    };
    query.addEventListener("change", resize);
    return () => query.removeEventListener("change", resize);
  }, []);
  if (!user) return null;
  const root = "/" + user.role;
  const unread = db.notices.filter(
    (n) => n.userId === user.id && !n.read,
  ).length;
  const hasRequests = db.requests.some(
    (r) => r.recipients.includes(user.id) && r.status !== "Respondida",
  );
  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("elo-ui:sidebar-collapsed", String(next));
    } catch {
      /* A preferência continua válida nesta sessão. */
    }
  };
  return (
    <div
      className={`app-shell ${collapsed && !mobile ? "sidebar-compact" : ""} ${conversation ? "conversation-shell" : ""}`}
    >
      <Sidebar
        user={user}
        collapsed={collapsed && !mobile}
        mobile={mobile}
        open={open}
        hasRequests={hasRequests}
        onClose={() => setOpen(false)}
        onToggleCollapsed={toggleCollapsed}
      />
      {open && mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar navegação"
          onClick={() => setOpen(false)}
          tabIndex={-1}
        />
      )}
      <div className="main-shell" inert={mobile && open}>
        <header className="topbar">
          <div className="top-start">
            <button
              className="icon-button menu-toggle"
              aria-label="Abrir navegação"
              aria-expanded={open}
              aria-controls="sidebar-navigation"
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </button>
            <span className="workspace-context">
              {user.role === "administracao"
                ? "Administração"
                : user.role === "cliente"
                  ? "Meu espaço"
                  : user.office || "Meu escritório"}
            </span>
          </div>
          <div className="top-actions">
            <span className="demo-indicator">Demonstração</span>
            <Link
              className="icon-button notification-bell"
              aria-label={`Notificações, ${unread} não lidas`}
              to={root + "/notificacoes"}
            >
              <Bell size={19} />
              {unread > 0 && <b>{unread}</b>}
            </Link>
            <button
              className="icon-button"
              aria-label="Sair da conta"
              title="Sair da conta"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>Elo Jurídico</span>
          <Link to="/sistema/transparencia">Sobre o Assistente IA</Link>
        </footer>
      </div>
      <nav className="bottom-nav" aria-label="Atalhos" inert={mobile && open}>
        {[
          [
            LayoutDashboard,
            "Início",
            user.role === "administracao" ? "" : "inicio",
          ],
          [BriefcaseBusiness, "Processos", "processos"],
          [FolderOpen, "Arquivos", "documentos"],
          [Sparkles, "Assistente", "assistente"],
          [Settings, "Conta", "configuracoes"],
        ]
          .filter(
            (_, i) =>
              user.role !== "administracao" || i === 0 || i === 1 || i === 4,
          )
          .map(([Icon, label, path]) => (
            <NavLink
              key={label as string}
              end={path === "" || path === "inicio"}
              to={root + (path ? "/" + path : "")}
            >
              <Icon size={21} />
              <span>{label as string}</span>
            </NavLink>
          ))}
      </nav>
    </div>
  );
}
