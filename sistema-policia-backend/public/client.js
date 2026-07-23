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

socket.on('carregar-alertas', (dados) => {
    console.log('📦 Alertas carregados:', dados);
    alertas = Array.isArray(dados) ? dados : [];
    renderizarAlertas();
    atualizarTotalAlertas();
});

socket.on('novo-alerta', (alerta) => {
    console.log('🚨 NOVO ALERTA:', alerta);
    alertas.unshift(alerta);
    renderizarAlertas();
    atualizarTotalAlertas();

    tocarSomAlerta();

    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 ALERTA DE EMERGÊNCIA', {
            body: `Protocolo: ${alerta.protocolo}`,
            icon: '🚔'
        });
    }

    const cards = document.querySelectorAll('.alerta-card');
    if (cards.length > 0) {
        cards[0].style.animation = 'slideIn 0.5s ease';
    }
});

socket.on('alerta-atualizado', (alerta) => {
    console.log('✏️ Alerta atualizado:', alerta);
    const index = alertas.findIndex(a => a.id === alerta.id);
    if (index !== -1) {
        alertas[index] = alerta;
        renderizarAlertas();
    }
});

socket.on('usuarios-conectados', (quantidade) => {
    document.getElementById('usuariosConectados').textContent = quantidade;
});

socket.on('tocar-som-alerta', () => {
    tocarSomAlerta();
});

// ============================================
// FUNÇÕES DE INTERFACE
// ============================================

function renderizarAlertas() {
    const lista = document.getElementById('alertasList');

    let alertasFiltrados = alertas;
    if (filtroAtual !== 'TODOS') {
        alertasFiltrados = alertas.filter(a => a.status === filtroAtual);
    }

    if (alertasFiltrados.length === 0) {
        lista.innerHTML = '<div class="empty-state"><p>📭 Nenhum alerta no momento</p></div>';
        return;
    }

    lista.innerHTML = alertasFiltrados.map(alerta => {
        const localizacao = obterLocalizacao(alerta);
        const timestamp = obterTimestamp(alerta);

        return `
            <div class="alerta-card ${getClassePorStatus(alerta.status)}" data-id="${alerta.id}">
                <div class="alerta-header">
                    <span class="alerta-protocolo">${alerta.protocolo}</span>
                    <span class="alerta-status ${getClassePorStatus(alerta.status)}">${formatarStatus(alerta.status)}</span>
                </div>

                <div class="alerta-info">
                    <div class="alerta-item">
                        <span class="alerta-label">⏰ Horário:</span>
                        <span class="alerta-value">${formatarData(timestamp)}</span>
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

                ${localizacao ? `
                    <div class="alerta-localizacao">
                        📍 Lat: ${localizacao.latitude.toFixed(4)}, Long: ${localizacao.longitude.toFixed(4)}
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
        `;
    }).join('');
}

function abrirDetalhes(id) {
    const alerta = alertas.find(a => a.id === id);
    if (!alerta) return;

    const modal = document.getElementById('modalAlerta');
    const modalBody = document.getElementById('modalBody');
    const localizacao = obterLocalizacao(alerta);
    const timestamp = obterTimestamp(alerta);

    modalBody.innerHTML = `
        <h2>🚨 ${alerta.protocolo}</h2>
        <p><strong>Status:</strong> ${formatarStatus(alerta.status)}</p>
        <p><strong>Tipo:</strong> ${alerta.tipo}</p>
        <p><strong>Prioridade:</strong> ${alerta.prioridade}</p>
        <p><strong>Data/Hora:</strong> ${formatarData(timestamp)}</p>
        <p><strong>Dispositivo:</strong> ${alerta.dispositivo || 'Não informado'}</p>

        ${localizacao ? `
            <p><strong>📍 Localização:</strong><br>
            Latitude: ${localizacao.latitude.toFixed(6)}<br>
            Longitude: ${localizacao.longitude.toFixed(6)}<br>
            Acurácia: ${localizacao.acuracia.toFixed(0)}m
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

    socket.emit('atualizar-alerta', {
        id: id,
        status: novoStatus,
        usuario: 'Policial ' + Math.floor(Math.random() * 1000),
        observacoes: alerta.observacoes
    });

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

function obterLocalizacao(alerta) {
    if (alerta.localizacao && alerta.localizacao.latitude !== undefined) {
        return alerta.localizacao;
    }

    if (alerta.latitude !== null && alerta.longitude !== null) {
        return {
            latitude: alerta.latitude,
            longitude: alerta.longitude,
            acuracia: alerta.acuracia || 0,
        };
    }

    return null;
}

function obterTimestamp(alerta) {
    return alerta.timestamp || alerta.criado_em || alerta.dataLocal;
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

document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        filtroAtual = e.target.dataset.filtro;
        renderizarAlertas();
    });
});

document.querySelector('.modal-close').addEventListener('click', () => {
    document.getElementById('modalAlerta').classList.add('hidden');
});

document.getElementById('modalAlerta').addEventListener('click', (e) => {
    if (e.target.id === 'modalAlerta') {
        document.getElementById('modalAlerta').classList.add('hidden');
    }
});

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
