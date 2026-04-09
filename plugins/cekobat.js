const axios = require("axios")

module.exports = {
  name: "obat",
  alias: ["cekobat", "infoobat", "drug"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const nama = args.join(" ")

    if (!nama) {
      return sock.sendMessage(from, {
        text: "💊 Contoh:\n.obat paracetamol\n.obat amoxicillin\n.obat aspirin"
      })
    }

    try {
      await sock.sendMessage(from, { text: "💊 Mencari info obat..." })

      const res = await axios.get(
        `https://api.fda.gov/drug/label.json?search=openfda.brand_name:${encodeURIComponent(nama)}&limit=1`,
        { timeout: 12000 }
      )

      const d = res.data?.results?.[0]
      if (!d) {
        return sock.sendMessage(from, {
          text: `💊 Info untuk *${nama}*:\n⚠️ Data dari database FDA tidak ditemukan.\n\n🔍 Cari di:\nhttps://www.drugs.com/${nama.replace(/\s/g, "-").toLowerCase()}.html`
        })
      }

      const purpose = d.purpose?.[0]?.slice(0, 200) || "N/A"
      const warnings = d.warnings?.[0]?.slice(0, 300) || "N/A"
      const directions = d.dosage_and_administration?.[0]?.slice(0, 300) || d.directions?.[0]?.slice(0, 300) || "Konsultasikan dengan dokter/apoteker."
      const brandName = d.openfda?.brand_name?.[0] || nama

      await sock.sendMessage(from, {
        text: `💊 *INFO OBAT: ${brandName.toUpperCase()}*
━━━━━━━━━━━━━━━
🏷️ Nama Generik: ${d.openfda?.generic_name?.[0] || "N/A"}
🏭 Produsen: ${d.openfda?.manufacturer_name?.[0] || "N/A"}

🎯 Kegunaan: ${purpose}

💉 Aturan Pakai: ${directions}

⚠️ Peringatan: ${warnings}

🔴 PENTING: Selalu konsultasikan penggunaan obat dengan dokter atau apoteker!`
      })
    } catch {
      await sock.sendMessage(from, {
        text: `💊 Info obat *${nama}*:\n\n🔍 Cari di:\n• https://www.drugs.com/search.php?searchterm=${encodeURIComponent(nama)}\n• https://www.alodokter.com/?s=${encodeURIComponent(nama)}\n\n⚠️ Selalu konsultasikan dengan dokter!`
      })
    }
  }
}
