const axios = require("axios")

module.exports = {
  name: "pinterest",
  alias: ["pin"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.pin anime\n.pin aesthetic sunset"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🔎 Mencari gambar..." })

      let imageUrl = null

      // API 1: siputzx
      try {
        const res = await axios.get(
          `https://api.siputzx.my.id/api/s/pinterest?q=${encodeURIComponent(query)}`,
          { timeout: 10000 }
        )
        const data = res.data?.data || []
        if (Array.isArray(data) && data.length) {
          const pick = data[Math.floor(Math.random() * data.length)]
          imageUrl = typeof pick === "string" ? pick : pick?.url || pick?.image || pick?.images?.orig?.url
        }
      } catch {}

      // API 2: ryzendesu
      if (!imageUrl) {
        try {
          const res2 = await axios.get(
            `https://api.ryzendesu.vip/api/search/pinterest?query=${encodeURIComponent(query)}`,
            { timeout: 10000 }
          )
          const data = res2.data?.data || res2.data?.results || []
          const arr = Array.isArray(data) ? data : []
          if (arr.length) {
            const pick = arr[Math.floor(Math.random() * arr.length)]
            imageUrl = typeof pick === "string" ? pick : pick?.url || pick?.image
          }
        } catch {}
      }

      // API 3: pinterest-api vercel
      if (!imageUrl) {
        try {
          const res3 = await axios.get(
            `https://pinterest-api-one.vercel.app/?q=${encodeURIComponent(query)}`,
            { timeout: 10000 }
          )
          const results = Array.isArray(res3.data) ? res3.data : []
          if (results.length) {
            imageUrl = results[Math.floor(Math.random() * results.length)]
          }
        } catch {}
      }

      if (!imageUrl) {
        return sock.sendMessage(from, {
          text: `❌ Tidak ada gambar ditemukan untuk: *${query}*\nCoba keyword lain`
        })
      }

      await sock.sendMessage(from, {
        image: { url: imageUrl },
        caption: `📌 Pinterest: *${query}*`
      })

    } catch (err) {
      console.log("PINTEREST ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal ambil gambar Pinterest" })
    }
  }
}
