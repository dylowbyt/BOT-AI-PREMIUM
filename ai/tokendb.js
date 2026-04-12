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

// Normalisasi userId — hapus suffix device :12 agar key selalu konsisten
// "6283866344919:12@s.whatsapp.net" → "6283866344919@s.whatsapp.net"
// "213013684609202@lid"             → "213013684609202@lid" (tidak berubah)
function normalizeId(userId) {
  return (userId || "").replace(/:\d+(@)/, "$1")
}

function getTokens(userId) {
  const db = load()
  const id = normalizeId(userId)
  return db[id]?.tokens ?? 0
}

function addTokens(userId, amount) {
  const db = load()
  const id = normalizeId(userId)
  if (!db[id]) {
    db[id] = { tokens: 0, totalBought: 0, history: [] }
  }
  db[id].tokens += amount
  db[id].totalBought = (db[id].totalBought || 0) + amount
  db[id].history = db[id].history || []
  db[id].history.push({
    type: "add",
    amount,
    timestamp: new Date().toISOString()
  })
  save(db)
  return db[id].tokens
}

function useTokens(userId, amount) {
  const db = load()
  const id = normalizeId(userId)
  const current = db[id]?.tokens ?? 0
  if (current < amount) return false

  db[id].tokens = current - amount
  db[id].history = db[id].history || []
  db[id].history.push({
    type: "use",
    amount,
    remaining: db[id].tokens,
    timestamp: new Date().toISOString()
  })
  save(db)
  return db[id].tokens
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
