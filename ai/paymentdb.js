/**
 * paymentdb.js — Menyimpan transaksi pending ke JSON
 */

const fs   = require("fs")
const path = require("path")

const DB_PATH = path.resolve(__dirname, "../data/payments.json")

function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    fs.writeFileSync(DB_PATH, JSON.stringify([]))
    return []
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
  } catch {
    return []
  }
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
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
