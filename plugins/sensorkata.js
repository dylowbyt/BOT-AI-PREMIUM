module.exports = {
  name: "sensor",
  alias: ["censor", "sensorkata", "gantinama"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text
    const text = args.join(" ") || quotedText

    if (!text) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.sensor teks yang ingin disensor\nAtau reply pesan dengan .sensor"
      })
    }

    const badWords = [
      "anjing", "babi", "bangsat", "bajingan", "goblok", "idiot", "bodoh",
      "tolol", "kontol", "memek", "ngentot", "brengsek", "keparat", "sialan",
      "fuck", "shit", "asshole", "bitch", "damn", "cunt"
    ]

    let result = text
    let count = 0

    badWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, "gi")
      if (regex.test(result)) {
        count++
        result = result.replace(regex, match => match[0] + "*".repeat(match.length - 2) + match[match.length - 1])
      }
    })

    await sock.sendMessage(from, {
      text: `🚫 *TEKS TERSENSOR*
━━━━━━━━━━━━━━━
📝 Asli: ${text.slice(0, 200)}
✅ Tersensor: ${result.slice(0, 200)}
🔍 Kata terdeteksi: ${count} kata`
    })
  }
}
