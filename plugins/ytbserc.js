const axios = require("axios")

// FIX: Tidak pakai yt-search yang mungkin tidak terinstall, pakai API langsung
async function searchYoutube(query) {
  const apis = [
    async () => {
      const r = await axios.get(
        `https://api.siputzx.my.id/api/s/youtube?q=${encodeURIComponent(query)}`,
        { timeout: 12000 }
      )
      return (r.data?.data || []).map(v => ({
        title: v.title,
        url: v.url || v.link,
        duration: v.duration || v.timestamp || "",
        views: v.views || v.viewCount || ""
      })).filter(v => v.url)
    },
    async () => {
      const r = await axios.get(
        `https://api.ryzendesu.vip/api/search/youtube?q=${encodeURIComponent(query)}`,
        { timeout: 12000 }
      )
      return (r.data?.data || r.data?.result || []).map(v => ({
        title: v.title,
        url: v.url || v.link,
        duration: v.duration || v.timestamp || "",
        views: v.views || ""
      })).filter(v => v.url)
    },
    async () => {
      const r = await axios.get(
        `https://api.betabotz.eu.org/api/search/youtube?q=${encodeURIComponent(query)}&apikey=beta`,
        { timeout: 12000 }
      )
      return (r.data?.result || r.data?.data || []).map(v => ({
        title: v.title,
        url: v.url || v.link,
        duration: v.duration || "",
        views: v.views || ""
      })).filter(v => v.url)
    },
    async () => {
      const r = await axios.get(
        `https://api.nexoracle.com/search/youtube?apikey=free&q=${encodeURIComponent(query)}`,
        { timeout: 12000 }
      )
      return (r.data?.result || []).map(v => ({
        title: v.title,
        url: v.url || v.link,
        duration: v.duration || "",
        views: v.views || ""
      })).filter(v => v.url)
    }
  ]

  for (const api of apis) {
    try {
      const results = await api()
      if (results?.length) return results.slice(0, 5)
    } catch {}
  }
  return []
}

module.exports = {
  name: "ytsearch",
  alias: ["yts", "ytbserch", "ytbsearch", "cariyt", "ytcari"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const q = args.join(" ")

    if (!q) {
      return sock.sendMessage(from, {
        text: `🔎 *YOUTUBE SEARCH*\n━━━━━━━━━━━━━━━\nFormat: .ytbserch <kata kunci>\n\nContoh:\n.ytbserch lagu pop indonesia 2024\n.ytbserch tutorial belajar python\n\n✅ Tampilkan 5 hasil teratas\n💡 Salin link lalu pakai .ytb <url> untuk download`
      })
    }

    try {
      await sock.sendMessage(from, { text: `🔎 Mencari di YouTube: *"${q}"*...` })

      const videos = await searchYoutube(q)

      if (!videos.length) {
        return sock.sendMessage(from, {
          text: `❌ Tidak ada hasil untuk: *"${q}"*\n\nCoba kata kunci yang berbeda.`
        })
      }

      let txt = `🎬 *HASIL PENCARIAN YOUTUBE*\n🔍 "${q}"\n━━━━━━━━━━━━━━━\n`
      txt += videos.map((v, i) => {
        const dur = v.duration ? `⏱️ ${v.duration}` : ""
        const views = v.views ? `👁️ ${v.views}` : ""
        const meta = [dur, views].filter(Boolean).join(" | ")
        return `\n*${i + 1}. ${v.title?.slice(0, 70)}*\n${meta ? meta + "\n" : ""}🔗 ${v.url}`
      }).join("\n")

      txt += "\n\n━━━━━━━━━━━━━━━"
      txt += "\n💡 Download: *.ytb <url>* untuk video"
      txt += "\n🎵 Audio: *.ytmp3 <url>* untuk MP3"

      await sock.sendMessage(from, { text: txt })

    } catch (err) {
      console.log("YTSEARCH ERROR:", err?.message)
      sock.sendMessage(from, { text: `❌ Gagal mencari video\n_${err?.message?.slice(0, 80)}_` })
    }
  }
}
