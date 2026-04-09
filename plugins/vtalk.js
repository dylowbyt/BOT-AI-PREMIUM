const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const axios = require("axios")
const FormData = require("form-data")

module.exports = {
  name: "vtalk",
  alias: ["talkingphoto", "fotobicara"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const API_KEY = process.env.MAGIC_HOUR_KEY
    if (!API_KEY) {
      return sock.sendMessage(from, { text: "❌ MAGIC_HOUR_KEY belum diset di ENV" })
    }

    const text = args.join(" ")

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const hasImage =
        m.message?.imageMessage ||
        quoted?.imageMessage

      if (!hasImage) {
        return sock.sendMessage(from, {
          text: "⚠️ Reply foto + teks\nContoh: .vtalk halo nama saya bot"
        })
      }

      if (!text) {
        return sock.sendMessage(from, {
          text: "⚠️ Masukkan teks setelah .vtalk"
        })
      }

      await sock.sendMessage(from, { text: "🗣️ Membuat foto berbicara..." })

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
      form.append("file", buffer, { filename: "image.jpg", contentType: "image/jpeg" })

      const up = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
        headers: form.getHeaders(),
        timeout: 30000
      })

      const rawUrl = up.data?.data?.url
      if (!rawUrl) throw new Error("Upload gagal")
      const imageUrl = rawUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/")

      const res = await axios.post(
        "https://api.magichour.ai/v1/video/talk",
        { image_url: imageUrl, text },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          }
        }
      )

      const jobId = res.data?.id
      if (!jobId) throw new Error("Gagal memulai proses")

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
        caption: "🗣️ Foto Berbicara"
      })

    } catch (err) {
      console.log("VTALK ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Error membuat foto berbicara" })
    }
  }
}
