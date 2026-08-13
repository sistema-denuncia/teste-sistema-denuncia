# 🚔 Sistema de Emergência - Nova Arquitetura

Sistema completo de emergência com aplicações web e desktop separadas.

---

## 📋 Nova Estrutura

```
UC12/Electron/
├── botao-emergencia-web/              (WEB - Cidadão)
│   ├── server.js                      (Express - porta 3000)
│   └── public/
│       ├── index.html
│       ├── style.css
│       └── client.js
│
├── sistema-policia-backend/           (Backend - API)
│   ├── server.js                      (Express + Socket.io - porta 3001)
│   └── public/
│       ├── index.html
│       ├── style.css
│       └── client.js
│
└── painel-policia-electron/           (DESKTOP - Polícia)
    ├── main.js                        (Electron)
    └── package.json
```

---

## 🚀 Como Iniciar

### **1️⃣ Terminal 1 - Backend (API + WebSocket)**

```bash
cd "C:\Users\larissa.rodrigues18\Documents\UC12\Electron\sistema-policia-backend"
npm install  # (primeira vez)
npm start
```

Rodará em: `http://localhost:3001`

---

### **2️⃣ Terminal 2 - Botão de Emergência (WEB)**

```bash
cd "C:\Users\larissa.rodrigues18\Documents\UC12\Electron\botao-emergencia-web"
npm install  # (primeira vez)
npm start
```

Acesse no navegador: `http://localhost:3000`

---

### **3️⃣ Terminal 3 - Painel da Polícia (DESKTOP)**

```bash
cd "C:\Users\larissa.rodrigues18\Documents\UC12\Electron\painel-policia-electron"
npm install  # (primeira vez)
npm start
```

Abrirá uma janela Electron com o painel da polícia

---

## 📊 Arquitetura

```
┌─────────────────────────────────┐
│   Botão de Emergência           │
│   (WEB - Navegador)             │
│   http://localhost:3000         │
└──────────────┬──────────────────┘
               │
               │ HTTP POST
               │ (Alerta)
               ▼
┌─────────────────────────────────┐
│   Backend - API                 │
│   (Node.js + Express)           │
│   http://localhost:3001         │
└──────────────┬──────────────────┘
               │
               │ WebSocket
               │
               ▼
┌─────────────────────────────────┐
│   Painel Polícia (Desktop)      │
│   (Electron)                    │
│   Carrega: localhost:3001       │
└─────────────────────────────────┘
```

---

## 🔄 Fluxo de Operação

1. **Cidadão acessa** `http://localhost:3000` no navegador
2. **Pressiona** botão de emergência (com confirmação dupla)
3. **Dados enviados** para `http://localhost:3001/api/emergencia`
4. **Backend recebe** e notifica via WebSocket
5. **Painel Electron** recebe alerta em tempo real
6. **Som + Notificação** acionados
7. **Policial** atualiza status do alerta

---

## ⚙️ Configuração

### Variáveis de Ambiente (opcional)

**Backend:**
```bash
PORT=3001
POLICIA_API_KEY=sua-chave-api-super-secreta
```

**Botão Web:**
```bash
PORT=3000
POLICIA_SERVER_URL=http://localhost:3001
```

---

## 🎯 Funcionalidades

### 🔴 Botão de Emergência (WEB)
- ✅ Interface responsiva
- ✅ Confirmação dupla de segurança
- ✅ Coleta de geolocalização
- ✅ Feedback visual
- ✅ Funciona em qualquer dispositivo (mobile, tablet, desktop)

### 🚔 Painel da Polícia (DESKTOP)
- ✅ Aplicação Electron completa
- ✅ Recebe alertas em tempo real
- ✅ Sons e notificações
- ✅ Interface otimizada para desktop
- ✅ Filtros por status
- ✅ Atualiza status dos alertas

### 🛠️ Backend (API)
- ✅ API REST para receber alertas
- ✅ WebSocket para tempo real
- ✅ Gerenciamento de alertas
- ✅ Validação de segurança

---

## 🔐 Segurança

- ✅ Validação de chave API
- ✅ CORS configurado
- ✅ Context isolation no Electron
- ✅ Confirmação dupla no botão

### ⚠️ Para Produção:
1. Usar HTTPS
2. Implementar autenticação robusta
3. Rate limiting
4. Banco de dados real
5. Logs detalhados
6. Backup de dados

---

## 📱 Acesso

| Aplicação | URL | Tipo | Porta |
|-----------|-----|------|-------|
| Botão Emergência | http://localhost:3000 | WEB | 3000 |
| Painel Polícia | http://localhost:3001 | DESKTOP (Electron) | 3001 |
| Backend API | http://localhost:3001 | API | 3001 |

---

## 🛠️ Troubleshooting

### "Conexão recusada"
- Verifique se o backend está rodando
- Verifique portas: 3000 (web), 3001 (backend)

### Alertas não chegam
- Verifique os logs do backend
- Verifique a chave API
- Abra DevTools (F12) no navegador

### Electron não abre
- Certifique-se que o backend está rodando
- Verifique a porta 3001

---

## 📝 API Reference

### POST /api/emergencia
Receber novo alerta

### GET /api/alertas
Listar todos os alertas

### GET /api/alertas/:id
Obter alerta específico

### PATCH /api/alertas/:id/status
Atualizar status do alerta

---

## 🚀 Próximas Melhorias

- [ ] Banco de dados persistente
- [ ] Autenticação de usuários
- [ ] Integração com mapas
- [ ] Sistema de notificações por SMS/Email
- [ ] Análise de dados
- [ ] Dashboard com estatísticas
- [ ] Sistema de rotas otimizadas

---

Desenvolvido com ❤️ para emergências
