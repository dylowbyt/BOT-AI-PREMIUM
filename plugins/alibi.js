/**
 * alibi.js — AI Generator Alibi Kocak & Kreatif
 * Command: .alibi
 * FREE - Tidak perlu token
 */

require("dotenv").config()
const OpenAI = require("openai")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

module.exports = {
  name: "alibi",
  alias: ["buatalibi", "alasan"],

  async run(sock, m, args) {
    const from     = m.key.remoteJid
    const situasi  = args.join(" ").trim()

    if (!situasi) {
      return sock.sendMessage(from, {
        text:
          `🕵️ *AI ALIBI GENERATOR*\n\n` +
          `AI akan buatkan alibi yang kreatif, meyakinkan, dan kocak untuk situasimu!\n\n` +
          `Cara pakai:\n` +
          `*.alibi <situasi kamu>*\n\n` +
          `Contoh:\n` +
          `• *.alibi telat masuk kerja karena bangun kesiangan*\n` +
          `• *.alibi lupa ulang tahun pacar*\n` +
          `• *.alibi tidak mengerjakan PR*\n` +
          `• *.alibi pulang malam ke orang tua*\n\n` +
          `_Gratis! Tidak perlu token._`
      })
    }

    await sock.sendMessage(from, { text: `🕵️ *AI sedang meracik alibi terbaik untukmu...*\n\n⏳ Tunggu sebentar...` })

    try {
      const systemPrompt = `Kamu adalah master of deception — ahli pembuat alibi yang kreatif, lucu, dan semi-meyakinkan.
Buatkan 3 versi alibi untuk situasi yang diberikan:
1. 🎭 Versi DRAMATIS (lebay & mengharukan)
2. 😂 Versi KOCAK (lucu tapi masuk akal sedikit)
3. 🎩 Versi PROFESIONAL (serius dan meyakinkan)

Setiap alibi harus detail, kreatif, dan ada elemen yang tidak terduga.
Tambahkan tips cara menyampaikannya dengan meyakinkan.
Gunakan Bahasa Indonesia yang ekspresif dan menghibur.
Ini hanya untuk hiburan semata.`

      const ai     = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Buatkan alibi untuk situasi: ${situasi}` }
        ],
        max_tokens: 1000
      })

      const result = ai.choices[0].message.content

      await sock.sendMessage(from, {
        text:
          `🕵️ *ALIBI GENERATOR AI*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📌 Situasi: _${situasi}_\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${result}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_⚠️ Untuk hiburan semata. Jujur itu lebih baik!_ 😅`
      })

    } catch (err) {
      console.log("[alibi] ERROR:", err.message)
      await sock.sendMessage(from, { text: `❌ Gagal generate alibi: ${err.message}` })
    }
  }
}
