// frontend/src/lib/api.js
import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL;

// Instância Axios com timeout e baseURL
const api = axios.create({
  baseURL: API_URL,
  timeout: 12000,
});

// ---- Interceptors ----

// Injeta token em todas as requisições
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

// Normaliza mensagens de erro
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      "Erro de comunicação com o servidor";
    return Promise.reject(new Error(msg));
  }
);

/* ========= AUTH ========= */
export async function login(username, password) {
  const { data } = await api.post("/login", { username, password });
  return data; // { message, token }
}

export async function register(username, password) {
  const { data } = await api.post("/register", { username, password });
  return data; // { message, user }
}

/* ========= PERFIS ========= */
export async function createProfile(profile) {
  const { data } = await api.post("/profiles", profile);
  return data;
}

export async function fetchProfiles({ page = 1, pageSize = 60 } = {}) {
  const { data } = await api.get("/profiles", { params: { page, pageSize } });
  // suporta API que responde { items: [...] } ou array direto
  return data.items ?? data;
}

/* ========= IA (SUGESTÕES) ========= */
export async function aiSuggest(payload) {
  try {
    const { data } = await api.post("/ai/suggest", payload);
    return data || { items: [] };
  } catch {
    return { items: [] };
  }
}

/* ========= IA (EXTRACT + SUMMARY) =========
   Se o backend não tiver essas rotas, usa um fallback local. */
export async function aiExtract(text) {
  try {
    const { data } = await api.post("/ai/extract", { text });
    return data || { habilidadesTecnicas: [], softSkills: [], area: "" };
  } catch {
    const lower = String(text || "").toLowerCase();
    const skills = [];
    ["react", "node", "java", "c#", "python", "sql", "docker", "aws", "tailwind"].forEach((k) => {
      if (lower.includes(k)) skills.push(k[0].toUpperCase() + k.slice(1));
    });
    return {
      habilidadesTecnicas: skills,
      softSkills: [],
      area: lower.includes("dados")
        ? "Dados"
        : lower.includes("design")
        ? "Design"
        : "Desenvolvimento",
    };
  }
}

export async function aiSummary(payload) {
  try {
    const { data } = await api.post("/ai/summary", payload);
    return data || { resumo: "", skillsSugeridas: [] };
  } catch {
    const { nome = "", cargo = "", localizacao = "", area = "" } = payload || {};
    return {
      resumo: `${nome || "Profissional"} atuando em ${cargo || "sua área"}, localizado em ${
        localizacao || "..."
      }. Foco em ${area || "Tecnologia"} e evolução contínua.`,
      skillsSugeridas: [],
    };
  }
}

/* ========= IA (Plano de aprendizado) ========= */
function buildLocalLearningPlan(profile = {}) {
  const area = profile.area || "Desenvolvimento";
  const cargo = profile.cargo || "Profissional";
  const skills = Array.isArray(profile.habilidadesTecnicas)
    ? profile.habilidadesTecnicas
    : [];

  const nivelAtual =
    skills.length === 0 ? "iniciante" : skills.length < 6 ? "intermediario" : "avancado";

  const baseByArea = {
    Desenvolvimento: [
      {
        id: "dev-1",
        titulo: "Logica de programacao na pratica",
        tipo: "curso",
        duracaoHoras: 6,
        foco: "Rever logica, estruturas de decisao e repeticao.",
        conteudo:
          "Nesta aula, voce revisa conceitos basicos de logica e aprende a quebrar problemas em passos menores. " +
          "Comece escrevendo algoritmos em portugues estruturado, depois traduza para pseudocodigo e somente entao para codigo real.",
      },
      {
        id: "dev-2",
        titulo: "Fundamentos web: HTML, CSS e JS",
        tipo: "curso",
        duracaoHoras: 8,
        foco: "Criar paginas simples e interativas.",
        conteudo:
          "Monte uma landing page simples com HTML e CSS. Em seguida, use JavaScript para adicionar interacoes como abrir/fechar modais e validar formularios.\n\n" +
          "Exercicio: crie uma mini pagina de portfolio com seu nome, resumo e lista de projetos.",
      },
      {
        id: "dev-3",
        titulo: "Projeto guiado com React e API",
        tipo: "projeto",
        duracaoHoras: 10,
        foco: "Consumir uma API e montar uma lista com filtros.",
        conteudo:
          "A ideia aqui e montar uma pequena aplicacao usando React ou outra biblioteca de componentes. " +
          "Use uma API publica (ou o proprio backend do SkillUp) para listar itens, aplicar busca e filtros.\n\n" +
          "Exercicio: liste perfis, permita filtrar por area e estado e abra um detalhe ao clicar.",
      },
    ],
    Dados: [
      {
        id: "data-1",
        titulo: "Planilhas para analise rapida",
        tipo: "curso",
        duracaoHoras: 4,
        foco: "Organizar dados, usar filtros e formulas simples.",
        conteudo:
          "Use uma planilha para registrar dados de vendas ficticias. " +
          "Aplique filtros, crie colunas calculadas (total = quantidade x preco) e um grafico simples.\n\n" +
          "Exercicio: monte um pequeno dashboard com top 5 produtos e total por mes.",
      },
      {
        id: "data-2",
        titulo: "SQL essencial para analise",
        tipo: "curso",
        duracaoHoras: 8,
        foco: "SELECT, filtros, agregacoes e joins.",
        conteudo:
          "Pratique consultas em um banco de dados de exemplo. " +
          "Comece com SELECT basico, depois adicione WHERE, GROUP BY e JOIN entre duas tabelas.\n\n" +
          "Exercicio: responda perguntas de negocio, como 'qual produto mais vendeu em cada mes?'.",
      },
      {
        id: "data-3",
        titulo: "Python para exploracao de dados",
        tipo: "curso",
        duracaoHoras: 10,
        foco: "Carregar dados, limpar e gerar graficos.",
        conteudo:
          "Usando Python (pandas), carregue um CSV, trate valores faltantes e crie graficos simples.\n\n" +
          "Exercicio: crie um notebook com 3 perguntas e 3 graficos respondendo cada uma delas.",
      },
    ],
    Design: [
      {
        id: "design-1",
        titulo: "Fundamentos de UX e UI",
        tipo: "curso",
        duracaoHoras: 6,
        foco: "Principios de usabilidade e hierarquia visual.",
        conteudo:
          "Revise principios basicos como hierarquia, contraste, proximidade e alinhamento.\n\n" +
          "Exercicio: escolha uma tela que voce usa no dia a dia e desenhe uma versao melhorada em papel.",
      },
      {
        id: "design-2",
        titulo: "Figma do zero ao prototipo",
        tipo: "curso",
        duracaoHoras: 8,
        foco: "Criar wireframes e prototipos navegaveis.",
        conteudo:
          "No Figma, crie um fluxo simples (por exemplo: login, home, detalhes). Use componentes basicos e auto layout.\n\n" +
          "Exercicio: crie um prototipo clicavel e compartilhe com alguem para navegar e dar feedback.",
      },
    ],
    Infraestrutura: [
      {
        id: "infra-1",
        titulo: "Fundamentos de redes e servidores",
        tipo: "curso",
        duracaoHoras: 6,
        foco: "Entender como aplicacoes conversam na rede.",
        conteudo:
          "Revise conceitos como HTTP, DNS, portas e requisicao/resposta.\n\n" +
          "Exercicio: desenhe um diagrama simples mostrando navegador, servidor e banco de dados.",
      },
      {
        id: "infra-2",
        titulo: "Primeiros passos com containers",
        tipo: "curso",
        duracaoHoras: 6,
        foco: "Rodar uma aplicacao simples em Docker.",
        conteudo:
          "Aprenda a criar uma imagem simples e roda-la localmente.\n\n" +
          "Exercicio: suba uma aplicacao simples em um container e anote os comandos usados.",
      },
    ],
  };

  const base = baseByArea[area] || baseByArea.Desenvolvimento;

  const extras = [];
  if (!skills.length) {
    extras.push({
      id: "extra-inicio",
      titulo: "Como estudar de forma continua",
      tipo: "artigo",
      duracaoHoras: 2,
      foco: "Definir rotina de estudo e metas semanais.",
      conteudo:
        "Defina 3 momentos da semana para estudar. Escreva o que quer aprender, ate quando e como vai praticar. " +
        "Revise essa lista a cada 15 dias.",
    });
  } else if (skills.length >= 3) {
    extras.push({
      id: "extra-projeto",
      titulo: "Projeto integrador com o que voce ja sabe",
      tipo: "projeto",
      duracaoHoras: 8,
      foco: "Juntar varias habilidades em um unico projeto.",
      conteudo:
        "Escolha um problema simples do dia a dia e tente resolve-lo com as habilidades que ja tem.\n\n" +
        "Exercicio: escreva um resumo do projeto (problema, solucao, tecnologias) e adicione ao seu card.",
    });
  }

  return {
    objetivo: cargo || "Evoluir na carreira",
    areaAlvo: area,
    nivelAtual,
    trilha: [...base, ...extras],
    observacoes: [
      "Plano gerado localmente a partir da area e das habilidades informadas no card.",
      "Use cada etapa como ponto de partida e ajuste o ritmo ao seu dia a dia.",
    ],
  };
}

export async function aiLearningPlan(profile) {
  try {
    const { data } = await api.post("/ai/learning-plan", { profile });
    if (data && Array.isArray(data.trilha) && data.trilha.length) {
      return data;
    }
  } catch {
    // ignora erro e cai no plano local
  }
  return buildLocalLearningPlan(profile);
}

/* ========= IA (Quiz / Simulado) ========= */
export async function aiQuizBank(area) {
  try {
    const { data } = await api.get("/ai/quiz-bank", {
      params: { area },
    });
    return data || { area, total: 0, questoes: [] };
  } catch {
    return { area, total: 0, questoes: [] };
  }
}

/* ========= IA (Mentoria) ========= */
export async function aiMentor({ mensagem, perfil, plano }) {
  try {
    const { data } = await api.post("/ai/mentor", { mensagem, perfil, plano });
    return data || { resposta: "" };
  } catch {
    return {
      resposta:
        "No momento a mentoria automática não está disponível. Tente reformular sua dúvida ou revisar o plano de aprendizado.",
    };
  }
}

/* ========= UPLOAD DE FOTO ========= */
export async function uploadPhoto(file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post("/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  // esperado: { url: "http://.../uploads/arquivo.png" }
  return data;
}

/* ========= MESSAGES ========= */
// Salva mensagem em data/messages.json via rota /messages
export async function sendMessage(payload) {
  // payload: { toId, text, fromName?, fromContact? }
  const { data } = await api.post("/messages", payload);
  return data;
}

export default api;

/* ========= RECOMMEND ========= */
export async function recommendProfile(payload) {
  try {
    const { data } = await api.post("/recommend", payload);
    return data || { items: [] };
  } catch {
    return { items: [] };
  }
}
