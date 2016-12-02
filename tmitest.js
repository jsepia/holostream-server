const winston = require('winston')
const tmi = require('tmi.js')
require('dotenv').config({silent: true})

const OAUTH_TOKEN = process.env.OAUTH_TOKEN
const CHANNELS = (process.env.CHANNELS || '').split(',').map((str) => str.trim())

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
      username: BOT_NAME,
      password: OAUTH_TOKEN
  },
  channels: CHANNELS
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
        resolve()
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
