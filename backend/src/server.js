// backend/src/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import recommendRoutes from "./routes/recommend.routes.js";
import messagesRoutes from "./routes/messages.routes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "5mb" }));

// ✔️ Servir a pasta data para fallback do front
app.use("/data", express.static(path.join(__dirname, "../data")));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/health", (_, res) => res.json({ ok: true }));

// Rotas
app.use("/", authRoutes);
app.use("/", profileRoutes);
app.use("/", aiRoutes);
app.use("/", uploadRoutes);
app.use("/", recommendRoutes);
app.use("/", messagesRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Rota não encontrada" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API on`);
});
