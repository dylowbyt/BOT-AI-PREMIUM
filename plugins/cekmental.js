/**
 * cekmental.js — AI Analisis Kondisi Mental dari Curhat/Teks
 * Command: .cekmental
 * FREE - Tidak perlu token
 */

require("dotenv").config()
const OpenAI = require("openai")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

module.exports = {
  name: "cekmental",
  alias: ["mentalcheck", "curhat", "psikologi"],

  async run(sock, m, args) {
    const from  = m.key.remoteJid
    const input = args.join(" ").trim()

    if (!input) {
      return sock.sendMessage(from, {
        text:
          `🧠 *CEK KONDISI MENTAL AI*\n\n` +
          `Ceritakan apa yang kamu rasakan atau alami, AI akan memberikan insight kondisi mentalmu dan saran yang membangun.\n\n` +
          `Cara pakai:\n` +
          `*.cekmental <cerita/curhat kamu>*\n\n` +
          `Contoh:\n` +
          `• *.cekmental akhir-akhir ini aku sering ngerasa cemas dan susah tidur*\n` +
          `• *.cekmental aku males ngapa-ngapain dan ngerasa hampa*\n\n` +
          `_⚠️ Bukan pengganti konsultasi psikolog profesional.\n` +
          `Gratis! Tidak perlu token._`
      })
    }

    await sock.sendMessage(from, { text: `🧠 *AI sedang menganalisis kondisi mentalmu...*\n\n⏳ Tunggu sebentar...` })

    try {
      const systemPrompt = `Kamu adalah psikolog yang empatik, hangat, dan berpengetahuan luas.
Analisis kondisi mental berdasarkan teks yang diberikan dan berikan:
1. 🔍 Insight kondisi emosional yang terdeteksi
2. 💭 Pola pikir yang mungkin sedang terjadi
3. ⚡ Trigger/pemicu yang mungkin ada
4. 💪 Kekuatan yang terlihat dari tulisan
5. 🌟 Saran praktis yang bisa dilakukan hari ini (3-5 langkah konkret)
6. 💬 Kata-kata penyemangat yang personal

Sampaikan dengan hangat, tidak menghakimi, dan penuh empati.
Selalu ingatkan bahwa ini bukan pengganti konsultasi profesional.
Gunakan Bahasa Indonesia yang lembut dan membangun.`

      const ai     = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input }
        ],
        max_tokens: 1200
      })

      const result = ai.choices[0].message.content

      await sock.sendMessage(from, {
        text:
          `🧠 *ANALISIS KONDISI MENTAL AI*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${result}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `_⚠️ Bukan pengganti konsultasi psikolog profesional.\n` +
          `Jika merasa butuh bantuan lebih, hubungi Into The Light Indonesia: 119 ext 8_`
      })

    } catch (err) {
      console.log("[cekmental] ERROR:", err.message)
      await sock.sendMessage(from, { text: `❌ Gagal analisis mental: ${err.message}` })
    }
  }
}
