const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const sharp = require("sharp")

module.exports = {
  name: "sticker",
  alias: ["s", "stiker", "stickers"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const isImage =
        m.message.imageMessage ||
        quoted?.imageMessage

      if (!isImage) {
        return sock.sendMessage(from, {
          text: "⚠️ Kirim / reply gambar dengan .s"
        })
      }

      const msg = quoted ? { key: m.key, message: quoted } : m

      const buffer = await downloadMediaMessage(
        msg,
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      )

      // 🔥 CONVERT KE WEBP (WA FORMAT)
      const webp = await sharp(buffer)
        .resize(512, 512, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp()
        .toBuffer()

      await sock.sendMessage(from, {
        sticker: webp
      })

    } catch (err) {
      console.log("STICKER ERROR:", err)

      await sock.sendMessage(from, {
        text: "❌ Gagal buat sticker"
      })
    }
  }
}
