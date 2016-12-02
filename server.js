'use strict'

const path = require('path')
const winston = require('winston')
require('app-module-path').addPath(path.join(__dirname, 'lib'))
require('dotenv').config({silent: true})

// configure system logging
winston.level = process.env.LOG_LEVEL || 'info'
winston.addColors({
  debug: 'gray',
  info: 'green',
  warn: 'orange',
  error: 'red'
})

const tmi = require('services/tmi')
const Bot = require('bot')
const currencyPlugin = require('bot/plugins/currency')
const queuedMessageBroker = require('bot/plugins/queued-message-broker')

// test data
const customCommands = {
  '!about': 'Julio is an amateur artist based in Seattle. He likes to draw tiny stuff and is rather fond of felines.',
  '!social': 'Website: http://juliosepia.com | Instagram: https://instagram.com/draws_with_kitties',
  '!bot': 'I am kittythebot! Find me on https://github.com/jsepia/holostream-server'
}

let kittybot = null

tmi.connect().then(
  (client) => {
    kittybot = new Bot(client)
    kittybot.use(currencyPlugin)
    kittybot.use(queuedMessageBroker)
    kittybot.command('!units', currencyPlugin.queryMyCurrency)
    for(const command in customCommands) {
      const value = customCommands[command]
      kittybot.command(command, value)
    }
  },
  (err) => {
    winston.warn(`Error: ${err}`)
  }
)

//require('net').createServer().listen() // keep alive
