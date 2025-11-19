import { Router } from "express";
import { dataPath, readJson } from "../utils/jsonStore.js";
import OpenAI from "openai";
import "dotenv/config";

function getOpenAI() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key });
}

const router = Router();
const PROFILES = dataPath("profiles.json");

function scoreProfile(p, skillsWanted, areaWanted, cityWanted) {
  const skills = Array.isArray(p.habilidadesTecnicas)
    ? p.habilidadesTecnicas.map((s) => s.toLowerCase())
    : [];
  const want = skillsWanted.map((s) => s.toLowerCase());

  const inter = want.filter((w) => skills.includes(w));
  let score = inter.length * 2;

  if (areaWanted && p.area?.toLowerCase() === areaWanted.toLowerCase()) {
    score += 1.5;
  }
  if (cityWanted && p.localizacao?.toLowerCase() === cityWanted.toLowerCase()) {
    score += 0.5;
  }

  return { score, inter };
}

// GET /ai/suggest?skills=React,Node.js&area=Desenvolvimento&city=São%20Paulo%20-%20SP&k=6
router.get("/ai/suggest", async (req, res) => {
  try {
    const k = Number(req.query.k) || 6;
    const area = req.query.area || "";
    const city = req.query.city || "";
    const skillsParam = (req.query.skills || "").trim();
    if (!skillsParam) {
      return res
        .status(400)
        .json({ error: "Param skills é obrigatório (ex: React,Node.js)" });
    }

    const skillsWanted = skillsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const all = await readJson(PROFILES);

    const ranked = all
      .map((p) => {
        const { score, inter } = scoreProfile(p, skillsWanted, area, city);
        return { ...p, _score: score, _match: inter };
      })
      .filter((p) => p._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, k)
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        foto: p.foto,
        cargo: p.cargo,
        localizacao: p.localizacao,
        area: p.area,
        habilidadesTecnicas: p.habilidadesTecnicas,
        score: p._score,
        motivo: `Match em: ${p._match.join(", ")}${
          area ? " · área" : ""
        }${city ? " · cidade" : ""}`,
      }));

    return res.json({ total: ranked.length, items: ranked });
  } catch (e) {
    console.error("ERRO /ai/suggest:", e);
    return res.status(500).json({ error: "Erro ao sugerir perfis" });
  }
});

const KNOWN_SKILLS = [
  "React",
  "Next.js",
  "TailwindCSS",
  "JavaScript",
  "TypeScript",
  "Node.js",
  "Express",
  "Python",
  "FastAPI",
  "Django",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Power BI",
  "Figma",
  "Design System",
  "Acessibilidade",
  "AWS",
  "Docker",
  "CI/CD",
];

const AREA_KEYWORDS = {
  Desenvolvimento: [
    "front",
    "back",
    "full",
    "api",
    "node",
    "react",
    "typescript",
    "javascript",
    "python",
    "java",
    ".net",
  ],
  Dados: [
    "bi",
    "dashboard",
    "power bi",
    "sql",
    "etl",
    "pipelines",
    "modelagem",
    "análise",
    "big data",
  ],
  Design: [
    "ux",
    "ui",
    "figma",
    "wireframe",
    "prototip",
    "acessibilidad",
    "design system",
  ],
  Infraestrutura: ["devops", "aws", "docker", "k8s", "jenkins", "infra", "iac"],
  Sistemas: ["erp", "protheus", "totvs", "gestão", "integr"],
};

// Extrai habilidades e área a partir de texto livre (sem modelo ou com fallback)
router.post("/ai/extract", async (req, res) => {
  const { text = "" } = req.body || {};
  const t = String(text).toLowerCase();

  const habilidadesTecnicas = KNOWN_SKILLS.filter((s) =>
    t.includes(s.toLowerCase())
  );

  let area = "";
  let maxHits = 0;
  for (const [k, words] of Object.entries(AREA_KEYWORDS)) {
    const hits = words.reduce(
      (acc, w) => acc + (t.includes(w.toLowerCase()) ? 1 : 0),
      0
    );
    if (hits > maxHits) {
      maxHits = hits;
      area = k;
    }
  }

  const softSkills = [];
  if (t.includes("comunica")) softSkills.push("Comunicação");
  if (t.includes("lider")) softSkills.push("Liderança");
  if (t.includes("colabora")) softSkills.push("Colaboração");
  if (t.includes("resili")) softSkills.push("Resiliência");
  if (t.includes("criativ")) softSkills.push("Criatividade");

  return res.json({
    habilidadesTecnicas,
    softSkills,
    area: area || null,
    tags: [...new Set([...habilidadesTecnicas, ...softSkills])],
  });
});

// ========= Trilha de aprendizado (reskilling / upskilling) =========
const BASE_PATHS = {
  Desenvolvimento: [
    {
      id: "dev-1",
      titulo: "Fundamentos de lógica de programação",
      tipo: "curso",
      duracaoHoras: 8,
      foco: "Lógica, variáveis, estruturas de decisão e repetição",
      conteudo:
        "Nesta aula, você vai entender o que é lógica de programação, como pensar em passos, criar algoritmos simples e usar estruturas como if/else e laços de repetição. A ideia é aprender a traduzir problemas do dia a dia em uma sequência de instruções que o computador consiga executar.",
    },
    {
      id: "dev-2",
      titulo: "JavaScript moderno e DOM",
      tipo: "curso",
      duracaoHoras: 12,
      foco: "JS moderno, DOM, chamadas HTTP e boas práticas",
      conteudo:
        "Aqui você vai aprender a base de JavaScript moderno (let/const, funções, arrays, objetos) e como manipular o DOM para criar páginas interativas. Também verá como fazer requisições HTTP simples para buscar dados de uma API.",
    },
    {
      id: "dev-3",
      titulo: "Projeto prático: mini aplicação React + API",
      tipo: "projeto",
      duracaoHoras: 10,
      foco: "Construir uma aplicação integrada a uma API REST",
      conteudo:
        "Você vai montar uma pequena aplicação React que consome uma API REST, exibindo e filtrando dados. O foco é praticar componentes, estado e efeitos, conectando o front-end a um backend simples.",
    },
  ],
  Dados: [
    {
      id: "data-1",
      titulo: "Excel/Planilhas para análise de dados",
      tipo: "curso",
      duracaoHoras: 6,
      foco: "Tabelas, filtros, fórmulas e gráficos básicos",
      conteudo:
        "Nesta etapa você aprende a organizar dados em planilhas, usar filtros, fórmulas básicas (SOMA, MÉDIA, SE) e criar gráficos simples. É a base para qualquer trabalho de análise de dados.",
    },
    {
      id: "data-2",
      titulo: "Introdução a SQL para análise",
      tipo: "curso",
      duracaoHoras: 10,
      foco: "SELECT, filtros, agregações e JOINs",
      conteudo:
        "Aqui você entra no mundo de bancos de dados relacionais. Vai aprender a escrever consultas SQL para buscar, filtrar, agrupar e combinar tabelas usando JOINs. Tudo com exemplos práticos de análise.",
    },
    {
      id: "data-3",
      titulo: "Python para análise de dados",
      tipo: "curso",
      duracaoHoras: 12,
      foco: "Pandas, visualização e limpeza de dados",
      conteudo:
        "Você vai conhecer o ecossistema de dados em Python, com foco em Pandas para manipulação de tabelas, limpeza de dados e criação de visualizações simples para tirar insights.",
    },
  ],
  Design: [
    {
      id: "design-1",
      titulo: "Fundamentos de UX e UI",
      tipo: "curso",
      duracaoHoras: 8,
      foco: "Princípios de usabilidade, hierarquia visual e UI patterns",
      conteudo:
        "Nesta aula você entende o que é UX e UI, aprende princípios de usabilidade, hierarquia visual, contraste, tipografia e padrões comuns de interface que tornam um produto fácil de usar.",
    },
    {
      id: "design-2",
      titulo: "Figma na prática",
      tipo: "curso",
      duracaoHoras: 10,
      foco: "Wireframes, protótipos navegáveis e handoff",
      conteudo:
        "Você vai criar telas no Figma desde o rascunho até um protótipo navegável, aprendendo a usar componentes, auto layout e recursos básicos para colaboração e handoff para desenvolvedores.",
    },
    {
      id: "design-3",
      titulo: "Projeto prático: protótipo de app completo",
      tipo: "projeto",
      duracaoHoras: 10,
      foco: "Criar o fluxo completo de um produto digital",
      conteudo:
        "Aqui o foco é aplicar tudo que foi aprendido montando o fluxo completo de um aplicativo: mapa de navegação, telas principais, estados de erro e feedback para o usuário.",
    },
  ],
  Infraestrutura: [
    {
      id: "infra-1",
      titulo: "Fundamentos de redes e sistemas",
      tipo: "curso",
      duracaoHoras: 8,
      foco: "Conceitos de rede, servidores, sistemas operacionais",
      conteudo:
        "Você vai revisar conceitos básicos de redes (IP, DNS, HTTP), entender o papel de servidores e noções de sistemas operacionais voltadas para o dia a dia de quem cuida de infraestrutura.",
    },
    {
      id: "infra-2",
      titulo: "Introdução a Docker e containers",
      tipo: "curso",
      duracaoHoras: 8,
      foco: "Containers, imagens e orquestração básica",
      conteudo:
        "Nesta etapa você aprende o que são containers, como criar imagens, rodar serviços com Docker e organizar o ambiente de desenvolvimento de forma mais previsível.",
    },
    {
      id: "infra-3",
      titulo: "CI/CD na prática",
      tipo: "curso",
      duracaoHoras: 8,
      foco: "Pipelines de build, teste e deploy automatizado",
      conteudo:
        "Você vai entender o conceito de integração contínua e entrega contínua, configurando um pipeline simples que executa testes e faz deploy automatizado em um ambiente de teste.",
    },
  ],
  default: [
    {
      id: "base-1",
      titulo: "Fundamentos digitais e colaboração online",
      tipo: "curso",
      duracaoHoras: 4,
      foco: "Organização, comunicação e produtividade digital",
      conteudo:
        "Nesta aula você aprende boas práticas de organização de arquivos, comunicação assíncrona e uso de ferramentas colaborativas como e-mail, chats e documentos compartilhados.",
    },
    {
      id: "base-2",
      titulo: "Lógica de resolução de problemas",
      tipo: "curso",
      duracaoHoras: 6,
      foco: "Raciocínio lógico aplicado ao trabalho",
      conteudo:
        "Você vai praticar técnicas simples para decompor problemas, analisar causas e pensar em soluções passo a passo, aplicando isso em situações reais do dia a dia profissional.",
    },
  ],
};

// ===== Banco de questões por área (simulado adaptativo) =====
const QUIZ_BANK = {
  Desenvolvimento: [
    {
      id: "dev-q1",
      nivel: "iniciante",
      pergunta: "O que é uma variável em programação?",
      alternativas: [
        "Um valor fixo que nunca muda",
        "Um espaço na memória para guardar valores que podem mudar",
        "Um arquivo de configuração do sistema",
        "Um tipo especial de banco de dados",
      ],
      corretaIndex: 1,
      explicacao:
        "Variáveis são espaços na memória usados para armazenar valores que podem mudar durante a execução do programa.",
    },
    {
      id: "dev-q2",
      nivel: "iniciante",
      pergunta: "Qual destas opções é um exemplo de linguagem de programação?",
      alternativas: ["HTML", "CSS", "JavaScript", "HTTP"],
      corretaIndex: 2,
      explicacao:
        "JavaScript é uma linguagem de programação. HTML e CSS são linguagens de marcação e estilo, e HTTP é um protocolo.",
    },
    {
      id: "dev-q3",
      nivel: "intermediario",
      pergunta: "O que é uma API REST?",
      alternativas: [
        "Um tipo de banco de dados relacional",
        "Um padrão para construir serviços web usando HTTP",
        "Um servidor de arquivos",
        "Uma ferramenta de design de telas",
      ],
      corretaIndex: 1,
      explicacao:
        "APIs REST seguem um conjunto de princípios para expor recursos via HTTP, usando verbos como GET, POST, PUT e DELETE.",
    },
    {
      id: "dev-q4",
      nivel: "intermediario",
      pergunta: "No React, o que é um componente?",
      alternativas: [
        "Um arquivo CSS",
        "Uma função ou classe que retorna elementos de interface",
        "Um tipo de banco de dados",
        "Uma variável global",
      ],
      corretaIndex: 1,
      explicacao:
        "Componentes são blocos reutilizáveis de UI em React, geralmente implementados como funções que retornam JSX.",
    },
    {
      id: "dev-q5",
      nivel: "avancado",
      pergunta:
        "Por que é importante lidar com estados assíncronos em aplicações web?",
      alternativas: [
        "Porque o JavaScript não suporta operações síncronas",
        "Porque quase tudo (requisições, timers) acontece em momentos diferentes no tempo",
        "Para evitar o uso de variáveis",
        "Para não precisar testar o código",
      ],
      corretaIndex: 1,
      explicacao:
        "Em aplicações web, muitas operações são assíncronas (requisições HTTP, timers, eventos de usuário), e o estado precisa refletir essas mudanças de forma previsível.",
    },
  ],
  Dados: [
    {
      id: "data-q1",
      nivel: "iniciante",
      pergunta: "Para que serve uma planilha (como Excel ou Google Sheets)?",
      alternativas: [
        "Apenas para escrever textos longos",
        "Para armazenar e organizar dados em linhas e colunas",
        "Para compilar código",
        "Para hospedar sites",
      ],
      corretaIndex: 1,
      explicacao:
        "Planilhas são muito usadas para organizar dados em tabelas, fazer cálculos e criar gráficos simples.",
    },
    {
      id: "data-q2",
      nivel: "iniciante",
      pergunta: "O que é SQL?",
      alternativas: [
        "Uma biblioteca de Python",
        "Uma linguagem para consultar e manipular dados em bancos relacionais",
        "Um tipo de gráfico",
        "Um editor de planilhas",
      ],
      corretaIndex: 1,
      explicacao:
        "SQL (Structured Query Language) é a linguagem padrão para trabalhar com bancos de dados relacionais.",
    },
    {
      id: "data-q3",
      nivel: "intermediario",
      pergunta:
        "O que significa 'limpar dados' em um projeto de análise de dados?",
      alternativas: [
        "Apagar todos os registros antigos",
        "Corrigir, padronizar e tratar valores faltantes ou inconsistentes",
        "Converter tudo para texto",
        "Tornar os dados confidenciais",
      ],
      corretaIndex: 1,
      explicacao:
        "Limpeza de dados envolve tratar valores faltantes, remover duplicados e corrigir inconsistências para garantir qualidade nas análises.",
    },
    {
      id: "data-q4",
      nivel: "intermediario",
      pergunta: "Qual é o objetivo principal de um dashboard em BI?",
      alternativas: [
        "Armazenar dados brutos",
        "Configurar servidores",
        "Consolidar indicadores em uma visualização clara para tomada de decisão",
        "Substituir apresentações em slides",
      ],
      corretaIndex: 2,
      explicacao:
        "Dashboards reúnem indicadores e gráficos em uma visão única, facilitando a interpretação rápida de resultados e tendências.",
    },
  ],
  Design: [
    {
      id: "design-q1",
      nivel: "iniciante",
      pergunta: "O que significa UX em design de produtos digitais?",
      alternativas: [
        "User eXecution",
        "User eXperience",
        "Unified eXchange",
        "Universal eXtension",
      ],
      corretaIndex: 1,
      explicacao:
        "UX significa User Experience e está relacionado à experiência completa que a pessoa tem ao usar um produto ou serviço.",
    },
    {
      id: "design-q2",
      nivel: "iniciante",
      pergunta: "Qual ferramenta é comumente usada para prototipagem de interfaces?",
      alternativas: ["Excel", "Figma", "Postman", "Jenkins"],
      corretaIndex: 1,
      explicacao:
        "Figma é uma ferramenta popular para criação de interfaces, protótipos e sistemas de design.",
    },
    {
      id: "design-q3",
      nivel: "intermediario",
      pergunta: "Por que acessibilidade é importante em interfaces digitais?",
      alternativas: [
        "Apenas para cumprir leis",
        "Para reduzir custos de desenvolvimento",
        "Para garantir que pessoas com diferentes necessidades consigam usar o produto",
        "Para deixar a interface mais colorida",
      ],
      corretaIndex: 2,
      explicacao:
        "Acessibilidade garante que pessoas com diferentes limitações (visuais, motoras, cognitivas) consigam usar o produto com autonomia.",
    },
  ],
  Infraestrutura: [
    {
      id: "infra-q1",
      nivel: "iniciante",
      pergunta: "O que é um container (como Docker)?",
      alternativas: [
        "Um tipo de banco de dados",
        "Um pacote isolado com aplicação e suas dependências",
        "Um protocolo de rede",
        "Um servidor físico",
      ],
      corretaIndex: 1,
      explicacao:
        "Containers empacotam aplicação e dependências em um ambiente isolado e portátil, facilitando deploy e consistência.",
    },
    {
      id: "infra-q2",
      nivel: "intermediario",
      pergunta: "O que significa CI/CD?",
      alternativas: [
        "Continuous Integration / Continuous Delivery",
        "Cloud Integration / Cloud Database",
        "Central Interface / Core Design",
        "Code Injection / Code Destruction",
      ],
      corretaIndex: 0,
      explicacao:
        "CI/CD é um conjunto de práticas para integrar código continuamente e automatizar entregas e deploy.",
    },
    {
      id: "infra-q3",
      nivel: "intermediario",
      pergunta: "Por que monitorar serviços em produção é essencial?",
      alternativas: [
        "Para aumentar o consumo de CPU",
        "Para detectar problemas rapidamente e agir antes do usuário ser afetado",
        "Apenas para gerar relatórios mensais",
        "Porque garante que o código nunca terá bugs",
      ],
      corretaIndex: 1,
      explicacao:
        "Monitorar serviços permite identificar falhas, lentidão ou uso excessivo de recursos antes que impactem os usuários.",
    },
  ],
  default: [
    {
      id: "base-q1",
      nivel: "iniciante",
      pergunta: "O que é aprender de forma contínua (lifelong learning)?",
      alternativas: [
        "Estudar somente na época da escola",
        "Buscar novos conhecimentos ao longo de toda a carreira",
        "Aprender apenas quando a empresa exige",
        "Focar só em cursos longos e formais",
      ],
      corretaIndex: 1,
      explicacao:
        "Aprendizado contínuo significa manter o hábito de aprender ao longo da vida, acompanhando mudanças do mercado e da tecnologia.",
    },
    {
      id: "base-q2",
      nivel: "iniciante",
      pergunta: "Qual é uma boa prática para consolidar um novo conhecimento?",
      alternativas: [
        "Apenas assistir vídeos",
        "Repetir o conteúdo sem aplicar",
        "Colocar em prática em pequenos projetos ou exercícios",
        "Evitar falar sobre o tema com outras pessoas",
      ],
      corretaIndex: 2,
      explicacao:
        "Aplicar o que você aprendeu em pequenos projetos ou exercícios ajuda o cérebro a fixar melhor o conteúdo.",
    },
  ],
};

router.get("/ai/quiz-bank", async (req, res) => {
  const area = (req.query.area || "Desenvolvimento").trim();
  const bank =
    QUIZ_BANK[area] ||
    QUIZ_BANK.Dados ||
    QUIZ_BANK.Design ||
    QUIZ_BANK.Infraestrutura ||
    QUIZ_BANK.default ||
    [];
  res.json({
    area,
    total: bank.length,
    questoes: bank,
  });
});

router.post("/ai/learning-plan", async (req, res) => {
  const client = getOpenAI();
  const body = req.body || {};
  const profile = body.profile || {};
  const objetivo = body.objetivo || profile.cargo || "Evoluir na carreira";

  const area = profile.area || body.area || "Desenvolvimento";
  const trilhaBase = BASE_PATHS[area] || BASE_PATHS.default;

  // cálculo simples de "nível" com base na quantidade de skills técnicas
  const skillsCount = Array.isArray(profile.habilidadesTecnicas)
    ? profile.habilidadesTecnicas.length
    : 0;
  const nivelAtual =
    skillsCount === 0 ? "iniciante" : skillsCount < 6 ? "intermediário" : "avançado";

  // monta um plano local usando também padrões do profiles.json
  async function buildPersonalizedTrail() {
    let dynamicSteps = [];
    try {
      const all = await readJson(PROFILES);
      const peers = all.filter((p) => p.area === area);
      const freq = new Map();
      for (const p of peers) {
        const skills = Array.isArray(p.habilidadesTecnicas)
          ? p.habilidadesTecnicas
          : [];
        for (const s of skills) {
          const key = String(s).trim();
          if (!key) continue;
          freq.set(key, (freq.get(key) || 0) + 1);
        }
      }

      const userSkills = new Set(
        (profile.habilidadesTecnicas || []).map((s) => String(s).trim())
      );
      const gapSkills = Array.from(freq.entries())
        .filter(([s]) => !userSkills.has(s))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4)
        .map(([skill]) => skill);

      dynamicSteps = gapSkills.map((skill, idx) => ({
        id: `gap-${idx}-${String(skill).toLowerCase()}`,
        titulo: `Prática guiada em ${skill}`,
        tipo: "curso",
        duracaoHoras: 4,
        foco: `Desenvolver ${skill} a partir de exemplos práticos e exercícios introdutórios.`,
        conteudo: `Nesta etapa você foca em ${skill}. Comece entendendo o conceito, depois veja exemplos simples e, por fim, tente aplicar em um mini projeto pessoal. Use materiais curtos (vídeos ou artigos) e anote dúvidas para revisar com a mentoria.`,
      }));
    } catch (e) {
      console.error("Erro ao personalizar trilha com profiles.json:", e);
    }

    return {
      objetivo,
      areaAlvo: area,
      nivelAtual,
      trilha: [...trilhaBase, ...dynamicSteps],
      observacoes: [
        "Plano gerado com base na área informada e nas habilidades mais comuns entre outros perfis cadastrados.",
        "Os módulos extras destacam skills em alta que ainda não aparecem no seu card.",
        "Ao configurar OPENAI_API_KEY no backend, o plano passa a ser refinado e reescrito por IA.",
      ],
    };
  }

  async function localPlan() {
    const payload = await buildPersonalizedTrail();
    return res.json(payload);
  }

  if (!client) {
    return localPlan();
  }

  try {
    const prompt = `
Você é um mentor de carreira focado em reskilling e upskilling.
Receberá um perfil em JSON e deve devolver APENAS um JSON válido com o seguinte formato:
{
  "objetivo": "string",
  "areaAlvo": "string",
  "nivelAtual": "iniciante|intermediário|avançado",
  "trilha": [
    {
      "id": "string-curta",
      "titulo": "string",
      "tipo": "curso|vídeo|artigo|projeto|simulado",
      "duracaoHoras": 0,
      "foco": "string curta explicando o foco da etapa",
      "conteudo": "texto curto (uma ou duas seções) explicando de forma bem introdutória o assunto da etapa"
    }
  ],
  "observacoes": ["lista", "de", "insights", "curtos"]
}

Regras:
- Sempre responda em PT-BR.
- Adapte a trilha para o objetivo e área do perfil.
- Use no máximo 6 etapas na trilha.

Perfil:
${JSON.stringify(profile, null, 2)}
Objetivo declarado: ${objetivo}
Área alvo sugerida: ${area}
`.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    const content = completion.choices[0].message.content || "{}";
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    const json = JSON.parse(content.slice(start, end + 1));

    if (json && json.trilha) {
      return res.json(json);
    }
    return localPlan();
  } catch (e) {
    console.error("AI /learning-plan error:", e);
    return localPlan();
  }
});

// Mentoria com IA: tira dúvidas sobre carreira, plano e conteúdo
router.post("/ai/mentor", async (req, res) => {
  const client = getOpenAI();
  const body = req.body || {};
  const mensagem = String(body.mensagem || "").trim();
  const profile = body.perfil || {};
  const plano = body.plano || null;

  if (!mensagem) {
    return res.status(400).json({ error: "mensagem é obrigatória" });
  }

  // Fallback simples sem IA
  async function localMentor() {
    const nome = profile.nome || "profissional";
    const area = profile.area || "sua área";
    const resposta =
      `Olá, ${nome}! Pelo que vejo, você está focando em ${area}. ` +
      `Minha sugestão é transformar sua dúvida em pequenos passos: ` +
      `1) anote o que você já sabe, 2) escreva o que ainda não está claro, ` +
      `3) conecte essa lacuna com uma etapa do seu plano de aprendizado ` +
      `(por exemplo, revise a etapa mais básica antes de avançar). ` +
      `Use a trilha como um mapa: volte um passo quando sentir que está travado.`;
    return res.json({ resposta });
  }

  if (!client) {
    return localMentor();
  }

  try {
    const prompt = `
Você é um mentor de carreira e estudos para profissionais em transição ou crescimento.
Ajude o usuário a estudar, tirar dúvidas e manter motivação, sempre em PT-BR, objetivo e didático.

Contexto do perfil (JSON):
${JSON.stringify(profile, null, 2)}

Contexto do plano de aprendizado (JSON, se houver):
${JSON.stringify(plano, null, 2)}

Mensagem do usuário:
${mensagem}

Responda em tom acolhedor, em até 3 parágrafos curtos, podendo sugerir exercícios práticos relacionados à trilha do plano.
`.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const content = completion.choices[0].message.content || "";
    return res.json({ resposta: content.trim() });
  } catch (e) {
    console.error("AI /mentor error:", e);
    return localMentor();
  }
});

// Gera headline curta, melhora "resumo" e sugere 5 skills a partir do perfil
router.post("/ai/summary", async (req, res) => {
  const client = getOpenAI();
  if (!client) {
    return res.status(503).json({
      error: "AI offline: defina OPENAI_API_KEY no backend/.env",
    });
  }

  try {
    const profile = req.body?.profile || {};
    const prompt = `
Você é um assistente de carreiras. Dado o perfil JSON abaixo, gere:
- "headline": um título curto e marcante (máx. 60 caracteres)
- "resumo": de 1 a 2 frases com impacto, em PT-BR
- "skillsSugeridas": até 5 habilidades técnicas adicionais que façam sentido

Responda somente em JSON válido.

Perfil:
${JSON.stringify(profile, null, 2)}
`.trim();

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    const content = completion.choices[0].message.content || "{}";
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    const json = JSON.parse(content.slice(start, end + 1));
    res.json(json);
  } catch (e) {
    console.error("AI /summary error:", e);
    res.status(500).json({ error: "Falha na IA" });
  }
});

export default router;

