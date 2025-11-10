import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();
const TOKEN_EXPIRATION = '1h';

// POST /register
router.post('/register', async (req, res) => {
  const { username, password } = req.body; // em prod -> bcrypt

  try {
    if (!username || !password) {
      return res.status(400).json({ error: 'Username e password são obrigatórios' });
    }

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) return res.status(409).json({ error: 'Usuário já existe' });

    const user = await prisma.user.create({ data: { username, password } });

    return res.status(201).json({
      message: 'Usuário cadastrado com sucesso',
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error('Erro /register:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.SECRET_KEY, {
      expiresIn: TOKEN_EXPIRATION
    });

    return res.json({ message: 'Login bem-sucedido', token });
  } catch (err) {
    console.error('Erro /login:', err);
    return res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
