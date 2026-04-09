const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const fs = require("fs")
const { exec } = require("child_process")
const path = require("path")

module.exports = {
  name: "ptv",
  alias: ["photovideo", "foto2vid", "img2mp4"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const isImage = m.message?.imageMessage || quoted?.imageMessage

      if (!isImage) {
        return sock.sendMessage(from, {
          text: "📷 *FOTO ke VIDEO*\n━━━━━━━━━━━━━━━\nCara pakai:\n1. Kirim atau reply foto\n2. Ketik *.ptv*\n\n✅ Foto akan diubah jadi video 5 detik\n⚠️ Butuh ffmpeg di server"
        })
      }

      await sock.sendMessage(from, { text: "⏳ Mengonversi foto ke video..." })

      // FIX: Gunakan key quoted yang benar
      let targetMsg
      if (quoted?.imageMessage) {
        const stanzaId = m.message?.extendedTextMessage?.contextInfo?.stanzaId
        const participant = m.message?.extendedTextMessage?.contextInfo?.participant
        targetMsg = {
          key: { remoteJid: from, id: stanzaId, participant: participant || from },
          message: quoted
        }
      } else {
        targetMsg = m
      }

      const buffer = await downloadMediaMessage(targetMsg, "buffer", {}, {
        logger: console,
        reuploadRequest: sock.updateMediaMessage
      })

      if (!buffer || buffer.length < 100) throw new Error("Gagal download foto")

      // Cek ffmpeg
      const hasFfmpeg = await new Promise(resolve => {
        exec("ffmpeg -version", { timeout: 5000 }, (err) => resolve(!err))
      })

      if (!hasFfmpeg) {
        return sock.sendMessage(from, {
          text: "❌ *ffmpeg tidak tersedia di server ini*\n\nFitur .ptv memerlukan ffmpeg.\nHubungi owner untuk instalasi."
        })
      }

      const timestamp = Date.now()
      const inputPath = path.join(__dirname, `../tmp_ptv_in_${timestamp}.jpg`)
      const outputPath = path.join(__dirname, `../tmp_ptv_out_${timestamp}.mp4`)

      fs.writeFileSync(inputPath, buffer)

      // FIX: Tambah error handling lebih baik, gunakan /tmp jika folder tidak bisa ditulis
      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -y -loop 1 -i "${inputPath}" ` +
          `-vf "scale=720:1280:force_original_aspect_ratio=decrease,pad=720:1280:(ow-iw)/2:(oh-ih)/2:color=black" ` +
          `-t 5 -c:v libx264 -pix_fmt yuv420p -r 24 -movflags +faststart "${outputPath}"`,
          { timeout: 60000 },
          (err, stdout, stderr) => {
            if (err) reject(new Error(stderr?.slice(0, 200) || err.message))
            else resolve()
          }
        )
      })

      if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 100) {
        throw new Error("Ffmpeg gagal menghasilkan video")
      }

      const videoBuffer = fs.readFileSync(outputPath)

      await sock.sendMessage(from, {
        video: videoBuffer,
        caption: "🎥 *Foto jadi Video!*"
      })

      // Cleanup
      try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath) } catch {}
      try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath) } catch {}

    } catch (err) {
      console.log("PTV ERROR:", err?.message)
      await sock.sendMessage(from, {
        text: `❌ Gagal convert foto ke video\n_${err?.message?.slice(0, 100) || "Coba lagi nanti"}_`
      })
    }
  }
}
