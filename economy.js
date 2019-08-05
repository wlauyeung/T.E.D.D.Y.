const Utils = require('./utilities.js');
const Database = require('./database.js');

module.exports = class Economy {
  static work(msg, callback) {
    const payment = 1000;
    const id = msg.member.user.id;
    Database.db.query("SELECT DATE_FORMAT(`reload_date`,'%Y-%m-%d') AS `reload_date` FROM `Users` WHERE `id`=" + id, (err, result) => {
      if (err) {
        console.error(err);
      } else {
        if (result.length > 0) {
          const currentDate = new Date();
          const reloadDate = result[0].reload_date.split("-");
          const reloadMonth = parseInt(reloadDate[1]);
          
          if (currentDate.getMonth() + 1 >= reloadMonth) {
           if (currentDate.getMonth() + 1 == reloadMonth
             && currentDate.getDate() < reloadMonth) {
             Utils.reply(msg, 'You have already worked today. Please wait until tomorrow.');
           } else {
             this.addBalance(id, payment)
             Utils.reply(msg, '$' + payment + ' has been added to your balance!');
             this.resetReloadDate(id);
           }
          } else {
            if(currentDate.getFullYear() > parseInt(reloadDate[0])) {
              this.addBalance(id, payment)
              Utils.reply(msg, '$' + payment + ' has been added to your balance!');
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
    let day = (currentDate.getDate() < 9) ? '0' + currentDate.getDate() : currentDate.getDate();
    let str = year + '-' + month + '-' + day;

    Database.db.query("UPDATE `Users` SET `reload_date`='" + str + "' WHERE `id`=" + id
             , (err, result) => {
      if (err) console.error(err);;
    });
  }

  static addBalance(id, amount) {
    Database.db.query('UPDATE `Users` SET `balance` = `balance` + ' + amount + ' WHERE `id`=' + id
             , (err, result) => {
      if (err) console.error(err);
      if (result.affectedRows == 0) {
        this.addUserToDB(id);
        this.addBalance(id, amount);
      }
    });
  }

  static removeBalance(id, amount) {
      Database.db.query('UPDATE `Users` SET `balance` = `balance` - ' + amount + ' WHERE `id`=' + id
             , (err, result) => {
      if (err) console.error(err);
      if (result.affectedRows == 0) {
        this.addUserToDB(id);
        this.removeBalance(id, amount);
      }
    });
  }

  static checkBal(msg) {
    const id = msg.member.user.id;
    Database.db.query('SELECT `balance` FROM `Users` WHERE `id`=' + id, (err, result) => {
      if (err) console.error(err);
      if (result.length > 0) {
        Utils.reply(msg, 'Your balance is $' + result[0].balance);
      } else {
        this.addUserToDB(id);
        this.checkBal(msg);
      }
    });
  } 

  static addUserToDB(id) {
    Database.db.query('SELECT `balance` FROM `Users` WHERE `id`=' + id, (err, result) => {
      if (err) console.error(err);
      if (result.length == 0) {
        Database.db.query('INSERT INTO `Users`(`id`, `balance`, `reload_date`) VALUES (' + id + ', 0, ' + "'1000-01-01')", (err, result) => {
          if (err) {
            console.error(err);
          } else {
            console.log('Added ' + id + ' into the database');
          }
        });
      }
    });
  }

  static displayLB(client, msg) {  
    Database.db.query('SELECT `balance`, CONVERT(`id`, CHAR(50)) AS `id` FROM `Users` ORDER BY `balance` DESC LIMIT 10;', (err, result) => {
      if (err) console.error(err);
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
    });
  }
  
  static donate(msg, donee, donation) {
    const donorID = msg.member.user.id;
    const doneeID = donee.id;
    
    if(donorID != doneeID) {
      Database.db.query('SELECT `balance` FROM `Users` WHERE `id`=' + donorID, (err, result) => {
        if (err) console.error(err);
        if (result.length > 0) {
          if(result[0].balance - donation >= 0) {
            this.removeBalance(donorID, donation);
            this.addBalance(doneeID, donation);
            Utils.reply(msg, 'You have donated $' + donation + ' to ' + donee.tag);
          } else {
            Utils.reply(msg, 'You do not have enough balance to donate to' + donee.tag);
          }
        } else {
          this.addUserToDB(donorID);
          this.donate(msg, doneeID, donation);
        }
      });
    } else {
      Utils.reply(msg, 'You cannot donate to yourself!');
    }
  }
}