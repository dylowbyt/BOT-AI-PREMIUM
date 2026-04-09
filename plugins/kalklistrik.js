module.exports = {
  name: "listrik",
  alias: ["kalklistrik", "taglistrik", "kwh", "biayalistrik"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    if (args.length < 2) {
      return sock.sendMessage(from, {
        text: `⚡ *KALKULATOR TAGIHAN LISTRIK*

Format: .listrik <daya_watt> <jam_per_hari> [hari]
Contoh:
.listrik 100 8          (lampu 100W, 8 jam/hari, 30 hari)
.listrik 450 24 30      (AC 450W, 24 jam/hari, 30 hari)
.listrik 1300 10 30     (kulkas 1300W)

Golongan Tarif:
.listrik tarif          (lihat tarif PLN)`
      })
    }

    if (args[0] === "tarif") {
      return sock.sendMessage(from, {
        text: `⚡ *TARIF LISTRIK PLN 2024*
━━━━━━━━━━━━━━━
🔌 900 VA (R1/M)  : Rp 1.352/kWh
🔌 1.300 VA (R1)  : Rp 1.444,70/kWh
🔌 2.200 VA (R1)  : Rp 1.444,70/kWh
🔌 3.500-5.500 VA : Rp 1.699,53/kWh
🔌 6.600+ VA      : Rp 1.699,53/kWh

⚠️ Tarif dapat berubah. Cek di PLN Mobile.`
      })
    }

    const daya = parseFloat(args[0])
    const jam = parseFloat(args[1])
    const hari = parseFloat(args[2]) || 30

    if (isNaN(daya) || isNaN(jam)) return sock.sendMessage(from, { text: "❌ Masukkan nilai yang valid." })

    const kwhPerHari = (daya * jam) / 1000
    const kwhPerBulan = kwhPerHari * hari

    const tarif1300 = 1444.70
    const biaya = kwhPerBulan * tarif1300
    const biayaPerHari = kwhPerHari * tarif1300

    await sock.sendMessage(from, {
      text: `⚡ *ESTIMASI TAGIHAN LISTRIK*
━━━━━━━━━━━━━━━
🔌 Daya: ${daya} Watt
⏱️ Penggunaan: ${jam} jam/hari
📅 Periode: ${hari} hari

📊 Konsumsi:
• Per hari: ${kwhPerHari.toFixed(3)} kWh
• Per bulan: ${kwhPerBulan.toFixed(3)} kWh

💰 Estimasi Biaya (1.300VA):
• Per hari: Rp ${Math.round(biayaPerHari).toLocaleString("id-ID")}
• Per bulan: Rp ${Math.round(biaya).toLocaleString("id-ID")}

⚠️ Belum termasuk biaya beban & pajak. Cek di PLN Mobile.`
    })
  }
}
