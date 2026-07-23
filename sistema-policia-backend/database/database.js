const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'emergencia.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Erro ao abrir o banco de dados:', err.message);
    process.exit(1);
  }
});

function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });
}

function getRows(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

function getRow(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

async function initializeDatabase() {
  await runQuery('PRAGMA foreign_keys = ON;');

  await runQuery(`
    CREATE TABLE IF NOT EXISTS alertas_policia (
      id TEXT PRIMARY KEY,
      protocolo TEXT NOT NULL UNIQUE,
      tipo TEXT NOT NULL,
      status TEXT NOT NULL,
      prioridade TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      dispositivo TEXT,
      ip_origem TEXT,
      observacoes TEXT,
      criado_em TEXT NOT NULL,
      atualizado_em TEXT,
      timestamp TEXT NOT NULL
    );
  `);

  await runQuery(`
    CREATE TABLE IF NOT EXISTS notificacoes_policia (
      id TEXT PRIMARY KEY,
      alerta_id TEXT,
      titulo TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      tipo TEXT NOT NULL DEFAULT 'ALERTA',
      lida INTEGER NOT NULL DEFAULT 0,
      criada_em TEXT NOT NULL,
      FOREIGN KEY (alerta_id) REFERENCES alertas_policia(id)
    );
  `);

  console.log('✅ Banco SQLite inicializado com sucesso.');
}

async function insertAlerta(alerta) {
  await runQuery(
    `INSERT INTO alertas_policia (
      id, protocolo, tipo, status, prioridade, latitude, longitude, dispositivo, ip_origem, observacoes, criado_em, atualizado_em, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      alerta.id,
      alerta.protocolo,
      alerta.tipo,
      alerta.status,
      alerta.prioridade,
      alerta.latitude,
      alerta.longitude,
      alerta.dispositivo,
      alerta.ip_origem,
      alerta.observacoes || null,
      alerta.criado_em,
      alerta.atualizado_em || alerta.criado_em,
      alerta.timestamp,
    ]
  );

  return alerta;
}

async function insertNotificacao(notificacao) {
  await runQuery(
    `INSERT INTO notificacoes_policia (id, alerta_id, titulo, mensagem, tipo, lida, criada_em)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      notificacao.id,
      notificacao.alerta_id || null,
      notificacao.titulo,
      notificacao.mensagem,
      notificacao.tipo || 'ALERTA',
      notificacao.lida ? 1 : 0,
      notificacao.criada_em || new Date().toISOString(),
    ]
  );

  return notificacao;
}

async function getAlertas(status = null) {
  let sql = 'SELECT * FROM alertas_policia WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY criado_em DESC LIMIT 100';
  return getRows(sql, params);
}

async function getNotificacoes(lida = null) {
  let sql = 'SELECT * FROM notificacoes_policia WHERE 1=1';
  const params = [];

  if (lida !== null) {
    sql += ' AND lida = ?';
    params.push(lida ? 1 : 0);
  }

  sql += ' ORDER BY criada_em DESC';
  return getRows(sql, params);
}

async function getAlertaById(id) {
  return getRow('SELECT * FROM alertas_policia WHERE id = ?', [id]);
}

async function updateAlertaStatus(id, status, observacoes) {
  const atualizadoEm = new Date().toISOString();

  await runQuery(
    'UPDATE alertas_policia SET status = ?, observacoes = ?, atualizado_em = ?, timestamp = ? WHERE id = ?',
    [status, observacoes || null, atualizadoEm, atualizadoEm, id]
  );

  return getAlertaById(id);
}

module.exports = {
  db,
  initializeDatabase,
  insertAlerta,
  insertNotificacao,
  getAlertas,
  getNotificacoes,
  getAlertaById,
  updateAlertaStatus,
};