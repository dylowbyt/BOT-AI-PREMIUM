const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const axios = require("axios")
const FormData = require("form-data")

module.exports = {
  name: "tourl",

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const message = quoted || m.message

      const isMedia =
        message?.imageMessage ||
        message?.videoMessage ||
        message?.documentMessage ||
        message?.audioMessage

      if (!isMedia) {
        return sock.sendMessage(from, {
          text: "⚠️ Reply file/foto/video/audio dengan .tourl"
        })
      }

      await sock.sendMessage(from, { text: "⏳ Mengupload file..." })

      // ===== FIX: tambahkan key agar downloadMediaMessage bekerja =====
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

      // ===== UPLOAD KE 0x0.st =====
      const form = new FormData()
      form.append("file", buffer, "file")

      const res = await axios.post("https://0x0.st", form, {
        headers: form.getHeaders(),
        timeout: 30000
      })

      const link = res.data.trim()

      if (!link.startsWith("http")) {
        throw new Error("Upload gagal, response tidak valid: " + link)
      }

      await sock.sendMessage(from, {
        text: `🔗 *Link file kamu:*\n${link}\n\n_Link aktif selama 30 hari_`
      })

    } catch (err) {
      console.log("TOURL ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal upload file" })
    }
  }
}
