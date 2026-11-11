import type { DB, User } from "../domain/types";
const at = "2026-11-09T12:00:00.000Z";
const makeUser = (
  id: string,
  name: string,
  role: User["role"],
  email: string,
  extra: Partial<User> = {},
): User => ({
  id,
  name,
  role,
  email,
  password: "Demo@123",
  phone: "(11) 90000-0000",
  verified: true,
  emailVerified: true,
  active: true,
  mfa: role === "administracao",
  preferences: {
    aiAware: true,
    Mensagens: true,
    Convites: true,
    Documentos: true,
    "Processo concluído": true,
  },
  ...extra,
});
export function createSeed(): DB {
  const users = [
    makeUser("a1", "Mariana Almeida", "advogado", "mariana@elo.demo", {
      office: "Almeida & Costa",
      oab: "245.810/SP",
    }),
    makeUser("a2", "Rafael Costa", "advogado", "rafael@elo.demo", {
      office: "Almeida & Costa",
      oab: "312.604/SP",
    }),
    makeUser("a3", "Beatriz Santos", "advogado", "beatriz@elo.demo", {
      office: "Almeida & Costa",
      oab: "289.713/SP",
    }),
    makeUser("a4", "Lucas Ferreira", "advogado", "lucas@elo.demo", {
      oab: "198.420/RJ",
    }),
    makeUser("a5", "Camila Rocha", "advogado", "camila@elo.demo", {
      oab: "402.115/SP",
      verified: false,
    }),
    makeUser("c1", "Ana Beatriz Oliveira", "cliente", "ana@elo.demo"),
    makeUser("c2", "Pedro Henrique Lima", "cliente", "pedro@elo.demo"),
    makeUser("c3", "Carolina Martins", "cliente", "carolina@elo.demo"),
    makeUser("c4", "João Rodrigues", "cliente", "joao@elo.demo"),
    makeUser("c5", "Fernanda Alves", "cliente", "fernanda@elo.demo"),
    makeUser("c6", "Roberto Mendes", "cliente", "roberto@elo.demo"),
    makeUser("c7", "Juliana Souza", "cliente", "juliana@elo.demo"),
    makeUser("c8", "Daniel Pereira", "cliente", "daniel@elo.demo"),
    makeUser("c9", "Sofia Ribeiro", "cliente", "sofia@elo.demo"),
    makeUser("c10", "Thiago Nunes", "cliente", "thiago@elo.demo"),
    makeUser("c11", "Clara Dias", "cliente", "clara@elo.demo"),
    makeUser("ad1", "Guilherme Ribeiro", "administracao", "guilherme@elo.demo"),
    makeUser("ad2", "Helena Azevedo", "administracao", "helena@elo.demo"),
  ];
  const titles = [
    "Revisão de contrato de trabalho",
    "Inventário familiar",
    "Indenização por danos materiais",
    "Regularização de imóvel",
    "Revisão de contrato de locação",
    "Acordo trabalhista",
    "Planejamento sucessório",
    "Rescisão contratual",
    "Direito do consumidor",
    "Consultoria empresarial",
    "Revisão de financiamento",
    "Partilha de bens",
  ];
  const areas = [
    "Trabalhista",
    "Sucessões",
    "Cível",
    "Imobiliário",
    "Imobiliário",
    "Trabalhista",
    "Sucessões",
    "Cível",
    "Consumidor",
    "Empresarial",
    "Consumidor",
    "Família",
  ];
  const cases: DB["cases"] = titles.map((title, i) => ({
    id: "p" + (i + 1),
    title,
    area: areas[i],
    number: `000${1042 + i}-22.2026.8.26.0100`,
    description:
      "Dados inteiramente fictícios para demonstração de atendimento e organização documental.",
    clients:
      i === 4 ? [] : [i === 0 || i === 10 ? "c1" : "c" + Math.min(i + 1, 10)],
    lawyers:
      i === 9
        ? ["a4"]
        : i === 1
          ? ["a1", "a2", "a3"]
          : ["a1", i % 2 ? "a3" : "a2"],
    status:
      i === 4
        ? "Aguardando aceite"
        : i === 5 || i === 11
          ? "Concluído"
          : i === 7
            ? "Cancelado"
            : "Ativo",
    mode:
      i === 5 || i === 7 || i === 11
        ? "IA pausada"
        : i === 1
          ? "Aguardando advogado"
          : i === 2
            ? "Atendimento humano"
            : "IA ativa",
    claimedBy: i === 2 ? "a2" : undefined,
    createdAt: "2026-10-12T13:00:00Z",
    updatedAt: new Date(Date.parse(at) - i * 3600000).toISOString(),
  }));
  const messages: DB["messages"] = cases.flatMap((c, i) =>
    c.status === "Aguardando aceite"
      ? []
      : [
          {
            id: "m" + i + "a",
            caseId: c.id,
            author: c.lawyers[0],
            text: "Olá! Este é o nosso espaço para conversar sobre o processo. Os documentos e andamentos ficam organizados nas abas ao lado.",
            at: "2026-11-06T13:30:00Z",
            status: "Entregue" as const,
          },
          {
            id: "m" + i + "b",
            caseId: c.id,
            author: c.clients[0],
            text:
              i === 1
                ? "Devo aceitar a proposta de acordo?"
                : "Bom dia! Você pode me atualizar sobre o andamento?",
            at: "2026-11-09T11:32:00Z",
            status: "Entregue" as const,
          },
          ...(i !== 1
            ? [
                {
                  id: "m" + i + "c",
                  caseId: c.id,
                  author: "ia",
                  text:
                    "O último andamento publicado é “Documentação recebida”, em 06/11/2026. Os arquivos foram recebidos para conferência. Fonte: andamento registrado por " +
                    users.find((u) => u.id === c.lawyers[0])?.name +
                    ".",
                  at: "2026-11-09T11:32:10Z",
                  status: "Entregue" as const,
                  policy: 1,
                },
              ]
            : []),
        ],
  );
  messages.push(
    {
      id: "sample-audio",
      caseId: "p1",
      author: "c1",
      text: "[Áudio demonstrativo] Confirmação de recebimento dos arquivos.",
      at: "2026-11-09T11:28:00Z",
      status: "Entregue",
    },
    {
      id: "sample-video",
      caseId: "p1",
      author: "a1",
      text: "[Vídeo demonstrativo] Orientação de uso do aplicativo.",
      at: "2026-11-09T11:29:00Z",
      status: "Entregue",
    },
  );
  messages.sort((a, b) => a.at.localeCompare(b.at));
  const names = [
    "Contrato de honorários.pdf",
    "Documentos de identificação.pdf",
    "Petição inicial.pdf",
    "Comprovante de residência.pdf",
    "Recurso ordinário.pdf",
    "Documentação complementar.pdf",
  ];
  const cats = [
    "Contratos",
    "Documentos pessoais",
    "Petições",
    "Comprovantes",
    "Recursos",
    "Organização pendente",
  ];
  const documents: DB["documents"] = cases.flatMap((c, i) =>
    names.slice(0, i < 3 ? 6 : 3).map((name, j) => ({
      id: `d${i}-${j}`,
      name,
      owner: c.clients[0] || "c1",
      caseId: c.id,
      category: cats[j],
      shared: j !== 2,
      internal: j === 2,
      state:
        j === 5
          ? ("Organização pendente" as const)
          : i === 2 && j === 3
            ? ("Processando" as const)
            : ("Disponível" as const),
      allowClientVersion: j === 1 || j === 3,
      versions: [
        {
          id: `v${i}-${j}-1`,
          number: 1,
          name,
          at: "2026-11-06T14:00:00Z",
          author: c.lawyers[0],
          size: 245760 + j * 10240,
          mime: "application/pdf",
        },
        ...(j === 0
          ? [
              {
                id: `v${i}-${j}-2`,
                number: 2,
                name,
                at: "2026-11-08T14:00:00Z",
                author: c.lawyers[0],
                size: 256000,
                mime: "application/pdf",
              },
            ]
          : []),
      ],
    })),
  );
  documents.push({
    id: "personal1",
    name: "Identidade pessoal.pdf",
    owner: "c1",
    category: "Documentos pessoais",
    shared: false,
    internal: false,
    state: "Disponível",
    allowClientVersion: false,
    versions: [
      {
        id: "vp1",
        number: 1,
        name: "Identidade pessoal.pdf",
        at,
        size: 126400,
        author: "c1",
        mime: "application/pdf",
      },
    ],
  });
  return {
    schema: 1,
    appointments: [],
    users,
    cases,
    messages,
    documents,
    updates: cases.flatMap((c) => [
      {
        id: "u" + c.id,
        caseId: c.id,
        title: "Documentação recebida",
        description: "Os arquivos foram recebidos para conferência.",
        date: "2026-11-06",
        author: c.lawyers[0],
        public: true,
        history: [],
      },
      {
        id: "ui" + c.id,
        caseId: c.id,
        title: "Preparação interna",
        description: "Revisar documentos em reunião de equipe.",
        date: "2026-11-08",
        author: c.lawyers[0],
        public: false,
        history: [],
      },
    ]),
    invitations: [
      {
        id: "i1",
        caseId: "p5",
        email: "ana@elo.demo",
        lawyer: "a1",
        sentAt: at,
        expiresAt: "2026-12-09T12:00:00Z",
        status: "Pendente",
      },
      ...(["Aceito", "Recusado", "Expirado", "Cancelado"] as const).map(
        (status, i) => ({
          id: "i" + (i + 2),
          caseId: "p" + (i + 1),
          email: "ana@elo.demo",
          lawyer: "a1",
          sentAt: "2026-09-01T12:00:00Z",
          expiresAt:
            status === "Aceito"
              ? "2026-12-09T12:00:00Z"
              : "2026-10-01T12:00:00Z",
          status,
        }),
      ),
    ],
    requests: [
      {
        id: "r1",
        caseId: "p2",
        question: "Devo aceitar a proposta de acordo?",
        summary:
          "Cliente solicita avaliação profissional de uma proposta de acordo.",
        at,
        status: "Aguardando",
        recipients: ["a1", "a2", "a3"],
      },
    ],
    notices: [
      {
        id: "n1",
        userId: "a1",
        title: "Pedro Henrique: pergunta que precisa de avaliação profissional",
        at,
        path: "/advogado/processos/p2/conversa",
        read: false,
        category: "Mensagens",
      },
      {
        id: "n2",
        userId: "c1",
        title: "Você recebeu um convite para Revisão de contrato de locação",
        at,
        path: "/cliente/convites/i1",
        read: false,
        category: "Convites",
      },
      {
        id: "n3",
        userId: "a1",
        title: "Documentação complementar: organização pendente",
        at,
        path: "/advogado/documentos",
        read: true,
        category: "Documentos",
      },
    ],
    threads: [],
    tickets: [
      {
        id: "SUP-1001",
        userId: "c1",
        title: "Dúvida sobre o envio de um documento",
        category: "Documentos",
        status: "Aberto",
        priority: "Normal",
        messages: [
          {
            author: "c1",
            text: "Onde encontro o arquivo que enviei pela conversa?",
            at,
            internal: false,
          },
        ],
      },
      {
        id: "SUP-1002",
        userId: "a5",
        title: "Atualização dos dados da OAB",
        category: "Cadastro",
        status: "Em análise",
        priority: "Normal",
        messages: [
          {
            author: "a5",
            text: "Enviei o comprovante atualizado para análise.",
            at,
            internal: false,
          },
        ],
      },
    ],
    audits: [
      {
        id: "log1",
        actor: "ad1",
        at,
        action: "Acesso administrativo",
        resource: "Painel operacional",
        result: "Sucesso",
      },
    ],
    dataRequests: [],
    incidents: [
      {
        id: "INC-001",
        title: "Arquivo de teste isolado para verificação",
        severity: "Baixa",
        status: "Monitorando",
        owner: "ad1",
        history: ["09/11/2026 — incidente simulado aberto."],
      },
    ],
    policies: [
      {
        version: 1,
        text: "Responder apenas com fontes autorizadas. Encaminhar estratégia, riscos, acordos e valores aos advogados. Identificar toda resposta como Assistente IA.",
        status: "Publicada",
        at,
        author: "ad1",
      },
    ],
    categories: cats.map((name, i) => ({
      id: "cat" + i,
      name,
      description: "Categoria documental sugerida",
      synonyms: "",
      active: true,
    })),
    internal: [
      {
        id: "int1",
        office: "Almeida & Costa",
        title: "Equipe · organização dos atendimentos",
        participants: ["a1", "a2", "a3"],
        messages: [
          {
            id: "im1",
            caseId: "int1",
            author: "a2",
            text: "Podemos conferir os documentos do inventário na reunião de hoje?",
            at,
            status: "Entregue",
          },
        ],
      },
    ],
    aiEnabled: true,
    fileRequests: [
      {
        id: "fr1",
        caseId: "p1",
        clientId: "c1",
        title: "Comprovante de vínculo profissional",
        description:
          "Envie um comprovante fictício para demonstrar o fluxo de solicitação de documentos.",
        status: "Pendente",
        at,
        author: "a1",
      },
    ],
  };
}
