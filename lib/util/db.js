'use strict'

const fs = require('fs')
const winston = require('winston')

const DB_PATH = process.env.BOT_DB_PATH || 'db.json'
const DB_BACKUP_FREQUENCY = process.env.BOT_DB_BACKUP_FREQUENCY || 10000
let data = null

function load() {
  data = fs.readFileSync(DB_PATH, 'utf8')
  data = data && JSON.parse(data) || {}
  backup()
}

function backup() {
  winston.debug('Backing up database...')
  fs.writeFile(
    DB_PATH,
    JSON.stringify(data),
    {
      encoding: 'utf8'
    }
  )
}

load()
setInterval(backup, DB_BACKUP_FREQUENCY)

module.exports = {
  get: (key) => {
    return data[key]
  },
  set: (key, value) => {
    data[key] = value
  }
}
