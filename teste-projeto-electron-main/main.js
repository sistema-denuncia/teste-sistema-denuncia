const { app, BrowserWindow, ipcMain, Notification } = require('electron');
const path = require('path');
const axios = require('axios');

let mainWindow;

// Configurações do servidor da polícia
const CONFIG = {
    SERVIDOR_URL: process.env.POLICIA_SERVER_URL || 'http://localhost:3001',
    API_KEY: process.env.POLICIA_API_KEY || 'sua-chave-api-super-secreta'
};

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 2500,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');
}

// Handler para enviar emergência
ipcMain.handle('enviar-emergencia', async (event, dados) => {
    try {
        console.log('Processando alerta de emergência:', dados);

        // Enviar notificação no sistema
        const notificacao = new Notification({
            title: '🚨 EMERGÊNCIA ACIONADA',
            body: 'Um alerta de emergência foi enviado para a polícia',
            icon: path.join(__dirname, 'assets/emergencia-icon.png')
        });
        notificacao.show();

        // Enviar dados para o servidor da polícia
        const resposta = await axios.post(
            `${CONFIG.SERVIDOR_URL}/api/emergencia`,
            {
                ...dados,
                apiKey: CONFIG.API_KEY
            },
            {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.API_KEY}`
                }
            }
        );

        console.log('Resposta do servidor:', resposta.data);

        return {
            sucesso: true,
            mensagem: 'Alerta enviado com sucesso',
            id: resposta.data.id,
            referencia: resposta.data.protocolo
        };

    } catch (erro) {
        console.error('Erro ao enviar emergência:', erro.message);
        
        // Notificação de erro
        const notificacaoErro = new Notification({
            title: '❌ Erro no Envio',
            body: 'Não foi possível enviar o alerta. Verifique a conexão.',
            icon: path.join(__dirname, 'assets/erro-icon.png')
        });
        notificacaoErro.show();

        return {
            sucesso: false,
            mensagem: erro.message || 'Erro ao conectar com o servidor'
        };
    }
});

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});