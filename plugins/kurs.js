const axios = require("axios")

module.exports = {
  name: "kurs",
  alias: ["valas", "forex", "currency"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    if (!args[0]) {
      try {
        await sock.sendMessage(from, { text: "💱 Mengambil kurs hari ini..." })
        const res = await axios.get(
          "https://open.er-api.com/v6/latest/IDR",
          { timeout: 10000 }
        )
        const rates = res.data.rates
        const targetCurrencies = ["USD", "SGD", "MYR", "JPY", "EUR", "GBP", "AUD", "CNY", "SAR", "KRW"]
        let msg = `💱 *KURS RUPIAH HARI INI*\n━━━━━━━━━━━━━━━\n`
        for (const cur of targetCurrencies) {
          if (rates[cur]) {
            const rate = (1 / rates[cur]).toFixed(0)
            msg += `• 1 ${cur} = Rp ${Number(rate).toLocaleString("id-ID")}\n`
          }
        }
        msg += `\n📅 Update: ${new Date(res.data.time_last_update_utc).toLocaleString("id-ID")}`
        return sock.sendMessage(from, { text: msg })
      } catch {
        return sock.sendMessage(from, { text: "❌ Gagal mengambil data kurs." })
      }
    }

    const amount = parseFloat(args[0]) || 1
    const from_cur = args[1]?.toUpperCase() || "USD"
    const to_cur = args[2]?.toUpperCase() || "IDR"

    try {
      await sock.sendMessage(from, { text: "💱 Mengkonversi..." })
      const res = await axios.get(
        `https://open.er-api.com/v6/latest/${from_cur}`,
        { timeout: 10000 }
      )
      const rate = res.data.rates[to_cur]
      if (!rate) return sock.sendMessage(from, { text: `❌ Kode mata uang tidak valid: ${to_cur}` })

      const result = (amount * rate).toFixed(2)
      await sock.sendMessage(from, {
        text: `💱 *KONVERSI MATA UANG*\n━━━━━━━━━━━━━━━\n💵 ${amount} ${from_cur}\n🟰\n💰 ${Number(result).toLocaleString("id-ID")} ${to_cur}`
      })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal konversi. Pastikan kode mata uang benar (contoh: USD, IDR, EUR)" })
    }
  }
}
