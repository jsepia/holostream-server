/**
 * A plugin-oriented wrapper around the TMI.js client.
 * Instead of sending chat messages via client.say(), it
 * emits the 'message-sent' event, which gets
 * picked up by the 'message-queue' plugin. 
 */

'use strict'

const EventEmitter = require('events')
const winston = require('winston')
const mustache = require('mustache')
const config = require('util/config')


/**
 * BOT CLASS
 */

class Bot extends EventEmitter {
  constructor(client) {
    super()
    const _this = this
    this.name = config.BOT_NAME
    this.on('newListener', (event, listener) => {
      winston.debug(`New listener registered for "${event}": ${listener.name}`)
    })
    this.client = client
    this.client.on('message', (channel, userstate, message, self) => {
      winston.info(`${channel}: ${userstate['message-type']}: ${message}`)
      if (self) return
      _this.emit('message-received', channel, userstate, message)
    })
    this.client.on('join', (channel, username, self) => {
      winston.debug(`JOIN: ${username} has joined ${channel}`)
      if (self) return
      if (username === _this.name) return
      _this.emit('join', channel, username)
    })
    this.client.on('disconnect', () => {
      winston.debug('Bot connection closed')
    })
  }

  use(plugin) {
    winston.info(`Using plugin ${plugin.name || plugin.id}`)
    plugin(this)
  }

  command(command, argument) {
    winston.info(`Registering new command: ${command} (${typeof argument})`)
    const commandRegex = new RegExp(`^${command}\\b(\\s+(.*))?`, 'i')

    // if the argument is a string, create a handler that replies with that string
    let handler = null
    if (typeof argument === 'string') {
      handler = (options) => {
        const messageType = options.userstate['message-type']
        const displayName = options.userstate['display-name']
        winston.debug(`Custom command from ${displayName} via ${messageType}`)

        const username = options.userstate.username.toLowerCase()
        const reply = mustache.render(
          argument,
          {}
        )
        if (messageType === 'chat') {
          this.say(options.channel, reply)
        }
        else if (messageType === 'whisper') {
          this.whisper(username, reply)
        }
      }
    }
    else if (typeof argument === 'function') {
      handler = argument
    }
    else {
      throw new Error(`Invalid argument for bot.command('${command}')!`)
    }

    this.on('message-received', (channel, userstate, message) => {
      const matches = commandRegex.exec(message)
      if (matches) {
        winston.debug(`"${message}" is a match for ${commandRegex}`)
        let options = {
          channel: channel,
          userstate: userstate,
          message: message,
          args: typeof matches[2] === 'string' ? matches[2].split(/\s+/) : []
        }
        handler(options)
      }
    })
  }

  say(channel, message) {
    this.emit('message-sent', channel, message)
  }

  whisper(username, message) {
    this.client.whisper(username, message)
  }
}


/**
 * PUBLIC INTERFACE
 */

module.exports = Bot
