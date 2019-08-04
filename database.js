const MySQL = require('mysql');
const config = require('./config.json');

const db = module.exports.db = MySQL.createConnection({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to database');
});