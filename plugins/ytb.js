const axios = require("axios")

module.exports = {
  name: "ytmp4",
  alias: ["ytvideo", "ytb", "video", "youtube", "yt4"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || ""
    // FIX: bersihkan prefix command dengan regex yang mencakup semua alias
    const url = args[0] || text.replace(/^\.(ytmp4|ytvideo|ytb|video|youtube|yt4)\s*/i, "").trim()

    if (!url || !url.includes("http")) {
      return sock.sendMessage(from, {
        text: `🎬 *YOUTUBE VIDEO DOWNLOADER*\n━━━━━━━━━━━━━━━\nFormat: .ytb <url youtube>\n\nContoh:\n.ytb https://youtu.be/xxxxx\n.ytb https://youtube.com/watch?v=xxxxx\n\n✅ Format MP4\n✅ Kualitas terbaik tersedia\n\n🎵 Untuk audio saja: .ytmp3 <url>`
      })
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Downloading video YouTube..." })

      let videoUrl = null

      // API 1: ryzendesu
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.url || r.data?.download || r.data?.link
        } catch {}
      }

      // API 2: siputzx
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.siputzx.my.id/api/dl/ytmp4?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.data?.url || r.data?.data?.download || r.data?.url
        } catch {}
      }

      // API 3: cobadeh
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.cobadeh.xyz/ytdl/mp4?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.download || r.data?.url || r.data?.link
        } catch {}
      }

      // API 4: betabotz
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.betabotz.eu.org/api/download/ytmp4?url=${encodeURIComponent(url)}&apikey=beta`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.result?.url || r.data?.result?.download
        } catch {}
      }

      // API 5: nexoracle
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.nexoracle.com/downloader/ytmp4?apikey=free&url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.result?.url || r.data?.result?.download
        } catch {}
      }

      // API 6: surabaya
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.surabaya.eu.org/api/dl/ytmp4?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.data?.url || r.data?.data?.download
        } catch {}
      }

      // API 7: agatz (tambahan)
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.agatz.xyz/api/ytmp4?url=${encodeURIComponent(url)}`,
            { timeout: 25000 }
          )
          videoUrl = r.data?.data?.url || r.data?.data?.download || r.data?.url
        } catch {}
      }

      if (!videoUrl) {
        return sock.sendMessage(from, {
          text: "❌ *Gagal download video YouTube*\n\nSemua server sedang down.\nCoba lagi beberapa menit kemudian 🙏\n\n💡 Atau coba: .ytmp3 <url> untuk audio saja"
        })
      }

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: "🎥 *YouTube Video* ✅"
      })

    } catch (err) {
      console.log("YTB ERROR:", err?.message)
      sock.sendMessage(from, { text: `❌ Error download video YouTube\n_${err?.message?.slice(0, 80)}_` })
    }
  }
}
