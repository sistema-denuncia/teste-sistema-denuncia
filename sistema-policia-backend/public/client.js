const socket = io();

let alertas = [];
let filtroAtual = 'ATIVO';
let mapaLocalizacao = null;

const $ = (id) => document.getElementById(id);

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getClassePorStatus(status) {
    return {
        ATIVO: 'ativo',
        EM_ATENDIMENTO: 'em-atendimento',
        RESOLVIDO: 'resolvido',
        FALSO_ALARME: 'falso-alarme'
    }[status] || '';
}

function formatarStatus(status) {
    return {
        ATIVO: 'ATIVO',
        EM_ATENDIMENTO: 'EM ATENDIMENTO',
        RESOLVIDO: 'RESOLVIDO',
        FALSO_ALARME: 'FALSO ALARME'
    }[status] || status;
}

// O SQLite grava criado_em/atualizado_em/encerrado_em em UTC no formato
// "AAAA-MM-DD HH:MM:SS" (sem "T" e sem "Z"). Sem indicação de fuso, o
// navegador assume que essa string já está no horário local do usuário e
// exibe a hora errada (ex.: mostra a hora UTC como se fosse a de Brasília,
// um erro de 3h). Aqui normalizamos para ISO com "Z" antes de interpretar,
// garantindo a conversão correta para o fuso local de quem está vendo o painel.
function normalizarDataUTC(dataString) {
    if (!dataString) return null;
    const jaTemFuso = /Z$|[+-]\d{2}:?\d{2}$/.test(dataString);
    const iso = dataString.includes('T') ? dataString : dataString.replace(' ', 'T');
    return jaTemFuso ? iso : `${iso}Z`;
}

function formatarData(dataString) {
    if (!dataString) return '—';
    const data = new Date(normalizarDataUTC(dataString));
    if (Number.isNaN(data.getTime())) return '—';
    return data.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

function formatarHorario(dataString) {
    if (!dataString) return '--:--:--';
    const data = new Date(normalizarDataUTC(dataString));
    return Number.isNaN(data.getTime()) ? '--:--:--' : data.toLocaleTimeString('pt-BR');
}

function atualizarRelogio() {
    $('relogio').textContent = new Date().toLocaleTimeString('pt-BR');
}

function atualizarResumo() {
    const ativos = alertas.filter(a => a.status === 'ATIVO').length;
    const atendimento = alertas.filter(a => a.status === 'EM_ATENDIMENTO').length;
    const resolvidas = alertas.filter(a => a.status === 'RESOLVIDO').length;

    $('metricAtivos').textContent = ativos;
    $('metricAtendimento').textContent = atendimento;
    $('metricResolvidas').textContent = resolvidas;
    $('badgeAtivos').textContent = ativos;
    $('badgeAtendimento').textContent = atendimento;
    $('badgeResolvidas').textContent = resolvidas;
    $('totalAlertas').textContent = alertas.length;
}

function marcarAtualizacao() {
    $('ultimaAtualizacao').textContent = `atualizado às ${new Date().toLocaleTimeString('pt-BR')}`;
}

function renderizarAlertas() {
    const lista = $('alertasList');
    const filtrados = filtroAtual === 'TODOS'
        ? alertas
        : alertas.filter(a => a.status === filtroAtual);

    atualizarResumo();

    if (!filtrados.length) {
        lista.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">—</div>
                <strong>Nenhuma ocorrência nesta fila</strong>
                <span>Os acionamentos recebidos serão inseridos automaticamente nesta área.</span>
            </div>`;
        return;
    }

    lista.innerHTML = filtrados.map(alerta => {
        const classe = getClassePorStatus(alerta.status);
        const latitude = alerta.localizacao?.latitude;
        const longitude = alerta.localizacao?.longitude;
        const temLocalizacao = Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude));

        return `
            <article class="alerta-card ${classe}" data-id="${escapeHtml(alerta.id)}">
                <div class="alerta-header">
                    <span class="alerta-protocolo">${escapeHtml(alerta.protocolo)}</span>
                    <div class="alerta-main-title">${escapeHtml(alerta.tipo || 'EMERGÊNCIA')}</div>
                    <div class="alerta-sub">Recebido em ${escapeHtml(formatarData(alerta.timestamp))}</div>
                </div>

                <div class="alerta-info">
                    <div class="alerta-item"><span class="alerta-label">Status</span><span class="alerta-value"><span class="alerta-status ${classe}"><span class="status-dot"></span>${escapeHtml(formatarStatus(alerta.status))}</span></span></div>
                    <div class="alerta-item"><span class="alerta-label">Prioridade</span><span class="alerta-value">${escapeHtml(alerta.prioridade || '—')}</span></div>
                    <div class="alerta-item"><span class="alerta-label">Dispositivo</span><span class="alerta-value">${escapeHtml(alerta.dispositivo || 'Não informado')}</span></div>
                    <div class="alerta-item"><span class="alerta-label">Cliente</span><span class="alerta-value">${escapeHtml(alerta.clienteId || '—')}</span></div>
                </div>

                <div class="alerta-localizacao">
                    <strong>Geolocalização</strong>
                    ${temLocalizacao
                        ? `${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)} · precisão ${formatarAcuracia(alerta.localizacao?.acuracia)} · mapa disponível na abertura`
                        : 'Posição não disponível'}
                </div>

                <div class="alerta-acoes">
                    <button class="alerta-btn btn-ver-detalhes" onclick="abrirDetalhes('${escapeHtml(alerta.id)}')">Abrir ocorrência</button>
                    ${alerta.status === 'ATIVO' ? `<button class="alerta-btn btn-atender" onclick="atualizarStatus('${escapeHtml(alerta.id)}','EM_ATENDIMENTO')">Assumir</button>` : ''}
                    ${alerta.status !== 'RESOLVIDO' ? `<button class="alerta-btn btn-resolver" onclick="atualizarStatus('${escapeHtml(alerta.id)}','RESOLVIDO')">Encerrar</button>` : ''}
                </div>
            </article>`;
    }).join('');
}

function abrirDetalhes(id) {
    const alerta = alertas.find(a => a.id === id);
    if (!alerta) return;

    const localizacao = alerta.localizacao;
    const temLocalizacao = localizacao && Number.isFinite(Number(localizacao.latitude)) && Number.isFinite(Number(localizacao.longitude));

    $('modalBody').innerHTML = `
        <div class="modal-kicker">FICHA OPERACIONAL / ${escapeHtml(alerta.protocolo)}</div>
        <h2 class="modal-title">${escapeHtml(alerta.tipo || 'EMERGÊNCIA')}</h2>
        <div class="detail-grid">
            <div class="detail-card"><span>Status</span><strong>${escapeHtml(formatarStatus(alerta.status))}</strong></div>
            <div class="detail-card"><span>Prioridade</span><strong>${escapeHtml(alerta.prioridade || '—')}</strong></div>
            <div class="detail-card"><span>Data e hora</span><strong>${escapeHtml(formatarData(alerta.timestamp))}</strong></div>
            <div class="detail-card"><span>Cliente</span><strong>${escapeHtml(alerta.clienteId || '—')}</strong></div>
            <div class="detail-card"><span>Dispositivo</span><strong>${escapeHtml(alerta.dispositivo || '—')}</strong></div>
            <div class="detail-card"><span>IP de origem</span><strong>${escapeHtml(alerta.ipOrigem || '—')}</strong></div>
        </div>
        <div class="modal-section">
            <h4>LOCALIZAÇÃO</h4>
            ${temLocalizacao ? `
                <div id="mapaOcorrencia" class="mapa-ocorrencia" aria-label="Mapa da localização da ocorrência"></div>
                <div class="mapa-detalhes">
                    <span>Coordenadas: <strong>${Number(localizacao.latitude).toFixed(6)}, ${Number(localizacao.longitude).toFixed(6)}</strong></span>
                    <span>Precisão: <strong>${formatarAcuracia(localizacao.acuracia)}</strong></span>
                    <a href="https://www.google.com/maps/search/?api=1&query=${Number(localizacao.latitude)},${Number(localizacao.longitude)}" target="_blank" rel="noopener noreferrer" class="mapa-link">Abrir no Google Maps ↗</a>
                </div>
                ${precisaoBaixa(localizacao.acuracia)
                    ? '<p class="mapa-alerta">⚠ Precisão baixa: o ponto no mapa pode estar deslocado. Se possível, confirme o endereço diretamente com o solicitante.</p>'
                    : ''}
                <p class="mapa-ajuda">Ponto registrado no momento do acionamento${Number.isFinite(Number(localizacao.acuracia)) ? '; o círculo mostra a margem de erro do GPS' : ''}.</p>
            ` : '<p>Localização não enviada no acionamento.</p>'}
        </div>
        <div class="modal-section">
            <h4>OBSERVAÇÕES</h4>
            <p>${escapeHtml(alerta.observacoes || 'Nenhuma observação registrada.')}</p>
        </div>
        <div class="modal-actions">
            ${alerta.status === 'ATIVO' ? `<button class="modal-btn btn-atender" onclick="atualizarStatus('${escapeHtml(alerta.id)}','EM_ATENDIMENTO')">Marcar em atendimento</button>` : ''}
            ${alerta.status !== 'RESOLVIDO' ? `<button class="modal-btn btn-resolver" onclick="atualizarStatus('${escapeHtml(alerta.id)}','RESOLVIDO')">Encerrar ocorrência</button>` : ''}
        </div>`;

    $('modalAlerta').classList.remove('hidden');
    $('modalAlerta').setAttribute('aria-hidden', 'false');

    if (temLocalizacao) {
        criarMapaOcorrencia(Number(localizacao.latitude), Number(localizacao.longitude), Number(localizacao.acuracia));
    }
}

// Ícone customizado em formato de "alvo" para destacar o ponto do acionamento
// entre as camadas de mapa padrão do Leaflet.
const iconeOcorrencia = L.divIcon({
    className: 'marcador-ocorrencia',
    html: '<span class="marcador-pulso"></span><span class="marcador-nucleo"></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

function formatarAcuracia(acuraciaMetros) {
    if (!Number.isFinite(Number(acuraciaMetros))) return 'não informada pelo dispositivo';
    const metros = Number(acuraciaMetros);
    if (metros < 1000) return `± ${Math.round(metros)} m`;
    return `± ${(metros / 1000).toFixed(1)} km`;
}

// Acima disso, o ponto no mapa é só uma referência aproximada — não dá pra
// confiar nele como o endereço exato (típico de geolocalização por Wi-Fi/torre
// de celular em vez de GPS com sinal de satélite).
const LIMITE_PRECISAO_BAIXA_M = 100;

function precisaoBaixa(acuraciaMetros) {
    return Number.isFinite(Number(acuraciaMetros)) && Number(acuraciaMetros) > LIMITE_PRECISAO_BAIXA_M;
}

function criarMapaOcorrencia(latitude, longitude, acuraciaMetros) {
    if (mapaLocalizacao) {
        mapaLocalizacao.remove();
        mapaLocalizacao = null;
    }

    mapaLocalizacao = L.map('mapaOcorrencia', {
        scrollWheelZoom: true,
    }).setView([latitude, longitude], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
    }).addTo(mapaLocalizacao);

    L.marker([latitude, longitude], { icon: iconeOcorrencia })
        .addTo(mapaLocalizacao)
        .bindPopup(`Local do acionamento<br>Precisão: ${formatarAcuracia(acuraciaMetros)}`)
        .openPopup();

    // Quando o dispositivo informa a acurácia do GPS, desenhamos o raio de
    // incerteza real e enquadramos o mapa nele, em vez de usar um zoom fixo
    // que pode esconder o quão impreciso (ou preciso) o ponto realmente é.
    const temAcuracia = Number.isFinite(acuraciaMetros) && acuraciaMetros > 0;
    if (temAcuracia) {
        const corPrecisao = precisaoBaixa(acuraciaMetros) ? '#ffa940' : '#ff4d4f';
        const circulo = L.circle([latitude, longitude], {
            radius: acuraciaMetros,
            color: corPrecisao,
            weight: 1,
            fillColor: corPrecisao,
            fillOpacity: 0.12,
        }).addTo(mapaLocalizacao);

        // maxZoom 19 = zoom máximo que o OpenStreetMap fornece: quando a
        // precisão é ótima (poucos metros), deixamos o mapa aproximar até o
        // limite real dos tiles, em vez de travar num zoom intermediário que
        // faz parecer que o ponto está "impreciso" quando na verdade só
        // estava sendo exibido de longe demais.
        mapaLocalizacao.fitBounds(circulo.getBounds(), { maxZoom: 19, padding: [24, 24] });
    }

    // O Leaflet calcula o tamanho do mapa com base no container visível;
    // como o modal acabou de ser exibido, forçamos um recálculo após a
    // renderização para evitar tiles cortados ou cinza.
    setTimeout(() => mapaLocalizacao.invalidateSize(), 0);
}

async function atualizarStatus(id, novoStatus) {
    const alerta = alertas.find(a => a.id === id);
    if (!alerta) return;

    try {
        const resposta = await fetch(`/api/emergencia/${encodeURIComponent(id)}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus, observacoes: alerta.observacoes || null })
        });
        const resultado = await resposta.json();
        if (!resposta.ok || !resultado.sucesso) throw new Error(resultado.mensagem || 'Falha ao atualizar ocorrência.');
        fecharModal();
    } catch (err) {
        console.error('Erro ao atualizar status:', err);
        window.alert(`Não foi possível atualizar o status: ${err.message}`);
    }
}

function atualizarStatusConexao(conectado) {
    const el = $('statusConexao');
    el.innerHTML = `<span class="status-dot ${conectado ? 'online' : 'offline'}"></span><span>${conectado ? 'ONLINE' : 'OFFLINE'}</span>`;
}

function fecharModal() {
    if (mapaLocalizacao) {
        mapaLocalizacao.remove();
        mapaLocalizacao = null;
    }
    $('modalAlerta').classList.add('hidden');
    $('modalAlerta').setAttribute('aria-hidden', 'true');
}

socket.on('connect', () => { atualizarStatusConexao(true); marcarAtualizacao(); });
socket.on('disconnect', () => { atualizarStatusConexao(false); });

socket.on('carregar-alertas', dados => { alertas = Array.isArray(dados) ? dados : []; renderizarAlertas(); marcarAtualizacao(); });
socket.on('novo-alerta', alerta => {
    alertas = [alerta, ...alertas.filter(a => a.id !== alerta.id)];
    renderizarAlertas();
    marcarAtualizacao();
    tocarSomAlerta();
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Novo acionamento de emergência', { body: `Protocolo ${alerta.protocolo}` });
    }
    const first = document.querySelector('.alerta-card');
    if (first) first.style.animation = 'slideIn .45s ease';
});

socket.on('alerta-atualizado', alerta => {
    const index = alertas.findIndex(a => a.id === alerta.id);
    if (index !== -1) alertas[index] = alerta;
    else alertas.unshift(alerta);
    renderizarAlertas();
    marcarAtualizacao();
});

socket.on('usuarios-conectados', quantidade => { $('usuariosConectados').textContent = quantidade; });
socket.on('total-alertas', quantidade => { $('totalAlertas').textContent = quantidade; });

document.querySelectorAll('.filtro-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filtroAtual = btn.dataset.filtro;
        renderizarAlertas();
    });
});

document.querySelector('.modal-close').addEventListener('click', fecharModal);
$('modalAlerta').addEventListener('click', e => { if (e.target === $('modalAlerta')) fecharModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') fecharModal(); });

function tocarSomAlerta() {
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain); gain.connect(ctx.destination);
        oscillator.type = 'sine'; oscillator.frequency.value = 740;
        gain.gain.setValueAtTime(.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(.16, ctx.currentTime + .02);
        gain.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + .38);
        oscillator.start(); oscillator.stop(ctx.currentTime + .4);
    } catch (error) { console.debug('Áudio indisponível:', error.message); }
}

if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {});

setInterval(atualizarRelogio, 1000);
atualizarRelogio();
renderizarAlertas();

console.log('Central Operacional carregada.');
