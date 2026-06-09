const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    enviarEmergencia: (dados) => {
        return ipcRenderer.invoke('enviar-emergencia', dados);
    },
    
    onEmergenciaRecebida: (callback) => {
        ipcRenderer.on('emergencia-recebida', (event, dados) => {
            callback(dados);
        });
    }
});