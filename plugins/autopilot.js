const axios = require("axios")
const OpenAI = require("openai")
const fs = require("fs")
const path = require("path")

// ===== PERSISTENT FILE STORAGE =====
// FIX: Simpan ke file agar state tidak hilang saat module di-reload
const CONFIG_FILE = path.join(__dirname, "../autopilot-config.json")
const VIOLATIONS_FILE = path.join(__dirname, "../autopilot-violations.json")

function loadJson(file) {
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8")) } catch {}
  return {}
}
function saveJson(file, data) {
  try { fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8") } catch (e) { console.log("AUTOPILOT saveJson:", e.message) }
}
function getGrupConfig() { return loadJson(CONFIG_FILE) }
function saveGrupConfig(d) { saveJson(CONFIG_FILE, d) }
function getViolations() { return loadJson(VIOLATIONS_FILE) }
function saveViolations(d) { saveJson(VIOLATIONS_FILE, d) }

// ===== KATA KOTOR =====
const kataKotor = [
  "anjing","anjir","anjrit","anying","babi","babi lu","babi lo","bangsat","bajingan",
  "kontol","memek","pepek","ngentot","entot","ngentod","jancok","jancuk","goblok",
  "goblog","tolol","idiot","brengsek","keparat","sialan","asu","kampret","monyet",
  "monyong","mamak lu","mamak lo","bokep","porno","xxx","ngewe","ngecrot","cok","cuk"
]

function cekKataKotor(text) {
  if (!text) return null
  const lower = text.toLowerCase().replace(/[^a-z0-9\s]/g, " ")
  for (const kata of kataKotor) {
    const regex = new RegExp(`\\b${kata.replace(/\s+/g, "\\s+")}\\b`, "i")
    if (regex.test(lower)) return kata
  }
  return null
}

async function cekGambarJorok(imageBuffer) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || !imageBuffer) return false
  try {
    const openai = new OpenAI({ apiKey })
    const base64 = imageBuffer.toString("base64")
    const result = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: [
        { type: "text", text: "Apakah gambar ini mengandung konten dewasa, pornografi, atau kekerasan ekstrem? Jawab: YA atau TIDAK" },
        { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` } }
      ]}],
      max_tokens: 10
    })
    return (result.choices[0]?.message?.content?.toUpperCase() || "").includes("YA")
  } catch (err) { console.log("AUTOPILOT IMG CHECK ERROR:", err?.message); return false }
}

function tambahViolation(grupId, userId) {
  const v = getViolations()
  if (!v[grupId]) v[grupId] = {}
  if (!v[grupId][userId]) v[grupId][userId] = { count: 0, lastWarn: 0 }
  v[grupId][userId].count++
  v[grupId][userId].lastWarn = Date.now()
  saveViolations(v)
  return v[grupId][userId].count
}

function resetViolation(grupId, userId) {
  const v = getViolations()
  if (v[grupId]?.[userId]) { v[grupId][userId].count = 0; saveViolations(v) }
}

async function getBotNumber(sock) { return sock.user?.id?.split(":")[0] + "@s.whatsapp.net" }

async function isBotAdmin(sock, grupId) {
  try {
    const meta = await sock.groupMetadata(grupId)
    const botNum = await getBotNumber(sock)
    const b = meta.participants.find(p => p.id === botNum || p.id === sock.user?.id)
    return b?.admin === "admin" || b?.admin === "superadmin"
  } catch { return false }
}

// ===== CHECK — dipanggil dari index.js =====
async function check(sock, m, { text, sender, from, imageBuffer }) {
  try {
    if (!from?.endsWith("@g.us")) return false
    const grupConfig = getGrupConfig()
    if (!grupConfig[from]?.enabled) return false
    const botNum = await getBotNumber(sock)
    if (sender === botNum || m.key.fromMe) return false
    if (text?.startsWith(".")) return false
    const botAdmin = await isBotAdmin(sock, from)
    if (!botAdmin) return false

    let pelanggaranTipe = null
    const kataJorok = cekKataKotor(text)
    if (kataJorok) pelanggaranTipe = `kata kotor (*${kataJorok}*)`
    if (!pelanggaranTipe && imageBuffer) {
      const jorok = await cekGambarJorok(imageBuffer)
      if (jorok) pelanggaranTipe = "media tidak pantas (konten dewasa)"
    }
    if (!pelanggaranTipe) return false

    const jumlahWarn = tambahViolation(from, sender)
    const namaSender = `@${sender.split("@")[0]}`

    if (jumlahWarn === 1) {
      await sock.sendMessage(from, {
        text: `⚠️ *PERINGATAN* ⚠️\n\n${namaSender} terdeteksi mengirim ${pelanggaranTipe}.\n\n❗ Peringatan ke-1. Jika melanggar lagi, akan dikeluarkan!`,
        mentions: [sender]
      })
      try { await sock.sendMessage(from, { delete: m.key }) } catch {}
    } else {
      await sock.sendMessage(from, {
        text: `🚫 *DIKELUARKAN* 🚫\n\n${namaSender} dikeluarkan karena melanggar ${pelanggaranTipe}.\n\n(Pelanggaran ke-${jumlahWarn})`,
        mentions: [sender]
      })
      try { await sock.sendMessage(from, { delete: m.key }) } catch {}
      await sock.groupParticipantsUpdate(from, [sender], "remove")
      resetViolation(from, sender)
    }
    return true
  } catch (err) { console.log("AUTOPILOT CHECK ERROR:", err?.message); return false }
}

module.exports = {
  name: "autopilot",
  alias: ["automod", "autoadmin"],
  check,

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    if (!from.endsWith("@g.us"))
      return sock.sendMessage(from, { text: "❌ Fitur ini hanya untuk grup" })

    let senderIsAdmin = false
    try {
      const meta = await sock.groupMetadata(from)
      const member = meta.participants.find(p => p.id === sender)
      senderIsAdmin = member?.admin === "admin" || member?.admin === "superadmin"
    } catch {}

    if (!senderIsAdmin)
      return sock.sendMessage(from, { text: "❌ Hanya admin yang bisa mengatur autopilot" })

    const sub = args[0]?.toLowerCase()
    const grupConfig = getGrupConfig()
    const violations = getViolations()

    if (!sub || sub === "status") {
      const aktif = grupConfig[from]?.enabled ? "✅ AKTIF" : "❌ NONAKTIF"
      const totalWarn = Object.values(violations[from] || {}).reduce((s, v) => s + v.count, 0)
      return sock.sendMessage(from, {
        text: `🤖 *STATUS AUTOPILOT*\n\n` +
          `Status      : ${aktif}\n` +
          `Pelanggaran : ${totalWarn} kali\n\n` +
          `*Perintah:*\n` +
          `.autopilot on — Aktifkan\n` +
          `.autopilot off — Matikan\n` +
          `.autopilot status — Lihat status\n` +
          `.autopilot reset — Reset data pelanggaran\n\n` +
          `*Yang dideteksi:*\n` +
          `🔤 Kata-kata kotor/kasar\n` +
          `🖼️ Media tidak pantas\n\n` +
          `*Sistem hukuman:*\n` +
          `1️⃣ Pelanggaran pertama → Peringatan\n` +
          `2️⃣ Pelanggaran kedua → Dikeluarkan dari grup`
      })
    }

    if (sub === "on") {
      grupConfig[from] = { enabled: true }
      saveGrupConfig(grupConfig)
      return sock.sendMessage(from, {
        text: `✅ *Autopilot Admin AKTIF!*\n\nBot akan otomatis:\n🔤 Peringatkan kata kasar\n🖼️ Peringatkan media tidak pantas\n🚫 Keluarkan member yang berulang melanggar\n\n⚠️ Pastikan bot sudah jadi admin grup!\n💾 Status tersimpan permanen.`
      })
    }

    if (sub === "off") {
      grupConfig[from] = { enabled: false }
      saveGrupConfig(grupConfig)
      return sock.sendMessage(from, {
        text: "❌ *Autopilot Admin DIMATIKAN*\n\nBot tidak lagi memantau pesan.\n💾 Status tersimpan permanen."
      })
    }

    if (sub === "reset") {
      violations[from] = {}
      saveViolations(violations)
      return sock.sendMessage(from, { text: "✅ Data pelanggaran grup ini sudah direset" })
    }

    return sock.sendMessage(from, { text: "⚠️ Perintah tidak dikenal\nGunakan: .autopilot on / off / status / reset" })
  }
}
