const axios = require("axios")

module.exports = {
  name: "imsakiyah",
  alias: ["imsak", "saur", "jadwasaur", "ramadan"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const kota = args.join(" ") || "Jakarta"

    try {
      await sock.sendMessage(from, { text: "🌙 Mengambil jadwal imsakiyah..." })

      const today = new Date()
      const day = today.getDate()
      const month = today.getMonth() + 1
      const year = today.getFullYear()

      const geoRes = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(kota)}&count=1&language=id`,
        { timeout: 8000 }
      )

      if (!geoRes.data?.results?.length) {
        return sock.sendMessage(from, { text: `❌ Kota *${kota}* tidak ditemukan.` })
      }

      const loc = geoRes.data.results[0]
      const res = await axios.get(
        `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${loc.latitude}&longitude=${loc.longitude}&method=11&tune=0,0,0,0,0,0,0,-15,0`,
        { timeout: 12000 }
      )

      const t = res.data?.data?.timings
      const hijri = res.data?.data?.date?.hijri

      if (!t) return sock.sendMessage(from, { text: "❌ Gagal mengambil jadwal." })

      await sock.sendMessage(from, {
        text: `🌙 *JADWAL IMSAKIYAH*
📍 ${loc.name}, ${loc.country}
━━━━━━━━━━━━━━━
📅 ${day}/${month}/${year}
🕌 ${hijri?.day} ${hijri?.month?.en} ${hijri?.year} H

⭐ Imsak    : *${t.Imsak || t.Fajr}*
🌅 Subuh    : *${t.Fajr}*
🌄 Syuruq   : *${t.Sunrise}*
☀️ Dzuhur   : *${t.Dhuhr}*
🌤️ Ashar    : *${t.Asr}*
🌇 Maghrib  : *${t.Maghrib}* ← Berbuka
🌙 Isya     : *${t.Isha}*

🤲 Semoga ibadahmu diterima!`
      })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil jadwal imsakiyah." })
    }
  }
}
