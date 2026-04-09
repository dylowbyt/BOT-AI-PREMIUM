const axios = require("axios")
const yts = require("yt-search")

module.exports = {
  name: "play",
  alias: ["lagu", "music"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""

    const query = args.length ? args.join(" ") : text.replace(/^\.(play|lagu|music)\s*/i, "").trim()

    if (!query) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.play judul lagu"
      })
    }

    let search, video
    try {
      search = await yts(query)
      video = search.videos[0]
    } catch (e) {
      console.log("YTS ERROR:", e.message)
    }

    if (!video) {
      return sock.sendMessage(from, {
        text: "❌ Lagu tidak ditemukan"
      })
    }

    await sock.sendMessage(from, {
      text: `🎵 Ditemukan:\n*${video.title}*\n⏳ Downloading...`
    })

    const ytUrl = `https://www.youtube.com/watch?v=${video.videoId}`
    let audioUrl = null

    // API 1: ryzendesu
    if (!audioUrl) {
      try {
        const r = await axios.get(
          `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(ytUrl)}`,
          { timeout: 25000 }
        )
        audioUrl = r.data?.url || r.data?.download || r.data?.link
      } catch {}
    }

    // API 2: siputzx
    if (!audioUrl) {
      try {
        const r = await axios.get(
          `https://api.siputzx.my.id/api/dl/ytmp3?url=${encodeURIComponent(ytUrl)}`,
          { timeout: 25000 }
        )
        audioUrl = r.data?.data?.url || r.data?.data?.download || r.data?.url
      } catch {}
    }

    // API 3: cobadeh
    if (!audioUrl) {
      try {
        const r = await axios.get(
          `https://api.cobadeh.xyz/ytdl/mp3?url=${encodeURIComponent(ytUrl)}`,
          { timeout: 25000 }
        )
        audioUrl = r.data?.download || r.data?.url || r.data?.link
      } catch {}
    }

    // API 4: betabotz
    if (!audioUrl) {
      try {
        const r = await axios.get(
          `https://api.betabotz.eu.org/api/download/ytmp3?url=${encodeURIComponent(ytUrl)}&apikey=beta`,
          { timeout: 25000 }
        )
        audioUrl = r.data?.result?.url || r.data?.result?.download
      } catch {}
    }

    // API 5: nexoracle
    if (!audioUrl) {
      try {
        const r = await axios.get(
          `https://api.nexoracle.com/downloader/ytmp3?apikey=free&url=${encodeURIComponent(ytUrl)}`,
          { timeout: 25000 }
        )
        audioUrl = r.data?.result?.url || r.data?.result?.download
      } catch {}
    }

    // API 6: surabaya
    if (!audioUrl) {
      try {
        const r = await axios.get(
          `https://api.surabaya.eu.org/api/dl/ytmp3?url=${encodeURIComponent(ytUrl)}`,
          { timeout: 25000 }
        )
        audioUrl = r.data?.data?.url || r.data?.data?.download
      } catch {}
    }

    // API 7: loader.to
    if (!audioUrl) {
      try {
        const r = await axios.get(
          `https://loader.to/api/button/?url=${encodeURIComponent(ytUrl)}&f=mp3`,
          { timeout: 25000 }
        )
        audioUrl = r.data?.url
      } catch {}
    }

    if (!audioUrl) {
      return sock.sendMessage(from, {
        text: `❌ Gagal download: *${video.title}*\nSemua server sedang down, coba lagi nanti`
      })
    }

    try {
      await sock.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: video.title + ".mp3"
      })
    } catch (err) {
      console.log("PLAY SEND ERROR:", err.message)
      await sock.sendMessage(from, {
        text: `❌ Gagal kirim audio\n${err.message}`
      })
    }
  }
}
