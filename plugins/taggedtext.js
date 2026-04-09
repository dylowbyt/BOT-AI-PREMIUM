module.exports = {
  name: "format",
  alias: ["formattext", "bold", "italic", "styletext"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text
    const tipe = args[0]?.toLowerCase()
    const text = args.slice(1).join(" ") || quotedText

    if (!tipe) {
      return sock.sendMessage(from, {
        text: `✍️ *FORMAT TEKS*

Perintah:
.format bold <teks>     → *teks tebal*
.format italic <teks>   → _teks miring_
.format mono <teks>     → \`monospace\`
.format strike <teks>   → ~teks dicoret~
.format clean <teks>    → Hapus format

Contoh:
.format bold Halo dunia
.format italic Selamat pagi`
      })
    }

    if (!text) return sock.sendMessage(from, { text: "⚠️ Masukkan teks setelah format." })

    let result = ""
    let label = ""

    if (tipe === "bold") {
      result = `*${text}*`
      label = "TEBAL"
    } else if (tipe === "italic") {
      result = `_${text}_`
      label = "MIRING"
    } else if (tipe === "mono" || tipe === "code") {
      result = `\`\`\`${text}\`\`\``
      label = "KODE"
    } else if (tipe === "strike") {
      result = `~${text}~`
      label = "DICORET"
    } else if (tipe === "clean") {
      result = text.replace(/[*_~`]/g, "")
      label = "BERSIH"
    } else if (tipe === "all") {
      result = `*_~${text}~_*`
      label = "SEMUA FORMAT"
    } else {
      return sock.sendMessage(from, { text: "❌ Format tidak dikenal." })
    }

    await sock.sendMessage(from, {
      text: `✍️ *FORMAT ${label}*\n━━━━━━━━━━━\n${result}`
    })
  }
}
