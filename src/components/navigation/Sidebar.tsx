import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Building2, ChevronDown, CircleHelp, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Scale, Settings, X } from "lucide-react";
import type { User } from "../../domain/types";
import { Avatar } from "../ui";
import { navigationFor } from "./navigation";
import type { NavigationItem } from "./navigation";

export interface SidebarProps {
  user: User;
  collapsed: boolean;
  mobile: boolean;
  open: boolean;
  hasRequests: boolean;
  onClose: () => void;
  onToggleCollapsed: () => void;
}
interface SidebarLinkProps {
  item: NavigationItem;
  root: string;
  collapsed: boolean;
  hasRequests: boolean;
  onNavigate: () => void;
}
function SidebarLink({ item, root, collapsed, hasRequests, onNavigate }: SidebarLinkProps) {
  const Icon = item.icon;
  return <NavLink end={item.path === "" || item.path === "inicio"} to={root + (item.path ? "/" + item.path : "")} aria-label={item.label} title={collapsed ? item.label : undefined} onClick={onNavigate}>
    <Icon size={19} aria-hidden="true" />
    <span className="nav-text">{item.label}</span>
    {item.path === "solicitacoes" && hasRequests && <span className="nav-dot" aria-label="Solicitações pendentes" />}
    {collapsed && <span className="rail-tooltip" aria-hidden="true">{item.label}</span>}
  </NavLink>;
}
export function Sidebar({ user, collapsed, mobile, open, hasRequests, onClose, onToggleCollapsed }: SidebarProps) {
  const root = "/" + user.role;
  const groups = navigationFor(user);
  const { pathname } = useLocation();
  const secondaryActive = groups.secondary.some((item) => pathname.startsWith(`${root}/${item.path}`));
  const [toolsOpen, setToolsOpen] = useState(secondaryActive);
  const sidebar = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!mobile || !open) return;
    const previous = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const focusable = Array.from(sidebar.current!.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")).filter((element) => element.getClientRects().length > 0);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      if (previous?.isConnected) previous.focus();
    };
  }, [mobile, open]);
  return <aside ref={sidebar} className={`sidebar ${open ? "open" : ""}`} aria-label="Navegação lateral" inert={mobile && !open}>
    <div className="sidebar-header">
      <Link className="brand" aria-label="Elo Jurídico, início" to={root + (user.role === "administracao" ? "" : "/inicio")} onClick={onClose}>
        <span className="brand-mark"><Scale size={21} /></span>
        <span className="brand-name">elo<span className="brand-light">jurídico</span></span>
      </Link>
      <button className="icon-button sidebar-collapse" aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"} title={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"} aria-expanded={!collapsed} aria-controls="sidebar-navigation" onClick={onToggleCollapsed}>
        {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
      </button>
      <button ref={closeButton} className="mobile-close icon-button" aria-label="Fechar navegação" onClick={onClose}><X size={21} /></button>
    </div>
    <div className="workspace" title={collapsed ? user.office || "Conta individual" : undefined}>
      <Building2 size={17} aria-hidden="true" />
      <span>{user.role === "administracao" ? "Administração" : user.office || "Conta individual"}</span>
    </div>
    <nav id="sidebar-navigation" aria-label="Principal">
      {groups.primary.map((item) => <SidebarLink key={item.path} item={item} root={root} collapsed={collapsed} hasRequests={hasRequests} onNavigate={onClose} />)}
      <div className="nav-group">
        <button className={`nav-group-toggle ${secondaryActive ? "group-active" : ""}`} onClick={() => setToolsOpen(!toolsOpen)} aria-label={groups.secondaryLabel} title={collapsed ? groups.secondaryLabel : undefined} aria-expanded={toolsOpen} aria-controls="secondary-navigation">
          <MoreHorizontal size={19} aria-hidden="true" />
          <span className="nav-text">{groups.secondaryLabel}</span>
          <ChevronDown className={toolsOpen ? "rotated" : ""} size={15} aria-hidden="true" />
        </button>
        <div id="secondary-navigation" hidden={!toolsOpen}>
          {groups.secondary.map((item) => <SidebarLink key={item.path} item={item} root={root} collapsed={collapsed} hasRequests={hasRequests} onNavigate={onClose} />)}
        </div>
      </div>
    </nav>
    <div className="nav-bottom">
      <NavLink aria-label="Configurações" title={collapsed ? "Configurações" : undefined} to={root + "/configuracoes"} onClick={onClose}><Settings size={19} /><span className="nav-text">Configurações</span>{collapsed && <span className="rail-tooltip" aria-hidden="true">Configurações</span>}</NavLink>
      <NavLink aria-label="Ajuda e suporte" title={collapsed ? "Ajuda e suporte" : undefined} to={root + "/ajuda"} onClick={onClose}><CircleHelp size={19} /><span className="nav-text">Ajuda e suporte</span>{collapsed && <span className="rail-tooltip" aria-hidden="true">Ajuda e suporte</span>}</NavLink>
      <Link className="profile-button" aria-label={`Perfil de ${user.name}`} title={collapsed ? user.name : undefined} to={root + "/configuracoes"} onClick={onClose}>
        <Avatar name={user.name} small /><span className="nav-text"><strong>{user.name}</strong><small>{user.role === "advogado" ? "Advogado" : user.role === "cliente" ? "Cliente" : "Administrador"}</small></span>
      </Link>
    </div>
  </aside>;
}
