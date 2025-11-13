// frontend/src/lib/api.js
import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({ baseURL: API_URL });

// Injeta token em todas as requisições
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token");
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

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
  return data.items ?? data; // compatível com Home.jsx
}

/* ========= IA (SUGESTÕES) ========= */
export async function aiSuggest(payload) {
  try {
    const { data } = await api.post("/ai/suggest", payload);
    return data; // { items: [...] }
  } catch {
    return { items: [] }; // fallback
  }
}

/* ========= IA (EXTRACT + SUMMARY) =========
   Chamam endpoints caso existam; se não, retornam um fallback local. */
export async function aiExtract(text) {
  try {
    const { data } = await api.post("/ai/extract", { text });
    // esperado: { habilidadesTecnicas:[], softSkills:[], area:"..." }
    return data || { habilidadesTecnicas: [], softSkills: [], area: "" };
  } catch {
    // heurística simples como quebra-galho
    const lower = String(text || "").toLowerCase();
    const skills = [];
    ["react", "node", "java", "c#", "python", "sql", "docker", "aws", "tailwind"]
      .forEach(k => lower.includes(k) && skills.push(k[0].toUpperCase() + k.slice(1)));
    return {
      habilidadesTecnicas: skills,
      softSkills: [],
      area: lower.includes("dados") ? "Dados"
           : lower.includes("design") ? "Design"
           : "Desenvolvimento",
    };
  }
}

export async function aiSummary(payload) {
  try {
    const { data } = await api.post("/ai/summary", payload);
    // esperado: { resumo:"...", skillsSugeridas:[] }
    return data || { resumo: "", skillsSugeridas: [] };
  } catch {
    const { nome = "", cargo = "", localizacao = "", area = "" } = payload || {};
    return {
      resumo: `${nome || "Profissional"} atuando em ${cargo || "sua área"}, localizado em ${localizacao || "..."}. Foco em ${area || "Tecnologia"} e evolução contínua.`,
      skillsSugeridas: [],
    };
  }
}

/* ========= UPLOAD DE FOTO =========
   Usa a rota /upload do seu backend (multer). */
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

// ===== RECOMMEND (similaridade de perfis) =====
export async function recommendProfile(payload) {
  // payload pode ser { id } ou { skills: [...], area, city, k }
  try {
    const { data } = await api.post("/recommend", payload);
    // esperado: { items: [...] }
    return data || { items: [] };
  } catch {
    // fallback se o endpoint não existir
    return { items: [] };
  }
}
