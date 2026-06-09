const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: path.join(__dirname, 'assets/icon.png')
    });

    // Carregar o painel da polícia do servidor backend
    mainWindow.loadURL('http://localhost:3001');

    // Abrir DevTools em desenvolvimento (descomente se necessário)
    // mainWindow.webContents.openDevTools();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (mainWindow === null) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Mostrar mensagem no console
console.log(`
╔════════════════════════════════════════╗
║  🚔 PAINEL POLÍCIA - ELECTRON          ║
╚════════════════════════════════════════╝

✅ Abrindo painel em: http://localhost:3001
📡 Certifique-se que o backend está rodando!
`);
