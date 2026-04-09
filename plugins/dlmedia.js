const axios = require("axios")

module.exports = {
  name: "ytmp3",
  alias: ["dl2", "musik", "dlmedia", "ytmp3"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""

    const url = args[0] || text.replace(/^\.(ytmp3|dl2|musik)\s*/i, "").trim()

    if (!url || !url.includes("http")) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.ytmp3 https://youtube.com/watch?v=xxxxx"
      })
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Downloading audio..." })

      let audioUrl = null

      // API 1: ryzendesu
      if (!audioUrl) {
        try {
          const r = await axios.get(
            `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          audioUrl = r.data?.url || r.data?.download || r.data?.link
        } catch {}
      }

      // API 2: siputzx
      if (!audioUrl) {
        try {
          const r = await axios.get(
            `https://api.siputzx.my.id/api/dl/ytmp3?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          audioUrl = r.data?.data?.url || r.data?.data?.download || r.data?.url
        } catch {}
      }

      // API 3: cobadeh
      if (!audioUrl) {
        try {
          const r = await axios.get(
            `https://api.cobadeh.xyz/ytdl/mp3?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          audioUrl = r.data?.download || r.data?.url || r.data?.link
        } catch {}
      }

      // API 4: betabotz
      if (!audioUrl) {
        try {
          const r = await axios.get(
            `https://api.betabotz.eu.org/api/download/ytmp3?url=${encodeURIComponent(url)}&apikey=beta`,
            { timeout: 25000 }
          )
          audioUrl = r.data?.result?.url || r.data?.result?.download
        } catch {}
      }

      // API 5: nexoracle
      if (!audioUrl) {
        try {
          const r = await axios.get(
            `https://api.nexoracle.com/downloader/ytmp3?apikey=free&url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          audioUrl = r.data?.result?.url || r.data?.result?.download
        } catch {}
      }

      // API 6: surabaya
      if (!audioUrl) {
        try {
          const r = await axios.get(
            `https://api.surabaya.eu.org/api/dl/ytmp3?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          audioUrl = r.data?.data?.url || r.data?.data?.download
        } catch {}
      }

      // API 7: loader.to
      if (!audioUrl) {
        try {
          const r = await axios.get(
            `https://loader.to/api/button/?url=${encodeURIComponent(url)}&f=mp3`,
            { timeout: 25000 }
          )
          audioUrl = r.data?.url
        } catch {}
      }

      if (!audioUrl) {
        return sock.sendMessage(from, {
          text: "❌ Gagal download audio\nSemua server sedang down, coba lagi nanti"
        })
      }

      await sock.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg"
      })

    } catch (err) {
      console.log("DLMEDIA ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Error download media" })
    }
  }
}
