/**
 * anondb.js — Engine Anonymous Chat
 * Mengelola: antrian, sesi, gender, premium filter
 */

const fs   = require("fs")
const path = require("path")

const DATA_DIR = process.env.DATA_DIR || "/root/botdata"
const DB_PATH  = path.join(DATA_DIR, "anon.json")

// ─── LOAD / SAVE ──────────────────────────────────────
function load() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    const init = { users: {}, queue: [], sessions: {} }
    fs.writeFileSync(DB_PATH, JSON.stringify(init, null, 2))
    return init
  }
  try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")) }
  catch { return { users: {}, queue: [], sessions: {} } }
}

function save(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

// ─── USER DATA ─────────────────────────────────────────
function getUser(jid) {
  const db = load()
  if (!db.users[jid]) {
    db.users[jid] = {
      gender:          null,    // "cowo" | "cewe"
      premiumExpiry:   null,    // ISO date string
      inSession:       false,
      partnerId:       null,
      inQueue:         false,
      lookingFor:      null,    // null = random | "cewe" | "cowo"
      totalChats:      0
    }
    save(db)
  }
  return db.users[jid]
}

function saveUser(jid, data) {
  const db = load()
  db.users[jid] = { ...db.users[jid], ...data }
  save(db)
  return db.users[jid]
}

// ─── GENDER ────────────────────────────────────────────
function setGender(jid, gender) {
  saveUser(jid, { gender })
}

function getGender(jid) {
  return getUser(jid).gender
}

// ─── PREMIUM ANON ──────────────────────────────────────
function hasPremiumAnon(jid) {
  const user = getUser(jid)
  if (!user.premiumExpiry) return false
  return new Date(user.premiumExpiry) > new Date()
}

function activatePremiumAnon(jid) {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 30)
  saveUser(jid, { premiumExpiry: expiry.toISOString() })
  return expiry
}

function getPremiumExpiry(jid) {
  const user = getUser(jid)
  if (!user.premiumExpiry) return null
  return new Date(user.premiumExpiry)
}

// ─── SESSION CHECK ─────────────────────────────────────
function isInSession(jid) {
  const db = load()
  return !!(db.sessions[jid])
}

function getPartner(jid) {
  const db = load()
  return db.sessions[jid]?.partnerId || null
}

function isInQueue(jid) {
  const db   = load()
  return db.queue.some(q => q.jid === jid)
}

// ─── QUEUE ─────────────────────────────────────────────
function addToQueue(jid, lookingFor = null) {
  const db = load()

  // Hapus jika sudah ada
  db.queue = db.queue.filter(q => q.jid !== jid)

  const gender = db.users[jid]?.gender || null
  db.queue.push({
    jid,
    gender,
    lookingFor,
    joinedAt: new Date().toISOString()
  })
  save(db)
}

function removeFromQueue(jid) {
  const db = load()
  db.queue = db.queue.filter(q => q.jid !== jid)
  save(db)
}

/**
 * Cari pasangan dari antrian
 * Returns: { matched: true, partnerId } | { matched: false }
 */
function findMatch(jid) {
  const db   = load()
  const me   = db.users[jid]
  if (!me) return { matched: false }

  const myGender     = me.gender
  const myLookingFor = me.lookingFor || null

  // Cari dari antrian (kecuali diri sendiri)
  const candidates = db.queue.filter(q => {
    if (q.jid === jid) return false
    if (isInSession(q.jid)) return false

    const theirGender     = q.gender
    const theirLookingFor = q.lookingFor || null

    // ── Filter: saya cari gender tertentu ──
    if (myLookingFor) {
      if (theirGender !== myLookingFor) return false
    }

    // ── Filter: mereka cari gender tertentu ──
    if (theirLookingFor) {
      if (myGender !== theirLookingFor) return false
    }

    return true
  })

  if (candidates.length === 0) return { matched: false }

  // Ambil yang paling lama menunggu (index 0)
  const partner = candidates[0]
  return { matched: true, partnerId: partner.jid }
}

// ─── SESSION ───────────────────────────────────────────
function createSession(jid1, jid2) {
  const db = load()

  // Buat sesi untuk keduanya
  db.sessions[jid1] = {
    partnerId: jid2,
    startTime: new Date().toISOString()
  }
  db.sessions[jid2] = {
    partnerId: jid1,
    startTime: new Date().toISOString()
  }

  // Hapus dari antrian
  db.queue = db.queue.filter(q => q.jid !== jid1 && q.jid !== jid2)

  // Update user stats
  if (db.users[jid1]) db.users[jid1].totalChats = (db.users[jid1].totalChats || 0) + 1
  if (db.users[jid2]) db.users[jid2].totalChats = (db.users[jid2].totalChats || 0) + 1

  save(db)
}

function endSession(jid) {
  const db      = load()
  const session = db.sessions[jid]
  if (!session) return null

  const partnerId = session.partnerId

  delete db.sessions[jid]
  if (partnerId) delete db.sessions[partnerId]

  save(db)
  return partnerId
}

// ─── STATS ─────────────────────────────────────────────
function getQueueStats() {
  const db       = load()
  const total    = db.queue.length
  const cewe     = db.queue.filter(q => q.gender === "cewe").length
  const cowo     = db.queue.filter(q => q.gender === "cowo").length
  const sessions = Object.keys(db.sessions).length / 2
  return { total, cewe, cowo, sessions: Math.floor(sessions) }
}

// ─── FORWARD MESSAGE ───────────────────────────────────
/**
 * Forward pesan dari user ke partner-nya
 * Menangani: teks, gambar, video, audio, stiker, dokumen
 */
async function forwardMessage(sock, m, senderJid, partnerJid) {
  const msg    = m.message
  const { downloadMediaMessage } = require("@whiskeysockets/baileys")

  const ANON_TAG = `👤 *Stranger:*\n`

  try {
    // ── TEXT ──
    const text =
      msg?.conversation ||
      msg?.extendedTextMessage?.text || ""

    if (msg?.conversation || msg?.extendedTextMessage?.text) {
      await sock.sendMessage(partnerJid, {
        text: ANON_TAG + text
      })
      return
    }

    // ── IMAGE ──
    if (msg?.imageMessage) {
      const buf = await downloadMediaMessage(m, "buffer", {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
      await sock.sendMessage(partnerJid, {
        image:   buf,
        caption: ANON_TAG + (msg.imageMessage.caption || "")
      })
      return
    }

    // ── VIDEO ──
    if (msg?.videoMessage) {
      const buf = await downloadMediaMessage(m, "buffer", {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
      await sock.sendMessage(partnerJid, {
        video:   buf,
        caption: ANON_TAG + (msg.videoMessage.caption || "")
      })
      return
    }

    // ── AUDIO / PTT ──
    if (msg?.audioMessage) {
      const buf  = await downloadMediaMessage(m, "buffer", {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
      const isPtt = msg.audioMessage.ptt || false
      await sock.sendMessage(partnerJid, {
        audio:    buf,
        mimetype: "audio/ogg; codecs=opus",
        ptt:      isPtt
      })
      return
    }

    // ── STICKER ──
    if (msg?.stickerMessage) {
      const buf = await downloadMediaMessage(m, "buffer", {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
      await sock.sendMessage(partnerJid, {
        sticker: buf
      })
      return
    }

    // ── DOCUMENT ──
    if (msg?.documentMessage) {
      const buf = await downloadMediaMessage(m, "buffer", {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
      await sock.sendMessage(partnerJid, {
        document: buf,
        fileName: msg.documentMessage.fileName || "file",
        mimetype: msg.documentMessage.mimetype || "application/octet-stream",
        caption:  ANON_TAG
      })
      return
    }

    // ── Fallback ──
    await sock.sendMessage(partnerJid, {
      text: `👤 *Stranger mengirim media yang tidak didukung*`
    })

  } catch (err) {
    console.log("[anondb] forwardMessage error:", err.message)
  }
}

module.exports = {
  getUser,
  saveUser,
  setGender,
  getGender,
  hasPremiumAnon,
  activatePremiumAnon,
  getPremiumExpiry,
  isInSession,
  getPartner,
  isInQueue,
  addToQueue,
  removeFromQueue,
  findMatch,
  createSession,
  endSession,
  getQueueStats,
  forwardMessage
}
