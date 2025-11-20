// backend/src/routes/recommend.routes.js
import { Router } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, "../../data");
const filePath = path.join(dataDir, "recommendations.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "[]", "utf-8");
  }
}

function readAll() {
  ensureStore();
  try {
    const txt = fs.readFileSync(filePath, "utf-8");
    const arr = JSON.parse((txt || "[]").trim());
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error("[recommend] read error:", e);
    return [];
  }
}

function writeAll(arr) {
  ensureStore();
  fs.writeFileSync(filePath, JSON.stringify(arr, null, 2), "utf-8");
}

// POST /recommend  { toId, message, from }
router.post("/recommend", (req, res) => {
  try {
    const { toId, message, from } = req.body || {};
    if (!toId || !message) {
      return res
        .status(400)
        .json({ error: "toId e message são obrigatórios" });
    }

    const all = readAll();
    const rec = {
      id: Date.now(),
      toId,
      message,
      from: from || "anon",
      createdAt: new Date().toISOString(),
    };
    all.push(rec);
    writeAll(all);

    return res.json({ ok: true, recommendation: rec });
  } catch (e) {
    console.error("ERRO /recommend:", e);
    return res
      .status(500)
      .json({ error: "Erro interno ao salvar recomendação" });
  }
});

// GET /recommendations?toId=123
router.get("/recommendations", (req, res) => {
  try {
    const { toId } = req.query;
    const all = readAll();
    const filtered = toId
      ? all.filter((r) => String(r.toId) === String(toId))
      : all;
    return res.json(filtered);
  } catch (e) {
    console.error("ERRO /recommendations:", e);
    return res.status(500).json({ error: "Erro ao listar recomendações" });
  }
});

export default router;
