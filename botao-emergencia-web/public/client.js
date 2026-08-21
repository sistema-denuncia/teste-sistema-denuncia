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
  mostrarStatus('📤 Enviando alerta de emergência...', '#ffcc00');

  const dados = {
    clienteId: obterClienteId(),
    tipo: 'EMERGENCIA',
    prioridade: 'ALTA',
    dispositivo: navigator.userAgent,
    localizacao: await obterLocalizacao(),
  };

  try {
    const resposta = await fetch('/api/emergencia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const resultado = await resposta.json();

    if (!resposta.ok || !resultado.sucesso) {
      throw new Error(resultado.mensagem || `Erro do servidor: ${resposta.status}`);
    }

    mostrarStatus(`✅ Emergência registrada. Protocolo: ${resultado.protocolo}`, '#00ff00');
    console.log('Alerta enviado:', resultado);

    localStorage.removeItem('emergencia_cliente_id');
  } catch (erro) {
    mostrarStatus('❌ Não foi possível enviar o alerta. Tente novamente.', '#ff0000');
    console.error('Erro:', erro);
  } finally {
    envioEmCurso = false;
    btn.disabled = false;
    btn.classList.remove('enviando');

    setTimeout(() => mostrarStatus(''), 7000);
  }
});

async function obterLocalizacao() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: null, longitude: null });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        latitude: coords.latitude,
        longitude: coords.longitude,
      }),
      () => resolve({ latitude: null, longitude: null }),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
}

console.log('Botão de emergência carregado.');
