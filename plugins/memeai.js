const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const axios = require("axios")
const FormData = require("form-data")

const GEMINI_API_KEY = process.env.GEMINI_API_KEY

module.exports = {
  name: "memeai",
  alias: ["memegen"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const hasImage =
        m.message?.imageMessage ||
        quoted?.imageMessage

      if (!hasImage) {
        return sock.sendMessage(from, {
          text: "⚠️ Reply foto dengan .memeai"
        })
      }

      await sock.sendMessage(from, {
        text: "🧠 AI lagi mikir meme..."
      })

      // ===== FIX: bungkus dengan key agar downloadMediaMessage bisa kerja =====
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

      const base64 = buffer.toString("base64")

      // ===== GEMINI VISION =====
      const gemini = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: "Buatkan teks meme lucu bahasa Indonesia dari gambar ini, format: atas|bawah, singkat dan relate"
                },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: base64
                  }
                }
              ]
            }
          ]
        },
        { timeout: 20000 }
      )

      let text = gemini.data.candidates?.[0]?.content?.parts?.[0]?.text || ""

      // Bersihkan dari karakter markdown
      text = text.replace(/\*/g, "").trim()

      let [top, bottom] = text.split("|").map(s => s.trim())

      if (!top || !bottom) {
        top = "Ketika hidup..."
        bottom = "ya begitulah"
      }

      // ===== UPLOAD FOTO — coba beberapa host =====
      let imageUrl = null

      // Upload ke tmpfiles.org
      try {
        const form1 = new FormData()
        form1.append("file", buffer, { filename: "image.jpg", contentType: "image/jpeg" })
        const up1 = await axios.post("https://tmpfiles.org/api/v1/upload", form1, {
          headers: form1.getHeaders(),
          timeout: 30000
        })
        const rawUrl = up1.data?.data?.url
        if (rawUrl && rawUrl.startsWith("http")) {
          imageUrl = rawUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/")
        }
      } catch {}

      // Fallback ke 0x0.st
      if (!imageUrl) {
        try {
          const form2 = new FormData()
          form2.append("file", buffer, { filename: "image.jpg", contentType: "image/jpeg" })
          const up2 = await axios.post("https://0x0.st", form2, {
            headers: form2.getHeaders(),
            timeout: 30000
          })
          const rawUrl2 = up2.data?.trim()
          if (rawUrl2?.startsWith("http")) imageUrl = rawUrl2
        } catch {}
      }

      if (!imageUrl) throw new Error("Semua server upload gagal")

      // ===== GENERATE MEME — coba popcat lalu fallback teks =====
      let memeSuccess = false

      try {
        const memeUrl = `https://api.popcat.xyz/meme?image=${encodeURIComponent(imageUrl)}&top=${encodeURIComponent(top)}&bottom=${encodeURIComponent(bottom)}`

        await sock.sendMessage(from, {
          image: { url: memeUrl },
          caption: `😂 *${top}*\n_${bottom}_`
        })
        memeSuccess = true
      } catch {}

      // Fallback: kirim gambar asli + teks meme
      if (!memeSuccess) {
        await sock.sendMessage(from, {
          image: buffer,
          caption: `😂 *MEME AI*\n\n⬆️ *${top}*\n⬇️ _${bottom}_`
        })
      }

    } catch (err) {
      console.log("MEMEAI ERROR:", err?.message || err)

      await sock.sendMessage(from, {
        text: "❌ Gagal bikin meme AI\nPastikan GEMINI_API_KEY sudah diset"
      })
    }
  }
}
