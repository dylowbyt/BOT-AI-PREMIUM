const axios = require("axios")
const fs = require("fs")
const path = require("path")

const RAPIDAPI_KEY = "c0c4506840msh0c2e5468f11345ep10d8c0jsnb3a976a9c6f0"

// FIX: Pakai file-based storage agar tidak reset saat module di-reload
const RESULTS_FILE = path.join(__dirname, "../gsearch-results.json")

function loadResults() {
  try { if (fs.existsSync(RESULTS_FILE)) return JSON.parse(fs.readFileSync(RESULTS_FILE, "utf-8")) } catch {}
  return {}
}
function saveResults(data) {
  try { fs.writeFileSync(RESULTS_FILE, JSON.stringify(data, null, 2), "utf-8") } catch {}
}

module.exports = {
  name: "gsearch",
  alias: ["gs", "cari", "search", "googling", "google"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    if (!args.length) {
      return sock.sendMessage(from, {
        text: `🔍 *GOOGLE SEARCH + AUTO DOWNLOAD*\n━━━━━━━━━━━━━━━\nFormat: .gsearch <kata kunci>\n\nContoh:\n• .gsearch download lagu Ed Sheeran mp3\n• .gsearch download film Avengers mkv\n• .gsearch download ebook python pdf\n\nSetelah hasil muncul, ketik:\n• .gsearch dl 1  ← download hasil nomor 1\n• .gsearch dl 2  ← download hasil nomor 2`
      })
    }

    if (args[0]?.toLowerCase() === "dl") {
      const num = parseInt(args[1]) - 1
      // FIX: Load dari file
      const LAST_RESULTS = loadResults()
      const saved = LAST_RESULTS[from]
      if (!saved || !saved[num]) {
        return sock.sendMessage(from, {
          text: "❌ Tidak ada hasil tersimpan. Lakukan pencarian dulu.\nContoh: .gsearch download lagu mp3"
        })
      }
      return await downloadAndSend(sock, m, from, saved[num])
    }

    const query = args.join(" ")

    try {
      await sock.sendMessage(from, { text: `🔍 Mencari: *"${query}"*...` })

      let results = []

      // API 1: rapidapi google search
      try {
        const res = await axios.get(
          `https://google-search3.p.rapidapi.com/api/v1/search/q=${encodeURIComponent(query)}&num=8`,
          {
            headers: {
              "x-rapidapi-host": "google-search3.p.rapidapi.com",
              "x-rapidapi-key": RAPIDAPI_KEY
            },
            timeout: 15000
          }
        )
        results = res.data?.results || []
      } catch {}

      // API 2: rapidapi real-time
      if (!results.length) {
        try {
          const res2 = await axios.get(
            "https://real-time-web-search.p.rapidapi.com/search",
            {
              params: { q: query, limit: 8 },
              headers: {
                "x-rapidapi-host": "real-time-web-search.p.rapidapi.com",
                "x-rapidapi-key": RAPIDAPI_KEY
              },
              timeout: 15000
            }
          )
          const raw = res2.data?.data || res2.data?.results || []
          results = raw.map(r => ({
            title: r.title,
            link: r.url || r.link,
            description: r.snippet || r.body || ""
          }))
        } catch {}
      }

      // API 3: siputzx (fallback gratis)
      if (!results.length) {
        try {
          const res3 = await axios.get(
            `https://api.siputzx.my.id/api/s/google?q=${encodeURIComponent(query)}`,
            { timeout: 12000 }
          )
          const raw = res3.data?.data || []
          results = raw.map(r => ({
            title: r.title || "Untitled",
            link: r.url || r.link || "",
            description: r.snippet || r.description || ""
          }))
        } catch {}
      }

      // API 4: betabotz (fallback)
      if (!results.length) {
        try {
          const res4 = await axios.get(
            `https://api.betabotz.eu.org/api/search/google?q=${encodeURIComponent(query)}&apikey=beta`,
            { timeout: 12000 }
          )
          const raw = res4.data?.result || res4.data?.data || []
          results = raw.map(r => ({
            title: r.title || "Untitled",
            link: r.url || r.link || "",
            description: r.description || r.snippet || ""
          }))
        } catch {}
      }

      if (!results.length) {
        return sock.sendMessage(from, {
          text: `❌ Tidak ada hasil untuk: "${query}"\n\nCoba kata kunci lain.`
        })
      }

      // FIX: Simpan ke file
      const LAST_RESULTS = loadResults()
      LAST_RESULTS[from] = results.slice(0, 8).map(r => ({
        title: r.title || "Untitled",
        url: r.link || r.url || ""
      }))
      saveResults(LAST_RESULTS)

      let text = `🔍 *HASIL: "${query}"*\n━━━━━━━━━━━━\n`

      LAST_RESULTS[from].forEach((item, i) => {
        const r = results[i]
        const snippet = (r.description || r.snippet || "").slice(0, 80)
        const isFile = item.url.match(/\.(mp3|mp4|mkv|avi|zip|pdf|m4a|flac|wav|ogg|mov|apk)(\?.*)?$/i)
        const tag = isFile ? " 📥" : ""

        text += `\n*${i + 1}.${tag} ${item.title?.slice(0, 60)}*\n`
        if (snippet) text += `   ${snippet}...\n`
        text += `   🔗 ${item.url?.slice(0, 80)}\n`
      })

      const hasFile = LAST_RESULTS[from].some(r =>
        r.url.match(/\.(mp3|mp4|mkv|avi|zip|pdf|m4a|flac|wav|ogg|mov|apk)(\?.*)?$/i)
      )

      text += `\n━━━━━━━━━━━━`
      if (hasFile) {
        text += `\n📥 Ketik *.gsearch dl <nomor>* untuk download`
      } else {
        text += `\n💡 Ketik *.gsearch dl <nomor>* untuk coba download link`
      }

      await sock.sendMessage(from, { text })

    } catch (err) {
      if (err.response?.status === 429) {
        return sock.sendMessage(from, { text: "❌ Limit API habis. Coba lagi nanti." })
      }
      await sock.sendMessage(from, {
        text: `❌ Gagal mencari. ${err.message?.slice(0, 100)}`
      })
    }
  }
}

async function downloadAndSend(sock, m, from, item) {
  const { title, url } = item

  if (!url) return sock.sendMessage(from, { text: "❌ URL tidak tersedia." })

  const ext = (url.match(/\.(mp3|mp4|mkv|avi|m4a|flac|wav|ogg|mov|pdf|zip|apk)(\?.*)?$/i) || [])[1]?.toLowerCase()

  try {
    const head = await axios.head(url, {
      timeout: 10000,
      headers: { "User-Agent": "Mozilla/5.0" },
      maxRedirects: 5
    })

    const contentLength = parseInt(head.headers["content-length"] || "0")
    const contentType = head.headers["content-type"] || ""
    const sizeMB = contentLength / (1024 * 1024)

    if (contentLength > 0 && sizeMB > 50) {
      return sock.sendMessage(from, {
        text: `📦 *${title?.slice(0, 60)}*\n\n⚠️ Ukuran file: ${sizeMB.toFixed(1)} MB (terlalu besar)\n\n🔗 *Link download:*\n${url}`
      })
    }

    await sock.sendMessage(from, {
      text: `⬇️ Mendownload... ${sizeMB > 0 ? `(${sizeMB.toFixed(1)} MB)` : ""}`
    })

    const dlRes = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 120000,
      headers: { "User-Agent": "Mozilla/5.0" },
      maxContentLength: 50 * 1024 * 1024,
      maxRedirects: 5
    })

    const buffer = Buffer.from(dlRes.data)
    const actualSize = buffer.length / (1024 * 1024)
    const finalType = dlRes.headers["content-type"] || contentType

    if (actualSize > 50) {
      return sock.sendMessage(from, {
        text: `⚠️ File terlalu besar (${actualSize.toFixed(1)} MB)\n\n🔗 ${url}`
      })
    }

    const cleanName = (title?.slice(0, 40) || "file").replace(/[^a-zA-Z0-9 _-]/g, "_")

    if (finalType.includes("audio") || ["mp3", "m4a", "flac", "wav", "ogg"].includes(ext)) {
      await sock.sendMessage(from, { audio: buffer, mimetype: "audio/mp4", ptt: false })
      await sock.sendMessage(from, { text: `🎵 *${title?.slice(0, 60)}*\n📦 ${actualSize.toFixed(1)} MB` })
    } else if (finalType.includes("video") || ["mp4", "mkv", "avi", "mov"].includes(ext)) {
      await sock.sendMessage(from, { video: buffer, caption: `🎬 ${title?.slice(0, 60)}\n📦 ${actualSize.toFixed(1)} MB` })
    } else if (finalType.includes("pdf") || ext === "pdf") {
      await sock.sendMessage(from, { document: buffer, fileName: cleanName + ".pdf", mimetype: "application/pdf", caption: `📄 ${title?.slice(0, 60)}` })
    } else {
      await sock.sendMessage(from, { document: buffer, fileName: cleanName + (ext ? "." + ext : ".bin"), mimetype: finalType || "application/octet-stream", caption: `📦 ${title?.slice(0, 60)}` })
    }

  } catch (err) {
    if (err.message?.includes("maxContentLength")) {
      return sock.sendMessage(from, { text: `⚠️ File melebihi 50 MB.\n\n🔗 Download langsung:\n${url}` })
    }
    await sock.sendMessage(from, { text: `❌ Gagal download.\n\n🔗 Link manual:\n${url}` })
  }
}
