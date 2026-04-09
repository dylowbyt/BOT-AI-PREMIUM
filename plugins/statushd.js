const { downloadContentFromMessage, downloadMediaMessage } = require("@whiskeysockets/baileys")
const fs = require("fs")
const { exec } = require("child_process")
const path = require("path")

const MAX_SIZE_BYTES = 15 * 1024 * 1024 // 15MB

function runFfmpeg(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr?.slice(0, 300) || err.message))
      else resolve()
    })
  })
}

module.exports = {
  name: "statushd",
  alias: ["statusvid", "statusfix", "statuswa"],

  async run(sock, m) {
    const from = m.key.remoteJid

    try {
      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const message = quoted || m.message
      const videoMessage = message?.videoMessage

      if (!videoMessage) {
        return sock.sendMessage(from, {
          text: `📺 *VIDEO OPTIMIZER STATUS WA*\n━━━━━━━━━━━━━━━\nCara pakai:\n1. Reply video dengan *.statushd*\n\nFitur:\n✅ Video dioptimasi untuk status WA\n✅ Format H.264 + AAC (kompatibel WA)\n✅ Ukuran diperkecil otomatis\n✅ Max resolusi 720p\n\n⚠️ Butuh ffmpeg di server`
        })
      }

      await sock.sendMessage(from, { text: "⏳ Memproses video untuk status WA..." })

      // FIX: Download video dengan metode yang lebih robust
      let buffer = null

      // Coba downloadContentFromMessage dulu
      try {
        const stream = await downloadContentFromMessage(videoMessage, "video")
        const chunks = []
        for await (const chunk of stream) chunks.push(chunk)
        buffer = Buffer.concat(chunks)
      } catch {}

      // Fallback: downloadMediaMessage
      if (!buffer || buffer.length < 1000) {
        try {
          let targetMsg
          if (quoted?.videoMessage) {
            const stanzaId = m.message?.extendedTextMessage?.contextInfo?.stanzaId
            const participant = m.message?.extendedTextMessage?.contextInfo?.participant
            targetMsg = {
              key: { remoteJid: from, id: stanzaId, participant: participant || from },
              message: quoted
            }
          } else {
            targetMsg = m
          }
          buffer = await downloadMediaMessage(targetMsg, "buffer", {}, {
            logger: console,
            reuploadRequest: sock.updateMediaMessage
          })
        } catch {}
      }

      if (!buffer || buffer.length < 1000) {
        throw new Error("Gagal download video, coba kirim ulang videonya")
      }

      // Cek ffmpeg
      const hasFfmpeg = await new Promise(resolve => {
        exec("ffmpeg -version", { timeout: 5000 }, err => resolve(!err))
      })

      if (!hasFfmpeg) {
        await sock.sendMessage(from, {
          video: buffer,
          caption: "⚠️ ffmpeg tidak tersedia, video dikirim apa adanya"
        })
        return
      }

      const ts = Date.now()
      const inputPath = `/tmp/statushd_in_${ts}.mp4`
      const outputPath = `/tmp/statushd_out_${ts}.mp4`

      fs.writeFileSync(inputPath, buffer)

      let finalBuffer = null

      try {
        // Pass 1: compress ke 720p max
        await runFfmpeg(
          `ffmpeg -y -i "${inputPath}" ` +
          `-vf "scale='min(720,iw)':-2:flags=lanczos" ` +
          `-c:v libx264 -profile:v baseline -level 3.1 ` +
          `-crf 23 -preset medium ` +
          `-pix_fmt yuv420p -movflags +faststart ` +
          `-r 30 -c:a aac -b:a 128k -ar 44100 ` +
          `"${outputPath}"`
        )

        const fileSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0

        if (fileSize > MAX_SIZE_BYTES) {
          // Pass 2: compress lebih agresif jika masih besar
          const outputPath2 = `/tmp/statushd_out2_${ts}.mp4`
          await sock.sendMessage(from, { text: "📦 File masih besar, kompres ulang..." })
          await runFfmpeg(
            `ffmpeg -y -i "${outputPath}" ` +
            `-vf "scale='min(480,iw)':-2:flags=lanczos" ` +
            `-c:v libx264 -profile:v baseline -level 3.1 ` +
            `-crf 28 -preset fast -pix_fmt yuv420p ` +
            `-movflags +faststart -r 30 ` +
            `-c:a aac -b:a 96k -ar 44100 "${outputPath2}"`
          )
          if (fs.existsSync(outputPath2) && fs.statSync(outputPath2).size > 1000) {
            finalBuffer = fs.readFileSync(outputPath2)
          }
          try { if (fs.existsSync(outputPath2)) fs.unlinkSync(outputPath2) } catch {}
        } else if (fileSize > 1000) {
          finalBuffer = fs.readFileSync(outputPath)
        }
      } catch (ffErr) {
        console.log("FFMPEG ERROR:", ffErr.message)
        finalBuffer = buffer // fallback ke video original
      }

      // Cleanup
      try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath) } catch {}
      try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath) } catch {}

      if (!finalBuffer || finalBuffer.length < 1000) finalBuffer = buffer

      const sizeMB = (finalBuffer.length / 1024 / 1024).toFixed(2)

      await sock.sendMessage(from, {
        video: finalBuffer,
        caption: `✅ *Video siap untuk Status WA!*\n\n📦 Ukuran: ${sizeMB} MB\n🎬 Format: H.264 + AAC\n\n💡 Simpan lalu upload manual ke status WA kamu`
      })

      // Coba upload ke status (opsional)
      try {
        await sock.sendMessage("status@broadcast", {
          video: finalBuffer,
          caption: "",
          backgroundColor: "#000000"
        }, { statusJidList: [from] })
        await sock.sendMessage(from, { text: "📤 Video juga sudah dicoba upload ke status WA otomatis" })
      } catch {}

    } catch (err) {
      console.log("STATUSHD ERROR:", err?.message)
      await sock.sendMessage(from, {
        text: `❌ Gagal memproses video\n_${err?.message?.slice(0, 100) || "Coba lagi nanti"}_`
      })
    }
  }
}
