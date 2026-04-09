const axios = require("axios")

module.exports = {
  name: "uvindex",
  alias: ["uv", "sinar", "matahari"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const kota = args.join(" ") || "Jakarta"

    try {
      await sock.sendMessage(from, { text: "☀️ Mengambil data UV Index..." })

      const geo = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(kota)}&count=1&language=id`,
        { timeout: 8000 }
      )

      if (!geo.data?.results?.length) {
        return sock.sendMessage(from, { text: `❌ Kota *${kota}* tidak ditemukan.` })
      }

      const loc = geo.data.results[0]
      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=uv_index_max,precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=Asia%2FJakarta&forecast_days=3`,
        { timeout: 10000 }
      )

      const daily = res.data?.daily
      if (!daily) return sock.sendMessage(from, { text: "❌ Gagal mengambil data." })

      const uvLevels = (uv) => {
        if (uv <= 2) return "🟢 Rendah (Aman)"
        if (uv <= 5) return "🟡 Sedang (Gunakan sunscreen)"
        if (uv <= 7) return "🟠 Tinggi (Hindari siang hari)"
        if (uv <= 10) return "🔴 Sangat Tinggi (Lindungi diri)"
        return "🟣 Ekstrem (Jangan keluar tanpa perlindungan)"
      }

      let msg = `☀️ *UV INDEX & PRAKIRAAN*\n📍 ${loc.name}, ${loc.country}\n━━━━━━━━━━━━━━━\n`
      for (let i = 0; i < 3; i++) {
        const date = new Date(daily.time[i]).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "short" })
        const uv = daily.uv_index_max[i]?.toFixed(1) || "N/A"
        const tmax = daily.temperature_2m_max[i] || "N/A"
        const tmin = daily.temperature_2m_min[i] || "N/A"
        const rain = daily.precipitation_sum[i] || 0
        msg += `📅 ${date}\n☀️ UV Max: ${uv} — ${uvLevels(uv)}\n🌡️ ${tmin}°C - ${tmax}°C | 🌧️ ${rain}mm\n\n`
      }

      await sock.sendMessage(from, { text: msg.trim() })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil data UV Index." })
    }
  }
}
