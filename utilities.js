module.exports = class Utils {
  static reply(msg, reply) {
    const embed = {
      "description": reply,
      "url": "https://discordapp.com",
      "color": 16626965,
      "author": {
        "name": msg.member.user.tag,
        "icon_url": msg.member.user.avatarURL
      }
    };
    msg.channel.send({ embed });
  }
}
