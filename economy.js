const Utils = require('./utilities.js');
const Database = require('./database.js');

module.exports = class Economy {
  static work(msg, callback) {
    const id = msg.member.user.id;
    Database.db.query("SELECT DATE_FORMAT(`reload_date`,'%Y-%m-%d') AS `reload_date` FROM `Users` WHERE `id`=" + id, (err, result) => {
      if (err) {
        throw err;
      } else {
        if (result.length > 0) {
          const currentDate = new Date();
          const reloadDate = result[0].reload_date.split("-");
          const reloadMonth = parseInt(reloadDate[1]) + 1;

          if (currentDate.getMonth() >= reloadMonth) {
             if (currentDate.getMonth() == reloadMonth
               && currentDate.getDate() < reloadMonth) {
               Utils.reply(msg, 'You have already worked today. Please wait until tomorrow.');
             } else {
               this.addBalance(msg, 1000);
               this.resetReloadDate(id);
             }
          } else {
            if(currentDate.getFullYear() > parseInt(reloadDate[0])) {
              this.addBalance(msg, 1000);
              this.resetReloadDate(id);
            } else {
              Utils.reply(msg, 'You have already worked today. Please wait until tomorrow.');
            }
          }
        } else {
          this.addUserToDB(id);
          this.work(msg);
        }
      }
    });
  }

  static resetReloadDate(id) {
    const currentDate = new Date();
    let year = currentDate.getFullYear();
    let month = (currentDate.getMonth() + 1 < 9) ? '0' + (currentDate.getMonth() + 1) : (currentDate.getMonth() + 1);
    let day = (currentDate.getDate() + 1 < 9) ? '0' + (currentDate.getDate() + 1) : (currentDate.getDate() + 1);
    let str = year + '-' + month + '-' + day;

    Database.db.query("UPDATE `Users` SET `reload_date`='" + str + "' WHERE `id`=" + id
             , (err, result) => {
      if (err) throw err;
    });
  }

  static addBalance(msg, amount) {
    Database.db.query('UPDATE `Users` SET `balance` = `balance` + ' + amount + ' WHERE `id`=' + msg.member.user.id
             , (err, result) => {
      if (err) throw err;
      if (result.affectedRows > 0) {
        Utils.reply(msg, '$' + amount + ' has been added to your balance!');
      }
    });
  }

  static removeBalance(msg, amount) {
      Database.db.query('UPDATE `Users` SET `balance` = `balance` - ' + amount + ' WHERE `id`=' + msg.member.user.id
             , (err, result) => {
      if (err) throw err;
      if (result.affectedRows > 0) {
        Utils.reply(msg, '$' + amount + ' has been deducted from your balance!');
      }
    });
  }

  static checkBal(msg) {
    const id = msg.member.user.id;
    Database.db.query('SELECT `balance` FROM `Users` WHERE `id`=' + id, (err, result) => {
      if (err) throw err;
      if (result.length > 0) {
        Utils.reply(msg, 'Your balance is $' + result[0].balance);
      } else {
        this.addUserToDB(id);
        this.checkBal(msg);
      }
    });
  } 

  static addUserToDB(id) {
    Database.db.query('INSERT INTO `Users`(`id`, `balance`, `reload_date`) VALUES (' + id + ', 0, ' + "'1000-01-01')", (err, result) => {
      if (err) {
        throw err;
      } else {
        console.log('Added ' + id + ' into the database');
      }
    });
  }

  static displayLB(client, msg) {  
    Database.db.query('SELECT `balance`, CONVERT(`id`, CHAR(50)) AS `id` FROM `Users` ORDER BY `balance` DESC LIMIT 10;', (err, result) => {
      if (err) throw err;
      let str = '';
      for (let i = 0; i < result.length; i++) {
        let user = client.users.get(result[i].id);
        str += (i + 1) + '. ' + user.tag + ' - $' + result[i].balance + '\n';
      }

      Utils.reply(msg, str);
    });
  }
}