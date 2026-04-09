const axios = require("axios")

module.exports = {
  name: "get",
  alias: ["searchdl", "getfile", "dlfile"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.get config pubg\n.get mod apk minecraft"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🔎 Mencari link download..." })

      const candidates = await searchDownloadLinks(query)

      if (!candidates.length) {
        return sock.sendMessage(from, {
          text: `❌ Tidak ada link download ditemukan untuk:\n*${query}*\n\nCoba kata kunci lebih spesifik`
        })
      }

      await sock.sendMessage(from, {
        text: `✅ ${candidates.length} link ditemukan, mencoba download...`
      })

      for (let i = 0; i < candidates.length; i++) {
        const url = candidates[i]
        try {
          await sock.sendMessage(from, {
            text: `⏳ Mencoba (${i + 1}/${candidates.length})\n${url}`
          })

          const direct = await bypass(url)
          const ok = await download(sock, from, direct)

          if (ok) {
            await sock.sendMessage(from, { text: "✅ Berhasil download!" })
            return
          }
        } catch (e) {
          console.log("GET bypass error:", e?.message)
        }
      }

      // Semua gagal download → kirim daftar link saja
      const linkList = candidates.map((l, i) => `${i + 1}. ${l}`).join("\n")
      await sock.sendMessage(from, {
        text: `⚠️ Tidak bisa auto-download, ini linknya:\n\n${linkList}`
      })

    } catch (err) {
      console.log("GET ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal mencari link" })
    }
  }
}

// ================= SEARCH DOWNLOAD LINKS =================
async function searchDownloadLinks(query) {
  const q = query + " download mediafire OR drive.google.com OR mega.nz OR dropbox"
  const encoded = encodeURIComponent(q)

  const allowedSites = [
    "mediafire.com",
    "drive.google.com",
    "mega.nz",
    "1fichier.com",
    "dropbox.com",
    "linkvertise.com",
    "zippyshare.com",
    "gofile.io"
  ]

  let results = []

  // API 1: siputzx Google Search
  if (!results.length) {
    try {
      const res = await axios.get(
        `https://api.siputzx.my.id/api/s/google?q=${encoded}`,
        { timeout: 12000 }
      )
      const data = res.data?.data || []
      for (const item of data) {
        const link = item.url || item.link || item.href
        if (link && allowedSites.some(s => link.includes(s))) results.push(link)
      }
    } catch {}
  }

  // API 2: ryzendesu Google Search
  if (!results.length) {
    try {
      const res = await axios.get(
        `https://api.ryzendesu.vip/api/search/google?q=${encoded}`,
        { timeout: 12000 }
      )
      const data = res.data?.data || res.data?.result || []
      for (const item of data) {
        const link = item.url || item.link || item.href
        if (link && allowedSites.some(s => link.includes(s))) results.push(link)
      }
    } catch {}
  }

  // API 3: betabotz Google Search
  if (!results.length) {
    try {
      const res = await axios.get(
        `https://api.betabotz.eu.org/api/search/google?q=${encoded}&apikey=beta`,
        { timeout: 12000 }
      )
      const data = res.data?.result || res.data?.data || []
      for (const item of data) {
        const link = item.url || item.link || item.href
        if (link && allowedSites.some(s => link.includes(s))) results.push(link)
      }
    } catch {}
  }

  // API 4: agatz Google Search
  if (!results.length) {
    try {
      const res = await axios.get(
        `https://api.agatz.xyz/api/google?q=${encoded}`,
        { timeout: 12000 }
      )
      const data = res.data?.data || res.data?.result || []
      for (const item of data) {
        const link = item.url || item.link || item.href
        if (link && allowedSites.some(s => link.includes(s))) results.push(link)
      }
    } catch {}
  }

  // API 5: nexoracle Google Search
  if (!results.length) {
    try {
      const res = await axios.get(
        `https://api.nexoracle.com/search/google?apikey=free&q=${encoded}`,
        { timeout: 12000 }
      )
      const data = res.data?.result || res.data?.data || []
      for (const item of data) {
        const link = item.url || item.link || item.href
        if (link && allowedSites.some(s => link.includes(s))) results.push(link)
      }
    } catch {}
  }

  // API 6: Fallback scraping DuckDuckGo
  if (!results.length) {
    try {
      const res = await axios.get(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + " download")}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
            "Referer": "https://duckduckgo.com/"
          },
          timeout: 15000
        }
      )
      const html = res.data
      const rawLinks = [...(html.matchAll(/uddg=(https[^&"]+)/g) || [])]
        .map(v => { try { return decodeURIComponent(v[1]) } catch { return v[1] } })
      for (const link of rawLinks) {
        if (allowedSites.some(s => link.includes(s))) results.push(link)
      }
    } catch {}
  }

  return [...new Set(results)].slice(0, 5)
}

// ================= BYPASS =================
async function bypass(url) {
  // MediaFire
  if (url.includes("mediafire.com")) {
    try {
      const res = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        timeout: 10000
      })
      const match = res.data.match(/href="(https:\/\/download[^"]+mediafire[^"]+)"/)
      if (match) return match[1]
      const match2 = res.data.match(/aria-label="Download file"\s+href="([^"]+)"/)
      if (match2) return match2[1]
    } catch {}
  }

  // Google Drive
  if (url.includes("drive.google.com")) {
    const idMatch = url.match(/\/d\/(.*?)\/|id=([^&]+)/)
    const id = idMatch?.[1] || idMatch?.[2]
    if (id) return `https://drive.google.com/uc?export=download&id=${id}&confirm=t`
  }

  // Gofile
  if (url.includes("gofile.io")) {
    try {
      const id = url.split("/").pop()
      const res = await axios.get(
        `https://api.gofile.io/getContent?contentId=${id}&token=&cache=true`,
        { timeout: 10000 }
      )
      const files = Object.values(res.data?.data?.contents || {})
      if (files.length) return files[0].link
    } catch {}
  }

  return url
}

// ================= DOWNLOAD =================
async function download(sock, from, url) {
  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" },
      maxRedirects: 5,
      timeout: 60000
    })

    const buffer = Buffer.from(res.data)
    const type = res.headers["content-type"] || ""

    if (buffer.length < 100) return false
    if (type.includes("html") || type.includes("text")) return false

    if (type.includes("image")) {
      await sock.sendMessage(from, { image: buffer })
      return true
    }
    if (type.includes("video")) {
      await sock.sendMessage(from, { video: buffer })
      return true
    }
    if (type.includes("audio")) {
      await sock.sendMessage(from, { audio: buffer, mimetype: "audio/mpeg" })
      return true
    }

    const fileName = url.split("/").pop().split("?")[0] || "downloaded_file"
    await sock.sendMessage(from, {
      document: buffer,
      fileName,
      mimetype: type || "application/octet-stream"
    })
    return true

  } catch {
    return false
  }
}
