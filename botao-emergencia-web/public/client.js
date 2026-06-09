const btn = document.getElementById('btnEmergencia');
const status = document.getElementById('status');

let envioEmCurso = false;

// Configuração
const CONFIG = {
    SERVIDOR_URL: 'http://localhost:3001'
};

btn.addEventListener('click', async () => {
    // Prevenir múltiplos cliques
    if (envioEmCurso) {
        status.innerText = "Alerta já está sendo enviado...";
        return;
    }

    // Confirmação de emergência (clique duplo)
    if (!btn.hasAttribute('data-confirmado')) {
        btn.setAttribute('data-confirmado', 'true');
        status.innerText = "⚠️ Clique novamente para confirmar emergência";
        status.style.color = '#ffcc00';
        
        // Resetar confirmação após 3 segundos
        setTimeout(() => {
            btn.removeAttribute('data-confirmado');
            status.innerText = "";
            status.style.color = 'white';
        }, 3000);
        return;
    }

    envioEmCurso = true;
    btn.removeAttribute('data-confirmado');
    btn.disabled = true;
    btn.classList.add('enviando');
    status.innerText = "📤 Enviando alerta de emergência...";
    status.style.color = '#ffcc00';

    const dados = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        tipo: 'EMERGENCIA',
        dispositivo: navigator.userAgent,
        localizacao: await obterLocalizacao(),
        status: 'ALERTA_ACIONADO'
    };

    try {
        const resposta = await fetch(`${CONFIG.SERVIDOR_URL}/api/emergencia`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...dados,
                apiKey: 'sua-chave-api-super-secreta'
            })
        });

        if (!resposta.ok) {
            throw new Error(`Erro do servidor: ${resposta.status}`);
        }

        const resultado = await resposta.json();
        
        if (resultado.sucesso) {
            status.innerText = "✅ Alerta enviado com sucesso para a polícia!";
            status.style.color = '#00ff00';
            console.log('Alerta enviado:', resultado);
        } else {
            throw new Error(resultado.mensagem);
        }

    } catch (erro) {
        status.innerText = "❌ Erro ao enviar alerta: " + erro.message;
        status.style.color = '#ff0000';
        console.error('Erro:', erro);
    } finally {
        envioEmCurso = false;
        btn.disabled = false;
        btn.classList.remove('enviando');
        
        // Resetar status após 5 segundos
        setTimeout(() => {
            status.innerText = "";
            status.style.color = 'white';
        }, 5000);
    }
});

// Função para obter localização do usuário
async function obterLocalizacao() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve({ latitude: null, longitude: null, erro: 'Geolocalização não disponível' });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    acuracia: position.coords.accuracy
                });
            },
            (erro) => {
                resolve({ latitude: null, longitude: null, erro: erro.message });
            },
            { timeout: 5000 }
        );
    });
}

console.log('✅ Botão de emergência carregado');
console.log('📡 Servidor:', CONFIG.SERVIDOR_URL);
