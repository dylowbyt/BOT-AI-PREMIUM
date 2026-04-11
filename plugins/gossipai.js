/**
 * gossipai.js — AI Generator Gosip Fiktif & Lucu
 * Command: .gossipai
 * FREE - Tidak perlu token
 */

require("dotenv").config()
const OpenAI = require("openai")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

module.exports = {
  name: "gossipai",
  alias: ["gosip", "gossip", "infoterkini"],

  async run(sock, m, args) {
    const from  = m.key.remoteJid
    const input = args.join(" ").trim()

    if (!input) {
      return sock.sendMessage(from, {
        text:
          `📰 *AI GOSIP GENERATOR*\n\n` +
          `AI akan buatkan gosip fiktif yang lucu & menghibur!\n\n` +
          `Cara pakai:\n` +
          `*.gossipai <nama orang/tokoh>*\n\n` +
          `Contoh:\n` +
          `• *.gossipai Budi dan Siti*\n` +
          `• *.gossipai pak RT kita*\n` +
          `• *.gossipai teman sekelas aku*\n\n` +
          `_⚠️ Semua gosip 100% fiktif untuk hiburan!\n` +
          `Gratis! Tidak perlu token._`
      })
    }

    await sock.sendMessage(from, { text: `📰 *AI sedang menggali gosip terhangat...*\n\n⏳ Tunggu sebentar...` })

    try {
      const systemPrompt = `Kamu adalah host acara gosip paling dramatis di Indonesia yang lebay dan menghibur.
Buatkan 3 gosip FIKTIF yang lucu tentang orang/tokoh yang disebutkan:
1. 💕 Gosip Percintaan (drama romance)
2. 💰 Gosip Harta/Karir (drama kesuksesan/kegagalan)
3. 🤫 Gosip Rahasia Tersembunyi (plot twist mengejutkan)

Setiap gosip harus: dramatis, lebay, lucu, ada elemen tidak masuk akal, dan menghibur.
Selalu tambahkan disclaimer bahwa ini 100% fiktif dan untuk hiburan.
Gaya bahasa: norak, dramatis, seperti pembawa berita gosip infotainment.
Gunakan Bahasa Indonesia yang ekspresif dengan banyak tanda seru!`

      const ai     = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Buatkan gosip fiktif tentang: ${input}` }
        ],
        max_tokens: 800
      })

      const result = ai.choices[0].message.content

      await sock.sendMessage(from, {
        text:
          `📰 *GOSIP AI — BREAKING NEWS!*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🎭 Tentang: _${input}_\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${result}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_⚠️ DISCLAIMER: Semua gosip di atas 100% FIKTIF & hanya untuk hiburan semata!_`
      })

    } catch (err) {
      console.log("[gossipai] ERROR:", err.message)
      await sock.sendMessage(from, { text: `❌ Gagal generate gosip: ${err.message}` })
    }
  }
}
