const axios = require("axios")

module.exports = {
  name: "kripto",
  alias: ["crypto", "coin", "bitcoin", "hargacoin"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const coin = args[0]?.toLowerCase() || "bitcoin"

    try {
      await sock.sendMessage(from, { text: "₿ Mengambil data kripto..." })

      if (!args[0]) {
        const res = await axios.get(
          "https://api.coingecko.com/api/v3/coins/markets?vs_currency=idr&order=market_cap_desc&per_page=10&page=1&sparkline=false",
          { timeout: 12000 }
        )
        const coins = res.data
        let msg = "₿ *TOP 10 KRIPTO (IDR)*\n━━━━━━━━━━━━━━━\n"
        coins.forEach((c, i) => {
          const change = c.price_change_percentage_24h?.toFixed(2)
          const arrow = change > 0 ? "📈" : "📉"
          msg += `${i + 1}. *${c.name}* (${c.symbol?.toUpperCase()})\n   💰 Rp ${c.current_price?.toLocaleString("id-ID")} ${arrow} ${change}%\n`
        })
        return sock.sendMessage(from, { text: msg })
      }

      const res = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${coin}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
        { timeout: 12000 }
      )
      const c = res.data
      const md = c.market_data
      const idr = md.current_price.idr
      const usd = md.current_price.usd
      const change24h = md.price_change_percentage_24h?.toFixed(2)
      const change7d = md.price_change_percentage_7d?.toFixed(2)

      await sock.sendMessage(from, {
        text: `₿ *${c.name} (${c.symbol?.toUpperCase()})*
━━━━━━━━━━━━━━━
💰 Harga IDR: Rp ${idr?.toLocaleString("id-ID")}
💵 Harga USD: $${usd?.toLocaleString("en-US")}
📈 24 jam: ${change24h > 0 ? "+" : ""}${change24h}%
📊 7 hari: ${change7d > 0 ? "+" : ""}${change7d}%
🏔️ ATH IDR: Rp ${md.ath.idr?.toLocaleString("id-ID")}
📦 Market Cap: Rp ${md.market_cap.idr?.toLocaleString("id-ID")}
🏅 Rank: #${c.market_cap_rank}`
      })
    } catch {
      await sock.sendMessage(from, { text: `❌ Gagal mengambil data *${coin}*. Pastikan nama koin benar (contoh: bitcoin, ethereum, solana)` })
    }
  }
}
