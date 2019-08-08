const Utils = require('./utilities.js');
const Economy = require('./economy.js');
const Database = require('./database.js');

var bjGames = module.exports.bjGames = new Map();

class Player {
  constructor(name) {
    this.name = name;
    this.cards = new Array();
    this.value = 0;
    this.aces = 0;
  }
  
  translate(card) {
    let value = (card % 13) + 1;
    let result = '';
    
    switch (value) {
      case 1:
        result += 'A';
        break;
      case 11:
        result += 'J';
        break;
      case 12:
        result += 'Q';
        break;
      case 13:
        result += 'K';
        break;
      default:
        result += value;
    }
    
    switch(Math.floor(card / 13)) {
      case 0:
        result += ':diamonds:';
        break;
      case 1:
        result += ':clubs:';
        break;
      case 2:
        result += ':hearts:';
        break;
      default:
        result += ':spades:';
    }
    
    return result;
  }
  
  translateInt(card) {
    let value = (card % 13) + 1;
    switch (value) {
      case 1:
        return '1';
      case 11:
        return '10';
      case 12:
        return '10';
      case 13:
        return '10';
      default:
        return value;
    }
  }
  
  getCardValueAt(index) {
    return this.translate(this.cards[index]);
  }
  
  addCard(card) {
    this.cards.push(card);
    if ((card + 1) % 13 == 1) {
      this.aces++;
    } else {
      let value = 1 + card % 13;
      value = (value > 10) ? 10: value;
      this._value += value;
    }
  }
  
  set value(n) {
    this._value = n;
  }
  
  get value() {
    let potentialValues = 0;
    
    if (this.aces > 0) {
      for(let i = 0; i < this.aces - 1; i++) {
        potentialValues++;
      }
      potentialValues = (potentialValues + 11 > 21) ? potentialValues + 1 : potentialValues + 11;
    }
    return potentialValues + this._value;
  }
};

class Blackjack {
  constructor(bet) {
    this.bet = bet;
    
    this.deck = new Array(52);
    this.deck.fill(0);
    
    this.player = new Player('Player');

    this.dealer = new Player('Dealer');
    
    this.init();
  }
  
  init() {
    for (let i = 0; i < 2; i++) {
      this.addCard(this.player);
      this.addCard(this.dealer);
    }
  }
  
  getDesc() {
    return this.desc;
  }
  
  drawCard() {
    let card = Math.floor(Math.random() * 52);
    
    while (this.deck[card] != 0) {
      card = Math.floor(Math.random() * 52);
    }
    
    this.deck[card] = 1;
    
    return card + 1;
  }
  
  addCard(player) {
    player.addCard(this.drawCard());
  }
  
  hit(msg) {
    let bet = this.bet;
    this.player.addCard(this.drawCard());
    
    if (this.player.value > 21) {
      bjGames.delete(msg.member.user.id);
      Utils.reply(msg, this.getFinalInfo() + 'You lost!');
        Database.getConnection(function (connection) {
          Economy.removeBalance(connection, msg.member.user.id, bet);
          connection.release();
        });
      Utils.reply(msg, '$' + this.bet + ' has been deducted from your balance!');
    } else {
      Utils.reply(msg, this.getInfo());
    }
  }
  
  stand(msg) {
    const bet = this.bet;
    while (this.dealer.value < 17) {
      this.addCard(this.dealer);
    }
    
    if(this.dealer.value < 22) {
      if (this.player.value > this.dealer.value) {
        Utils.reply(msg, this.getFinalInfo() + 'You won!');
        Database.getConnection(function (connection) {
          Economy.addBalance(connection, msg.member.user.id, bet);
          connection.release();
        });
        Utils.reply(msg, '$' + this.bet + ' has been added to your balance!');
      } else if (this.player.value == this.dealer.value) {
        Utils.reply(msg, this.getFinalInfo() + "It's a draw! Try again!");
      } else {
        Utils.reply(msg, this.getFinalInfo() + 'You lost!');
        Database.getConnection(function (connection) {
          Economy.removeBalance(connection, msg.member.user.id, bet);
          connection.release();
        });
        Utils.reply(msg, '$' + this.bet + ' has been deducted from your balance!');
      }
    } else {
      let bet = this.bet;
      Utils.reply(msg, this.getFinalInfo() + 'You won!');
      Database.getConnection(function (connection) {
        Economy.addBalance(connection, msg.member.user.id, bet);
        connection.release();
      });
      Utils.reply(msg, '$' + this.bet + ' has been added to your balance!');
    }
    
    bjGames.delete(msg.member.user.id);
  }
  
  getInfo() {
    let reply = "**Your Hand: **";
    
    for(let i = 0; i < this.player.cards.length; i++) {
      reply += this.player.getCardValueAt(i) + " ";
    } 
    reply += "(Value: " + this.player.value + ")" + "\n\n"
      + "**Dealer's Hand: **" + this.dealer.getCardValueAt(0) + " X (Value: " + this.dealer.translateInt(this.dealer.cards[0]) + ")" + "\n\n";
    
    return reply;
  }
  
  getFinalInfo() {
    let reply = "**Your Hand: **";
    
    for (let i = 0; i < this.player.cards.length; i++) {
      reply += this.player.getCardValueAt(i) + " ";
    } 
    reply += "(Value: " + this.player.value + ")" + "\n\n"
      + "**Dealer's Hand: **";

    for (let i = 0; i < this.dealer.cards.length; i++) {
      reply += this.dealer.getCardValueAt(i) + " ";
    }
    reply += "(Value: " + this.dealer.value + ")" + "\n\n";
    
    return reply;
  }
  
  hint() {
    let reply = "Type `!hit` to draw another card, double down to double down, or `!stand` to pass.\n\n";
    
    reply += this.getInfo();
    
    return reply
  }
}

module.exports.createBlackjackGame = function (msg, bet) {
  const id = msg.member.user.id;
  let desc = '';
  Database.getConnection(function (connection){
    connection.query('SELECT `balance` FROM `users` WHERE `id`=' + id, (err, result) => {
      if (err) throw err;
      if(result.length > 0) {
        let bal = result[0].balance;
        if(bal - bet >= 0) {
            if (!bjGames.has(id)) {
              let bj = new Blackjack(bet);
              bjGames.set(id, bj);
              desc = bj.hint();
            } else {
              let bj = bjGames.get(id);
              desc = bj.hint();
            }
        } else {
            desc = 'Insufficient balance. Please try again later.';
        }

        Utils.reply(msg, desc);
      } else {
        Economy.addUserToDB(connection, id);
        connection.release();
        module.exports.createBlackjackGame(msg, bet);
      }
    });
  });
}