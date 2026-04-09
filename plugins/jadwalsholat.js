const axios = require("axios")

module.exports = {
  name: "sholat",
  alias: ["jadwalsholat", "jadwalsolat", "solat", "prayer"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const kota = args.join(" ") || "Jakarta"

    try {
      await sock.sendMessage(from, { text: "🕌 Mengambil jadwal sholat..." })

      const today = new Date()
      const day = today.getDate()
      const month = today.getMonth() + 1
      const year = today.getFullYear()

      const geoRes = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(kota)}&count=1&language=id&format=json`,
        { timeout: 10000 }
      )

      if (!geoRes.data?.results?.length) {
        return sock.sendMessage(from, { text: `❌ Kota *${kota}* tidak ditemukan.` })
      }

      const loc = geoRes.data.results[0]
      const res = await axios.get(
        `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${loc.latitude}&longitude=${loc.longitude}&method=11`,
        { timeout: 15000 }
      )

      const timings = res.data?.data?.timings
      if (!timings) return sock.sendMessage(from, { text: "❌ Gagal mengambil jadwal sholat." })

      const hijri = res.data?.data?.date?.hijri
      const gregorian = res.data?.data?.date?.gregorian

      await sock.sendMessage(from, {
        text: `🕌 *JADWAL SHOLAT*
📍 ${loc.name}, ${loc.country}
━━━━━━━━━━━━━━━
📅 ${gregorian?.weekday?.en}, ${gregorian?.date}
🌙 ${hijri?.day} ${hijri?.month?.en} ${hijri?.year} H

🌅 Subuh  : *${timings.Fajr}*
🌄 Syuruq : *${timings.Sunrise}*
☀️ Dzuhur : *${timings.Dhuhr}*
🌤️ Ashar  : *${timings.Asr}*
🌆 Maghrib: *${timings.Maghrib}*
🌙 Isya   : *${timings.Isha}*

📌 Sumber: Aladhan API`
      })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil jadwal sholat. Coba lagi nanti." })
    }
  }
}
