const axios = require("axios")

module.exports = {
  name: "spotify",
  alias: ["spotifydl"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.spotify judul lagu\n.spotify https://open.spotify.com/track/xxxxx"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🎵 Mencari di Spotify..." })

      let audioUrl = null
      let title = query

      // API 1: fabdl
      if (!audioUrl) {
        try {
          const r1 = await axios.get(
            `https://api.fabdl.com/spotify/get?url=${encodeURIComponent(query)}`,
            { timeout: 15000 }
          )
          if (r1.data?.result) {
            title = r1.data.result.name || title
            const trackId = r1.data.result.id
            if (trackId) {
              const r2 = await axios.get(
                `https://api.fabdl.com/spotify/mp3-convert-task/${r1.data.result.gid}/${trackId}`,
                { timeout: 15000 }
              )
              audioUrl = r2.data?.result?.download_url
              if (audioUrl && !audioUrl.startsWith("http")) {
                audioUrl = `https://api.fabdl.com${audioUrl}`
              }
            }
          }
        } catch {}
      }

      // API 2: siputzx
      if (!audioUrl) {
        try {
          const r = await axios.get(
            `https://api.siputzx.my.id/api/dl/spotify?url=${encodeURIComponent(query)}`,
            { timeout: 15000 }
          )
          audioUrl = r.data?.data?.url || r.data?.data?.download
          title = r.data?.data?.title || title
        } catch {}
      }

      // API 3: ryzendesu
      if (!audioUrl) {
        try {
          const r = await axios.get(
            `https://api.ryzendesu.vip/api/downloader/spotify?url=${encodeURIComponent(query)}`,
            { timeout: 15000 }
          )
          audioUrl = r.data?.url || r.data?.download
          title = r.data?.title || title
        } catch {}
      }

      // API 4: betabotz
      if (!audioUrl) {
        try {
          const r = await axios.get(
            `https://api.betabotz.eu.org/api/download/spotify?url=${encodeURIComponent(query)}&apikey=beta`,
            { timeout: 15000 }
          )
          audioUrl = r.data?.result?.url || r.data?.result?.download
          title = r.data?.result?.title || title
        } catch {}
      }

      // API 5: nexoracle
      if (!audioUrl) {
        try {
          const r = await axios.get(
            `https://api.nexoracle.com/downloader/spotify?apikey=free&url=${encodeURIComponent(query)}`,
            { timeout: 15000 }
          )
          audioUrl = r.data?.result?.url || r.data?.result?.download
          title = r.data?.result?.title || title
        } catch {}
      }

      // API 6: surabaya
      if (!audioUrl) {
        try {
          const r = await axios.get(
            `https://api.surabaya.eu.org/api/dl/spotify?url=${encodeURIComponent(query)}`,
            { timeout: 15000 }
          )
          audioUrl = r.data?.data?.url || r.data?.data?.download
          title = r.data?.data?.title || title
        } catch {}
      }

      if (!audioUrl) {
        return sock.sendMessage(from, {
          text: "❌ Gagal download Spotify\nSemua server sedang down, coba lagi nanti"
        })
      }

      await sock.sendMessage(from, {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`
      })

    } catch (err) {
      console.log("SPOTIFY ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Error download Spotify" })
    }
  }
}
