const axios = require("axios")

module.exports = {
  name: "berita",
  alias: ["news", "headline", "topik"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const topik = args.join(" ") || "indonesia"

    try {
      await sock.sendMessage(from, { text: "📰 Mengambil berita terbaru..." })

      const res = await axios.get(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent(topik)}&lang=id&country=id&max=5&apikey=f4e1b3b4c2d5f6a7b8c9d0e1f2a3b4c5`,
        { timeout: 10000 }
      )

      let articles = res.data?.articles || []

      if (!articles.length) {
        const fallback = await axios.get(
          `https://api.siputzx.my.id/api/berita?category=terbaru`,
          { timeout: 10000 }
        )
        articles = fallback.data?.data?.slice(0, 5) || []

        if (!articles.length) return sock.sendMessage(from, { text: "❌ Tidak ada berita ditemukan." })

        let msg = `📰 *BERITA TERBARU*\n━━━━━━━━━━━━━━━\n`
        articles.forEach((a, i) => {
          msg += `${i + 1}. *${a.title || a.judul}*\n📅 ${a.date || a.tanggal || "N/A"}\n🔗 ${a.link || a.url || ""}\n\n`
        })
        return sock.sendMessage(from, { text: msg.slice(0, 4096) })
      }

      let msg = `📰 *BERITA: ${topik.toUpperCase()}*\n━━━━━━━━━━━━━━━\n`
      articles.forEach((a, i) => {
        const date = new Date(a.publishedAt).toLocaleDateString("id-ID")
        msg += `${i + 1}. *${a.title}*\n   📅 ${date} | 🗞️ ${a.source?.name || "N/A"}\n   🔗 ${a.url}\n\n`
      })

      await sock.sendMessage(from, { text: msg.slice(0, 4096) })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil berita. Coba lagi nanti." })
    }
  }
}
