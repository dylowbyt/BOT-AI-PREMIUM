const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const axios = require("axios")
const FormData = require("form-data")

module.exports = {
  name: "vanime",
  alias: [],

  async run(sock, m) {
    const from = m.key.remoteJid

    const API_KEY = process.env.MAGIC_HOUR_KEY
    if (!API_KEY) {
      return sock.sendMessage(from, { text: "❌ MAGIC_HOUR_KEY belum diset di ENV" })
    }

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const hasVideo =
        m.message?.videoMessage ||
        quoted?.videoMessage

      if (!hasVideo) {
        return sock.sendMessage(from, {
          text: "⚠️ Reply video dengan .vanime"
        })
      }

      await sock.sendMessage(from, { text: "🎌 Mengubah video ke anime..." })

      const targetMsg = quoted
        ? { key: m.key, message: quoted }
        : m

      const buffer = await downloadMediaMessage(
        targetMsg,
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      )

      const form = new FormData()
      form.append("file", buffer, { filename: "video.mp4", contentType: "video/mp4" })

      const up = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
        headers: form.getHeaders(),
        timeout: 60000
      })

      const rawUrl = up.data?.data?.url
      if (!rawUrl) throw new Error("Upload gagal")
      const videoUrl = rawUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/")

      const res = await axios.post(
        "https://api.magichour.ai/v1/video/style",
        { video_url: videoUrl, style: "anime" },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      )

      const jobId = res.data?.id
      if (!jobId) throw new Error("Gagal memulai proses")

      await sock.sendMessage(from, { text: "⏳ Diproses..." })

      let resultUrl
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 4000))

        const check = await axios.get(
          `https://api.magichour.ai/v1/video/status/${jobId}`,
          { headers: { Authorization: `Bearer ${API_KEY}` } }
        )

        if (check.data?.status === "completed") {
          resultUrl = check.data.result_url
          break
        }
      }

      if (!resultUrl) {
        return sock.sendMessage(from, { text: "⏳ Masih diproses, coba lagi nanti" })
      }

      await sock.sendMessage(from, {
        video: { url: resultUrl },
        caption: "🎌 Video Anime"
      })

    } catch (err) {
      console.log("VANIME ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal convert ke anime" })
    }
  }
}
