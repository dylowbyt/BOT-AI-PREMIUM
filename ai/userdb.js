/**
 * userdb.js — Menyimpan semua user yang pernah chat dengan bot
 * Digunakan untuk fitur broadcast/notifikasi admin
 */

const fs   = require("fs")
const path = require("path")

const DATA_DIR = process.env.DATA_DIR || "/root/botdata"
const DB_PATH  = path.join(DATA_DIR, "users.json")

function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }))
    return { users: {} }
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
  } catch {
    return { users: {} }
  }
}

function save(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

/**
 * Daftarkan user ke database (otomatis dipanggil dari index.js)
 * @param {string} userId  - JID user (xxx@s.whatsapp.net)
 * @param {string} name    - Nama display (opsional)
 */
function registerUser(userId, name = "") {
  if (!userId || userId.endsWith("@g.us") || userId.includes("broadcast")) return
  const db = load()
  if (!db.users[userId]) {
    db.users[userId] = {
      name:      name || "",
      firstSeen: new Date().toISOString(),
      lastSeen:  new Date().toISOString()
    }
    save(db)
  } else {
    db.users[userId].lastSeen = new Date().toISOString()
    if (name && !db.users[userId].name) db.users[userId].name = name
    save(db)
  }
}

/**
 * Ambil semua user JID yang terdaftar
 * @returns {string[]}
 */
function getAllUsers() {
  const db = load()
  return Object.keys(db.users)
}

/**
 * Total jumlah user
 */
function getUserCount() {
  return getAllUsers().length
}

module.exports = { registerUser, getAllUsers, getUserCount }
