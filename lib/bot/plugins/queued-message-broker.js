'use strict'

const _ = require('lodash')
const winston = require('winston')
const config = require('util/config')
const COOLDOWN = config.COOLDOWN_BETWEEN_MESSAGES

let timersByChannel = {}
let queuesByChannel = {}
let bot = null

function queueMessage(channel, message) {
  // init queue if it does not exist
  winston.debug(`Adding message "${message}" to the ${channel} queue...`)
  if (!queuesByChannel[channel]) {
    winston.debug(`There is no existing message queue for ${channel}. A new one will be created.`)
    queuesByChannel[channel] = []
  }
  queuesByChannel[channel].push(message)
  onMessageQueued(channel)
}

function onMessageQueued(channel) {
  if (!(channel in timersByChannel)) {
    winston.debug(`There is no existing timer for ${channel}. A new one will be created.`)
    // define a function that will be called on every
    // iteration of the timer
    const timerFunction = () => {
      if (!_.isEmpty(queuesByChannel[channel])) {
        // get the first message in the queue
        winston.debug(`The contents of the ${channel} queue are: ${JSON.stringify(queuesByChannel[channel])}`)
        const message = queuesByChannel[channel].shift()
        sendMessage(channel, message)
      }
      // if the queue is empty, cancel the timer;
      // it will get created again next time a
      // message is queued
      else {
        winston.debug(`The ${channel} queue is now empty, deleting timer`)
        clearInterval(timersByChannel[channel])
        delete timersByChannel[channel]
      }
    }
    
    // execute the first iteration right away
    timerFunction()

    // queue subsequent iterations
    timersByChannel[channel] = setInterval(timerFunction, COOLDOWN)
  }
  else {
    winston.debug(`A timer was found for ${channel}. The message should be sent on the next iteration.`)
  }
}

function sendMessage(channel, message) {
  winston.debug(`Sending message "${message}" to ${channel}...`)
  bot.client
    .say(channel, message)
    .then(
      (data) => {
        winston.debug(`The message was sent, server returned ${JSON.stringify(data)}`)
      },
      (err) => {
        winston.error(`Error while sending message: ${err}`)
      }
    )
}

module.exports = (_bot) => {
  winston.info(`Initializing queued message broker plugin with a ${COOLDOWN}ms cooldown.`)

  bot = _bot
  bot.on('message-sent', queueMessage)
}
