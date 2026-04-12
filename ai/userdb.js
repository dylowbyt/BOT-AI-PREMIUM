/**
 * userdb.js — Menyimpan semua user yang pernah chat dengan bot
 *
 * DATA_DIR harus diset ke Railway Volume path agar tidak hilang saat deploy.
 * Di Railway: Settings → Volumes → Mount Path: /app/botdata
 * Lalu set env: DATA_DIR=/app/botdata
 */

const fs   = require("fs")
const path = require("path")

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "../data")
const DB_PATH  = path.join(DATA_DIR, "users.json")

function initFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
      console.log("[userdb] Folder dibuat:", DATA_DIR)
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2))
      console.log("[userdb] File dibuat:", DB_PATH)
    }
  } catch (e) {
    console.error("[userdb] Gagal init file:", e.message)
  }
}

// Init saat module pertama kali dimuat
initFile()

function load() {
  try {
    initFile()
    return JSON.parse(fs.readFileSync(DB_PATH, "utf8"))
  } catch {
    return { users: {} }
  }
}

function save(db) {
  try {
    initFile()
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
  } catch (e) {
    console.error("[userdb] Gagal save:", e.message)
  }
}

function registerUser(userId, name = "") {
  if (!userId || userId.endsWith("@g.us") || userId.includes("broadcast")) return
  try {
    const db = load()
    if (!db.users[userId]) {
      db.users[userId] = {
        name:      name || "",
        firstSeen: new Date().toISOString(),
        lastSeen:  new Date().toISOString()
      }
    } else {
      db.users[userId].lastSeen = new Date().toISOString()
      if (name && !db.users[userId].name) db.users[userId].name = name
    }
    save(db)
  } catch (e) {
    console.error("[userdb] registerUser error:", e.message)
  }
}

function getAllUsers() {
  try {
    return Object.keys(load().users)
  } catch {
    return []
  }
}

function getUserCount() {
  return getAllUsers().length
}

module.exports = { registerUser, getAllUsers, getUserCount }
