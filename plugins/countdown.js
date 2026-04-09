module.exports = {
  name: "countdown",
  alias: ["hitung mundur", "hitungmundur", "timer"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const input = args.join(" ")

    if (!input) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.countdown 2025-12-31\n.countdown 25/06/2025\n.countdown Lebaran 2025-03-30"
      })
    }

    const dateRegex = /(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})/
    const match = input.match(dateRegex)

    if (!match) {
      return sock.sendMessage(from, { text: "❌ Format tanggal tidak dikenali. Gunakan: YYYY-MM-DD atau DD/MM/YYYY" })
    }

    let targetDate
    const raw = match[1]
    if (raw.includes("/")) {
      const parts = raw.split("/")
      targetDate = new Date(`${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`)
    } else {
      targetDate = new Date(raw)
    }

    const now = new Date()
    const diff = targetDate - now

    if (isNaN(targetDate.getTime())) {
      return sock.sendMessage(from, { text: "❌ Tanggal tidak valid." })
    }

    if (diff < 0) {
      const absDiff = Math.abs(diff)
      const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))
      const label = input.replace(raw, "").trim() || "Tanggal"
      return sock.sendMessage(from, {
        text: `⏮️ *COUNTDOWN*\n━━━━━━━━━━━\n📅 ${label}\n✅ Sudah terlewat ${days} hari yang lalu.`
      })
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const label = input.replace(raw, "").trim() || "Target"

    await sock.sendMessage(from, {
      text: `⏳ *COUNTDOWN*
━━━━━━━━━━━━━━━
🎯 Event: ${label}
📅 Tanggal: ${targetDate.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}

⏰ Sisa Waktu:
• ${days} hari
• ${hours} jam
• ${minutes} menit`
    })
  }
}
