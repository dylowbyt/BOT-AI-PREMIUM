const axios = require("axios")

module.exports = {
  name: "pesawat",
  alias: ["flight", "flightstatus", "cekpesawat", "jadwalpesawat"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const flightCode = args[0]?.toUpperCase()

    if (!flightCode) {
      return sock.sendMessage(from, {
        text: `✈️ *CEK STATUS PENERBANGAN*

Format: .pesawat <kode_penerbangan>
Contoh:
.pesawat GA123    (Garuda)
.pesawat QG831    (Citilink)
.pesawat JT123    (Lion Air)
.pesawat SJ234    (Sriwijaya)
.pesawat ID7529   (Batik Air)`
      })
    }

    try {
      await sock.sendMessage(from, { text: "✈️ Mencari info penerbangan..." })

      const res = await axios.get(
        `https://api.aviationstack.com/v1/flights?access_key=free&flight_iata=${flightCode}&limit=1`,
        { timeout: 12000 }
      )

      const data = res.data?.data?.[0]
      if (!data) {
        return sock.sendMessage(from, {
          text: `✈️ Info penerbangan *${flightCode}*:

📌 Cek real-time status di:
• https://flightaware.com/live/flight/${flightCode}
• https://www.flightradar24.com/${flightCode.toLowerCase()}

Atau download app Flightradar24 untuk tracking real-time!`
        })
      }

      const dep = data.departure
      const arr = data.arrival
      const statusMap = { scheduled: "🗓️ Terjadwal", active: "✈️ Sedang Terbang", landed: "🛬 Mendarat", cancelled: "❌ Dibatalkan", diverted: "↩️ Dialihkan", incident: "⚠️ Insiden" }

      await sock.sendMessage(from, {
        text: `✈️ *${data.airline?.name} ${flightCode}*
━━━━━━━━━━━━━━━
📊 Status: ${statusMap[data.flight_status] || data.flight_status}
🛫 Dari: ${dep?.airport} (${dep?.iata})
🛬 Ke: ${arr?.airport} (${arr?.iata})
⏰ Berangkat: ${dep?.scheduled ? new Date(dep.scheduled).toLocaleString("id-ID") : "N/A"}
⏰ Tiba: ${arr?.scheduled ? new Date(arr.scheduled).toLocaleString("id-ID") : "N/A"}
${dep?.delay ? `⏱️ Delay: ${dep.delay} menit` : ""}`
      })
    } catch {
      await sock.sendMessage(from, {
        text: `✈️ Cek status penerbangan *${flightCode}* di:\n• https://flightaware.com/live/flight/${flightCode}\n• https://www.flightradar24.com`
      })
    }
  }
}
