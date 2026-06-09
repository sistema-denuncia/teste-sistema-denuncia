# 🚔 Sistema de Emergência com Painel da Polícia

Este projeto consiste em duas aplicações integradas:

1. **Cliente Electron** - Botão de emergência para cidadãos
2. **Backend Node.js** - Servidor que recebe alertas e painel web para a polícia

---

## 📋 Estrutura do Projeto

```
├── teste-projeto-electron-main/     # Aplicação Electron (Cliente)
│   ├── main.js
│   ├── renderer.js
│   ├── preload.js
│   ├── index.html
│   ├── style.css
│   └── package.json
│
└── sistema-policia-backend/         # Backend + Painel Web
    ├── server.js
    ├── package.json
    └── public/
        ├── index.html
        ├── style.css
        └── client.js
```

---

## 🚀 Como Usar

### 1. Instalar e Iniciar o Servidor da Polícia

```bash
cd sistema-policia-backend
npm install
npm start
```

O servidor iniciará em `http://localhost:3001`

### 2. Abrir o Painel da Polícia

- Abra seu navegador e acesse: `http://localhost:3001`
- Você verá o painel em tempo real para receber alertas

### 3. Iniciar o Cliente Electron

Em outro terminal:

```bash
cd teste-projeto-electron-main
npm start
```

A aplicação Electron abrirá com o botão de emergência

---

## ⚙️ Configuração

### Variáveis de Ambiente

Você pode configurar a chave API e URL do servidor através de variáveis de ambiente:

**Windows:**
```bash
set POLICIA_SERVER_URL=http://seu-servidor.com:3001
set POLICIA_API_KEY=sua-chave-api-segura
```

**Linux/Mac:**
```bash
export POLICIA_SERVER_URL=http://seu-servidor.com:3001
export POLICIA_API_KEY=sua-chave-api-segura
```

---

## 🔄 Fluxo de Funcionamento

1. **Usuário pressiona o botão de emergência** na aplicação Electron
2. **Confirmação dupla** - clique novamente para confirmar
3. **Dados coletados:**
   - ID único
   - Timestamp
   - Tipo de alerta (EMERGENCIA)
   - Geolocalização (se disponível)
   - Informações do dispositivo
4. **Enviado para o servidor** via HTTP POST
5. **Painel da polícia recebe em tempo real** via WebSocket
6. **Sons e notificações** são acionados
7. **Policiais podem atualizar o status** (Em Atendimento → Resolvido)

---

## 🎯 Funcionalidades

### Cliente Electron
- ✅ Botão de emergência com confirmação dupla
- ✅ Coleta de geolocalização
- ✅ Feedback visual com animações
- ✅ Notificações do sistema
- ✅ Indicador de status de envio

### Painel da Polícia
- ✅ Receber alertas em tempo real
- ✅ Visualizar detalhes completos
- ✅ Som e notificação visual ao chegar novo alerta
- ✅ Filtrar alertas (Ativos, Em Atendimento, Resolvidos)
- ✅ Atualizar status do alerta
- ✅ Ver quantidade de usuários conectados
- ✅ Interface responsiva

### Backend
- ✅ API REST para receber alertas
- ✅ WebSocket para comunicação em tempo real
- ✅ Validação de chave API
- ✅ Armazenamento em memória de alertas
- ✅ Endpoints para gerenciar alertas

---

## 📡 API Endpoints

### Receber Alerta
```
POST /api/emergencia
Content-Type: application/json

{
  "id": "1780960306011",
  "timestamp": "2026-06-08T23:11:46.011Z",
  "tipo": "EMERGENCIA",
  "dispositivo": "...",
  "localizacao": {
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  "status": "ALERTA_ACIONADO",
  "apiKey": "sua-chave-api"
}
```

### Obter Todos os Alertas
```
GET /api/alertas
```

### Obter Alerta Específico
```
GET /api/alertas/:id
```

### Atualizar Status
```
PATCH /api/alertas/:id/status
Content-Type: application/json

{
  "status": "EM_ATENDIMENTO",
  "observacoes": "Policial designado"
}
```

---

## 🔒 Segurança

- ✅ Validação de chave API em cada requisição
- ✅ CORS habilitado apenas para localhost (ajuste conforme necessário)
- ✅ Context isolation no Electron
- ✅ Preload script isolado

### ⚠️ Para Produção:
1. Usar HTTPS em vez de HTTP
2. Implementar autenticação mais robusta (JWT, OAuth)
3. Adicionar rate limiting
4. Validar e sanitizar dados de entrada
5. Usar banco de dados real (PostgreSQL, MongoDB)
6. Implementar logs detalhados

---

## 🛠️ Troubleshooting

### Erro de conexão
- Verifique se o servidor está rodando em `http://localhost:3001`
- Verifique a chave API em ambas as aplicações

### Alertas não chegam no painel
- Abra o console do navegador (F12) e verifique erros
- Verifique se o WebSocket está conectado
- Verifique os logs do servidor

### Geolocalização não funciona
- Aceite a permissão de acesso à localização
- A geolocalização pode não funcionar em localhost (em produção funcionará melhor)

---

## 📝 Arquitetura

```
┌─────────────────────────────┐
│   Aplicação Electron        │
│   (Cliente - Cidadão)       │
└──────────────┬──────────────┘
               │
               │ HTTP POST
               │ (Alerta)
               ▼
┌─────────────────────────────┐
│   Node.js + Express         │
│   (Servidor - API)          │
└──────────────┬──────────────┘
               │
               │ WebSocket
               │
               ▼
┌─────────────────────────────┐
│   Painel Web Browser        │
│   (Polícia - Dashboard)     │
└─────────────────────────────┘
```

---

## 📦 Dependências

### Cliente Electron
- electron
- axios

### Backend
- express
- socket.io
- cors
- uuid

---

## 📄 Licença

ISC

---

## 👨‍💻 Desenvolvedor

Sistema criado para demonstrar integração entre Electron e WebSocket

---

## 🚀 Próximas Melhorias Sugeridas

- [ ] Banco de dados persistente
- [ ] Autenticação de usuários
- [ ] Histórico detalhado de alertas
- [ ] Integração com maps
- [ ] Envio de alertas por email/SMS
- [ ] Análise de dados e estatísticas
- [ ] Sistema de rotas otimizadas para policiais
- [ ] Integração com câmeras de segurança
