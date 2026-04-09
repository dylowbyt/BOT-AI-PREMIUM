const axios = require("axios")

module.exports = {
  name: "ringkas",
  alias: ["summarize", "rangkum", "summary"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text
    const text = args.join(" ") || quotedText

    if (!text || text.length < 50) {
      return sock.sendMessage(from, {
        text: "⚠️ Teks terlalu pendek! Minimal 50 karakter.\nContoh: .ringkas <teks panjang>\nAtau reply pesan panjang dengan .ringkas"
      })
    }

    try {
      await sock.sendMessage(from, { text: "📝 Meringkas teks..." })

      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
      const words = text.split(/\s+/).length

      if (sentences.length <= 2) {
        return sock.sendMessage(from, { text: `📝 *RINGKASAN*\n━━━━━━━━━━━\n${text}` })
      }

      const wordFreq = {}
      const stopWords = new Set(["dan", "yang", "untuk", "dengan", "ini", "itu", "adalah", "di", "ke", "dari", "pada", "dalam", "atau", "juga", "sudah", "akan", "the", "a", "an", "is", "are", "was", "were", "be", "been", "have", "has", "had", "do", "does", "did", "not", "but", "and", "or", "for", "of", "in", "to", "at"])

      text.toLowerCase().split(/\W+/).forEach(w => {
        if (w.length > 3 && !stopWords.has(w)) {
          wordFreq[w] = (wordFreq[w] || 0) + 1
        }
      })

      const senScores = sentences.map(sen => {
        let score = 0
        sen.toLowerCase().split(/\W+/).forEach(w => { score += wordFreq[w] || 0 })
        return { text: sen.trim(), score }
      })

      const topN = Math.min(3, Math.ceil(sentences.length * 0.3))
      const top = senScores.sort((a, b) => b.score - a.score).slice(0, topN)
      const summary = top.map(s => s.text).join(". ") + "."

      await sock.sendMessage(from, {
        text: `📝 *RINGKASAN TEKS*
━━━━━━━━━━━━━━━
📊 Teks asli: ${words} kata, ${sentences.length} kalimat
📄 Ringkasan: ${summary.split(/\s+/).length} kata

✅ *Hasil:*
${summary}`
      })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal meringkas teks." })
    }
  }
}
