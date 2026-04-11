/**
 * debugcode.js — AI Debug Kode dari teks atau screenshot
 * Command: .debugcode
 * FREE - Tidak perlu token
 */

require("dotenv").config()
const OpenAI = require("openai")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

module.exports = {
  name: "debugcode",
  alias: ["debug", "fixcode", "errorfix"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const msg       = m.message
    const quoted    = msg?.extendedTextMessage?.contextInfo?.quotedMessage
    const directImg = msg?.imageMessage
    const quotedImg = quoted?.imageMessage
    const hasImg    = !!(directImg || quotedImg)
    const kode      = args.join(" ").trim()

    if (!hasImg && !kode) {
      return sock.sendMessage(from, {
        text:
          `🐛 *AI DEBUG CODE*\n\n` +
          `Cara pakai:\n` +
          `• Kirim screenshot error + caption *.debugcode*\n` +
          `• *.debugcode <paste kode/error kamu>*\n\n` +
          `Supported: JavaScript, Python, PHP, Java, C++, dan lainnya\n\n` +
          `_Gratis! Tidak perlu token._`
      })
    }

    await sock.sendMessage(from, { text: `🔍 *AI sedang menganalisis kode...*\n\n⏳ Tunggu sebentar...` })

    try {
      const systemPrompt = `Kamu adalah senior software engineer expert dengan pengalaman 20 tahun. 
Tugasmu adalah menganalisis kode atau error yang diberikan dan memberikan:
1. Penjelasan masalahnya (bahasa sederhana)
2. Penyebab error/bug
3. Solusi lengkap dengan kode yang sudah diperbaiki
4. Tips pencegahan agar error tidak terulang
Gunakan Bahasa Indonesia yang jelas. Format jawaban dengan rapi menggunakan bullet points.`

      let messages = []
      let userContent = []

      if (hasImg) {
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

        userContent = [
          { type: "text", text: kode ? `Analisis error/kode ini: ${kode}` : "Analisis error/kode dalam screenshot ini dan berikan solusi lengkap." },
          { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } }
        ]
      } else {
        userContent = [{ type: "text", text: `Analisis dan debug kode/error berikut:\n\n${kode}` }]
      }

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ]

      const ai     = await openai.chat.completions.create({ model: "gpt-4o-mini", messages, max_tokens: 1500 })
      const result = ai.choices[0].message.content

      await sock.sendMessage(from, {
        text:
          `🐛 *HASIL DEBUG AI*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${result}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_🤖 AI Debug Engine • Gratis_`
      })

    } catch (err) {
      console.log("[debugcode] ERROR:", err.message)
      await sock.sendMessage(from, { text: `❌ Gagal debug kode: ${err.message}` })
    }
  }
}
