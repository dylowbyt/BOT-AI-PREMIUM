/**
 * tiktok.js — Download video TikTok tanpa watermark via ssstik.io
 * Command: .tiktok <url>
 * Alias  : .tt, .tikdown, .nomark
 * Gratis (tidak pakai token)
 */

const axios = require("axios")
const { Buffer } = require("buffer")

const BASE = "https://ssstik.io"

/**
 * Ambil token 'tt' dari halaman utama ssstik.io
 */
async function getToken() {
  const res = await axios.get(BASE, {
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5059.159 Safari/537.36"
    },
    timeout: 15000
  })
  const match = res.data.match(/tt:'([\w\d]+)'/)
  if (!match) throw new Error("Gagal mendapat token dari ssstik.io")
  return match[1]
}

/**
 * Parse dan decode URL dari HTML response ssstik.io
 */
function parseLinks(html) {
  const hrefs = [...new Set(html.match(/href="(.*?)"/g) || [])]
    .map(h => h.replace(/href="|"/g, ""))

  return hrefs
    .filter(h => h && h.startsWith("http"))
    .map(url => {
      // URL ssscdn.io perlu di-base64 decode dari path ke-5 dst
      if (url.includes("ssscdn.io")) {
        try {
          const parts = url.split("/")
          const encoded = parts.slice(5).join("/")
          return Buffer.from(encoded, "base64").toString("utf-8")
        } catch {
          return url
        }
      }
      return url
    })
    .filter(Boolean)
}

/**
 * Download media TikTok — return { video, music }
 */
async function getTikTokMedia(tiktokUrl) {
  const tt = await getToken()

  const res = await axios.post(
    `${BASE}/abc?url=dl`,
    new URLSearchParams({
      id:     tiktokUrl,
      locale: "en",
      tt:     tt
    }),
    {
      headers: {
        "content-type":     "application/x-www-form-urlencoded",
        "hx-current-url":   `${BASE}/id`,
        "hx-request":       "true",
        "hx-target":        "target",
        "hx-trigger":       "_gcaptcha_pt",
        "origin":           BASE,
        "pragma":           "no-cache",
        "referer":          `${BASE}/id`,
        "sec-ch-ua":        '" Not A;Brand";v="99", "Chromium";v="102", "Google Chrome";v="102"',
        "sec-ch-ua-mobile": "?0",
        "sec-fetch-dest":   "empty",
        "sec-fetch-mode":   "cors",
        "sec-fetch-site":   "same-origin",
        "user-agent":       "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5059.159 Safari/537.36"
      },
      timeout: 20000
    }
  )

  const links = parseLinks(res.data)

  const videoUrl = links.find(l => !l.includes("music") && !l.includes(".mp3"))
  const musicUrl = links.find(l => l.includes("music") || l.includes(".mp3"))

  if (!videoUrl && !musicUrl) {
    throw new Error("Tidak ada link download yang ditemukan. URL TikTok mungkin salah atau video private.")
  }

  return { video: videoUrl || null, music: musicUrl || null }
}

// ─────────────────────────────────────────
// PLUGIN
// ─────────────────────────────────────────

module.exports = {
  name:  "tiktok",
  alias: ["tiktok", "tt", "tikdown", "nomark"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    const url = args[0]?.trim()

    if (!url) {
      return sock.sendMessage(from, {
        text:
          `🎵 *TikTok Downloader — Tanpa Watermark*\n\n` +
          `📝 Format:\n` +
          `*.tiktok <link tiktok>*\n\n` +
          `Contoh:\n` +
          `*.tiktok https://vm.tiktok.com/xxxxx*\n\n` +
          `📦 Yang dikirim:\n` +
          `• Video tanpa watermark\n` +
          `• Audio/musik (jika ada)\n\n` +
          `✅ Gratis — tidak pakai token`
      }, { quoted: m })
    }

    if (!url.includes("tiktok.com") && !url.includes("vm.tiktok.com") && !url.includes("vt.tiktok.com")) {
      return sock.sendMessage(from, {
        text: `❌ Link tidak valid!\n\nKirimkan link TikTok yang benar.\nContoh: https://vm.tiktok.com/xxxxx`
      }, { quoted: m })
    }

    await sock.sendMessage(from, {
      text: `⏳ Sedang mengambil video TikTok...\nTunggu sebentar ya!`
    }, { quoted: m })

    try {
      const { video, music } = await getTikTokMedia(url)

      if (video) {
        await sock.sendMessage(from, {
          video:   { url: video },
          caption:
            `✅ *Video TikTok — No Watermark*\n\n` +
            `🔗 Source: ${url}\n` +
            `🎵 Audio dikirim terpisah (jika ada)`
        }, { quoted: m })
      }

      if (music) {
        await sock.sendMessage(from, {
          audio:       { url: music },
          mimetype:    "audio/mpeg",
          ptt:         false
        }, { quoted: m })
      }

      if (!video && !music) {
        throw new Error("Link download kosong")
      }

    } catch (err) {
      console.log("[tiktok] ERROR:", err.message)

      await sock.sendMessage(from, {
        text:
          `❌ *Gagal download TikTok*\n\n` +
          `📛 Error: ${err.message}\n\n` +
          `💡 Tips:\n` +
          `• Pastikan link benar\n` +
          `• Video tidak private\n` +
          `• Coba beberapa menit lagi`
      }, { quoted: m })
    }
  }
}
