const axios = require("axios")

module.exports = {
  name: "wiki",
  alias: ["wikipedia", "ensiklopedi", "cariinfo"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      return sock.sendMessage(from, {
        text: "📚 Contoh:\n.wiki Indonesia\n.wiki Albert Einstein\n.wiki fotosintesis"
      })
    }

    try {
      await sock.sendMessage(from, { text: "📚 Mencari di Wikipedia..." })

      const res = await axios.get(
        `https://id.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
        { timeout: 10000 }
      )

      const data = res.data
      if (!data?.extract) {
        const res2 = await axios.get(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`,
          { timeout: 10000 }
        )
        if (!res2.data?.extract) return sock.sendMessage(from, { text: `❌ Tidak ada artikel Wikipedia untuk *${query}*.` })

        return sock.sendMessage(from, {
          text: `📚 *${res2.data.title}*
━━━━━━━━━━━━━━━
${res2.data.extract?.slice(0, 1000)}...

🔗 https://en.wikipedia.org/wiki/${encodeURIComponent(res2.data.title)}`
        })
      }

      await sock.sendMessage(from, {
        text: `📚 *${data.title}*
━━━━━━━━━━━━━━━
${data.extract?.slice(0, 1000)}...

🔗 ${data.content_urls?.desktop?.page || `https://id.wikipedia.org/wiki/${encodeURIComponent(data.title)}`}`
      })
    } catch {
      await sock.sendMessage(from, { text: `❌ Artikel *${query}* tidak ditemukan di Wikipedia.` })
    }
  }
}
