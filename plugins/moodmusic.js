/**
 * moodmusic.js — AI Rekomendasi Musik + Generate Lirik dari Mood/Foto
 * Command: .moodmusic
 * 7 TOKEN
 */

require("dotenv").config()
const OpenAI = require("openai")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { useTokens, getTokens, getTokenWarning } = require("../ai/tokendb")

const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const TOKEN_COST = 7

module.exports = {
  name: "moodmusic",
  alias: ["musikmood", "songmood", "playlistai"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    const msg       = m.message
    const quoted    = msg?.extendedTextMessage?.contextInfo?.quotedMessage
    const directImg = msg?.imageMessage
    const quotedImg = quoted?.imageMessage
    const hasImg    = !!(directImg || quotedImg)
    const moodText  = args.join(" ").trim()

    if (!hasImg && !moodText) {
      return sock.sendMessage(from, {
        text:
          `🎵 *AI MOOD MUSIC*\n\n` +
          `AI akan analisis mood kamu dan rekomendasikan playlist + buatkan lirik lagu yang pas!\n\n` +
          `Cara pakai:\n` +
          `• Kirim foto + caption *.moodmusic* — AI baca mood dari foto\n` +
          `• *.moodmusic <ceritakan perasaanmu>* — berdasarkan teks\n\n` +
          `AI akan berikan:\n` +
          `🎧 10 rekomendasi lagu (lokal & internasional)\n` +
          `📝 Lirik lagu original yang dibuat khusus untukmu\n` +
          `🎼 Genre & vibe playlist\n\n` +
          `🪙 Biaya: *${TOKEN_COST} token*\n` +
          `💰 Token kamu: *${getTokens(sender)}*`
      })
    }

    const tokens = getTokens(sender)
    if (tokens < TOKEN_COST) {
      return sock.sendMessage(from, {
        text:
          `❌ *Token tidak cukup!*\n\n` +
          `🪙 Token kamu: *${tokens}*\n` +
          `💸 Dibutuhkan: *${TOKEN_COST} token*\n\n` +
          `Ketik *.premium* untuk beli token.`
      })
    }

    await sock.sendMessage(from, {
      text:
        `🎵 *AI Mood Music sedang menganalisis...*\n\n` +
        `🎧 Mencari lagu yang pas...\n` +
        `✍️ Menulis lirik spesial untukmu...\n\n` +
        `⏳ Tunggu sebentar...\n` +
        `🪙 ${TOKEN_COST} token akan dipotong`
    })

    try {
      let messages = []
      const systemPrompt = `Kamu adalah musik kurator & songwriter profesional yang ahli membaca mood.
Berdasarkan input yang diberikan, hasilkan:
1. 🎭 Analisis mood (dalam 2-3 kalimat)
2. 🎼 Genre & vibe yang cocok
3. 🎧 10 Rekomendasi lagu (campuran Indonesia & Internasional) dengan format:
   • Judul - Artis | Alasan singkat kenapa cocok
4. ✍️ Lirik lagu original (2 verse + chorus) yang dibuat khusus sesuai mood ini
5. 💌 Pesan penutup yang hangat

Gunakan Bahasa Indonesia yang ekspresif dan penuh perasaan.`

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
              { type: "text", text: moodText || "Analisis mood dari foto ini dan rekomendasikan musik yang pas." },
              { type: "image_url", image_url: { url: `data:${mime};base64,${base64}` } }
            ]
          }
        ]
      } else {
        messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Mood/perasaan saya: ${moodText}` }
        ]
      }

      const remaining = useTokens(sender, TOKEN_COST)
      const ai        = await openai.chat.completions.create({ model: "gpt-4o-mini", messages, max_tokens: 1500 })
      const result    = ai.choices[0].message.content

      await sock.sendMessage(from, {
        text:
          `🎵 *MOOD MUSIC AI*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${result}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🪙 Token terpakai: *${TOKEN_COST}* | Sisa: *${remaining}*`
      })

      const warning = getTokenWarning(sender)
      if (warning) await sock.sendMessage(from, { text: warning })

    } catch (err) {
      const { addTokens } = require("../ai/tokendb")
      addTokens(sender, TOKEN_COST)
      console.log("[moodmusic] ERROR:", err.message)
      await sock.sendMessage(from, {
        text: `❌ Gagal generate mood music: ${err.message}\n\n🪙 Token dikembalikan: *${TOKEN_COST}*`
      })
    }
  }
}
