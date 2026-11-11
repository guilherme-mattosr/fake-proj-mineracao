export type Role = "advogado" | "cliente" | "administracao";
export type CaseStatus =
  "Ativo" | "Aguardando aceite" | "Concluído" | "Cancelado" | "Suspenso";
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  password: string;
  phone: string;
  office?: string;
  oab?: string;
  verified: boolean;
  emailVerified: boolean;
  active: boolean;
  mfa: boolean;
  sessionVersion?: number;
  verificationState?: string;
  verificationNote?: string;
  reviewOwner?: string;
  requestedOffice?: string;
  professionalEvidence?: { name: string; size: number; mime: string }[];
  preferences: Record<string, boolean>;
}
export interface LegalCase {
  id: string;
  title: string;
  area: string;
  number: string;
  description: string;
  clients: string[];
  lawyers: string[];
  status: CaseStatus;
  mode:
    "IA ativa" | "IA pausada" | "Aguardando advogado" | "Atendimento humano";
  claimedBy?: string;
  createdAt: string;
  updatedAt: string;
  history?: {
    at: string;
    author: string;
    title: string;
    area: string;
    number: string;
    description: string;
  }[];
}
export interface Message {
  id: string;
  caseId: string;
  author: string;
  text: string;
  at: string;
  attachment?: string;
  version?: number;
  status: "Enviando" | "Enviada" | "Entregue" | "Falhou";
  replyTo?: string;
  policy?: number;
}
export interface Invitation {
  id: string;
  caseId: string;
  email: string;
  lawyer: string;
  sentAt: string;
  expiresAt: string;
  status: "Pendente" | "Aceito" | "Recusado" | "Expirado" | "Cancelado";
}
export interface Version {
  id: string;
  number: number;
  name: string;
  at: string;
  author: string;
  size: number;
  mime: string;
  content?: string;
}
export interface Document {
  id: string;
  name: string;
  owner: string;
  caseId?: string;
  category: string;
  shared: boolean;
  internal: boolean;
  internalThreadId?: string;
  state:
    | "Disponível"
    | "Processando"
    | "Organização pendente"
    | "Indisponível"
    | "Quarentena";
  versions: Version[];
  allowClientVersion: boolean;
  deleted?: boolean;
}
export interface Update {
  id: string;
  caseId: string;
  title: string;
  description: string;
  date: string;
  author: string;
  public: boolean;
  documentId?: string;
  history: { at: string; author: string; text: string }[];
}
export interface Request {
  id: string;
  caseId: string;
  question: string;
  summary: string;
  at: string;
  status: "Aguardando" | "Em atendimento" | "Respondida";
  recipients: string[];
}
export interface Notice {
  id: string;
  userId: string;
  title: string;
  at: string;
  path: string;
  read: boolean;
  category: string;
}
export interface AssistantThread {
  id: string;
  userId: string;
  caseId: string;
  title: string;
  at: string;
  messages: {
    id: string;
    author: string;
    text: string;
    at: string;
    source?: string;
  }[];
}
export interface Ticket {
  id: string;
  userId: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  assigned?: string;
  messages: { author: string; text: string; at: string; internal: boolean }[];
}
export interface Audit {
  id: string;
  actor: string;
  at: string;
  action: string;
  resource: string;
  result: string;
  reason?: string;
}
export interface DataRequest {
  id: string;
  userId: string;
  type: string;
  documentId?: string;
  caseId?: string;
  reason: string;
  status: string;
  at: string;
  answer?: string;
}
export interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  owner: string;
  history: string[];
}
export interface Policy {
  version: number;
  text: string;
  status: "Rascunho" | "Em aprovação" | "Aprovada" | "Publicada" | "Anterior";
  at: string;
  author: string;
}
export interface DB {
  appointments: Appointment[];
  schema: 1;
  users: User[];
  cases: LegalCase[];
  messages: Message[];
  invitations: Invitation[];
  documents: Document[];
  updates: Update[];
  requests: Request[];
  notices: Notice[];
  threads: AssistantThread[];
  tickets: Ticket[];
  audits: Audit[];
  dataRequests: DataRequest[];
  incidents: Incident[];
  policies: Policy[];
  categories: {
    id: string;
    name: string;
    description: string;
    synonyms: string;
    active: boolean;
  }[];
  internal: {
    id: string;
    office: string;
    title: string;
    caseId?: string;
    participants: string[];
    messages: Message[];
  }[];
  aiEnabled: boolean;
  fileRequests: {
    id: string;
    caseId: string;
    clientId: string;
    title: string;
    description: string;
    status: "Pendente" | "Atendida";
    at: string;
    author: string;
  }[];
}

export interface Appointment {
  id: string;
  title: string;
  lawyerId: string;
  requestedBy: string;
  clientIds: string[];
  caseId?: string;
  sourceMessageId?: string;
  start?: string;
  duration: number;
  location: string;
  notes: string;
  status: "Pendente" | "Confirmado" | "Recusado" | "Cancelado";
  kind: "Reunião" | "Pessoal";
  createdAt: string;
}
