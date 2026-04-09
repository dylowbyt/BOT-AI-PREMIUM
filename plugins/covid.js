const axios = require("axios")

module.exports = {
  name: "covid",
  alias: ["corona", "covidinfo", "covid19"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const negara = args.join(" ")

    try {
      await sock.sendMessage(from, { text: "🦠 Mengambil data COVID-19..." })

      if (!negara || negara.toLowerCase() === "indonesia" || negara.toLowerCase() === "dunia" || !negara) {
        const res = await axios.get("https://disease.sh/v3/covid-19/countries/indonesia", { timeout: 10000 })
        const d = res.data

        const world = await axios.get("https://disease.sh/v3/covid-19/all", { timeout: 10000 })
        const w = world.data

        await sock.sendMessage(from, {
          text: `🦠 *DATA COVID-19*
━━━━━━━━━━━━━━━
🇮🇩 *INDONESIA*
📊 Kasus: ${d.cases?.toLocaleString("id-ID")}
✅ Sembuh: ${d.recovered?.toLocaleString("id-ID")}
💀 Meninggal: ${d.deaths?.toLocaleString("id-ID")}
🏥 Aktif: ${d.active?.toLocaleString("id-ID")}

🌍 *GLOBAL*
📊 Kasus: ${w.cases?.toLocaleString("id-ID")}
✅ Sembuh: ${w.recovered?.toLocaleString("id-ID")}
💀 Meninggal: ${w.deaths?.toLocaleString("id-ID")}

📅 Update: ${new Date(d.updated).toLocaleString("id-ID")}`
        })
      } else {
        const res = await axios.get(
          `https://disease.sh/v3/covid-19/countries/${encodeURIComponent(negara)}`,
          { timeout: 10000 }
        )
        const d = res.data

        await sock.sendMessage(from, {
          text: `🦠 *COVID-19: ${d.country}*
━━━━━━━━━━━━━━━
📊 Total Kasus: ${d.cases?.toLocaleString("id-ID")}
🆕 Kasus Baru: ${d.todayCases?.toLocaleString("id-ID")}
✅ Sembuh: ${d.recovered?.toLocaleString("id-ID")}
💀 Meninggal: ${d.deaths?.toLocaleString("id-ID")}
🏥 Aktif: ${d.active?.toLocaleString("id-ID")}
🧪 Per 1jt: ${d.casesPerOneMillion?.toLocaleString("id-ID")}

📅 Update: ${new Date(d.updated).toLocaleString("id-ID")}`
        })
      }
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil data COVID-19." })
    }
  }
}
