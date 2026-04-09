const axios = require("axios")

module.exports = {
  name: "holiday",
  alias: ["libur", "harilibur", "cekhari"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    try {
      await sock.sendMessage(from, { text: "📅 Mengambil data hari libur Indonesia..." })

      const tahun = args[0] || new Date().getFullYear()
      const res = await axios.get(
        `https://api-harilibur.vercel.app/api?month=0&year=${tahun}`,
        { timeout: 10000 }
      )

      const holidays = res.data
      if (!holidays || !holidays.length) {
        return sock.sendMessage(from, { text: `❌ Data hari libur tahun ${tahun} tidak ditemukan.` })
      }

      const now = new Date()
      const upcoming = holidays.filter(h => new Date(h.holiday_date) >= now).slice(0, 10)

      if (!upcoming.length) {
        return sock.sendMessage(from, { text: `📅 Tidak ada hari libur yang akan datang di tahun ${tahun}.` })
      }

      let msg = `📅 *HARI LIBUR NASIONAL ${tahun}*\n━━━━━━━━━━━━━━━\n`
      for (const h of upcoming) {
        const tanggal = new Date(h.holiday_date).toLocaleDateString("id-ID", {
          weekday: "long", day: "numeric", month: "long"
        })
        msg += `🗓️ ${tanggal}\n   📌 ${h.holiday_name}\n\n`
      }

      await sock.sendMessage(from, { text: msg.trim() })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil data hari libur." })
    }
  }
}
