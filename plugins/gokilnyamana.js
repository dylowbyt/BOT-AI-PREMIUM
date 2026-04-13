/**
 * gokilnyamana.js — Balas dengan stiker random dari folder stickers/
 * Command: .gokilnyamana | .gokil
 */

const fs   = require("fs")
const path = require("path")

const STICKER_DIR = path.join(__dirname, "../stickers")

module.exports = {
  name:  "gokilnyamana",
  alias: ["gokil", "gokilnya"],

  async run(sock, m) {
    const from = m.key.remoteJid

    // Buat folder kalau belum ada
    if (!fs.existsSync(STICKER_DIR)) {
      fs.mkdirSync(STICKER_DIR, { recursive: true })
    }

    // Ambil semua file gambar
    const files = fs.readdirSync(STICKER_DIR).filter(f =>
      /\.(jpg|jpeg|png|webp)$/i.test(f)
    )

    if (files.length === 0) {
      return sock.sendMessage(from, {
        text: "⚠️ Folder stickers/ kosong. Tambahkan file .jpg/.png dulu."
      })
    }

    // Pilih random
    const randomFile = files[Math.floor(Math.random() * files.length)]
    const filePath   = path.join(STICKER_DIR, randomFile)

    try {
      // Coba pakai sharp kalau ada
      const sharp = require("sharp")
      const webp  = await sharp(filePath)
        .resize(512, 512, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp()
        .toBuffer()

      await sock.sendMessage(from, { sticker: webp })

    } catch (sharpErr) {
      console.log("[gokilnyamana] sharp error, coba kirim langsung:", sharpErr.message)

      // Fallback: kirim file langsung tanpa konversi
      try {
        const buffer = fs.readFileSync(filePath)
        const ext    = path.extname(randomFile).toLowerCase()

        if (ext === ".webp") {
          await sock.sendMessage(from, { sticker: buffer })
        } else {
          // Kirim sebagai gambar kalau sharp gagal
          await sock.sendMessage(from, {
            image:   buffer,
            caption: "🎭"
          })
        }
      } catch (err) {
        console.log("[gokilnyamana] Error:", err.message)
        await sock.sendMessage(from, { text: "❌ Gagal kirim stiker: " + err.message })
      }
    }
  }
}
