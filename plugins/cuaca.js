const axios = require("axios")

module.exports = {
  name: "cuaca",
  alias: ["weather", "bmkgcuaca"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const kota = args.join(" ")

    if (!kota) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.cuaca Jakarta\n.cuaca Surabaya"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🌤️ Mengambil data cuaca..." })

      const res = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=0&longitude=0&current_weather=true`,
        { timeout: 10000 }
      )

      const geo = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(kota)}&count=1&language=id&format=json`,
        { timeout: 10000 }
      )

      if (!geo.data?.results?.length) {
        return sock.sendMessage(from, { text: `❌ Kota *${kota}* tidak ditemukan.` })
      }

      const loc = geo.data.results[0]
      const weather = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true&hourly=relative_humidity_2m,precipitation_probability&timezone=Asia%2FJakarta&forecast_days=1`,
        { timeout: 10000 }
      )

      const cw = weather.data.current_weather
      const codes = {
        0: "☀️ Cerah", 1: "🌤️ Cerah Berawan", 2: "⛅ Berawan", 3: "☁️ Mendung",
        45: "🌫️ Berkabut", 48: "🌫️ Berkabut Beku",
        51: "🌦️ Gerimis Ringan", 53: "🌦️ Gerimis", 55: "🌧️ Gerimis Deras",
        61: "🌧️ Hujan Ringan", 63: "🌧️ Hujan", 65: "⛈️ Hujan Deras",
        71: "❄️ Salju Ringan", 80: "🌦️ Hujan Lokal", 95: "⛈️ Badai Petir"
      }

      const kondisi = codes[cw.weathercode] || "🌡️ Cuaca Tidak Diketahui"
      const wind = cw.windspeed
      const temp = cw.temperature

      const humidity = weather.data.hourly?.relative_humidity_2m?.[0] || "N/A"
      const rain_prob = weather.data.hourly?.precipitation_probability?.[0] || "N/A"

      const msg = `🌍 *CUACA ${kota.toUpperCase()}*
━━━━━━━━━━━━━━━
📍 Lokasi: ${loc.name}, ${loc.country}
🌡️ Suhu: ${temp}°C
💨 Angin: ${wind} km/h
💧 Kelembaban: ${humidity}%
☔ Prob. Hujan: ${rain_prob}%
🌤️ Kondisi: ${kondisi}

📌 Sumber: Open-Meteo API`

      await sock.sendMessage(from, { text: msg })
    } catch (e) {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil data cuaca. Coba lagi nanti." })
    }
  }
}
