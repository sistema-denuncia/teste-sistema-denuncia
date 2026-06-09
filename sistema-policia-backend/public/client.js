// Conexão Socket.io
const socket = io();

// Variáveis globais
let alertas = [];
let filtroAtual = 'ATIVO';

// ============================================
// EVENTOS DO SOCKET.IO
// ============================================

socket.on('connect', () => {
    console.log('✅ Conectado ao servidor');
    atualizarStatusConexao(true);
});

socket.on('disconnect', () => {
    console.log('❌ Desconectado do servidor');
    atualizarStatusConexao(false);
});

// Carregar alertas quando conectar
socket.on('carregar-alertas', (dados) => {
    console.log('📦 Alertas carregados:', dados);
    alertas = dados;
    renderizarAlertas();
    atualizarTotalAlertas();
});

// Novo alerta recebido
socket.on('novo-alerta', (alerta) => {
    console.log('🚨 NOVO ALERTA:', alerta);
    alertas.unshift(alerta);
    renderizarAlertas();
    atualizarTotalAlertas();
    
    // Tocar som de alerta
    tocarSomAlerta();
    
    // Mostrar notificação
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 ALERTA DE EMERGÊNCIA', {
            body: `Protocolo: ${alerta.protocolo}`,
            icon: '🚔'
        });
    }
    
    // Animar a chegada do novo alerta
    const cards = document.querySelectorAll('.alerta-card');
    if (cards.length > 0) {
        cards[0].style.animation = 'slideIn 0.5s ease';
    }
});

// Alerta atualizado
socket.on('alerta-atualizado', (alerta) => {
    console.log('✏️ Alerta atualizado:', alerta);
    const index = alertas.findIndex(a => a.id === alerta.id);
    if (index !== -1) {
        alertas[index] = alerta;
        renderizarAlertas();
    }
});

// Quantidade de usuários conectados
socket.on('usuarios-conectados', (quantidade) => {
    document.getElementById('usuariosConectados').textContent = quantidade;
});

// Tocar som de alerta
socket.on('tocar-som-alerta', () => {
    tocarSomAlerta();
});

// ============================================
// FUNÇÕES DE INTERFACE
// ============================================

function renderizarAlertas() {
    const lista = document.getElementById('alertasList');
    
    // Filtrar alertas baseado no filtro selecionado
    let alertasFiltrados = alertas;
    if (filtroAtual !== 'TODOS') {
        alertasFiltrados = alertas.filter(a => a.status === filtroAtual);
    }

    if (alertasFiltrados.length === 0) {
        lista.innerHTML = '<div class="empty-state"><p>📭 Nenhum alerta no momento</p></div>';
        return;
    }

    lista.innerHTML = alertasFiltrados.map(alerta => `
        <div class="alerta-card ${getClassePorStatus(alerta.status)}" data-id="${alerta.id}">
            <div class="alerta-header">
                <span class="alerta-protocolo">${alerta.protocolo}</span>
                <span class="alerta-status ${getClassePorStatus(alerta.status)}">${formatarStatus(alerta.status)}</span>
            </div>
            
            <div class="alerta-info">
                <div class="alerta-item">
                    <span class="alerta-label">⏰ Horário:</span>
                    <span class="alerta-value">${formatarData(alerta.timestamp)}</span>
                </div>
                <div class="alerta-item">
                    <span class="alerta-label">🚨 Tipo:</span>
                    <span class="alerta-value">${alerta.tipo}</span>
                </div>
                <div class="alerta-item">
                    <span class="alerta-label">⚠️ Prioridade:</span>
                    <span class="alerta-value">${alerta.prioridade}</span>
                </div>
            </div>

            ${alerta.localizacao && alerta.localizacao.latitude ? `
                <div class="alerta-localizacao">
                    📍 Lat: ${alerta.localizacao.latitude.toFixed(4)}, Long: ${alerta.localizacao.longitude.toFixed(4)}
                </div>
            ` : ''}

            <div class="alerta-acoes">
                <button class="alerta-btn btn-ver-detalhes" onclick="abrirDetalhes('${alerta.id}')">
                    📋 Detalhes
                </button>
                ${alerta.status === 'ATIVO' ? `
                    <button class="alerta-btn btn-atender" onclick="atualizarStatus('${alerta.id}', 'EM_ATENDIMENTO')">
                        🟡 Atender
                    </button>
                ` : ''}
                ${alerta.status !== 'RESOLVIDO' ? `
                    <button class="alerta-btn btn-resolver" onclick="atualizarStatus('${alerta.id}', 'RESOLVIDO')">
                        ✓ Resolvido
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function abrirDetalhes(id) {
    const alerta = alertas.find(a => a.id === id);
    if (!alerta) return;

    const modal = document.getElementById('modalAlerta');
    const modalBody = document.getElementById('modalBody');

    modalBody.innerHTML = `
        <h2>🚨 ${alerta.protocolo}</h2>
        <p><strong>Status:</strong> ${formatarStatus(alerta.status)}</p>
        <p><strong>Tipo:</strong> ${alerta.tipo}</p>
        <p><strong>Prioridade:</strong> ${alerta.prioridade}</p>
        <p><strong>Data/Hora:</strong> ${formatarData(alerta.timestamp)}</p>
        <p><strong>Dispositivo:</strong> ${alerta.dispositivo}</p>
        
        ${alerta.localizacao && alerta.localizacao.latitude ? `
            <p><strong>📍 Localização:</strong><br>
            Latitude: ${alerta.localizacao.latitude.toFixed(6)}<br>
            Longitude: ${alerta.localizacao.longitude.toFixed(6)}<br>
            Acurácia: ${alerta.localizacao.acuracia.toFixed(0)}m
            </p>
        ` : ''}

        ${alerta.observacoes ? `<p><strong>Observações:</strong> ${alerta.observacoes}</p>` : ''}
        ${alerta.atualizadoPor ? `<p><strong>Última atualização por:</strong> ${alerta.atualizadoPor}</p>` : ''}
        
        <div class="modal-actions">
            ${alerta.status === 'ATIVO' ? `
                <button class="modal-btn btn-atender" onclick="atualizarStatus('${alerta.id}', 'EM_ATENDIMENTO')">
                    Marcar como Em Atendimento
                </button>
            ` : ''}
            ${alerta.status !== 'RESOLVIDO' ? `
                <button class="modal-btn btn-resolver" onclick="atualizarStatus('${alerta.id}', 'RESOLVIDO')">
                    Marcar como Resolvido
                </button>
            ` : ''}
        </div>
    `;

    modal.classList.remove('hidden');
}

function atualizarStatus(id, novoStatus) {
    const alerta = alertas.find(a => a.id === id);
    if (!alerta) return;

    // Emitir atualização via socket
    socket.emit('atualizar-alerta', {
        id: id,
        status: novoStatus,
        usuario: 'Policial ' + Math.floor(Math.random() * 1000),
        observacoes: alerta.observacoes
    });

    // Fechar modal se estiver aberto
    document.getElementById('modalAlerta').classList.add('hidden');
}

function atualizarStatusConexao(conectado) {
    const elemento = document.getElementById('statusConexao');
    if (conectado) {
        elemento.innerHTML = '<span class="status-dot online"></span><span class="status-label">Conectado</span>';
    } else {
        elemento.innerHTML = '<span class="status-dot offline"></span><span class="status-label">Desconectado</span>';
    }
}

function atualizarTotalAlertas() {
    document.getElementById('totalAlertas').textContent = alertas.length;
}

function tocarSomAlerta() {
    // Criar som de alerta simulado
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function getClassePorStatus(status) {
    switch (status) {
        case 'ATIVO':
            return 'alerta-card ativo';
        case 'EM_ATENDIMENTO':
            return 'alerta-card em-atendimento';
        case 'RESOLVIDO':
            return 'alerta-card resolvido';
        default:
            return 'alerta-card';
    }
}

function formatarStatus(status) {
    switch (status) {
        case 'ATIVO':
            return '🔴 ATIVO';
        case 'EM_ATENDIMENTO':
            return '🟡 EM ATENDIMENTO';
        case 'RESOLVIDO':
            return '🟢 RESOLVIDO';
        default:
            return status;
    }
}

function formatarData(dataString) {
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// ============================================
// EVENT LISTENERS
// ============================================

// Filtros
document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        filtroAtual = e.target.dataset.filtro;
        renderizarAlertas();
    });
});

// Fechar modal
document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('modalAlerta').classList.add('hidden');
});

// Fechar modal ao clicar fora
document.getElementById('modalAlerta').addEventListener('click', (e) => {
    if (e.target.id === 'modalAlerta') {
        document.getElementById('modalAlerta').classList.add('hidden');
    }
});

// Solicitar permissão de notificação
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// CSS para animação de slide in
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Painel de emergência carregado');
