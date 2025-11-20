// backend/src/routes/profile.routes.js
import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from '../middlewares/auth.js';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const dataDir = path.join(__dirname, "../../data");
const filePath = path.join(dataDir, "profiles.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "[]", "utf-8");
}
function safeParseJson(txt) {
  // remove BOM + espaços
  const clean = txt.replace(/^\uFEFF/, "").trim();
  return JSON.parse(clean);
}
function readAll() {
  ensureStore();
  try {
    const txt = fs.readFileSync(filePath, "utf-8");
    const arr = safeParseJson(txt);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error("[profiles] read error:", e.message);
    return [];
  }
}
function writeAll(arr) {
  ensureStore();
  console.log("[profiles] write:", filePath, "len=", arr.length);
  fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), "utf-8");
}
function nextId(arr) {
  const max = arr.reduce((m, i) => Math.max(m, Number(i.id || 0)), 0);
  return max + 1;
}

/* ======= DEBUGS (antes de /:id !) ======= */
router.get("/profiles/__debug", (_req, res) => {
  const all = readAll();
  res.json({
    filePath,
    count: all.length,
    firstId: all[0]?.id ?? null,
    lastId: all[all.length - 1]?.id ?? null,
  });
});
router.get("/profiles/__validate", (_req, res) => {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    safeParseJson(raw);
    res.json({ ok: true, filePath });
  } catch (e) {
    res.status(422).json({ ok: false, filePath, parseError: e.message });
  }
});

/* ======= LISTA PAGINADA ======= */
// GET /profiles?page=1&pageSize=60
router.get("/profiles", verifyToken, (req, res) => {
  const page = Number(req.query.page || 1);
  const pageSize = Number(req.query.pageSize || 60);

  const all = readAll();
  const total = all.length;
  const start = (page - 1) * pageSize;
  const items = all.slice(start, start + pageSize);

  res.json({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
});

/* ======= DETALHE ======= */
router.get("/profiles/:id", (req, res) => {
  const id = String(req.params.id);
  const all = readAll();
  const it = all.find((p) => String(p.id) === id);
  if (!it) return res.status(404).json({ error: "Perfil não encontrado" });
  res.json(it);
});

/* ======= CRIAR (sempre adiciona no FINAL) ======= */
router.post("/profiles", (req, res) => {
  const b = req.body || {};
  for (const k of ["nome", "cargo"]) {
    if (!b[k]) return res.status(400).json({ error: `Campo obrigatório: ${k}` });
  }

  const all = readAll();
  const profile = {
    id: nextId(all),
    nome: b.nome,
    foto: b.foto || "https://i.pravatar.cc/150",
    cargo: b.cargo,
    resumo: b.resumo || "",
    localizacao: b.localizacao || "",
    area: b.area || "Desenvolvimento",
    habilidadesTecnicas: b.habilidadesTecnicas || [],
    softSkills: b.softSkills || [],
    experiencias: b.experiencias || [],
    formacao: b.formacao || [],
    projetos: b.projetos || [],
    certificacoes: b.certificacoes || [],
    idiomas: b.idiomas || [],
    areasInteresse: b.areasInteresse || [],
    createdAt: new Date().toISOString(),
  };

  all.push(profile); // ⬅️ vai para o FINAL
  writeAll(all);
  res.status(201).json(profile);
});

export default router;
