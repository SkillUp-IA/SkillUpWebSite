import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '../middlewares/auth.js';

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /profiles
 * Query params:
 *  - q (search em nome/cargo/resumo)
 *  - area
 *  - localizacao
 *  - skill (busca dentro de habilidadesTecnicas)
 *  - page (default 1)
 *  - pageSize (default 12)
 */
router.get('/profiles', async (req, res) => {
  try {
    const {
      q,
      area,
      localizacao,
      skill,
      page = 1,
      pageSize = 12,
    } = req.query;

    const where = {};

    if (area) where.area = area;
    if (localizacao) where.localizacao = localizacao;

    // Busca textual básica (nome/cargo/resumo)
    // Prisma no MySQL não tem "full text" direto aqui – usamos contains/insensitive
    if (q) {
      where.OR = [
        { nome: { contains: q, mode: 'insensitive' } },
        { cargo: { contains: q, mode: 'insensitive' } },
        { resumo: { contains: q, mode: 'insensitive' } },
      ];
    }

    // Filtro por skill: checa se a string aparece no JSON de habilidades
    // (simples: converte habilidadeTecnicas -> string e procura)
    if (skill) {
      where.habilidadesTecnicas = {
        // Prisma JSON: contains funciona com objetos/arrays – aqui exigimos que exista um item igual
        array_contains: [skill] // funciona quando habilidadesTecnicas é array JSON puro
      };
    }

    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const [items, total] = await Promise.all([
      prisma.profile.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, nome: true, foto: true, cargo: true, resumo: true,
          localizacao: true, area: true, habilidadesTecnicas: true, softSkills: true
        }
      }),
      prisma.profile.count({ where })
    ]);

    return res.json({
      page: Number(page),
      pageSize: Number(pageSize),
      total,
      items
    });

  } catch (err) {
    console.error('Erro GET /profiles:', err);
    return res.status(500).json({ error: 'Erro ao listar perfis' });
  }
});

/**
 * GET /profiles/:id - detalha um perfil
 */
router.get('/profiles/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const profile = await prisma.profile.findUnique({ where: { id } });
    if (!profile) return res.status(404).json({ error: 'Perfil não encontrado' });
    return res.json(profile);
  } catch (err) {
    console.error('Erro GET /profiles/:id:', err);
    return res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

/**
 * POST /profiles - cria perfil (protege se quiser)
 * body segue a tabela do enunciado; campos complexos = arrays/objetos (JSON)
 */
router.post('/profiles', verifyToken, async (req, res) => {
  try {
    const data = req.body;
    // vincula o dono do perfil ao usuário autenticado (opcional)
    data.ownerId = req.user.id;

    const created = await prisma.profile.create({ data });
    return res.status(201).json(created);
  } catch (err) {
    console.error('Erro POST /profiles:', err);
    return res.status(500).json({ error: 'Erro ao criar perfil' });
  }
});

/**
 * PUT /profiles/:id - atualiza perfil
 */
router.put('/profiles/:id', verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;

    // (opcional) checar se req.user.id === ownerId
    const updated = await prisma.profile.update({ where: { id }, data });
    return res.json(updated);
  } catch (err) {
    console.error('Erro PUT /profiles/:id:', err);
    return res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

/**
 * DELETE /profiles/:id - remove perfil
 */
router.delete('/profiles/:id', verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.profile.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    console.error('Erro DELETE /profiles/:id:', err);
    return res.status(500).json({ error: 'Erro ao remover perfil' });
  }
});

/**
 * POST /profiles/:id/recommend - “Recomendar profissional”
 * (Mock simples gravando um log no console; você pode salvar em tabela Recommendation)
 */
router.post('/profiles/:id/recommend', verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { message } = req.body ?? {};
    console.log(`[RECOMMEND] user=${req.user.username} -> profileId=${id} msg="${message || ''}"`);
    return res.json({ ok: true, message: 'Recomendação registrada (mock)' });
  } catch (err) {
    console.error('Erro /profiles/:id/recommend:', err);
    return res.status(500).json({ error: 'Erro ao recomendar' });
  }
});

/**
 * POST /profiles/:id/message - “Enviar mensagem”
 * (Mock – em prod: mandar e-mail, push, ou salvar numa tabela Messages)
 */
router.post('/profiles/:id/message', verifyToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { subject, body } = req.body;
    if (!subject || !body) return res.status(400).json({ error: 'subject e body são obrigatórios' });

    console.log(`[MESSAGE] from=${req.user.username} toProfileId=${id} subject="${subject}" body="${body}"`);
    return res.json({ ok: true, message: 'Mensagem enviada (mock)' });
  } catch (err) {
    console.error('Erro /profiles/:id/message:', err);
    return res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

export default router;
