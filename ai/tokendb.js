const fs = require("fs")
const path = require("path")

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data")
const DB_PATH  = path.join(DATA_DIR, "tokens.json")

const LOW_TOKEN_THRESHOLD = 3

function initFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
      console.log("[tokendb] Folder dibuat:", DATA_DIR)
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2))
      console.log("[tokendb] File dibuat:", DB_PATH)
    }
  } catch (e) {
    console.error("[tokendb] Gagal init file:", e.message)
  }
}

initFile()

function load() {
  try {
    initFile()
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
  } catch {
    return {}
  }
}

function save(db) {
  try {
    initFile()
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
  } catch (e) {
    console.error("[tokendb] Gagal save:", e.message)
  }
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
