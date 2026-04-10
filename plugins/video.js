const { generateVideo } = require("../ai/storynote")

const API_KEY = process.env.STORYNOTE_API_KEY || process.env.RUXA_API_KEY
const VIDEO_MODEL = process.env.RUXA_VIDEO_MODEL || "sora"

const videoLimits = {}
const DAILY_LIMIT = 3

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getVideoLimit(user) {
  const today = getToday()
  if (!videoLimits[user] || videoLimits[user].date !== today) {
    videoLimits[user] = { date: today, count: 0 }
  }
  return DAILY_LIMIT - videoLimits[user].count
}

function useVideoLimit(user) {
  const today = getToday()
  if (!videoLimits[user] || videoLimits[user].date !== today) {
    videoLimits[user] = { date: today, count: 0 }
  }
  if (videoLimits[user].count >= DAILY_LIMIT) return false
  videoLimits[user].count++
  return true
}

module.exports = {
  name: "video",
  alias: ["vid", "genvideo"],

  async run(sock, m) {
    const from = m.key.remoteJid
    const user = m.key.participant || m.key.remoteJid

    let text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""

    text = text.trim()

    if (!useVideoLimit(user)) {
      return sock.sendMessage(from, {
        text: `⚠️ Limit video habis! (${DAILY_LIMIT}x/hari)\nSisa: ${getVideoLimit(user)}\nReset besok`
      })
    }

    let prompt = text
      .replace(/^\.(video|vid|genvideo)\s*/i, "")
      .trim()

    if (!prompt) {
      return sock.sendMessage(from, {
        text: `⚠️ Contoh:\n.video kucing lucu\n.video pemandangan alam\n\n_Limit: ${DAILY_LIMIT}x per hari_`
      })
    }

    if (!API_KEY) {
      return sock.sendMessage(from, {
        text: "❌ RUXA_API_KEY belum diset di environment"
      })
    }

    try {
      await sock.sendMessage(from, {
        text: `🎬 Membuat video...\n⏳ Proses 1-3 menit\nPrompt: _${prompt}_`
      })

      const videoUrl = await generateVideo({
        prompt,
        modelId: VIDEO_MODEL,
        maxWaitMs: 180000
      })

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: `🎬 Video selesai!\n\n_${prompt}_\n\nSisa limit: ${getVideoLimit(user)}x`
      })

    } catch (err) {
      console.log("VIDEO ERROR:", err?.message)

      if (videoLimits[user]) videoLimits[user].count = Math.max(0, videoLimits[user].count - 1)

      await sock.sendMessage(from, {
        text: `❌ Gagal membuat video\n\nError: ${err?.message}`
      })
    }
  }
}
