const axios = require("axios")
const identity = require("./identity")

module.exports = {
  name: "setpp",
  alias: ["gantipp", "ubahpp", "profilepic"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const botJid = sock.user.id

    if (!args[0] && !m.message?.imageMessage && !m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
      return sock.sendMessage(from, {
        text: `🖼️ *GANTI FOTO PROFIL BOT*
━━━━━━━━━━━━━━━
Cara pakai:
• Reply foto → ketik .setpp
• .setpp <url_gambar>

Contoh:
.setpp https://example.com/photo.jpg`
      })
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Mengganti foto profil bot..." })

      let buffer

      const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
      const imgMsg = m.message?.imageMessage || quoted?.imageMessage

      if (imgMsg) {
        const stream = await sock.downloadContentFromMessage(imgMsg, "image")
        const chunks = []
        for await (const chunk of stream) chunks.push(chunk)
        buffer = Buffer.concat(chunks)
      } else if (args[0]?.startsWith("http")) {
        const res = await axios.get(args[0], {
          responseType: "arraybuffer",
          timeout: 15000,
          headers: { "User-Agent": "Mozilla/5.0" }
        })
        buffer = Buffer.from(res.data)
      } else {
        return sock.sendMessage(from, { text: "❌ Kirim foto atau berikan URL gambar yang valid." })
      }

      await sock.updateProfilePicture(botJid, buffer)

      await sock.sendMessage(from, {
        text: `✅ Foto profil *${identity.nama}* berhasil diperbarui!`
      })

    } catch (err) {
      await sock.sendMessage(from, {
        text: `❌ Gagal ganti foto profil: ${err.message?.slice(0, 100)}\n\nPastikan file adalah gambar yang valid.`
      })
    }
  }
}
