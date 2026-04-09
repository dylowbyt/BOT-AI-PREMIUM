module.exports = {
  name: "pajak",
  alias: ["hitungpajak", "pph", "ppn"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sub = args[0]?.toLowerCase()

    if (!sub) {
      return sock.sendMessage(from, {
        text: `💼 *KALKULATOR PAJAK*

Perintah:
.pajak pph21 <gaji_setahun> [TK/K0/K1/K2/K3]
   Contoh: .pajak pph21 120000000 TK
   Contoh: .pajak pph21 180000000 K1

.pajak ppn <harga>
   Contoh: .pajak ppn 1000000

.pajak umkm <omset_setahun>
   Contoh: .pajak umkm 500000000`
      })
    }

    if (sub === "ppn") {
      const harga = parseFloat(args[1])
      if (isNaN(harga)) return sock.sendMessage(from, { text: "❌ Masukkan harga." })
      const ppn = harga * 0.11
      return sock.sendMessage(from, {
        text: `🧾 *KALKULATOR PPN*
━━━━━━━━━━━━━━━
💰 Harga Dasar: Rp ${harga.toLocaleString("id-ID")}
📊 PPN 11%: Rp ${ppn.toLocaleString("id-ID")}
💳 Total: Rp ${(harga + ppn).toLocaleString("id-ID")}`
      })
    }

    if (sub === "umkm") {
      const omset = parseFloat(args[1])
      if (isNaN(omset)) return sock.sendMessage(from, { text: "❌ Masukkan omset tahunan." })
      if (omset <= 500000000) {
        return sock.sendMessage(from, {
          text: `🏪 *PAJAK UMKM (PP 23/2018)*
━━━━━━━━━━━━━━━
💰 Omset: Rp ${omset.toLocaleString("id-ID")}
📊 Tarif: 0.5% per bulan
💳 Pajak/bulan: Rp ${(omset / 12 * 0.005).toLocaleString("id-ID")}
💳 Pajak/tahun: Rp ${(omset * 0.005).toLocaleString("id-ID")}
✅ Omset < 4.8 Milyar → Tarif 0.5%`
        })
      } else {
        return sock.sendMessage(from, { text: "ℹ️ Omset > 4.8 Milyar, gunakan skema WP Badan biasa (PPh 22%)." })
      }
    }

    if (sub === "pph21") {
      const gajiSetahun = parseFloat(args[1])
      const statusStr = args[2]?.toUpperCase() || "TK"
      if (isNaN(gajiSetahun)) return sock.sendMessage(from, { text: "❌ Masukkan gaji setahun." })

      const ptkp = { TK: 54000000, K0: 58500000, K1: 63000000, K2: 67500000, K3: 72000000 }
      const biayaJabatan = Math.min(gajiSetahun * 0.05, 6000000)
      const penghasilanNeto = gajiSetahun - biayaJabatan
      const ptkpVal = ptkp[statusStr] || ptkp.TK
      const pkp = Math.max(0, penghasilanNeto - ptkpVal)

      let pajak = 0
      if (pkp <= 60000000) pajak = pkp * 0.05
      else if (pkp <= 250000000) pajak = 3000000 + (pkp - 60000000) * 0.15
      else if (pkp <= 500000000) pajak = 31500000 + (pkp - 250000000) * 0.25
      else if (pkp <= 5000000000) pajak = 94000000 + (pkp - 500000000) * 0.30
      else pajak = 1444000000 + (pkp - 5000000000) * 0.35

      return sock.sendMessage(from, {
        text: `💼 *PPh 21 PRIBADI*
━━━━━━━━━━━━━━━
💰 Gaji Setahun: Rp ${gajiSetahun.toLocaleString("id-ID")}
👨‍👩‍👧 Status: ${statusStr} (PTKP: Rp ${ptkpVal.toLocaleString("id-ID")})
📉 Biaya Jabatan: Rp ${biayaJabatan.toLocaleString("id-ID")}
📊 Penghasilan Kena Pajak: Rp ${pkp.toLocaleString("id-ID")}

💳 *PPh 21 Setahun: Rp ${Math.round(pajak).toLocaleString("id-ID")}*
💳 PPh 21/Bulan: Rp ${Math.round(pajak / 12).toLocaleString("id-ID")}`
      })
    }

    await sock.sendMessage(from, { text: "❌ Perintah tidak dikenal. Ketik .pajak untuk bantuan." })
  }
}
