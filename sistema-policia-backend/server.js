// ============================================================
//  sistema-policia-backend/server.js
//  Recebe alertas do botão de emergência e exibe no painel
//  em tempo real via WebSocket.
// ============================================================

require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const {
  initializeDatabase,
  insertAlerta,
  insertNotificacao,
  getAlertas,
  getNotificacoes,
  getAlertaById,
  updateAlertaStatus,
} = require('./database/database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] },
});

const DEFAULT_PORT = Number(process.env.PORT) || 3001;
const API_KEY = process.env.POLICIA_API_KEY || 'local-dev-key';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let alertasMemoria = [];
let usuariosConectados = [];

app.post('/api/emergencia', async (req, res) => {
  const { apiKey, localizacao, dispositivo, ...resto } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

  if (apiKey !== API_KEY) {
    return res.status(401).json({ sucesso: false, mensagem: 'Chave API inválida.' });
  }

  try {
    const timestamp = new Date().toISOString();
    const alerta = {
      id: uuidv4(),
      protocolo: `EMERG-${Date.now()}`,
      tipo: resto.tipo || 'EMERGENCIA',
      status: 'ATIVO',
      prioridade: resto.prioridade || 'ALTA',
      latitude: localizacao?.latitude ?? null,
      longitude: localizacao?.longitude ?? null,
      dispositivo: dispositivo ? JSON.stringify(dispositivo) : null,
      ip_origem: ip,
      observacoes: resto.observacoes || null,
      criado_em: timestamp,
      atualizado_em: timestamp,
      timestamp,
      localizacao: localizacao
        ? {
            latitude: localizacao.latitude,
            longitude: localizacao.longitude,
            acuracia: localizacao.acuracia || 0,
          }
        : null,
      dataLocal: new Date(timestamp).toLocaleString('pt-BR'),
    };

    const salvo = await insertAlerta(alerta);
    alertasMemoria.unshift(salvo);
    if (alertasMemoria.length > 100) alertasMemoria.pop();

    const notificacao = {
      id: uuidv4(),
      alerta_id: alerta.id,
      titulo: '🚨 ALERTA DE EMERGÊNCIA',
      mensagem: `Protocolo: ${alerta.protocolo}`,
      tipo: 'ALERTA',
      lida: 0,
      criada_em: timestamp,
    };

    await insertNotificacao(notificacao);

    console.log(`🚨 [${alerta.dataLocal}] NOVO ALERTA: ${alerta.protocolo}`);

    io.emit('novo-alerta', alerta);
    io.emit('tocar-som-alerta');
    io.emit('nova-notificacao', notificacao);
    io.emit('mostrar-notificacao', {
      titulo: notificacao.titulo,
      mensagem: notificacao.mensagem,
      alerta,
      notificacao,
    });

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Alerta recebido com sucesso.',
      id: alerta.id,
      protocolo: alerta.protocolo,
    });
  } catch (err) {
    console.error('Erro ao processar alerta:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao processar o alerta.' });
  }
});

app.get('/api/alertas', async (req, res) => {
  const { status } = req.query;

  try {
    const alertas = await getAlertas(status || null);
    return res.json({ total: alertas.length, alertas });
  } catch (err) {
    console.error('Erro ao buscar alertas:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar alertas.' });
  }
});

app.get('/api/alertas/:id', async (req, res) => {
  try {
    const alerta = await getAlertaById(req.params.id);
    if (!alerta) {
      return res.status(404).json({ sucesso: false, mensagem: 'Alerta não encontrado.' });
    }
    return res.json(alerta);
  } catch (err) {
    console.error('Erro ao buscar alerta:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar alertas.' });
  }
});

app.get('/api/notificacoes', async (req, res) => {
  try {
    const lida = req.query.lida === undefined ? null : req.query.lida === 'true';
    const notificacoes = await getNotificacoes(lida);
    return res.json({ total: notificacoes.length, notificacoes });
  } catch (err) {
    console.error('Erro ao buscar notificações:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar notificações.' });
  }
});

app.patch('/api/alertas/:id/status', async (req, res) => {
  const { status, observacoes } = req.body;
  const STATUS_VALIDOS = ['ATIVO', 'EM_ATENDIMENTO', 'RESOLVIDO', 'FALSO_ALARME'];

  if (!STATUS_VALIDOS.includes(status)) {
    return res.status(400).json({
      sucesso: false,
      mensagem: `Status inválido. Use: ${STATUS_VALIDOS.join(', ')}`,
    });
  }

  try {
    const alertaAtualizado = await updateAlertaStatus(req.params.id, status, observacoes);
    if (!alertaAtualizado) {
      return res.status(404).json({ sucesso: false, mensagem: 'Alerta não encontrado.' });
    }

    io.emit('alerta-atualizado', alertaAtualizado);
    return res.json({ sucesso: true, mensagem: 'Status atualizado.', alerta: alertaAtualizado });
  } catch (err) {
    console.error('Erro ao atualizar status:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar status.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ erro: `Rota "${req.method} ${req.path}" não encontrada.` });
});

io.on('connection', async (socket) => {
  console.log(`✅ Policial conectado: ${socket.id}`);
  usuariosConectados.push(socket.id);

  try {
    const alertas = await getAlertas();
    socket.emit('carregar-alertas', alertas);
  } catch (err) {
    console.error('Erro ao carregar alertas:', err.message);
  }

  io.emit('usuarios-conectados', usuariosConectados.length);

  socket.on('atualizar-alerta', async (dados) => {
    try {
      const alertaAtualizado = await updateAlertaStatus(dados.id, dados.status, dados.observacoes);
      if (alertaAtualizado) {
        io.emit('alerta-atualizado', alertaAtualizado);
      }
    } catch (err) {
      console.error('Erro ao atualizar alerta via WebSocket:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Policial desconectado: ${socket.id}`);
    usuariosConectados = usuariosConectados.filter((id) => id !== socket.id);
    io.emit('usuarios-conectados', usuariosConectados.length);
  });
});

async function start(port) {
  await initializeDatabase();

  const onError = (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1;
      console.warn(`⚠️ Porta ${port} ocupada. Tentando ${nextPort}...`);
      server.off('error', onError);
      server.close(() => start(nextPort));
    } else {
      console.error('Erro ao iniciar servidor:', err);
      process.exit(1);
    }
  };

  server.on('error', onError);

  server.listen(port, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║  🚔 SISTEMA DE EMERGÊNCIA DA POLÍCIA         ║
╚══════════════════════════════════════════════╝

✅  http://localhost:${port}
📡  WebSocket: ws://localhost:${port}
💾  Banco: SQLite ativo

Rotas:
  POST  /api/emergencia         → receber alerta
  GET   /api/alertas            → listar alertas
  GET   /api/alertas?status=ATIVO
  GET   /api/alertas/:id        → buscar alerta
  PATCH /api/alertas/:id/status → atualizar status
  `);
  });
}

start(DEFAULT_PORT).catch((err) => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});