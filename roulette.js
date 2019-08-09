const Utils = require('./utilities.js');
const Database = require('./database.js');
const Economy = require('./economy.js');

module.exports.createRoulette = function (msg, guess, bet) {
  let id = msg.member.user.id;
  let win, color, reward, n;
  
  Database.getConnection(function (connection) {
    Database.getBalanceByID(connection, id, function (result) {
      if (result.length > 0) {
        bet = (bet > 0) ? bet : -bet;
        if(result[0].balance - bet >= 0 && bet != 0) {
          reward = bet;
          n = Math.floor(Math.random() * 36);
          if (n % 2 == 1) {
            win = (guess === 'red') ? true : false;
            color = 'Red';
          } else if (n == 0) {
            win = (guess === 'green') ? true : false;
            reward *= 10;
            color = 'Green';
          } else {
            win = (guess === 'black') ? true : false;
            color = 'Black';
          }
          if (win) {
            Utils.reply(msg, 'The ball has landed on **' +
                  color + '**!\n\nYou won! $' + reward +
                  ' has been added to your balance!');
            Economy.addBalance(connection, msg.member.user.id, bet);
            connection.release();
          } else {
            Utils.reply(msg, 'The ball has landed on **' +
                  color + '**!\n\nYou lost! $' + bet +
                  ' has been deducted from your balance!');
            Economy.removeBalance(connection, msg.member.user.id, bet);
            connection.release();
          }
        } else {
          connection.release();
          Utils.reply(msg, 'Insufficient balance. Please try again later.');
        }
      } else {
        Economy.addUserToDB(connection, id);
        connection.release();
        module.exports.createRoulette(msg, guess, bet);
      }
    });
  });
}