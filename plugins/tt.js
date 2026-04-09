const axios = require("axios")

module.exports = {
  name: "tt",
  alias: ["tiktok", "tiktokdl", "ttdl"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const text = m.message?.conversation || m.message?.extendedTextMessage?.text || ""
    // FIX: Ambil URL dari args atau dari teks langsung, bersihkan prefix command
    const url = (args[0] || text.replace(/^\.(tt|tiktok|tiktokdl|ttdl)\s*/i, "").trim())

    if (!url || (!url.includes("tiktok") && !url.includes("vt.tt") && !url.includes("vm.tiktok"))) {
      return sock.sendMessage(from, {
        text: `📱 *TIKTOK DOWNLOADER*\n━━━━━━━━━━━━━━━\nFormat: .tt <link tiktok>\n\nContoh:\n.tt https://vt.tiktok.com/xxxxx\n.tt https://www.tiktok.com/@user/video/123\n\n✅ Video tanpa watermark\n✅ Audio MP3 tersedia`
      })
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Mendownload TikTok..." })

      let videoUrl = null
      let audioUrl = null
      let title = ""

      // API 1: tikwm.com — paling stabil
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://tikwm.com/api/?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.data?.play || r.data?.data?.wmplay
          audioUrl = r.data?.data?.music || null
          title = r.data?.data?.title || ""
        } catch {}
      }

      // API 2: tiklydown
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.video?.noWatermark || r.data?.video?.url || r.data?.url
          title = r.data?.title || ""
        } catch {}
      }

      // API 3: siputzx
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.siputzx.my.id/api/dl/tiktok?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.data?.play || r.data?.data?.wmplay
        } catch {}
      }

      // API 4: ryzendesu
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.ryzendesu.vip/api/downloader/ttdl?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.data?.play || r.data?.data?.video
        } catch {}
      }

      // API 5: betabotz
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.betabotz.eu.org/api/download/tiktok?url=${encodeURIComponent(url)}&apikey=beta`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.result?.play || r.data?.result?.url
        } catch {}
      }

      // API 6: nexoracle
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.nexoracle.com/downloader/tiktok?apikey=free&url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.result?.play || r.data?.result?.url
        } catch {}
      }

      // API 7: surabaya
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.surabaya.eu.org/api/dl/tiktok?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.data?.play || r.data?.data?.url
        } catch {}
      }

      // API 8: agatz (tambahan)
      if (!videoUrl) {
        try {
          const r = await axios.get(
            `https://api.agatz.xyz/api/tiktok?url=${encodeURIComponent(url)}`,
            { timeout: 15000 }
          )
          videoUrl = r.data?.data?.video || r.data?.data?.play
        } catch {}
      }

      if (!videoUrl) {
        return sock.sendMessage(from, {
          text: "❌ *Gagal download TikTok*\n\nSemua server sedang down.\n\nCoba lagi beberapa menit kemudian 🙏"
        })
      }

      const caption = title
        ? `✅ *TikTok Download*\n📝 ${title.slice(0, 100)}`
        : "✅ *TikTok Download* — Tanpa Watermark"

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption
      })

    } catch (err) {
      console.log("TT ERROR:", err?.message)
      sock.sendMessage(from, { text: `❌ Error download TikTok\n_${err?.message?.slice(0, 80)}_` })
    }
  }
}
