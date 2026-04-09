const axios = require("axios")

module.exports = {
  name: "jadwaltv",
  alias: ["tv", "acara", "jadwanTV"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const channel = args.join(" ")?.toLowerCase()

    const channels = {
      "trans7": "Trans7", "trans tv": "Trans TV", "rcti": "RCTI",
      "sctv": "SCTV", "mnctv": "MNCTV", "antv": "ANTV",
      "tvone": "TvOne", "metro tv": "Metro TV", "indosiar": "Indosiar",
      "net": "NET", "gtv": "GTV", "kompas tv": "Kompas TV"
    }

    if (!channel) {
      const list = Object.keys(channels).map(c => `• ${channels[c]}`).join("\n")
      return sock.sendMessage(from, {
        text: `📺 *JADWAL TV INDONESIA*\nContoh: .jadwaltv rcti\n.jadwaltv trans7\n\nChannel tersedia:\n${list}`
      })
    }

    const found = channels[channel]
    if (!found) return sock.sendMessage(from, { text: `❌ Channel *${channel}* tidak tersedia.` })

    try {
      await sock.sendMessage(from, { text: "📺 Mengambil jadwal TV..." })

      const res = await axios.get(
        `https://api.siputzx.my.id/api/jadwaltv?tv=${encodeURIComponent(found)}`,
        { timeout: 12000 }
      )

      const data = res.data?.data
      if (!data || !data.length) {
        return sock.sendMessage(from, { text: `❌ Jadwal *${found}* tidak tersedia saat ini.` })
      }

      let msg = `📺 *JADWAL ${found.toUpperCase()}*\n━━━━━━━━━━━━━━━\n`
      data.slice(0, 15).forEach(a => {
        msg += `⏰ ${a.jam || a.time || "N/A"} — ${a.judul || a.title || "N/A"}\n`
      })

      await sock.sendMessage(from, { text: msg })
    } catch {
      await sock.sendMessage(from, { text: `❌ Gagal mengambil jadwal *${found}*. Coba lagi nanti.` })
    }
  }
}
