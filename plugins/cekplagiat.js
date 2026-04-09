const axios = require("axios")
const crypto = require("crypto")

module.exports = {
  name: "plagiat",
  alias: ["cekplagiat", "similartext", "checkplag"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text
    const text = args.join(" ") || quotedText

    if (!text || text.length < 20) {
      return sock.sendMessage(from, {
        text: "⚠️ Kirim teks minimal 20 karakter:\n.plagiat <teks yang ingin dicek>\nAtau reply pesan dengan .plagiat"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🔍 Menganalisis teks..." })

      const words = text.split(/\s+/).length
      const chars = text.length
      const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length
      const avgWordsPerSentence = (words / Math.max(sentences, 1)).toFixed(1)

      const commonPhrases = ["the", "dan", "yang", "untuk", "dengan", "adalah", "ini", "itu"]
      let patternScore = 0
      commonPhrases.forEach(p => {
        const count = (text.toLowerCase().match(new RegExp("\\b" + p + "\\b", "g")) || []).length
        if (count / words > 0.05) patternScore++
      })

      const formality = text.match(/[A-Z][^.!?]*[.!?]/g)?.length || 0
      const uniqueWords = new Set(text.toLowerCase().split(/\W+/)).size
      const uniqueRatio = (uniqueWords / words * 100).toFixed(1)

      let originScore = Math.min(100, Math.max(0, 50 + (uniqueRatio - 50) * 0.5 + formality * 2 - patternScore * 5))
      const plagRisk = originScore > 70 ? "Rendah ✅" : originScore > 50 ? "Sedang ⚠️" : "Tinggi ❗"

      await sock.sendMessage(from, {
        text: `🔍 *ANALISIS PLAGIARISME*
━━━━━━━━━━━━━━━
📊 Statistik Teks:
• Kata: ${words}
• Karakter: ${chars}
• Kalimat: ${sentences}
• Rata-rata kata/kalimat: ${avgWordsPerSentence}
• Kosakata unik: ${uniqueRatio}%

🎯 Estimasi Orisinalitas: ${originScore.toFixed(0)}%
⚠️ Risiko Plagiarisme: ${plagRisk}

💡 Catatan: Analisis ini bersifat estimasi lokal berdasarkan pola teks. Untuk cek plagiarisme akurat, gunakan tools seperti Turnitin atau Grammarly.`
      })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal menganalisis teks." })
    }
  }
}
