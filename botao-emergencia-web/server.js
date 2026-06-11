// ============================================================
//  server.js — Ponto de entrada da aplicação
//
//  Este arquivo só monta o app e inicia o servidor.
//  Regras de negócio ficam nos arquivos de routes/.
// ============================================================

require('dotenv').config();

const express      = require('express');
const path         = require('path');
const alertasRoute = require('./routes/alertas');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares globais ───────────────────────────────────────
app.use(express.json());               // lê body JSON
app.use(express.urlencoded({ extended: true })); // lê body de formulários
app.use(express.static('public'));     // serve arquivos estáticos

// ── Rotas ─────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Todas as rotas de alerta ficam em /routes/alertas.js
// POST   /alerta          → criar alerta
// GET    /alertas         → listar alertas
// GET    /alertas/:id     → buscar um alerta
// PATCH  /alertas/:id/status → atualizar status
// DELETE /alertas/:id    → deletar alerta
app.use('/alertas', alertasRoute);

// ── Rota 404 — qualquer rota não mapeada ──────────────────────
app.use((req, res) => {
  res.status(404).json({ erro: `Rota "${req.method} ${req.path}" não encontrada.` });
});

// ── Middleware de erro global ─────────────────────────────────
// Captura qualquer erro que não foi tratado nas rotas
app.use((err, req, res, next) => {
  console.error('Erro inesperado:', err.message);
  res.status(500).json({ erro: 'Erro interno no servidor.' });
});

// ── Iniciar servidor ──────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║  🚨 BOTÃO DE EMERGÊNCIA — servidor iniciado  ║
╚══════════════════════════════════════════════╝

✅  http://localhost:${PORT}

Rotas disponíveis:
  POST   /alertas              → registrar alerta
  GET    /alertas              → listar todos
  GET    /alertas?status=pendente → filtrar por status
  GET    /alertas?tipo=incêndio   → filtrar por tipo
  GET    /alertas/:id          → buscar um alerta
  PATCH  /alertas/:id/status   → atualizar status
  DELETE /alertas/:id          → deletar alerta
  `);
});