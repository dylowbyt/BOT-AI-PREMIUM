const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const sharp = require("sharp")

module.exports = {
  name: "hd",
  alias: ["remini", "enhance"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const isImage =
        m.message?.imageMessage ||
        quoted?.imageMessage

      if (!isImage) {
        return sock.sendMessage(from, {
          text: "⚠️ Kirim atau reply foto dengan .hd"
        })
      }

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

      if (!buffer || buffer.length < 1000) {
        throw new Error("Gambar rusak / terlalu kecil")
      }

      let image = sharp(buffer)
      const metadata = await image.metadata()
      const width = metadata.width
      const upscaleWidth = width < 1000 ? width * 2 : width

      const result = await image
        .resize({
          width: upscaleWidth,
          withoutEnlargement: false
        })
        .modulate({
          brightness: 1.05,
          saturation: 1.2
        })
        .sharpen({
          sigma: 1.2,
          m1: 1,
          m2: 2
        })
        .normalize()
        .jpeg({
          quality: 95,
          chromaSubsampling: "4:4:4"
        })
        .toBuffer()

      await sock.sendMessage(from, {
        image: result,
        caption: "✨ HD berhasil (AI Enhance)"
      })

    } catch (err) {
      console.log("HD ERROR:", err)
      await sock.sendMessage(from, {
        text: "❌ Gagal proses HD, coba foto lain"
      })
    }
  }
}
