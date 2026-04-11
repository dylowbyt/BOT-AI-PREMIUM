/**
 * fasion.js — AI Fashion Advisor dari foto outfit
 * Command: .fasion
 * FREE - Tidak perlu token
 */

require("dotenv").config()
const OpenAI = require("openai")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

module.exports = {
  name: "fasion",
  alias: ["fashion", "outfitcheck", "stylecheck"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const msg       = m.message
    const quoted    = msg?.extendedTextMessage?.contextInfo?.quotedMessage
    const directImg = msg?.imageMessage
    const quotedImg = quoted?.imageMessage
    const hasImg    = !!(directImg || quotedImg)

    if (!hasImg) {
      return sock.sendMessage(from, {
        text:
          `👗 *AI FASHION ADVISOR*\n\n` +
          `Cara pakai:\n` +
          `• Kirim foto outfit/penampilan + caption *.fasion*\n` +
          `• Reply foto dengan *.fasion*\n\n` +
          `AI akan kasih:\n` +
          `✅ Rating penampilan\n` +
          `🎨 Analisis warna & gaya\n` +
          `💡 Saran mix & match\n` +
          `🏪 Rekomendasi item tambahan\n\n` +
          `_Gratis! Tidak perlu token._`
      })
    }

    await sock.sendMessage(from, { text: `👗 *AI Fashion Advisor sedang menganalisis outfit kamu...*\n\n⏳ Tunggu sebentar...` })

    try {
      let imageBuffer
      if (directImg) {
        imageBuffer = await downloadMediaMessage(m, "buffer", {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
      } else {
        imageBuffer = await downloadMediaMessage(
          { key: m.key, message: quoted }, "buffer", {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        )
      }

      const base64 = imageBuffer.toString("base64")
      const mime   = directImg?.mimetype || quotedImg?.mimetype || "image/jpeg"

      const systemPrompt = `Kamu adalah fashion stylist profesional kelas dunia yang jujur, stylish, dan berpengalaman.
Analisis outfit/penampilan dalam foto dan berikan:
1. ⭐ Rating keseluruhan (1-10) dengan penjelasan singkat
2. 🎨 Analisis warna & kombinasi
3. 👔 Gaya yang teridentifikasi (casual, formal, streetwear, dll)
4. ✅ Yang sudah bagus dari outfit ini
5. 🔧 Yang perlu diperbaiki/ditambahkan
6. 💡 Saran mix & match konkret (item spesifik)
7. 🌟 Tips styling tambahan

Jujur tapi tetap positif dan membangun. Gunakan Bahasa Indonesia yang fun dan trendi.`

      const ai     = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Analisis fashion dan outfit dalam foto ini." },
              { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } }
            ]
          }
        ],
        max_tokens: 1000
      })

      const result = ai.choices[0].message.content

      await sock.sendMessage(from, {
        text:
          `👗 *HASIL ANALISIS FASHION AI*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${result}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_✨ AI Fashion Advisor • Gratis_`
      })

    } catch (err) {
      console.log("[fasion] ERROR:", err.message)
      await sock.sendMessage(from, { text: `❌ Gagal analisis fashion: ${err.message}` })
    }
  }
}
