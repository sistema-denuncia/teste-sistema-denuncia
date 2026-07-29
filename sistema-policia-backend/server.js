// ============================================================
//  sistema-policia-backend/server.js
//  Recebe alertas do botão de emergência e exibe no painel
//  em tempo real via WebSocket.
// ============================================================

require('dotenv').config();

const express   = require('express');
const http      = require('http');
const socketIo  = require('socket.io');
const cors      = require('cors');
const { v4: uuidv4 } = require('uuid');
const path      = require('path');

const app    = express();
const server = http.createServer(app);
const io     = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] }
});

// ── Configurações ─────────────────────────────────────────────
const PORT    = process.env.PORT    || 3001;
const API_KEY = process.env.POLICIA_API_KEY;

if (!API_KEY) {
  console.error('❌ POLICIA_API_KEY não definida no .env');
  process.exit(1);
}

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ── Armazenamento em memória (usado enquanto não há banco) ────
let alertasMemoria = [];
let usuariosConectados = [];

// ── Flag: banco disponível ou não ────────────────────────────
// Troque para true quando o MySQL estiver pronto
const BANCO_ATIVO = false;

// ── Importa o db só se o banco estiver ativo ─────────────────
const db = BANCO_ATIVO ? require('./db') : null;

// ============================================================
//  ROTAS API
// ============================================================

// ── POST /api/emergencia ──────────────────────────────────────
app.post('/api/emergencia', async (req, res) => {
  const { apiKey, localizacao, dispositivo, ...resto } = req.body;
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

  if (apiKey !== API_KEY) {
    return res.status(401).json({ sucesso: false, mensagem: 'Chave API inválida.' });
  }

  try {
    const alerta = {
      id         : uuidv4(),
      protocolo  : `EMERG-${Date.now()}`,
      tipo       : resto.tipo       || 'EMERGENCIA',
      status     : 'ATIVO',
      prioridade : resto.prioridade || 'ALTA',
      latitude   : localizacao?.latitude  || null,
      longitude  : localizacao?.longitude || null,
      dispositivo: dispositivo ? JSON.stringify(dispositivo) : null,
      ip_origem  : ip,
      criado_em  : new Date().toISOString(),
      dataLocal  : new Date().toLocaleString('pt-BR'),
    };

    if (BANCO_ATIVO) {
      // Salva no banco quando disponível
      await db.execute(
        `INSERT INTO alertas_policia
           (id, protocolo, tipo, status, prioridade, latitude, longitude, dispositivo, ip_origem)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          alerta.id, alerta.protocolo, alerta.tipo, alerta.status,
          alerta.prioridade, alerta.latitude, alerta.longitude,
          alerta.dispositivo, alerta.ip_origem
        ]
      );
    } else {
      // Salva em memória enquanto não há banco
      alertasMemoria.unshift(alerta);
      if (alertasMemoria.length > 100) alertasMemoria.pop();
    }

    console.log(`🚨 [${alerta.dataLocal}] NOVO ALERTA: ${alerta.protocolo}`);

    io.emit('novo-alerta', alerta);
    io.emit('tocar-som-alerta');
    io.emit('mostrar-notificacao', {
      titulo  : '🚨 ALERTA DE EMERGÊNCIA',
      mensagem: `Protocolo: ${alerta.protocolo}`,
      alerta,
    });

    return res.status(200).json({
      sucesso  : true,
      mensagem : 'Alerta recebido com sucesso.',
      id       : alerta.id,
      protocolo: alerta.protocolo,
    });

  } catch (err) {
    console.error('Erro ao processar alerta:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao processar o alerta.' });
  }
});

// ── GET /api/alertas ──────────────────────────────────────────
app.get('/api/alertas', async (req, res) => {
  const { status } = req.query;

  try {
    if (BANCO_ATIVO) {
      let sql      = 'SELECT * FROM alertas_policia WHERE 1=1';
      const params = [];
      if (status) { sql += ' AND status = ?'; params.push(status); }
      sql += ' ORDER BY criado_em DESC LIMIT 100';
      const [alertas] = await db.execute(sql, params);
      return res.json({ total: alertas.length, alertas });
    } else {
      const alertas = status
        ? alertasMemoria.filter(a => a.status === status)
        : alertasMemoria;
      return res.json({ total: alertas.length, alertas });
    }
  } catch (err) {
    console.error('Erro ao buscar alertas:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar alertas.' });
  }
});

// ── GET /api/alertas/:id ──────────────────────────────────────
app.get('/api/alertas/:id', async (req, res) => {
  try {
    if (BANCO_ATIVO) {
      const [rows] = await db.execute(
        'SELECT * FROM alertas_policia WHERE id = ?',
        [req.params.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ sucesso: false, mensagem: 'Alerta não encontrado.' });
      }
      return res.json(rows[0]);
    } else {
      const alerta = alertasMemoria.find(a => a.id === req.params.id);
      if (!alerta) {
        return res.status(404).json({ sucesso: false, mensagem: 'Alerta não encontrado.' });
      }
      return res.json(alerta);
    }
  } catch (err) {
    console.error('Erro ao buscar alerta:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao buscar alerta.' });
  }
});

// ── PATCH /api/alertas/:id/status ────────────────────────────
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
    if (BANCO_ATIVO) {
      const [result] = await db.execute(
        `UPDATE alertas_policia SET status = ?, observacoes = ?, atualizado_em = NOW() WHERE id = ?`,
        [status, observacoes || null, req.params.id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ sucesso: false, mensagem: 'Alerta não encontrado.' });
      }
      const [rows] = await db.execute('SELECT * FROM alertas_policia WHERE id = ?', [req.params.id]);
      io.emit('alerta-atualizado', rows[0]);
      return res.json({ sucesso: true, mensagem: 'Status atualizado.', alerta: rows[0] });
    } else {
      const alerta = alertasMemoria.find(a => a.id === req.params.id);
      if (!alerta) {
        return res.status(404).json({ sucesso: false, mensagem: 'Alerta não encontrado.' });
      }
      alerta.status      = status;
      alerta.observacoes = observacoes || alerta.observacoes;
      alerta.atualizadoEm = new Date().toISOString();
      io.emit('alerta-atualizado', alerta);
      return res.json({ sucesso: true, mensagem: 'Status atualizado.', alerta });
    }
  } catch (err) {
    console.error('Erro ao atualizar status:', err.message);
    return res.status(500).json({ sucesso: false, mensagem: 'Erro ao atualizar status.' });
  }
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ erro: `Rota "${req.method} ${req.path}" não encontrada.` });
});

// ============================================================
//  WEBSOCKET
// ============================================================

io.on('connection', async (socket) => {
  console.log(`✅ Policial conectado: ${socket.id}`);
  usuariosConectados.push(socket.id);

  if (BANCO_ATIVO) {
    try {
      const [alertas] = await db.execute(
        'SELECT * FROM alertas_policia ORDER BY criado_em DESC LIMIT 100'
      );
      socket.emit('carregar-alertas', alertas);
    } catch (err) {
      console.error('Erro ao carregar alertas:', err.message);
    }
  } else {
    socket.emit('carregar-alertas', alertasMemoria);
  }

  io.emit('usuarios-conectados', usuariosConectados.length);

  socket.on('atualizar-alerta', async (dados) => {
    if (BANCO_ATIVO) {
      try {
        await db.execute(
          `UPDATE alertas_policia SET status = ?, observacoes = ?, atualizado_em = NOW() WHERE id = ?`,
          [dados.status, dados.observacoes || null, dados.id]
        );
        const [rows] = await db.execute('SELECT * FROM alertas_policia WHERE id = ?', [dados.id]);
        if (rows.length > 0) io.emit('alerta-atualizado', rows[0]);
      } catch (err) {
        console.error('Erro ao atualizar alerta via WebSocket:', err.message);
      }
    } else {
      const alerta = alertasMemoria.find(a => a.id === dados.id);
      if (alerta) {
        alerta.status      = dados.status;
        alerta.observacoes = dados.observacoes;
        alerta.atualizadoEm = new Date().toISOString();
        io.emit('alerta-atualizado', alerta);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Policial desconectado: ${socket.id}`);
    usuariosConectados = usuariosConectados.filter(id => id !== socket.id);
    io.emit('usuarios-conectados', usuariosConectados.length);
  });
});

// ============================================================
//  INICIAR
// ============================================================

server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║  🚔 SISTEMA DE EMERGÊNCIA DA POLÍCIA         ║
╚══════════════════════════════════════════════╝

✅  http://localhost:${PORT}
📡  WebSocket: ws://localhost:${PORT}
💾  Banco: ${BANCO_ATIVO ? 'MySQL ativo' : 'memória (sem banco)'}

Rotas:
  POST  /api/emergencia         → receber alerta
  GET   /api/alertas            → listar alertas
  GET   /api/alertas?status=ATIVO
  GET   /api/alertas/:id        → buscar alerta
  PATCH /api/alertas/:id/status → atualizar status
  `);
});