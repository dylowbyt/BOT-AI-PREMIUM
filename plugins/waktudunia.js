module.exports = {
  name: "waktusekrang",
  alias: ["jam", "time", "worldtime", "waktu"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const kota = args.join(" ")?.toLowerCase()

    const timezones = {
      "jakarta": { tz: "Asia/Jakarta", label: "🇮🇩 Jakarta (WIB)", offset: "+7" },
      "wib": { tz: "Asia/Jakarta", label: "🇮🇩 WIB (Jakarta/Surabaya)", offset: "+7" },
      "wita": { tz: "Asia/Makassar", label: "🇮🇩 WITA (Makassar/Bali)", offset: "+8" },
      "wit": { tz: "Asia/Jayapura", label: "🇮🇩 WIT (Jayapura)", offset: "+9" },
      "singapura": { tz: "Asia/Singapore", label: "🇸🇬 Singapura", offset: "+8" },
      "malaysia": { tz: "Asia/Kuala_Lumpur", label: "🇲🇾 Malaysia", offset: "+8" },
      "tokyo": { tz: "Asia/Tokyo", label: "🇯🇵 Tokyo", offset: "+9" },
      "london": { tz: "Europe/London", label: "🇬🇧 London", offset: "+0/+1" },
      "new york": { tz: "America/New_York", label: "🇺🇸 New York", offset: "-5/-4" },
      "dubai": { tz: "Asia/Dubai", label: "🇦🇪 Dubai", offset: "+4" },
      "riyadh": { tz: "Asia/Riyadh", label: "🇸🇦 Riyadh", offset: "+3" },
      "sydney": { tz: "Australia/Sydney", label: "🇦🇺 Sydney", offset: "+10/+11" },
      "beijing": { tz: "Asia/Shanghai", label: "🇨🇳 Beijing/Shanghai", offset: "+8" },
      "paris": { tz: "Europe/Paris", label: "🇫🇷 Paris", offset: "+1/+2" },
    }

    const tzList = ["jakarta", "wita", "wit", "singapura", "tokyo", "dubai", "riyadh", "london", "new york"]

    if (!kota) {
      let msg = "🕐 *WAKTU DUNIA*\n━━━━━━━━━━━━━━━\n"
      const now = new Date()
      tzList.forEach(k => {
        const t = timezones[k]
        const time = now.toLocaleString("id-ID", { timeZone: t.tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
        msg += `${t.label}: *${time}*\n`
      })
      msg += `\nCari kota: .waktu <kota>\nContoh: .waktu tokyo`
      return sock.sendMessage(from, { text: msg })
    }

    const found = Object.entries(timezones).find(([k]) => kota.includes(k) || k.includes(kota))
    if (!found) {
      return sock.sendMessage(from, { text: `❌ Kota *${kota}* tidak tersedia.\nKota tersedia: ${Object.keys(timezones).join(", ")}` })
    }

    const [, t] = found
    const now = new Date()
    const time = now.toLocaleString("id-ID", {
      timeZone: t.tz,
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    })

    await sock.sendMessage(from, {
      text: `🕐 *WAKTU SEKARANG*\n━━━━━━━━━━━━━━━\n${t.label}\n⏰ ${time}`
    })
  }
}
