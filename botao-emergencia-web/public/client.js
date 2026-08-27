const btn = document.getElementById('btnEmergencia');
const status = document.getElementById('status');

let envioEmCurso = false;

function mostrarStatus(mensagem, cor = 'white') {
  status.innerText = mensagem;
  status.style.color = cor;
}

function obterClienteId() {
  const chave = 'emergencia_cliente_id';
  let id = localStorage.getItem(chave);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(chave, id);
  }

  // Gera outro ID depois que uma ocorrência foi concluída pelo servidor.
  return id;
}

btn.addEventListener('click', async () => {
  if (envioEmCurso) {
    mostrarStatus('Alerta já está sendo enviado...', '#ffcc00');
    return;
  }

  if (!btn.hasAttribute('data-confirmado')) {
    btn.setAttribute('data-confirmado', 'true');
    mostrarStatus('⚠️ Clique novamente para confirmar a emergência', '#ffcc00');

    setTimeout(() => {
      btn.removeAttribute('data-confirmado');
      mostrarStatus('');
    }, 3000);
    return;
  }

  envioEmCurso = true;
  btn.removeAttribute('data-confirmado');
  btn.disabled = true;
  btn.classList.add('enviando');
  mostrarStatus('📍 Obtendo localização...', '#ffcc00');

  const dados = {
    clienteId: obterClienteId(),
    tipo: 'EMERGENCIA',
    prioridade: 'ALTA',
    dispositivo: navigator.userAgent,
    localizacao: await obterLocalizacao(),
  };

  // Uma acurácia muito ruim (dezenas de km) normalmente indica que o
  // dispositivo não está usando GPS de verdade, e sim uma estimativa por
  // IP/rede — típico de "Localização Precisa" desativada no celular, ou
  // de testes em notebook sem chip de GPS. O alerta é enviado do mesmo
  // jeito (é uma emergência, não podemos bloquear por isso), mas avisamos
  // brevemente antes de seguir para o envio.
  const LIMITE_ACURACIA_RUIM_M = 5000;
  const acuracia = dados.localizacao?.acuracia;
  if (Number.isFinite(acuracia) && acuracia > LIMITE_ACURACIA_RUIM_M) {
    mostrarStatus('⚠️ Localização imprecisa (verifique "Localização Precisa" no celular)...', '#ffcc00');
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  mostrarStatus('📤 Enviando alerta de emergência...', '#ffcc00');

  try {
    const resposta = await fetch('/api/emergencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    let resultado;
    try {
      resultado = await resposta.json();
    } catch {
      throw new Error(`Resposta inesperada do servidor (HTTP ${resposta.status}).`);
    }

    if (!resposta.ok || !resultado.sucesso) {
      throw new Error(resultado.mensagem || `Erro do servidor: ${resposta.status}`);
    }

    mostrarStatus(`✅ Emergência registrada. Protocolo: ${resultado.protocolo}`, '#00ff00');
    console.log('Alerta enviado:', resultado);

    localStorage.removeItem('emergencia_cliente_id');
  } catch (erro) {
    // Mostra o motivo real do erro (ex.: "Serviço de emergência não configurado.",
    // "Não foi possível comunicar com o sistema da polícia.") em vez de uma mensagem
    // genérica, para que dê pra saber se o problema é rede, configuração ou o
    // backend da polícia estar fora do ar.
    const mensagemFalhaRede = 'Sem conexão com o servidor. Verifique sua internet e tente novamente.';
    const mensagem = erro instanceof TypeError ? mensagemFalhaRede : erro.message;
    mostrarStatus(`❌ ${mensagem || 'Não foi possível enviar o alerta. Tente novamente.'}`, '#ff0000');
    console.error('Erro ao enviar alerta:', erro);
  } finally {
    envioEmCurso = false;
    btn.disabled = false;
    btn.classList.remove('enviando');

    setTimeout(() => mostrarStatus(''), 7000);
  }
});

async function obterLocalizacao() {
  // Uma única leitura de GPS (getCurrentPosition): pega a posição mais rápida
  // disponível, sem esperar múltiplas amostras para calibrar/refinar a
  // precisão. Isso agiliza o envio do alerta de emergência.
  const TIMEOUT_MS = 5000;

  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: null, longitude: null, acuracia: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          acuracia: Number.isFinite(coords.accuracy) ? coords.accuracy : null,
        });
      },
      (erro) => {
        // Não bloqueia o envio do alerta: a emergência é registrada mesmo sem
        // localização, mas registramos o motivo para eventual diagnóstico.
        console.warn('Não foi possível obter a localização:', erro.message);
        resolve({ latitude: null, longitude: null, acuracia: null });
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: TIMEOUT_MS }
    );
  });
}

console.log('Botão de emergência carregado.');
