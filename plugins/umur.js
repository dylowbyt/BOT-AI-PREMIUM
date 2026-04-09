module.exports = {
  name: "umur",
  alias: ["age", "ultah", "lahir", "hitungumur"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const input = args.join(" ")

    if (!input) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.umur 1998-05-21\n.umur 21/05/1998\n.umur 1995-01-01"
      })
    }

    let birth
    if (input.includes("/")) {
      const p = input.split("/")
      birth = new Date(`${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`)
    } else {
      birth = new Date(input)
    }

    if (isNaN(birth.getTime())) {
      return sock.sendMessage(from, { text: "❌ Format tanggal tidak valid. Gunakan: YYYY-MM-DD atau DD/MM/YYYY" })
    }

    const now = new Date()
    if (birth > now) return sock.sendMessage(from, { text: "❌ Tanggal lahir tidak boleh di masa depan." })

    let years = now.getFullYear() - birth.getFullYear()
    let months = now.getMonth() - birth.getMonth()
    let days = now.getDate() - birth.getDate()

    if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate() }
    if (months < 0) { years--; months += 12 }

    const totalDays = Math.floor((now - birth) / (1000 * 60 * 60 * 24))
    const totalHours = Math.floor((now - birth) / (1000 * 60 * 60))
    const totalWeeks = Math.floor(totalDays / 7)

    const nextBirthday = new Date(now.getFullYear(), birth.getMonth(), birth.getDate())
    if (nextBirthday < now) nextBirthday.setFullYear(now.getFullYear() + 1)
    const daysToB = Math.floor((nextBirthday - now) / (1000 * 60 * 60 * 24))

    const isBirthday = birth.getDate() === now.getDate() && birth.getMonth() === now.getMonth()

    await sock.sendMessage(from, {
      text: `🎂 *HITUNG UMUR*
━━━━━━━━━━━━━━━
📅 Lahir: ${birth.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
🎉 Umur: *${years} tahun ${months} bulan ${days} hari*

📊 Statistik:
• Total hari hidup: ${totalDays.toLocaleString("id-ID")} hari
• Total minggu: ${totalWeeks.toLocaleString("id-ID")} minggu
• Total jam: ${totalHours.toLocaleString("id-ID")} jam

🎂 Ulang Tahun Berikutnya:
${isBirthday ? "🎉 *SELAMAT ULANG TAHUN!* 🎉" : `⏳ ${daysToB} hari lagi!`}`
    })
  }
}
