/**
 * paymentdb.js — Menyimpan transaksi pending ke JSON
 */

const fs   = require("fs")
const path = require("path")

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data")
const DB_PATH  = path.join(DATA_DIR, "payments.json")

function initFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
      console.log("[paymentdb] Folder dibuat:", DATA_DIR)
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2))
      console.log("[paymentdb] File dibuat:", DB_PATH)
    }
  } catch (e) {
    console.error("[paymentdb] Gagal init file:", e.message)
  }
}

initFile()

function load() {
  try {
    initFile()
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
  } catch {
    return []
  }
}

function save(data) {
  try {
    initFile()
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
  } catch (e) {
    console.error("[paymentdb] Gagal save:", e.message)
  }
}

function addPendingPayment({ reference, userId, tokens, amount, expiredAt }) {
  const db = load()
  db.push({ reference, userId, tokens, amount, expiredAt, status: "UNPAID", createdAt: new Date().toISOString() })
  save(db)
}

function getPendingPayments() {
  const db   = load()
  const now  = Date.now()
  return db.filter(p => p.status === "UNPAID" && new Date(p.expiredAt).getTime() > now)
}

function updateStatus(reference, status) {
  const db  = load()
  const idx = db.findIndex(p => p.reference === reference)
  if (idx !== -1) {
    db[idx].status = status
    save(db)
    return db[idx]
  }
  return null
}

function getByReference(reference) {
  return load().find(p => p.reference === reference) || null
}

module.exports = { addPendingPayment, getPendingPayments, updateStatus, getByReference }
