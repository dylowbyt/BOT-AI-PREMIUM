const axios = require("axios")

module.exports = {
  name: "vidhr",
  alias: ["vdhr", "hrgeneratevid"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const text = args.join(" ")
    if (!text) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.vdhr kucing naik motor"
      })
    }

    const API_KEY = process.env.MAGIC_HOUR_KEY
    if (!API_KEY) {
      return sock.sendMessage(from, {
        text: "❌ MAGIC_HOUR_KEY belum diset di ENV"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🎬 Membuat video..." })

      const res = await axios.post(
        "https://api.magichour.ai/v1/video/generate",
        {
          prompt: text,
          duration: 5,
          aspect_ratio: "9:16"
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      )

      const jobId = res.data?.id
      if (!jobId) {
        return sock.sendMessage(from, { text: "❌ Gagal generate video" })
      }

      let videoUrl
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 4000))

        const check = await axios.get(
          `https://api.magichour.ai/v1/video/status/${jobId}`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }
        )

        if (check.data?.status === "completed") {
          videoUrl = check.data.result_url
          break
        }
      }

      if (!videoUrl) {
        return sock.sendMessage(from, { text: "⏳ Masih diproses, coba lagi nanti" })
      }

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: `🎥 Prompt: ${text}`
      })

    } catch (err) {
      console.log("VIDHR ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Error saat proses video" })
    }
  }
}
