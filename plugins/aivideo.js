const { generateVideo } = require("../ai/storynote")

const API_KEY = process.env.STORYNOTE_API_KEY || process.env.RUXA_API_KEY
const VIDEO_MODEL = process.env.RUXA_VIDEO_MODEL || "sora"

module.exports = {
  name: "aivideo",
  alias: ["videoai"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const prompt = args.join(" ")
    if (!prompt) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.aivideo kucing terbang di luar angkasa"
      })
    }

    if (!API_KEY) {
      return sock.sendMessage(from, {
        text: "❌ RUXA_API_KEY belum diset di environment"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🎬 Membuat video AI... tunggu 1-3 menit" })

      const videoUrl = await generateVideo({
        prompt,
        modelId: VIDEO_MODEL,
        maxWaitMs: 180000
      })

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: `🎥 AI Video:\n${prompt}`
      })

    } catch (err) {
      console.log("AIVIDEO ERROR:", err?.message)
      sock.sendMessage(from, { text: `❌ Gagal membuat video AI\n\nError: ${err?.message}` })
    }
  }
}
