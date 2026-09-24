const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Define o caminho onde o arquivo do banco de dados será salvo
const DB_PATH = path.join(__dirname, 'emergencia.db');

// Inicializa a conexão com o banco de dados
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Erro ao abrir o banco de dados:', err.message);
        process.exit(1);
    }
    console.log('✔ Conectado ao banco de dados SQLite.');
});

// Executa as queries dentro de uma serialização para garantir a ordem correta
db.serialize(() => {
    
    // 1. ATIVAR CHAVES ESTRANGEIRAS
    // Por padrão, o SQLite desativa o suporte a Foreign Keys. Precisamos ligar manualmente.
    db.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) console.error('Erro ao ativar chaves estrangeiras:', err.message);
    });

    // 2. CRIAR TABELA DE USUÁRIOS
    const queryUsuarios = `
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            tipo_usuario TEXT CHECK(tipo_usuario IN ('CIDADAO', 'POLICIAL')) DEFAULT 'CIDADAO',
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;
    db.run(queryUsuarios, (err) => {
        if (err) console.error('❌ Erro ao criar tabela "usuarios":', err.message);
        else console.log('🔹 Tabela "usuarios" verificada/criada com sucesso.');
    });

    // 3. CRIAR TABELA DE DENÚNCIAS
    const queryDenuncias = `
        CREATE TABLE IF NOT EXISTS denuncias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER,
            latitude REAL,
            longitude REAL,
            status TEXT CHECK(status IN ('ATIVO', 'EM_ATENDIMENTO', 'RESOLVIDO')) DEFAULT 'ATIVO',
            descricao TEXT,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
        );
    `;
    db.run(queryDenuncias, (err) => {
        if (err) console.error('❌ Erro ao criar tabela "denuncias":', err.message);
        else console.log('🔹 Tabela "denuncias" verificada/criada com sucesso.');
    });

    // 4. CRIAR TABELA DE NOTIFICAÇÕES
    const queryNotificacoes = `
        CREATE TABLE IF NOT EXISTS notificacoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            denuncia_id INTEGER,
            titulo TEXT NOT NULL,
            mensagem TEXT NOT NULL,
            lida INTEGER CHECK(lida IN (0, 1)) DEFAULT 0,
            criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
            FOREIGN KEY (denuncia_id) REFERENCES denuncias(id) ON DELETE CASCADE
        );
    `;
    db.run(queryNotificacoes, (err) => {
        if (err) console.error('❌ Erro ao criar tabela "notificacoes":', err.message);
        else console.log('🔹 Tabela "notificacoes" verificada/criada com sucesso.');
    });

});

// Fecha a conexão após a criação das tabelas
db.close((err) => {
    if (err) {
        console.error('Erro ao fechar o banco de dados:', err.message);
    } else {
        console.log('🚀 Banco de dados pronto para uso e conexão encerrada.');
    }
});