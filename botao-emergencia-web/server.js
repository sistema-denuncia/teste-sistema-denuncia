const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Servir a página HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║  🚨 BOTÃO DE EMERGÊNCIA - WEB          ║
╚════════════════════════════════════════╝

✅ Servidor rodando em http://localhost:${PORT}
🔗 Acesse: http://localhost:${PORT}

Enviar alertas para: http://localhost:3001
    `);
});
