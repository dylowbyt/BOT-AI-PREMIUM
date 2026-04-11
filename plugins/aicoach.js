/**
 * aicoach.js — AI Personal Life Coach
 * Command: .aicoach
 * FREE - Tidak perlu token
 */

require("dotenv").config()
const OpenAI = require("openai")
const fs     = require("fs")
const path   = require("path")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const DB_PATH = path.join(__dirname, "../data/aicoach.json")

function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
    fs.writeFileSync(DB_PATH, JSON.stringify({}))
    return {}
  }
  try { return JSON.parse(fs.readFileSync(DB_PATH, "utf8")) } catch { return {} }
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

function getUserData(userId) {
  const db = loadDb()
  if (!db[userId]) db[userId] = { goals: [], sessions: [], lastCheck: null }
  return db[userId]
}

function saveUserData(userId, data) {
  const db = loadDb()
  db[userId] = data
  saveDb(db)
}

module.exports = {
  name: "aicoach",
  alias: ["coach", "lifecoach", "coaching"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const sub    = args[0]?.toLowerCase()
    const input  = args.slice(1).join(" ").trim()

    const userData = getUserData(sender)

    // ─── HELP ───────────────────────────────────────────────────
    if (!sub) {
      return sock.sendMessage(from, {
        text:
          `🏆 *AI LIFE COACH*\n\n` +
          `AI Coach pribadi kamu yang siap membantu mencapai tujuan hidup!\n\n` +
          `*Perintah:*\n` +
          `🎯 *.aicoach goal <tujuanmu>* — Set tujuan baru\n` +
          `💬 *.aicoach curhat <ceritamu>* — Cerita & dapat saran\n` +
          `📊 *.aicoach progress <updatemu>* — Update progres\n` +
          `🗺️ *.aicoach plan* — Minta rencana aksi harian\n` +
          `📋 *.aicoach status* — Lihat tujuan aktifmu\n` +
          `🔄 *.aicoach reset* — Reset semua tujuan\n\n` +
          `_Gratis! Tidak perlu token._`
      })
    }

    // ─── STATUS ─────────────────────────────────────────────────
    if (sub === "status") {
      if (!userData.goals || userData.goals.length === 0) {
        return sock.sendMessage(from, {
          text: `📋 Kamu belum punya tujuan.\nKetik *.aicoach goal <tujuanmu>* untuk mulai!`
        })
      }
      const goalList = userData.goals.map((g, i) => `${i + 1}. ${g}`).join("\n")
      return sock.sendMessage(from, {
        text:
          `📋 *TUJUAN AKTIFMU:*\n\n${goalList}\n\n` +
          `💬 Ketik *.aicoach progress <update>* untuk kasih tau progresmu!`
      })
    }

    // ─── RESET ──────────────────────────────────────────────────
    if (sub === "reset") {
      saveUserData(sender, { goals: [], sessions: [], lastCheck: null })
      return sock.sendMessage(from, { text: `✅ Semua data coaching direset. Mulai fresh! 💪` })
    }

    // ─── SET GOAL ───────────────────────────────────────────────
    if (sub === "goal") {
      if (!input) {
        return sock.sendMessage(from, { text: `⚠️ Tulis tujuanmu!\nContoh: *.aicoach goal ingin turun berat badan 10kg dalam 3 bulan*` })
      }
      userData.goals = userData.goals || []
      userData.goals.push(input)
      saveUserData(sender, userData)

      await sock.sendMessage(from, { text: `🎯 *Tujuan tercatat!*\n\n_"${input}"_\n\n⏳ AI Coach sedang menyusun strategi untukmu...` })

      const ai = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Kamu adalah life coach profesional yang energik, suportif, dan strategis. 
Bantu user mencapai tujuan mereka dengan rencana yang konkret dan realistis.
Gunakan Bahasa Indonesia yang memotivasi dan personal.`
          },
          {
            role: "user",
            content: `Tujuan baru saya: ${input}\n\nBuatkan:\n1. Analisis singkat tujuan ini\n2. Rencana aksi 30 hari (minggu per minggu)\n3. 3 tantangan yang mungkin dihadapi & solusinya\n4. Kata-kata motivasi personal`
          }
        ],
        max_tokens: 1200
      })

      return sock.sendMessage(from, {
        text:
          `🏆 *RENCANA COACHING PERSONALMU*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🎯 Tujuan: _${input}_\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${ai.choices[0].message.content}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💪 Update progresmu dengan *.aicoach progress <ceritamu>*`
      })
    }

    // ─── CURHAT / PROGRESS / PLAN ────────────────────────────────
    if (["curhat", "progress", "plan"].includes(sub)) {
      if (sub !== "plan" && !input) {
        return sock.sendMessage(from, { text: `⚠️ Tulis ${sub === "curhat" ? "ceritamu" : "update progresmu"}!` })
      }

      await sock.sendMessage(from, { text: `💬 *AI Coach sedang memproses...*\n\n⏳ Tunggu sebentar...` })

      const goalContext = userData.goals?.length > 0
        ? `Tujuan user: ${userData.goals.join(", ")}`
        : "User belum memiliki tujuan yang ditetapkan."

      const prompts = {
        curhat: `User bercerita: ${input}\n\nKonteks: ${goalContext}\n\nBerikan respons empatik, insight mendalam, dan saran konkret sebagai life coach.`,
        progress: `Update progres user: ${input}\n\nKonteks: ${goalContext}\n\nEvaluasi progres, apresiasi usaha, identifikasi hambatan, dan berikan rencana lanjutan.`,
        plan: `${goalContext}\n\nBuatkan rencana aksi harian untuk minggu ini (7 hari) yang spesifik dan achievable.`
      }

      const ai = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Kamu adalah life coach profesional yang empatik, strategis, dan motivatif. 
Berikan saran yang personal, konkret, dan actionable dalam Bahasa Indonesia.`
          },
          { role: "user", content: prompts[sub] }
        ],
        max_tokens: 1000
      })

      const emoji = { curhat: "💬", progress: "📊", plan: "🗺️" }
      const title = { curhat: "SESI COACHING", progress: "EVALUASI PROGRES", plan: "RENCANA AKSI MINGGUAN" }

      return sock.sendMessage(from, {
        text:
          `${emoji[sub]} *${title[sub]}*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${ai.choices[0].message.content}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_🏆 AI Life Coach • Selalu ada untukmu!_`
      })
    }

    return sock.sendMessage(from, {
      text: `⚠️ Perintah tidak dikenal.\nKetik *.aicoach* untuk melihat panduan.`
    })
  }
}
