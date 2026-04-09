const fs = require("fs")
const path = require("path")

const filePath = path.join(__dirname, "limit.json")

let db = {}

if (fs.existsSync(filePath)) {
  db = JSON.parse(fs.readFileSync(filePath))
}

function save() {
  fs.writeFileSync(filePath, JSON.stringify(db, null, 2))
}

function resetDaily() {
  const now = new Date().toDateString()

  for (let user in db) {
    if (db[user].lastReset !== now) {
      db[user].limit = 5
      db[user].video = 2
      db[user].lastReset = now
    }
  }

  save()
}

// ===== LIMIT HD =====
function useLimit(user) {
  resetDaily()

  if (!db[user]) {
    db[user] = {
      limit: 5,
      video: 2,
      lastReset: new Date().toDateString()
    }
  }

  if (db[user].limit <= 0) return false

  db[user].limit -= 1
  save()
  return true
}

function getLimit(user) {
  resetDaily()

  if (!db[user]) return 5
  return db[user].limit
}

// ===== LIMIT VIDEO =====
function useVideoLimit(user) {
  resetDaily()

  if (!db[user]) {
    db[user] = {
      limit: 5,
      video: 2,
      lastReset: new Date().toDateString()
    }
  }

  if (db[user].video === undefined) {
    db[user].video = 2
  }

  if (db[user].video <= 0) return false

  db[user].video -= 1
  save()
  return true
}

function getVideoLimit(user) {
  resetDaily()

  if (!db[user] || db[user].video === undefined) return 2
  return db[user].video
}

module.exports = {
  useLimit,
  getLimit,
  useVideoLimit,
  getVideoLimit
}
