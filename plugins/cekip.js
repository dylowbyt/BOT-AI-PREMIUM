const axios = require("axios")

module.exports = {
  name: "cekip",
  alias: ["ipinfo", "whoisip", "traceiP"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    let ip = args[0]

    if (!ip) {
      try {
        const myIp = await axios.get("https://api.ipify.org?format=json", { timeout: 5000 })
        ip = myIp.data.ip
      } catch {
        return sock.sendMessage(from, { text: "⚠️ Masukkan IP:\n.cekip 8.8.8.8" })
      }
    }

    try {
      await sock.sendMessage(from, { text: "🌐 Mengecek informasi IP..." })

      const res = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 10000 })
      const d = res.data

      if (d.error) {
        return sock.sendMessage(from, { text: `❌ IP *${ip}* tidak valid atau tidak ditemukan.` })
      }

      await sock.sendMessage(from, {
        text: `🌐 *INFO IP ADDRESS*
━━━━━━━━━━━━━━━
🔢 IP: ${d.ip}
🌍 Negara: ${d.country_name} (${d.country})
🏙️ Kota: ${d.city || "N/A"}
📍 Region: ${d.region || "N/A"}
📮 Kode Pos: ${d.postal || "N/A"}
🗺️ Koordinat: ${d.latitude}, ${d.longitude}
🕐 Timezone: ${d.timezone || "N/A"}
🏢 ISP: ${d.org || "N/A"}
📡 ASN: ${d.asn || "N/A"}
🌐 Currency: ${d.currency_name || "N/A"} (${d.currency || "N/A"})`
      })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil info IP." })
    }
  }
}
