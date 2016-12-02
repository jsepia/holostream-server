const winston = require('winston')
const tmi = require('tmi.js')
const config = require('util/config')

const tmiClient = new tmi.client({
  options: {
    debug: true
  },
  connection: {
    cluster: 'aws',
    secure: true,
    reconnect: true
  },
  identity: {
    username: config.BOT_NAME,
    password: config.OAUTH_TOKEN
  },
  channels: config.CHANNELS
})

function getClient() {
  const p = new Promise((resolve) => {
    if (tmiClient.readyState() === 'OPEN') {
      return resolve(tmiClient)
    }
    tmiClient.on('connected', () => {
      resolve(tmiClient)
    })
  })
  return p
}

function connect() {
  winston.info('TMI client connecting...')
  return new Promise((resolve, reject) => {
    tmiClient.connect().then(
      (server, port) => {
        winston.debug(`Connected to ${server}:${port}`)
        getClient().then(
          resolve,
          reject
        )
      },
      (err) => {
        reject(err)
      }
    )
  })
}

module.exports = {
  connect: connect,
  getClient: getClient
}
