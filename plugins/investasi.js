module.exports = {
  name: "investasi",
  alias: ["bunga", "compound", "ROI", "hitung investasi"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sub = args[0]?.toLowerCase()

    if (!sub) {
      return sock.sendMessage(from, {
        text: `💰 *KALKULATOR INVESTASI*

Pilih tipe:
.investasi bunga <modal> <bunga%> <tahun>
   Contoh: .investasi bunga 10000000 8 5

.investasi compound <modal> <bunga%> <tahun> [frekuensi/tahun]
   Contoh: .investasi compound 10000000 12 10 12

.investasi roi <modal> <keuntungan>
   Contoh: .investasi roi 5000000 7500000`
      })
    }

    if (sub === "bunga") {
      const modal = parseFloat(args[1])
      const bunga = parseFloat(args[2]) / 100
      const tahun = parseFloat(args[3])

      if ([modal, bunga, tahun].some(isNaN)) return sock.sendMessage(from, { text: "❌ Nilai tidak valid." })

      const total = modal * (1 + bunga * tahun)
      const profit = total - modal

      return sock.sendMessage(from, {
        text: `💰 *BUNGA SEDERHANA*
━━━━━━━━━━━━━━━
🏦 Modal Awal: Rp ${modal.toLocaleString("id-ID")}
📊 Bunga: ${(bunga * 100).toFixed(1)}%/tahun
📅 Jangka: ${tahun} tahun
✅ Total Akhir: Rp ${total.toLocaleString("id-ID")}
💵 Keuntungan: Rp ${profit.toLocaleString("id-ID")}`
      })
    }

    if (sub === "compound") {
      const modal = parseFloat(args[1])
      const rate = parseFloat(args[2]) / 100
      const tahun = parseFloat(args[3])
      const n = parseFloat(args[4]) || 1

      if ([modal, rate, tahun].some(isNaN)) return sock.sendMessage(from, { text: "❌ Nilai tidak valid." })

      const total = modal * Math.pow(1 + rate / n, n * tahun)
      const profit = total - modal

      let breakdown = `\n\n📈 Perkembangan:\n`
      for (let y = 1; y <= Math.min(tahun, 5); y++) {
        const val = modal * Math.pow(1 + rate / n, n * y)
        breakdown += `Tahun ${y}: Rp ${val.toLocaleString("id-ID", { maximumFractionDigits: 0 })}\n`
      }
      if (tahun > 5) breakdown += `...sampai tahun ${tahun}`

      return sock.sendMessage(from, {
        text: `💰 *BUNGA MAJEMUK*
━━━━━━━━━━━━━━━
🏦 Modal Awal: Rp ${modal.toLocaleString("id-ID")}
📊 Bunga: ${(rate * 100).toFixed(1)}%/tahun
🔄 Frekuensi: ${n}x/tahun
📅 Jangka: ${tahun} tahun
✅ Total Akhir: Rp ${total.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
💵 Keuntungan: Rp ${profit.toLocaleString("id-ID", { maximumFractionDigits: 0 })}${breakdown}`
      })
    }

    if (sub === "roi") {
      const modal = parseFloat(args[1])
      const hasil = parseFloat(args[2])
      if ([modal, hasil].some(isNaN)) return sock.sendMessage(from, { text: "❌ Nilai tidak valid." })
      const roi = ((hasil - modal) / modal * 100).toFixed(2)
      const profit = hasil - modal

      return sock.sendMessage(from, {
        text: `📊 *RETURN ON INVESTMENT (ROI)*
━━━━━━━━━━━━━━━
💸 Modal: Rp ${modal.toLocaleString("id-ID")}
💰 Hasil: Rp ${hasil.toLocaleString("id-ID")}
💵 Profit: Rp ${profit.toLocaleString("id-ID")}
📈 ROI: *${roi}%*

${roi > 0 ? "✅ Investasi menguntungkan!" : "❌ Investasi merugi."}`
      })
    }

    await sock.sendMessage(from, { text: "❌ Sub-perintah tidak dikenal. Ketik .investasi untuk bantuan." })
  }
}
