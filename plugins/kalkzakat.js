module.exports = {
  name: "zakat",
  alias: ["kalkzakat", "hitungzakat", "zakatmaal"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sub = args[0]?.toLowerCase()

    if (!sub) {
      return sock.sendMessage(from, {
        text: `🌙 *KALKULATOR ZAKAT*

Perintah:
.zakat maal <total_harta>
   Contoh: .zakat maal 100000000

.zakat penghasilan <gaji_bulanan>
   Contoh: .zakat penghasilan 10000000

.zakat fitrah
   Info zakat fitrah

Nisab saat ini ≈ 85 gram emas × harga emas/gram`
      })
    }

    const hargaEmas = 1000000

    if (sub === "maal") {
      const harta = parseFloat(args[1])
      if (isNaN(harta)) return sock.sendMessage(from, { text: "❌ Masukkan jumlah harta dalam rupiah." })

      const nisab = 85 * hargaEmas
      const wajibZakat = harta >= nisab
      const zakatAmount = wajibZakat ? harta * 0.025 : 0

      return sock.sendMessage(from, {
        text: `🌙 *ZAKAT MAAL*
━━━━━━━━━━━━━━━
💰 Total Harta: Rp ${harta.toLocaleString("id-ID")}
📊 Nisab (85gr emas): Rp ${nisab.toLocaleString("id-ID")}
${wajibZakat ? "✅ Wajib Zakat" : "❌ Belum Wajib Zakat (harta < nisab)"}

${wajibZakat ? `💳 Zakat yang harus dibayar (2.5%):\nRp ${zakatAmount.toLocaleString("id-ID")}` : "Harta Anda belum mencapai nisab."}

⚠️ Ini estimasi. Konsultasikan dengan ulama/lembaga zakat.`
      })
    }

    if (sub === "penghasilan") {
      const gaji = parseFloat(args[1])
      if (isNaN(gaji)) return sock.sendMessage(from, { text: "❌ Masukkan jumlah gaji bulanan." })

      const nisabPerBulan = (520 * 2500) / 12
      const wajib = gaji >= nisabPerBulan
      const zakatBulanan = wajib ? gaji * 0.025 : 0
      const zakatTahunan = zakatBulanan * 12

      return sock.sendMessage(from, {
        text: `🌙 *ZAKAT PENGHASILAN*
━━━━━━━━━━━━━━━
💰 Gaji/Bulan: Rp ${gaji.toLocaleString("id-ID")}
📊 Nisab (520kg beras): ≈ Rp ${Math.round(nisabPerBulan).toLocaleString("id-ID")}/bulan
${wajib ? "✅ Wajib Zakat" : "❌ Belum Wajib Zakat"}

${wajib ? `💳 Zakat Bulanan (2.5%): Rp ${Math.round(zakatBulanan).toLocaleString("id-ID")}\n💳 Zakat Tahunan: Rp ${Math.round(zakatTahunan).toLocaleString("id-ID")}` : "Penghasilan belum mencapai nisab."}`
      })
    }

    if (sub === "fitrah") {
      return sock.sendMessage(from, {
        text: `🌙 *ZAKAT FITRAH*
━━━━━━━━━━━━━━━
📌 Zakat fitrah wajib atas setiap Muslim yang mampu
📅 Waktu: Sebelum sholat Idul Fitri

💰 Jumlah:
• 1 sha' = 2.5 kg beras
• Atau uang senilai 2.5 kg beras (± Rp 25.000-50.000/orang)

👨‍👩‍👧‍👦 Dihitung per jiwa dalam tanggungan

🏛️ Bayar melalui:
• BAZNAS
• Lembaga amil zakat terpercaya
• Langsung ke panitia masjid`
      })
    }

    await sock.sendMessage(from, { text: "❌ Sub-perintah tidak dikenal. Ketik .zakat untuk bantuan." })
  }
}
