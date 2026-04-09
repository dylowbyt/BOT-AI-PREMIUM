const axios = require("axios")

module.exports = {
  name: "maps",
  alias: ["lokasi", "petacari", "findplace", "carailokasi"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      return sock.sendMessage(from, {
        text: "🗺️ Contoh:\n.maps Monas Jakarta\n.maps RSUD Bandung\n.maps Bandara Soekarno Hatta"
      })
    }

    const encodedQuery = encodeURIComponent(query)
    const googleMapsUrl = `https://www.google.com/maps/search/${encodedQuery}`
    const wazeUrl = `https://waze.com/ul?q=${encodedQuery}&navigate=yes`

    try {
      await sock.sendMessage(from, { text: "🗺️ Mencari lokasi..." })

      const res = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodedQuery}&format=json&limit=3&accept-language=id`,
        {
          timeout: 10000,
          headers: { "User-Agent": "WABot/1.0 (Educational)" }
        }
      )

      const results = res.data
      if (!results?.length) {
        return sock.sendMessage(from, {
          text: `🗺️ *CARI LOKASI: ${query}*\n━━━━━━━━━━━\n❌ Lokasi tidak ditemukan via OpenStreetMap.\n\nBuka di:\n📌 Google Maps: ${googleMapsUrl}\n🚗 Waze: ${wazeUrl}`
        })
      }

      let msg = `🗺️ *CARI LOKASI: ${query.toUpperCase()}*\n━━━━━━━━━━━━━━━\n`
      results.slice(0, 3).forEach((loc, i) => {
        const lat = parseFloat(loc.lat).toFixed(6)
        const lon = parseFloat(loc.lon).toFixed(6)
        msg += `${i + 1}. 📍 ${loc.display_name.slice(0, 80)}\n   🌐 Koordinat: ${lat}, ${lon}\n   🗺️ https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15\n\n`
      })

      msg += `📌 Google Maps: ${googleMapsUrl}\n🚗 Waze: ${wazeUrl}`

      await sock.sendMessage(from, { text: msg.slice(0, 4096) })
    } catch {
      await sock.sendMessage(from, {
        text: `🗺️ *CARI LOKASI: ${query}*\n\n📌 Buka di Google Maps:\n${googleMapsUrl}`
      })
    }
  }
}
