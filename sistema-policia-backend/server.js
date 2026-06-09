const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Configurações
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.POLICIA_API_KEY || 'sua-chave-api-super-secreta';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Armazenar alertas em memória
let alertas = [];
const maxAlertas = 100;

// Conectar usuários (policiais)
let usuariosConectados = [];

// ============================================
// ROTAS API
// ============================================

// Rota para receber alertas de emergência
app.post('/api/emergencia', (req, res) => {
    const { apiKey, ...dados } = req.body;

    // Validar chave API
    if (apiKey !== API_KEY) {
        return res.status(401).json({
            sucesso: false,
            mensagem: 'Chave API inválida'
        });
    }

    try {
        const alerta = {
            id: uuidv4(),
            protocolo: `EMERG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            dataLocal: new Date().toLocaleString('pt-BR'),
            status: 'ATIVO',
            prioridade: 'ALTA',
            ...dados
        };

        // Adicionar ao array
        alertas.unshift(alerta);

        // Limitar quantidade de alertas em memória
        if (alertas.length > maxAlertas) {
            alertas.pop();
        }

        console.log(`🚨 NOVO ALERTA RECEBIDO: ${alerta.protocolo}`);
        console.log(alerta);

        // Enviar para todos os clientes conectados (policiais)
        io.emit('novo-alerta', alerta);

        // Reproduzir som de alerta
        io.emit('tocar-som-alerta');

        // Enviar notificação do desktop
        io.emit('mostrar-notificacao', {
            titulo: '🚨 ALERTA DE EMERGÊNCIA',
            mensagem: `Novo alerta de emergência recebido!\nProtocolo: ${alerta.protocolo}`,
            alerta: alerta
        });

        res.status(200).json({
            sucesso: true,
            mensagem: 'Alerta recebido com sucesso',
            id: alerta.id,
            protocolo: alerta.protocolo
        });

    } catch (erro) {
        console.error('Erro ao processar alerta:', erro);
        res.status(500).json({
            sucesso: false,
            mensagem: 'Erro ao processar o alerta'
        });
    }
});

// Rota para obter todos os alertas
app.get('/api/alertas', (req, res) => {
    res.json({
        total: alertas.length,
        alertas: alertas
    });
});

// Rota para obter alerta específico
app.get('/api/alertas/:id', (req, res) => {
    const alerta = alertas.find(a => a.id === req.params.id);
    
    if (!alerta) {
        return res.status(404).json({
            sucesso: false,
            mensagem: 'Alerta não encontrado'
        });
    }

    res.json(alerta);
});

// Rota para atualizar status do alerta
app.patch('/api/alertas/:id/status', express.json(), (req, res) => {
    const { status, observacoes } = req.body;
    const alerta = alertas.find(a => a.id === req.params.id);

    if (!alerta) {
        return res.status(404).json({
            sucesso: false,
            mensagem: 'Alerta não encontrado'
        });
    }

    alerta.status = status || alerta.status;
    alerta.observacoes = observacoes || alerta.observacoes;
    alerta.atualizadoEm = new Date().toISOString();

    // Notificar todos os clientes sobre a atualização
    io.emit('alerta-atualizado', alerta);

    res.json({
        sucesso: true,
        mensagem: 'Status do alerta atualizado',
        alerta: alerta
    });
});

// ============================================
// WEBSOCKET (Socket.io)
// ============================================

io.on('connection', (socket) => {
    console.log(`✅ Novo usuário conectado: ${socket.id}`);
    usuariosConectados.push(socket.id);

    // Enviar lista de alertas para o novo cliente
    socket.emit('carregar-alertas', alertas);

    // Enviar quantidade de usuários conectados
    io.emit('usuarios-conectados', usuariosConectados.length);

    // Quando um policial atualiza o status
    socket.on('atualizar-alerta', (dados) => {
        const alerta = alertas.find(a => a.id === dados.id);
        if (alerta) {
            alerta.status = dados.status;
            alerta.observacoes = dados.observacoes;
            alerta.atualizadoEm = new Date().toISOString();
            alerta.atualizadoPor = dados.usuario;

            // Notificar todos os clientes
            io.emit('alerta-atualizado', alerta);
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Usuário desconectado: ${socket.id}`);
        usuariosConectados = usuariosConectados.filter(id => id !== socket.id);
        io.emit('usuarios-conectados', usuariosConectados.length);
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================

server.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  🚔 SISTEMA DE EMERGÊNCIA DA POLÍCIA  ║
╚════════════════════════════════════════╝

✅ Servidor rodando em http://localhost:${PORT}
🔗 Painel da Polícia: http://localhost:${PORT}
📡 WebSocket: ws://localhost:${PORT}

⚙️ Chave API: ${API_KEY}
    `);
});
