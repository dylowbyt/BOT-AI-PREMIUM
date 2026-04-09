const fs = require("fs")
const path = require("path")

const DB_PATH = path.resolve(__dirname, "../data/tokens.json")

const LOW_TOKEN_THRESHOLD = 3

function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    fs.writeFileSync(DB_PATH, JSON.stringify({}))
    return {}
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
  } catch {
    return {}
  }
}

function save(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

function getTokens(userId) {
  const db = load()
  return db[userId]?.tokens ?? 0
}

function addTokens(userId, amount) {
  const db = load()
  if (!db[userId]) {
    db[userId] = { tokens: 0, totalBought: 0, history: [] }
  }
  db[userId].tokens += amount
  db[userId].totalBought = (db[userId].totalBought || 0) + amount
  db[userId].history = db[userId].history || []
  db[userId].history.push({
    type: "add",
    amount,
    timestamp: new Date().toISOString()
  })
  save(db)
  return db[userId].tokens
}

function useTokens(userId, amount) {
  const db = load()
  const current = db[userId]?.tokens ?? 0
  if (current < amount) return false

  db[userId].tokens = current - amount
  db[userId].history = db[userId].history || []
  db[userId].history.push({
    type: "use",
    amount,
    remaining: db[userId].tokens,
    timestamp: new Date().toISOString()
  })
  save(db)
  return db[userId].tokens
}

function getTokenWarning(userId) {
  const tokens = getTokens(userId)
  if (tokens <= 0) {
    return (
      `❌ *Token kamu habis!*\n\n` +
      `Kamu tidak bisa generate gambar lagi.\n` +
      `Ketik *.premium* untuk isi ulang token. 🪙`
    )
  }
  if (tokens <= LOW_TOKEN_THRESHOLD) {
    return (
      `⚠️ *Token kamu tersisa ${tokens}*\n\n` +
      `Jangan sampai habis 😄\n` +
      `Ketik *.premium* untuk isi ulang token!`
    )
  }
  return null
}

module.exports = {
  getTokens,
  addTokens,
  useTokens,
  getTokenWarning
}
