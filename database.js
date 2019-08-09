const MySQL = require('mysql');
const config = require('./config.json');
const db = module.exports.db = MySQL.createPool({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database
});

module.exports.getConnection = function (callback) {
  db.getConnection(function(err, connection) {
    if (err) throw err;
    callback(connection);
  });
}

module.exports.getBalanceByID = function (connection, id, callback) {
  connection.query('SELECT `balance` FROM `users` WHERE `id`=' + id,
      (err, result) => {
    if (err) throw err;
    callback(result);
  });
}

db.on('error', function (err) {
	if (err) throw err;
});
