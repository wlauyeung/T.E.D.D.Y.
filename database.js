const MySQL = require('mysql');

const db = module.exports.db = MySQL.createConnection({
    host: 'remotemysql.com',
    user: 'vAglAdWor5',
    password: 'B0vNA7e5Zb',
    database: 'vAglAdWor5'
  });

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});