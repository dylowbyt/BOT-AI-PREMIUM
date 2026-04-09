const axios = require("axios")

module.exports = {
  name: "qc",

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const text = args.join(" ")

    if (!text) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.qc Hidup itu indah kalau kamu bahagia"
      })
    }

    try {
      const safeText = text.slice(0, 200)
      let sent = false

      // API 1: popcat.xyz
      try {
        const url = `https://api.popcat.xyz/quote?text=${encodeURIComponent(safeText)}`
        const res = await axios.get(url, {
          responseType: "arraybuffer",
          timeout: 15000
        })
        if (res.data && res.data.byteLength > 1000) {
          await sock.sendMessage(from, {
            image: Buffer.from(res.data),
            caption: `📝 *${safeText}*`
          })
          sent = true
        }
      } catch {}

      // API 2: buat quote gambar dari teks saja (fallback)
      if (!sent) {
        try {
          const quoteUrl = `https://api.lolhuman.xyz/api/quotely?apikey=null&text=${encodeURIComponent(safeText)}&author=Bot`
          const res2 = await axios.get(quoteUrl, {
            responseType: "arraybuffer",
            timeout: 15000
          })
          if (res2.data && res2.data.byteLength > 1000) {
            await sock.sendMessage(from, {
              image: Buffer.from(res2.data),
              caption: `📝 *${safeText}*`
            })
            sent = true
          }
        } catch {}
      }

      // Fallback: kirim sebagai teks biasa
      if (!sent) {
        await sock.sendMessage(from, {
          text: `📝 *Quote:*\n\n_"${safeText}"_\n\n— Bot`
        })
      }

    } catch (err) {
      console.log("QC ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal buat quote, coba lagi nanti" })
    }
  }
}
