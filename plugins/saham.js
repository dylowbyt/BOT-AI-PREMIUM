const axios = require("axios")

module.exports = {
  name: "saham",
  alias: ["stock", "hargasaham", "ihsg"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const ticker = args[0]?.toUpperCase()

    if (!ticker) {
      return sock.sendMessage(from, {
        text: `📈 *CEK HARGA SAHAM*

Format: .saham <kode_saham>
Contoh:
.saham BBCA    (Bank BCA)
.saham BBRI    (Bank BRI)
.saham TLKM    (Telkom)
.saham AAPL    (Apple)
.saham GOOGL   (Google)
.saham TSLA    (Tesla)

Tambahkan .JK untuk saham IDX:
.saham BBCA.JK`
      })
    }

    try {
      await sock.sendMessage(from, { text: "📊 Mengambil data saham..." })

      const query = ticker.includes(".") ? ticker : ticker
      const res = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${query}?interval=1d&range=5d`,
        {
          timeout: 12000,
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        }
      )

      const result = res.data?.chart?.result?.[0]
      if (!result) return sock.sendMessage(from, { text: `❌ Data saham *${ticker}* tidak ditemukan.` })

      const meta = result.meta
      const price = meta.regularMarketPrice
      const prevClose = meta.chartPreviousClose || meta.previousClose
      const change = price - prevClose
      const changePct = ((change / prevClose) * 100).toFixed(2)
      const currency = meta.currency || "USD"
      const arrow = change >= 0 ? "📈" : "📉"

      await sock.sendMessage(from, {
        text: `📈 *${meta.longName || ticker}*
━━━━━━━━━━━━━━━
💰 Harga: ${currency} ${price?.toLocaleString("id-ID")}
${arrow} Perubahan: ${change >= 0 ? "+" : ""}${change?.toFixed(2)} (${changePct}%)
📊 Open: ${meta.regularMarketOpen?.toLocaleString("id-ID")}
⬆️ High: ${meta.regularMarketDayHigh?.toLocaleString("id-ID")}
⬇️ Low: ${meta.regularMarketDayLow?.toLocaleString("id-ID")}
📉 Prev Close: ${prevClose?.toLocaleString("id-ID")}
🏛️ Exchange: ${meta.exchangeName || "N/A"}`
      })
    } catch {
      await sock.sendMessage(from, {
        text: `❌ Gagal mengambil data saham *${ticker}*.\nPastikan kode saham benar. Contoh: BBCA.JK, AAPL, GOOGL`
      })
    }
  }
}
