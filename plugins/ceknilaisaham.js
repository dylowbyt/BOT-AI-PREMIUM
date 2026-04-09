const axios = require("axios")

module.exports = {
  name: "ihsg",
  alias: ["idx", "bursa", "bi"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    try {
      await sock.sendMessage(from, { text: "📈 Mengambil data pasar Indonesia..." })

      const res = await axios.get(
        "https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE?interval=1d&range=5d",
        {
          timeout: 12000,
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        }
      )

      const meta = res.data?.chart?.result?.[0]?.meta
      if (!meta) throw new Error("no data")

      const price = meta.regularMarketPrice
      const prevClose = meta.chartPreviousClose || meta.previousClose
      const change = price - prevClose
      const changePct = ((change / prevClose) * 100).toFixed(2)
      const arrow = change >= 0 ? "📈" : "📉"

      const kurs = await axios.get("https://open.er-api.com/v6/latest/USD", { timeout: 8000 })
      const idrRate = kurs.data?.rates?.IDR || 15000

      await sock.sendMessage(from, {
        text: `📈 *IHSG & PASAR INDONESIA*
━━━━━━━━━━━━━━━
📊 IHSG: ${price?.toLocaleString("id-ID")}
${arrow} Perubahan: ${change >= 0 ? "+" : ""}${change?.toFixed(2)} (${changePct}%)
⬆️ High: ${meta.regularMarketDayHigh?.toLocaleString("id-ID")}
⬇️ Low: ${meta.regularMarketDayLow?.toLocaleString("id-ID")}

💱 Kurs USD/IDR: Rp ${idrRate?.toLocaleString("id-ID")}

📅 ${new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })} WIB

💡 .saham <kode>.JK untuk saham spesifik`
      })
    } catch {
      await sock.sendMessage(from, {
        text: "❌ Gagal mengambil data IHSG. Cek di:\n📊 https://www.idx.co.id"
      })
    }
  }
}
