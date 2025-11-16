// frontend/src/lib/api.js
import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
