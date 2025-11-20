import { Router } from "express";
import {
  dataPath,
  ensureFile,
  readJson,
  writeJson,
} from "../utils/jsonStore.js";

const router = Router();

// arquivo: backend/data/messages.json
const MESSAGES = dataPath("messages.json");

// garante que o arquivo existe ([] se não existir)
await ensureFile(MESSAGES, []);

// gera próximo id numérico
function nextId(items) {
  const max = items.reduce((m, it) => Math.max(m, Number(it.id || 0)), 0);
  return max + 1;
}

/**
 * POST /messages
 * body: { toId, text, fromName?, fromContact? }
 */
router.post("/messages", async (req, res) => {
  try {
    const { toId, text, fromName, fromContact } = req.body || {};

    if (!toId || !text) {
      return res
        .status(400)
        .json({ error: "Campos obrigatórios: toId e text" });
    }

    const all = await readJson(MESSAGES);

    const msg = {
      id: nextId(all),
      toId,                         // id do perfil de destino
      text,                         // mensagem digitada
      fromName: fromName || null,   // opcional – nome de quem enviou
      fromContact: fromContact || null, // opcional – e-mail, LinkedIn etc.
      createdAt: new Date().toISOString(),
    };

    all.push(msg);
    await writeJson(MESSAGES, all);

    return res.status(201).json(msg);
  } catch (e) {
    console.error("ERRO /messages:", e);
    return res.status(500).json({ error: "Erro ao salvar mensagem" });
  }
});

/**
 * GET /messages?toId=123
 * Lista mensagens, opcionalmente filtrando pelo perfil
 */
router.get("/messages", async (req, res) => {
  try {
    const { toId } = req.query;
    const all = await readJson(MESSAGES);

    const filtered = toId
      ? all.filter((m) => String(m.toId) === String(toId))
      : all;

    return res.json(filtered);
  } catch (e) {
    console.error("ERRO GET /messages:", e);
    return res.status(500).json({ error: "Erro ao listar mensagens" });
  }
});

export default router;
