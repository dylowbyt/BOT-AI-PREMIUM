const QRCode = require("qrcode")

module.exports = {
  name: "qrgen",
  alias: ["qrbuat", "bqr", "makeqr"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const text = args.join(" ")

    if (!text) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.qrgen https://google.com\n.qrgen Halo ini teks QR saya"
      })
    }

    try {
      await sock.sendMessage(from, { text: "📲 Membuat QR Code..." })

      const qrBuffer = await QRCode.toBuffer(text, {
        type: "png",
        width: 512,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" }
      })

      await sock.sendMessage(from, {
        image: qrBuffer,
        caption: `📲 *QR CODE*\n━━━━━━━━━━\n📝 Isi: ${text.length > 50 ? text.slice(0, 50) + "..." : text}`
      })
    } catch (e) {
      await sock.sendMessage(from, { text: "❌ Gagal buat QR Code." })
    }
  }
}
