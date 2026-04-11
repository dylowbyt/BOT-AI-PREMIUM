/**
 * cekkodam.js — Cek Kodam/Aura dari foto atau nama
 * Command: .cekkodam
 * FREE - Tidak perlu token
 */

require("dotenv").config()
const OpenAI = require("openai")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const KODAM_LIST = [
  "Kodam Serigala Putih", "Kodam Naga Merah", "Kodam Elang Hitam",
  "Kodam Harimau Emas", "Kodam Ular Kobra", "Kodam Singa Biru",
  "Kodam Kuda Putih", "Kodam Burung Phoenix", "Kodam Buaya Sakti",
  "Kodam Macan Tutul", "Kodam Rajawali Sakti", "Kodam Kera Putih"
]

module.exports = {
  name: "cekkodam",
  alias: ["kodam", "aura", "cekAura"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    const msg       = m.message
    const quoted    = msg?.extendedTextMessage?.contextInfo?.quotedMessage
    const directImg = msg?.imageMessage
    const quotedImg = quoted?.imageMessage
    const hasImg    = !!(directImg || quotedImg)
    const nama      = args.join(" ").trim()

    if (!hasImg && !nama) {
      return sock.sendMessage(from, {
        text:
          `🔮 *CEK KODAM / AURA*\n\n` +
          `Cara pakai:\n` +
          `• Kirim foto + caption *.cekkodam*\n` +
          `• *.cekkodam <nama kamu>*\n\n` +
          `_Gratis! Tidak perlu token._`
      })
    }

    await sock.sendMessage(from, { text: `🔮 *Membaca Kodam & Aura kamu...*\n\n⏳ Tunggu sebentar...` })

    try {
      let messages = []
      const systemPrompt = `Kamu adalah dukun spiritual Indonesia yang sakti dan berpengalaman. 
Kamu bisa membaca kodam/aura seseorang dari foto atau nama mereka. 
Berikan pembacaan kodam yang dramatis, misterius, dan meyakinkan dalam Bahasa Indonesia.
Sertakan: nama kodamnya, elemen/unsur kodam, kekuatan utama, kelemahan tersembunyi, pesan spiritual, dan ramalan singkat.
Tulis dengan gaya mistis dan memukau. Ini untuk hiburan semata.`

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

        messages = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Bacakan kodam dan aura orang dalam foto ini secara detail dan dramatis." },
              { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } }
            ]
          }
        ]
      } else {
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Bacakan kodam dan aura dari orang bernama: ${nama}` }
        ]
      }

      const ai     = await openai.chat.completions.create({ model: "gpt-4o-mini", messages })
      const result = ai.choices[0].message.content
      const kodam  = KODAM_LIST[Math.floor(Math.random() * KODAM_LIST.length)]

      await sock.sendMessage(from, {
        text:
          `🔮 *HASIL PEMBACAAN KODAM & AURA*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `⚡ *Kodam Teridentifikasi:*\n_${kodam}_\n\n` +
          `${result}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_🌙 Dibaca oleh AI Spiritual • Untuk hiburan_`
      })

    } catch (err) {
      console.log("[cekkodam] ERROR:", err.message)
      await sock.sendMessage(from, { text: `❌ Gagal membaca kodam: ${err.message}` })
    }
  }
}
