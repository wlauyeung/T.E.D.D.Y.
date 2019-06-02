const Discord = require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');

function generateDenizenEmbedFields() {
  return config.reactionRoles.denizen.roles.map((r, e) => {
    return {
      emoji: config.reactionRoles.denizen.emoji[e],
      role: r
    }
  });
}

function generateGameModeEmbedFields() {
  return config.reactionRoles.gamemode.roles.map((r, e) => {
    return {
      emoji: config.reactionRoles.gamemode.emoji[e],
      role: r
    }
  });
}

function generatePlatformEmbedFields() {
  return config.reactionRoles.platform.roles.map((r, e) => {
    return {
      emoji: config.reactionRoles.platform.emoji[e],
      role: r
    }
  });
}

client.on('ready', () => {
  console.log('Logged in as ' + client.user.tag);
});

client.on('message', msg => {
  if (!msg.content.startsWith(config.prefix) || msg.author.bot) return;
  const args = msg.content.slice(1).split(' ');
  const command = args.shift().toLowerCase();
  if (command === config.commands.setreactrole
      && msg.member.hasPermission('ADMINISTRATOR')) {
    if (args[0] === config.reactionRoles.denizen.name) {
      const roleEmbed = new Discord.RichEmbed()
          .setTitle(config.reactionRoles.denizen.title)
              .setDescription(config.reactionRoles.denizen.description)
                  .setFooter(config.reactionRoles.denizen.footer);
      const fields = generateDenizenEmbedFields();
      for (const f of fields) {
        const emoji = f.emoji;
        const customEmoji = client.emojis.find(e => e.name === emoji);
        if (!customEmoji) {
          roleEmbed.addField(emoji, f.role, true);
        } else {
          roleEmbed.addField(customEmoji, f.role, true);
        }
      }
      msg.channel.send(roleEmbed).then(async m => {
        for (const r of config.reactionRoles.denizen.emoji) {
          const emoji = r;
          const customEmoji = client.emojis.find(e => e.name === emoji);
          if (!customEmoji) {
            await m.react(emoji);
          } else {
            await m.react(customEmoji.id);
          }
        }
      });
    }
    if (args[0] === config.reactionRoles.gamemode.name) {
      const roleEmbed = new Discord.RichEmbed()
          .setTitle(config.reactionRoles.gamemode.title)
              .setDescription(config.reactionRoles.gamemode.description)
                  .setFooter(config.reactionRoles.gamemode.footer);
      const fields = generateGameModeEmbedFields();
      for (const f of fields) {
        const emoji = f.emoji;
        const customEmoji = client.emojis.find(e => e.name === emoji);
        if (!customEmoji) {
          roleEmbed.addField(emoji, f.role, true);
        } else {
          roleEmbed.addField(customEmoji, f.role, true);
        }
      }
      msg.channel.send(roleEmbed).then(async m => {
        for (const r of config.reactionRoles.gamemode.emoji) {
          const emoji = r;
          const customEmoji = client.emojis.find(e => e.name === emoji);
          if (!customEmoji) {
            await m.react(emoji);
          } else {
            await m.react(customEmoji.id);
          }
        }
      });
    }
    if (args[0] === config.reactionRoles.platform.name) {
      const roleEmbed = new Discord.RichEmbed()
          .setTitle(config.reactionRoles.platform.title)
              .setDescription(config.reactionRoles.platform.description)
                  .setFooter(config.reactionRoles.platform.footer);
      const fields = generatePlatformEmbedFields();
      for (const f of fields) {
        const emoji = f.emoji;
        const customEmoji = client.emojis.find(e => e.name === emoji);
        if (!customEmoji) {
          roleEmbed.addField(emoji, f.role, true);
        } else {
          roleEmbed.addField(customEmoji, f.role, true);
        }
      }
      msg.channel.send(roleEmbed).then(async m => {
        for (const r of config.reactionRoles.platform.emoji) {
          const emoji = r;
          const customEmoji = client.emojis.find(e => e.name === emoji);
          if (!customEmoji) {
            await m.react(emoji);
          } else {
            await m.react(customEmoji.id);
          }
        }
      });
    }
  }
});

client.on('raw', async packet => {
  if (!['MESSAGE_REACTION_ADD', 'MESSAGE_REACTION_REMOVE']
      .includes(packet.t)) return;
  const message = await client.channels.get(packet.d.channel_id)
      .fetchMessage(packet.d.message_id);
  const member = message.guild.members
      .get(client.users.get(packet.d.user_id).id);
  let reaction = message.reactions.get((packet.d.emoji.id) ?
      `${packet.d.emoji.name}:${packet.d.emoji.id}` : packet.d.emoji.name);
  if (!reaction) {
    reaction = new MessageReaction(message, new Emoji(client.guilds
        .get(packet.d.guild_id), packet.d.emoji), 1, packet.d.user_id ===
            client.user.id);
  }
  const fields = message.embeds[0].fields;
  for (let i = 0; i < fields.length; i++) {
    const role = message.guild.roles.find(r => r.name === fields[i].value);
    if ((fields[i].name === reaction.emoji.name)
        || (fields[i].name === reaction.emoji.toString())) {
      if (packet.t === 'MESSAGE_REACTION_ADD') {
        member.addRole(role.id);
        break;
      } else {
        member.removeRole(role.id);
        break;
      }
    }
  }
});

client.login(config.token);
