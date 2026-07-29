// ============================================================
//  db.js — Conexão com o MySQL
//  Este arquivo é idêntico nos dois projetos.
//  Ambos apontam para o mesmo banco: emergencias
// ============================================================

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host    : process.env.DB_HOST     || 'localhost',
  port    : process.env.DB_PORT     || 3306,
  user    : process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'emergencias',

  connectionLimit   : 10,
  waitForConnections: true,
  queueLimit        : 0,
});

// Descomente este bloco quando tiver o MySQL configurado:
// pool.getConnection()
//   .then(conn => {
//     console.log('✅ MySQL conectado com sucesso.');
//     conn.release();
//   })
//   .catch(err => {
//     console.error('❌ Falha ao conectar no MySQL:', err.message);
//     console.error('   Verifique as variáveis no arquivo .env');
//     process.exit(1);
//   });

module.exports = pool;