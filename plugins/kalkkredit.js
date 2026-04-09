module.exports = {
  name: "kredit",
  alias: ["cicilan", "kpr", "angsuran", "kalkkredit"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    if (args.length < 3) {
      return sock.sendMessage(from, {
        text: `🏦 *KALKULATOR KREDIT/CICILAN*

Format: .kredit <pinjaman> <bunga%/tahun> <tenor_bulan>

Contoh:
.kredit 50000000 12 36   (Kredit 50jt, bunga 12%/thn, 36 bulan)
.kredit 300000000 7.5 240 (KPR 300jt, 7.5%/thn, 20 tahun)
.kredit 15000000 18 24   (Kredit motor)`
      })
    }

    const pokok = parseFloat(args[0])
    const bungaTahunan = parseFloat(args[1]) / 100
    const tenor = parseInt(args[2])

    if ([pokok, bungaTahunan, tenor].some(isNaN) || tenor <= 0) {
      return sock.sendMessage(from, { text: "❌ Nilai tidak valid." })
    }

    const bungaBulanan = bungaTahunan / 12

    let cicilan, totalBayar, totalBunga

    if (bungaBulanan === 0) {
      cicilan = pokok / tenor
    } else {
      cicilan = pokok * (bungaBulanan * Math.pow(1 + bungaBulanan, tenor)) / (Math.pow(1 + bungaBulanan, tenor) - 1)
    }

    totalBayar = cicilan * tenor
    totalBunga = totalBayar - pokok

    const tahun = Math.floor(tenor / 12)
    const bulan = tenor % 12

    await sock.sendMessage(from, {
      text: `🏦 *KALKULATOR KREDIT*
━━━━━━━━━━━━━━━
💰 Jumlah Pinjaman: Rp ${pokok.toLocaleString("id-ID")}
📊 Bunga: ${(bungaTahunan * 100).toFixed(2)}%/tahun
📅 Tenor: ${tenor} bulan${tahun > 0 ? ` (${tahun} tahun${bulan > 0 ? ` ${bulan} bulan` : ""})` : ""}

💳 *Cicilan/Bulan: Rp ${Math.ceil(cicilan).toLocaleString("id-ID")}*

📈 Total Bunga: Rp ${Math.round(totalBunga).toLocaleString("id-ID")}
💳 Total Bayar: Rp ${Math.round(totalBayar).toLocaleString("id-ID")}
📉 Beban Bunga: ${((totalBunga / pokok) * 100).toFixed(1)}% dari pinjaman

⚠️ Ini adalah estimasi. Hubungi bank untuk detail yang akurat.`
    })
  }
}
