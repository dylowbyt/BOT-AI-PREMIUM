const axios = require("axios")

module.exports = {
  name: "emas",
  alias: ["hargaemas", "gold", "goldprice"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    try {
      await sock.sendMessage(from, { text: "🥇 Mengambil harga emas..." })

      const res = await axios.get(
        "https://open.er-api.com/v6/latest/XAU",
        { timeout: 10000 }
      )

      if (!res.data?.rates) throw new Error("no data")

      const idrPerOz = res.data.rates.IDR
      const usdPerOz = res.data.rates.USD
      const eurPerOz = res.data.rates.EUR

      const gramPerOz = 31.1035
      const idrPerGram = idrPerOz / gramPerOz
      const usdPerGram = usdPerOz / gramPerOz

      const karats = [24, 22, 21, 18, 14, 10]
      let karatTable = ""
      karats.forEach(k => {
        const purity = k / 24
        const priceGram = idrPerGram * purity
        karatTable += `• Emas ${k}K: Rp ${Math.round(priceGram).toLocaleString("id-ID")}/gram\n`
      })

      await sock.sendMessage(from, {
        text: `🥇 *HARGA EMAS HARI INI*
━━━━━━━━━━━━━━━
📊 Harga Spot (Emas 24K):
💰 Rp ${Math.round(idrPerGram).toLocaleString("id-ID")}/gram
💵 $${usdPerGram.toFixed(2)}/gram

📈 Per Troy Ounce:
• IDR: Rp ${Math.round(idrPerOz).toLocaleString("id-ID")}
• USD: $${Math.round(usdPerOz).toLocaleString("en-US")}
• EUR: €${Math.round(eurPerOz).toLocaleString("en-US")}

💍 Estimasi Harga per Gram:
${karatTable}
📅 Update: ${new Date().toLocaleString("id-ID")}
⚠️ Harga dapat berbeda di toko fisik.`
      })
    } catch {
      await sock.sendMessage(from, {
        text: "❌ Gagal mengambil harga emas. Coba lagi nanti."
      })
    }
  }
}
