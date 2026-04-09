const axios = require("axios")

module.exports = {
  name: "translate",
  alias: ["tl", "alih"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text

    let lang = args[0]?.toLowerCase()
    let text = args.slice(1).join(" ")

    if (quotedText && !text) {
      text = quotedText
    }

    if (!lang || !text) {
      return sock.sendMessage(from, {
        text: `⚠️ Format: .translate <kode_bahasa> <teks>\nContoh:\n.translate en Halo apa kabar\n.translate id Hello how are you\n.translate ja Selamat pagi\n\nKode: en=Inggris, id=Indonesia, ja=Jepang, ko=Korea, ar=Arab, zh=Cina, fr=Prancis, de=Jerman, es=Spanyol`
      })
    }

    try {
      await sock.sendMessage(from, { text: "🌐 Menerjemahkan..." })

      const res = await axios.get(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`,
        { timeout: 10000 }
      )

      const translated = res.data?.responseData?.translatedText
      const match = res.data?.responseData?.match

      if (!translated) {
        return sock.sendMessage(from, { text: "❌ Terjemahan gagal, coba lagi." })
      }

      const msg = `🌐 *TERJEMAHAN*
━━━━━━━━━━━━━━━
📝 Asli: ${text}
🔄 Bahasa Target: ${lang.toUpperCase()}
✅ Hasil: ${translated}
📊 Akurasi: ${Math.round((match || 0) * 100)}%`

      await sock.sendMessage(from, { text: msg })
    } catch (e) {
      await sock.sendMessage(from, { text: "❌ Gagal menerjemahkan. Coba lagi nanti." })
    }
  }
}
