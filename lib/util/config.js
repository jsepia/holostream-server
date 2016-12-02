module.exports = {
  BOT_NAME: process.env.BOT_NAME,
  OAUTH_TOKEN: process.env.OAUTH_TOKEN,
  CHANNELS: (process.env.CHANNELS || '').split(',').map((str) => str.trim()),
  COOLDOWN_BETWEEN_MESSAGES: process.env.COOLDOWN_BETWEEN_MESSAGES || 5500
}
