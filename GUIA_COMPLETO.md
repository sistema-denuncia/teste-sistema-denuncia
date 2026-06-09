# 🚨 SISTEMA DE EMERGÊNCIA - GUIA COMPLETO

## 🎯 Nova Arquitetura

A arquitetura foi reorganizada conforme solicitado:

| Aplicação | Tipo | Descrição |
|-----------|------|-----------|
| **Botão de Emergência** | 🌐 WEB | Cidadão acessa via navegador (localhost:3000) |
| **Painel da Polícia** | 🖥️ DESKTOP | Aplicação Electron com painel em tempo real |
| **Backend** | ⚙️ API | Node.js + Express + Socket.io (localhost:3001) |

---

## 📁 Estrutura de Pastas

```
C:\Users\larissa.rodrigues18\Documents\UC12\Electron\
│
├── botao-emergencia-web/              ← 🌐 APP WEB (Cidadão)
│   ├── server.js
│   ├── package.json
│   └── public/
│       ├── index.html
│       ├── style.css
│       └── client.js
│
├── sistema-policia-backend/           ← ⚙️ BACKEND (API + WebSocket)
│   ├── server.js
│   ├── package.json
│   └── public/
│
└── painel-policia-electron/           ← 🖥️ ELECTRON DESKTOP (Polícia)
    ├── main.js
    ├── package.json
    └── README.md
```

---

## 🚀 INICIAR O SISTEMA

### **Abra 3 terminais diferentes:**

---

### **Terminal 1️⃣ - BACKEND (porta 3001)**

```bash
cd "C:\Users\larissa.rodrigues18\Documents\UC12\Electron\sistema-policia-backend"
npm start
```

Você verá:
```
╔════════════════════════════════════════╗
║  🚔 SISTEMA DE EMERGÊNCIA DA POLÍCIA  ║
╚════════════════════════════════════════╝

✅ Servidor rodando em http://localhost:3001
```

---

### **Terminal 2️⃣ - BOTÃO DE EMERGÊNCIA WEB (porta 3000)**

```bash
cd "C:\Users\larissa.rodrigues18\Documents\UC12\Electron\botao-emergencia-web"
npm start
```

Você verá:
```
╔════════════════════════════════════════╗
║  🚨 BOTÃO DE EMERGÊNCIA - WEB          ║
╚════════════════════════════════════════╝

✅ Servidor rodando em http://localhost:3000
```

Depois **abra seu navegador** em: **`http://localhost:3000`**

---

### **Terminal 3️⃣ - PAINEL POLÍCIA ELECTRON (Desktop)**

```bash
cd "C:\Users\larissa.rodrigues18\Documents\UC12\Electron\painel-policia-electron"
npm start
```

Uma **janela Electron** abrirá automaticamente com o painel da polícia

---

## 📊 Visualização do Sistema

```
┌─────────────────────────────────────────────────┐
│        Cidadão (Navegador - localhost:3000)     │
│          [Botão de Emergência 🚨]               │
└──────────────────┬──────────────────────────────┘
                   │ HTTP POST
                   │ Envia alerta
                   ▼
┌─────────────────────────────────────────────────┐
│        Backend (localhost:3001)                 │
│   Express API + Socket.io WebSocket             │
│   ✓ Recebe alerta                              │
│   ✓ Valida dados                               │
│   ✓ Notifica em tempo real                      │
└──────────────────┬──────────────────────────────┘
                   │ WebSocket
                   │ Notificação em tempo real
                   ▼
┌─────────────────────────────────────────────────┐
│    Painel Polícia (Electron Desktop)            │
│  🚔 Interface da Polícia                        │
│  ✓ Recebe alertas                              │
│  ✓ Som + Notificação                           │
│  ✓ Gerencia status do alerta                    │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Operação

1. **Cidadão** acessa `http://localhost:3000` 
2. **Pressiona** o botão EMERGÊNCIA (clique 2x para confirmar)
3. **Sistema coleta:**
   - ID único
   - Data/Hora
   - Localização (GPS)
   - Tipo de dispositivo
4. **Envia** para Backend `http://localhost:3001/api/emergencia`
5. **Backend recebe** e notifica via WebSocket
6. **Painel Electron** recebe alerta em tempo real
7. **Som + Notificação Visual** disparam
8. **Policial** vê alerta no desktop e pode:
   - Ver detalhes completos
   - Marcar como "Em Atendimento"
   - Marcar como "Resolvido"

---

## 💻 Tecnologias Utilizadas

### Frontend (Botão Web)
- HTML5
- CSS3 com Animações
- JavaScript Vanilla
- Fetch API

### Backend
- Node.js
- Express.js
- Socket.io (WebSocket)
- UUID

### Desktop (Polícia)
- Electron
- HTML/CSS/JS
- Socket.io Client

---

## 🔐 Segurança

- ✅ Chave API obrigatória: `sua-chave-api-super-secreta`
- ✅ Confirmação dupla no botão (previne acidentes)
- ✅ Context isolation no Electron
- ✅ CORS configurado

---

## 📡 Comunicação

### Botão → Backend
```javascript
POST http://localhost:3001/api/emergencia
Content-Type: application/json

{
  "id": "1234567890",
  "timestamp": "2026-06-08T23:11:46.011Z",
  "tipo": "EMERGENCIA",
  "dispositivo": "Mozilla/5.0...",
  "localizacao": { "latitude": -23.5505, "longitude": -46.6333 },
  "apiKey": "sua-chave-api-super-secreta"
}
```

### Backend → Painel (WebSocket)
```javascript
socket.emit('novo-alerta', alerta)
socket.emit('tocar-som-alerta')
socket.emit('mostrar-notificacao', { titulo, mensagem })
```

---

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| ❌ "Conexão recusada" | Verifique se Backend está rodando (Terminal 1) |
| ❌ Alerta não chega | Verifique console (F12) e logs do backend |
| ❌ Electron não abre | Certifique-se backend está rodando |
| ❌ Porta em uso | Altere porta no arquivo `server.js` |

---

## 📱 Acessar de Outro Dispositivo

Para acessar o botão de emergência de outro PC/mobile na rede:

1. Descubra o IP do seu PC:
   ```bash
   ipconfig
   ```
   Ex: `192.168.1.100`

2. Acesse no outro dispositivo:
   ```
   http://192.168.1.100:3000
   ```

---

## 🛠️ Personalização

### Mudar Cores
Edite `botao-emergencia-web/public/style.css` e `sistema-policia-backend/public/style.css`

### Mudar Porta Backend
Edite `sistema-policia-backend/server.js`:
```javascript
const PORT = process.env.PORT || 3001; // Mude 3001 para outra porta
```

### Mudar Porta Botão Web
Edite `botao-emergencia-web/server.js`:
```javascript
const PORT = process.env.PORT || 3000; // Mude 3000 para outra porta
```

---

## ✨ Próximas Melhorias

- [ ] Integração com Google Maps
- [ ] Banco de dados (PostgreSQL/MongoDB)
- [ ] Autenticação com login
- [ ] SMS/Email de notificação
- [ ] Dashboard com estatísticas
- [ ] Sistema de rotas para policiais
- [ ] Histórico completo de alertas
- [ ] Integração com câmeras

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique se todos 3 servidores estão rodando
2. Verifique as portas (3000, 3001)
3. Abra Console (F12) e verifique erros
4. Verifique logs do terminal

---

**Sistema pronto para usar! 🎉**

Divirta-se desenvolvendo! 🚀
