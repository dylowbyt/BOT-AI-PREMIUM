const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const axios = require("axios")
const FormData = require("form-data")

module.exports = {
  name: "removebg",
  alias: ["nobg"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const apiKey = process.env.REMOVE_BG_API_KEY
      if (!apiKey) {
        return sock.sendMessage(from, {
          text: "❌ API key Remove.bg belum diset di ENV"
        })
      }

      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const isImage =
        m.message?.imageMessage ||
        quoted?.imageMessage

      if (!isImage) {
        return sock.sendMessage(from, {
          text: "📸 Reply gambar dengan .removebg"
        })
      }

      await sock.sendMessage(from, { text: "⏳ Menghapus background..." })

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
      form.append("image_file", buffer, "image.png")
      form.append("size", "auto")

      const res = await axios.post(
        "https://api.remove.bg/v1.0/removebg",
        form,
        {
          headers: {
            ...form.getHeaders(),
            "X-Api-Key": apiKey,
          },
          responseType: "arraybuffer",
        }
      )

      await sock.sendMessage(from, {
        image: Buffer.from(res.data),
        caption: "✅ Background berhasil dihapus"
      })

    } catch (err) {
      console.log("REMOVEBG ERROR:", err?.message)
      sock.sendMessage(from, {
        text: "❌ Gagal menghapus background"
      })
    }
  }
}
