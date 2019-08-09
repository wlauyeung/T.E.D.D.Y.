const Utils = require('./utilities.js');
const Database = require('./database.js');
const config = require('./config.json');

module.exports.work = function (msg) {
  const id = msg.member.user.id;
  Database.getConnection(function (connection) {
    connection.query(
        "SELECT UNIX_TIMESTAMP(reload_date) as reloadTime FROM users WHERE id="
            + id, (err, result) => {
      const currentDate = new Date();
      const currentTime = Math.floor(currentDate.getTime() / 1000);
      const payment = config.economy.payment;
      if (err) throw err;
      if (result.length > 0) {
        let difference = currentTime - result[0].reloadTime;
        let cooldown = config.economy.cooldown_timer;
        if(difference >= cooldown) {
          module.exports.addBalance(connection, id, payment);
          resetReloadDate(connection, id);
          connection.release();
          Utils.reply(msg, '$' + payment +
              ' has been added to your balance!');
        } else {
          connection.release();
          Utils.reply(msg, 'You worked a while ago. Please wait ' +
              Math.floor(((cooldown - difference) / 60)) + ' minute(s) and ' +
                  ((cooldown - difference) % 60) + ' second(s).');
        }
      } else {
        module.exports.addUserToDB(connection, id);
        connection.release();
        module.exports.work(msg);
      }
    });
  });
}

function resetReloadDate(connection, id) {
  const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
  connection.query("UPDATE `users` SET `reload_date`='" + currentDate +
      "' WHERE `id`=" + id , (err, result) => {
    if (err) throw err;
  });
}

module.exports.checkBal = function (msg) {
  const id = msg.member.user.id;
  Database.getConnection(function (connection) {
      connection.query('SELECT `balance` FROM `users` WHERE `id`=' +
          id, (err, result) => {
      if (err) {
        connection.release();
        throw err;
        Utils.reply(msg, 'An error has occurred! Please contact an administrator to get this resolved!');
      } else if (result.length > 0) {
        connection.release();
        Utils.reply(msg, 'Your balance is $' + result[0].balance);
      } else {
        module.exports.addUserToDB(connection, id);
        connection.release();
        module.exports.checkBal(msg);
      }
    });
  });
} 

module.exports.displayLB = function (client, msg) {  
  Database.db.query('SELECT `balance`, CONVERT(`id`, CHAR(50)) AS `id` FROM `users` ORDER BY `balance` DESC LIMIT 10;',
      (err, result) => {
    if (err) {
      throw err;
      Utils.reply(msg, 'An error has occurred! Please contact an administrator to get this resolved!');
    } else {
      let str = '';
      for (let i = 0; i < result.length; i++) {
        try {
          let user = client.users.get(result[i].id);
          str += (i + 1) + '. ' + user.tag + ' - $' + result[i].balance + '\n';
        } catch (err) {
          console.log('User not found :(');
        }
      }
      Utils.reply(msg, str);
    }      
  });
}

module.exports.addUserToDB = function (connection, id) {
  connection.query('SELECT `balance` FROM `users` WHERE `id`=' +
      id, (err, result) => {
    if (err) throw err;
    if (result.length == 0) {
      connection.query(
          'INSERT INTO `users`(`id`, `balance`, `reload_date`) VALUES (' +
              id + ', 0, ' + "'1000-01-01')", (err, result) => {
        if (err) {
          throw err;
        } else {
          console.log('Added ' + id + ' into the database');
        }
      });
    }
  });
}

module.exports.addBalance = function (connection, id, amount) {
  connection.query('UPDATE `users` SET `balance` = `balance` + ' + amount +
      ' WHERE `id`=' + id, (err, result) => {
    if (err) {
      throw err;
    } else if (result.affectedRows == 0) {
      module.exports.addUserToDB(connection, id);
      module.exports.addBalance(connection, id, amount);
    }
  });
}

module.exports.removeBalance = function (connection, id, amount) {
  connection.query('UPDATE `users` SET `balance` = `balance` - ' + amount +
      ' WHERE `id`=' + id , (err, result) => {
    if (err) throw err;
    if (result.affectedRows == 0) {
      module.exports.addUserToDB(connection, id);
      module.exports.removeBalance(connection, id, amount);
    }
  });
}

module.exports.donate = function (msg, donee, donation) {
  const donorID = msg.member.user.id;
  const doneeID = donee.id;
  if (donorID != doneeID) {
    Database.getConnection(function (connection) {
      Database.getBalanceByID(connection, donorID, function (result) {
        if (result.length > 0) {
          if (result[0].balance - donation >= 0) {
            module.exports.removeBalance(connection, donorID, donation);
            module.exports.addBalance(connection, doneeID, donation);
            Utils.reply(msg, 'You have donated $' + donation + ' to ' +
                donee.tag);
          } else {
            Utils.reply(msg, 'You do not have enough balance to donate to' +
                donee.tag);
          }
          connection.release();
        } else {
          module.exports.addUserToDB(connection, donorID);
          connection.release();
          module.exports.donate(msg, doneeID, donation);
        }
      });
    });
  } else {
    Utils.reply(msg, 'You cannot donate to yourself!');
  }
}