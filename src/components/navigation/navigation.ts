import {
  Building2,
  CalendarDays,
  CircleHelp,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Users,
  BriefcaseBusiness,
  Settings,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { User } from "../../domain/types";

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
}
export interface NavigationGroups {
  primary: NavigationItem[];
  secondary: NavigationItem[];
  secondaryLabel: string;
}
export function navigationFor(user: User): NavigationGroups {
  if (user.role === "administracao")
    return {
      primary: [
        { icon: LayoutDashboard, label: "Visão geral", path: "" },
        { icon: Users, label: "Usuários e contas", path: "usuarios" },
        { icon: ShieldCheck, label: "Verificação OAB", path: "oab" },
        {
          icon: BriefcaseBusiness,
          label: "Processos e vínculos",
          path: "processos",
        },
        { icon: CircleHelp, label: "Suporte", path: "suporte" },
      ],
      secondary: [
        { icon: Users, label: "Administradores", path: "administradores" },
        { icon: FolderOpen, label: "Armazenamento", path: "armazenamento" },
        { icon: ListChecks, label: "Logs e auditoria", path: "auditoria" },
        { icon: ShieldCheck, label: "Incidentes", path: "incidentes" },
        { icon: Settings, label: "Privacidade", path: "privacidade" },
        { icon: Sparkles, label: "Políticas da IA", path: "ia" },
        {
          icon: LayoutDashboard,
          label: "Monitoramento IA",
          path: "monitoramento",
        },
        { icon: FolderOpen, label: "Categorias", path: "categorias" },
      ],
      secondaryLabel: "Gestão do sistema",
    };
  const primary: NavigationItem[] = [
    { icon: LayoutDashboard, label: "Visão geral", path: "inicio" },
    ...(user.role === "advogado"
      ? [{ icon: Users, label: "Clientes", path: "clientes" }]
      : []),
    { icon: BriefcaseBusiness, label: "Processos", path: "processos" },
    { icon: CalendarDays, label: "Calendário", path: "calendario" },
    { icon: FolderOpen, label: "Documentos", path: "documentos" },
  ];
  const secondary: NavigationItem[] = [
    {
      icon: Sparkles,
      label:
        user.role === "cliente"
          ? "Assistente particular"
          : "Assistente profissional",
      path: "assistente",
    },
    {
      icon: Mail,
      label: user.role === "cliente" ? "Convites" : "Convites enviados",
      path: "convites",
    },
  ];
  if (user.role === "advogado") {
    secondary.push({
      icon: ListChecks,
      label: "Solicitações da IA",
      path: "solicitacoes",
    });
    if (user.office)
      secondary.push(
        { icon: Building2, label: "Escritório e equipe", path: "escritorio" },
        {
          icon: MessageSquare,
          label: "Conversas internas",
          path: "conversas-internas",
        },
      );
  }
  return { primary, secondary, secondaryLabel: "Mais ferramentas" };
}
