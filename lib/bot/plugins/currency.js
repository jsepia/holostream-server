'use strict'

const winston = require('winston')
const mustache = require('mustache')
const db = require('util/db')

const CURRENCY_NAME = process.env.CURRENCY_NAME || 'points'
const CURRENCY_NAME_SINGULAR = process.env.CURRENCY_NAME_SINGULAR || 'point'
const CURRENCY_PAY_FREQUENCY = process.env.CURRENCY_PAY_FREQUENCY || 60000
const CURRENCY_PAY_AMOUNT = process.env.CURRENCY_PAY_AMOUNT || 1
//const SUBSCRIBERS_CAN_GIVE = process.env.CURRENCY_SUBSCRIBERS_CAN_GIVE === 'true'
//const MODS_CAN_GIVE = process.env.CURRENCY_MODS_CAN_GIVE === 'true'
const QUERY_RESPONSE = process.env.CURRENCY_QUERY_RESPONSE || '{{USERNAME}}, you have {{CURRENCY_AMOUNT}} {{CURRENCY_NAME}}.'

let bot = null
let currencyByUser = null

function load() {
  winston.info('Loading currency database...')
  currencyByUser = db.get('currencyByUser') || {}
  winston.debug(`Currency database: ${JSON.stringify(currencyByUser)}`)
  save()
}

function save() {
  db.set('currencyByUser', currencyByUser)
}

function pay() {
  winston.debug('Pay day! Pay day!')
  for(let username in currencyByUser) {
    currencyByUser[username].current += CURRENCY_PAY_AMOUNT
    currencyByUser[username].lifetime += CURRENCY_PAY_AMOUNT
    currencyByUser[username].lifetimeWithBonuses += CURRENCY_PAY_AMOUNT
  }
  save()
}

// function give(username, currencyAmount) {
//   registerUser(username)
//   currencyByUser[username].current += currencyAmount
//   currencyByUser[username].lifetimeWithBonuses += currencyAmount
//   save()
// }

// function giveAll() {
//   for(let username in currencyByUser) {
//     currencyByUser[username].current += CURRENCY_PAY_AMOUNT
//     currencyByUser[username].lifetimeWithBonuses += CURRENCY_PAY_AMOUNT
//   }
//   save()
// }

function registerUser(username) {
  winston.debug(`User identified: ${username}`)
  if (!(username in currencyByUser)) {
    currencyByUser[username] = {
      current: 0,
      lifetime: 0,
      lifetimeWithBonuses: 0
    }
  }
}

function handleQuery(options) {
  const messageType = options.userstate['message-type']
  const displayName = options.userstate['display-name']
  winston.debug(`Currency query from ${displayName} via ${messageType}`)

  const username = options.userstate.username.toLowerCase()
  const currentAmountOfCurrency = currencyByUser[username].current
  const currencyName = currentAmountOfCurrency === 1 ? CURRENCY_NAME_SINGULAR : CURRENCY_NAME
  const context = {
    USERNAME: displayName,
    CURRENCY_NAME: currencyName,
    CURRENCY_AMOUNT: currentAmountOfCurrency
  }
  const reply = mustache.render(
    QUERY_RESPONSE,
    context
  )
  if (messageType === 'chat') {
    bot.say(options.channel, reply)
  }
  else if (messageType === 'whisper') {
    bot.whisper(username, reply)
  }
}

module.exports = (_bot) => {
  winston.info('Initializing currency plugin.')

  bot = _bot

  bot.on('message-received', (channel, userstate, _message) => {
    const username = userstate['username']
    registerUser(username.toLowerCase())
    save()
  })
  
  bot.on('join', (channel, username) => {
    registerUser(username.toLowerCase())
    save()
  })

  load()
  setInterval(pay, CURRENCY_PAY_FREQUENCY)
}

module.exports.commands = {
  queryMyCurrency: handleQuery
}
