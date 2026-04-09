const axios = require("axios")

module.exports = {
  name: "tsunamiinfo",
  alias: ["tsunami", "bahaya", "ancaman"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    try {
      await sock.sendMessage(from, { text: "⚠️ Mengambil data peringatan dini..." })

      const res = await axios.get(
        "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
        { timeout: 10000 }
      )

      const gempa = res.data?.Infogempa?.gempa

      if (!gempa) return sock.sendMessage(from, { text: "❌ Data tidak tersedia saat ini." })

      const mag = parseFloat(gempa.Magnitude)
      const potensi = gempa.Potensi || "Tidak ada"
      const isTsunami = potensi.toLowerCase().includes("tsunami")

      await sock.sendMessage(from, {
        text: `🌊 *PERINGATAN DINI TSUNAMI & GEMPA*
━━━━━━━━━━━━━━━
📊 Gempa Terakhir:
📍 Lokasi: ${gempa.Wilayah}
💪 Magnitudo: M${gempa.Magnitude}
📏 Kedalaman: ${gempa.Kedalaman}
📅 Waktu: ${gempa.Tanggal} ${gempa.Jam} WIB
🌐 Koordinat: ${gempa.Lintang}, ${gempa.Bujur}

${isTsunami ? "🚨 *BERPOTENSI TSUNAMI!*" : "✅ Tidak berpotensi tsunami"}
⚠️ Potensi: ${potensi}

📞 Darurat: 117 (BNPB)
📞 BMKG: 021-4246321
📱 App: InaRISK, BMKG Mobile`
      })
    } catch {
      await sock.sendMessage(from, {
        text: `⚠️ Info darurat tsunami:\n📞 BNPB: 117\n📞 BMKG: 021-4246321\n🌐 https://www.bmkg.go.id`
      })
    }
  }
}
