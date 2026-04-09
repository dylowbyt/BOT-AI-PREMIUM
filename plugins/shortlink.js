const axios = require("axios")

module.exports = {
  name: "shortlink",
  alias: ["short", "persingkat", "tinyurl"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const url = args[0]

    if (!url || !url.startsWith("http")) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.shortlink https://google.com/search?q=bot+whatsapp"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🔗 Mempersingkat URL..." })

      const res = await axios.get(
        `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
        { timeout: 10000 }
      )

      const shortUrl = res.data

      await sock.sendMessage(from, {
        text: `🔗 *URL DIPERSINGKAT*
━━━━━━━━━━━━━━━
📎 Asli: ${url.length > 60 ? url.slice(0, 60) + "..." : url}
✅ Short: *${shortUrl}*`
      })
    } catch {
      try {
        const res2 = await axios.get(
          `https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(url)}`,
          { timeout: 10000 }
        )
        const data = res2.data?.result
        await sock.sendMessage(from, {
          text: `🔗 *URL DIPERSINGKAT*\n━━━━━━━━━━━━━━━\n✅ Short: *${data?.full_short_link}*`
        })
      } catch {
        await sock.sendMessage(from, { text: "❌ Gagal mempersingkat URL." })
      }
    }
  }
}
