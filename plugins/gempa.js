const axios = require("axios")
const { addTarget, removeTarget, getTargets } = require("../ai/gempaAlert")

module.exports = {
  name: "gempa",
  alias: ["earthquake", "bmkg"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sub = args[0]?.toLowerCase()

    // ===== .gempa on — subscribe alert =====
    if (sub === "on") {
      addTarget(from)
      return sock.sendMessage(from, {
        text: `✅ *Alert gempa AKTIF!*\n\nChat ini akan otomatis dapat notifikasi kalau ada gempa M${4.0}+ di Indonesia.\n\nKetik *.gempa off* untuk berhenti.`
      })
    }

    // ===== .gempa off — unsubscribe =====
    if (sub === "off") {
      removeTarget(from)
      return sock.sendMessage(from, {
        text: "🔕 Alert gempa dimatikan untuk chat ini."
      })
    }

    // ===== .gempa info — cek status =====
    if (sub === "info") {
      const targets = getTargets()
      const aktif = targets.includes(from)
      return sock.sendMessage(from, {
        text: `📊 *Status Alert Gempa:*\n\n${aktif ? "✅ Aktif di chat ini" : "❌ Tidak aktif di chat ini"}\n\nTotal chat terdaftar: ${targets.length}\n\nKetik *.gempa on* untuk aktifkan.`
      })
    }

    // ===== .gempa — cek gempa terbaru =====
    try {
      await sock.sendMessage(from, { text: "🌍 Mengambil data gempa terbaru..." })

      const res = await axios.get(
        "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
        { timeout: 10000 }
      )

      const gempa = res.data?.Infogempa?.gempa

      if (!gempa) {
        return sock.sendMessage(from, { text: "❌ Gagal ambil data gempa dari BMKG" })
      }

      const adaTsunami = (gempa.Potensi || "").toLowerCase().includes("tsunami")

      let pesan = `🌍 *GEMPA TERKINI — BMKG*\n`
      pesan += `━━━━━━━━━━━━━━━━━━\n`
      pesan += `📍 *Wilayah:* ${gempa.Wilayah}\n`
      pesan += `💥 *Magnitudo:* M${gempa.Magnitude}\n`
      pesan += `🕐 *Waktu:* ${gempa.Tanggal} ${gempa.Jam} WIB\n`
      pesan += `🌊 *Kedalaman:* ${gempa.Kedalaman}\n`
      pesan += `🗺️ *Koordinat:* ${gempa.Lintang}, ${gempa.Bujur}\n`
      pesan += `━━━━━━━━━━━━━━━━━━\n`
      pesan += `⚠️ *Potensi:* ${adaTsunami ? "⛔ ADA POTENSI TSUNAMI" : gempa.Potensi || "Tidak berpotensi tsunami"}\n`
      pesan += `\n_Sumber: BMKG Indonesia_\n`
      pesan += `\n_Ketik *.gempa on* untuk aktifkan notifikasi otomatis_`

      await sock.sendMessage(from, { text: pesan })

    } catch (err) {
      console.log("GEMPA ERROR:", err.message)
      sock.sendMessage(from, { text: "❌ Gagal ambil data gempa" })
    }
  }
}
