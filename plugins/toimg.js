const { downloadMediaMessage } = require("@whiskeysockets/baileys")

module.exports = {
  name: "toimg",

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const isSticker =
        m.message?.stickerMessage ||
        quoted?.stickerMessage

      if (!isSticker) {
        return sock.sendMessage(from, {
          text: "⚠️ Reply sticker dengan .toimg"
        })
      }

      await sock.sendMessage(from, { text: "⏳ Mengonversi sticker..." })

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

      // Sticker adalah format WebP, kirim sebagai image WebP
      await sock.sendMessage(from, {
        image: buffer,
        mimetype: "image/webp",
        caption: "🖼️ Sticker jadi foto"
      })

    } catch (err) {
      console.log("TOIMG ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal convert sticker ke foto" })
    }
  }
}
