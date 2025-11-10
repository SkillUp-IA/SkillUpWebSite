import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';

dotenv.config();

const app = express();
app.use(cors());            // libera o front (React) consumir
app.use(express.json());    // parse de JSON do body

// Healthcheck simples
app.get('/health', (_, res) => res.json({ ok: true, env: 'dev' }));

// Rotas
app.use('/', authRoutes);
app.use('/', profileRoutes);

// 404 padrão
app.use((req, res) => res.status(404).json({ error: 'Rota não encontrada' }));

// erro genérico (catch-all)
app.use((err, req, res, next) => {
  console.error('Unhandled', err);
  res.status(500).json({ error: 'Erro interno' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
