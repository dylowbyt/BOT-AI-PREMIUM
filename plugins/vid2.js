require("dotenv").config()
const axios = require("axios")

const J2V_BASE = "https://api.json2video.com/v2"

// Pilih template scene berdasarkan kata kunci dalam teks
function buildScene(text) {
  const lower = text.toLowerCase()
  let bgColor = "#1a1a2e"
  let textColor = "#ffffff"
  let style = "003"
  let animation = "slideInLeft"

  if (/kucing|cat|anjing|dog|hewan|binatang/.test(lower)) {
    bgColor = "#2d4a22"; textColor = "#a8e6cf"; animation = "bounceIn"
  } else if (/lucu|fun|haha|gokil|meme/.test(lower)) {
    bgColor = "#ff6b6b"; textColor = "#ffffff"; animation = "bounceIn"; style = "007"
  } else if (/berita|news|info|update/.test(lower)) {
    bgColor = "#0d1b2a"; textColor = "#e0f0ff"; style = "001"
  } else if (/motivasi|inspirasi|semangat/.test(lower)) {
    bgColor = "#f7971e"; textColor = "#1a1a1a"; style = "005"; animation = "zoomIn"
  }

  return {
    comment: "scene-1",
    duration: 8,
    elements: [
      {
        type: "image",
        src: "https://picsum.photos/1280/720?blur=5",
        duration: 8,
        x: 0, y: 0,
        width: "100%",
        height: "100%",
        opacity: 0.35
      },
      {
        type: "text",
        style,
        text,
        "font-color": textColor,
        "font-size": "60px",
        "font-family": "Montserrat",
        x: "center",
        y: "center",
        width: "80%",
        duration: 8,
        animations: [{ type: animation }]
      }
    ]
  }
}

module.exports = {
  name: "vid2",
  alias: ["jsonvideo", "j2v", "videoteks"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const text = args.join(" ").trim()
    if (!text) {
      return sock.sendMessage(from, {
        text:
          "🎬 *JSON2Video Text-to-Video*\n\n" +
          "Format:\n" +
          "• `.j2v <teks>`\n\n" +
          "Contoh:\n" +
          "• `.j2v kucing lucu main bola`\n" +
          "• `.j2v berita teknologi AI terbaru 2025`\n" +
          "• `.j2v motivasi hidup hari ini`\n\n" +
          "📦 Output: video MP4 1280x720\n" +
          "⏳ Proses: ~1-2 menit"
      })
    }

    const API_KEY = process.env.JSON2VIDEO_API_KEY
    if (!API_KEY) {
      return sock.sendMessage(from, {
        text:
          "❌ *JSON2VIDEO_API_KEY belum diset!*\n\n" +
          "Tambahkan ke Railway Variables:\n" +
          "`JSON2VIDEO_API_KEY = your_key_here`\n\n" +
          "Daftar gratis di: https://json2video.com"
      })
    }

    await sock.sendMessage(from, {
      text: `🎬 *Membuat video JSON2Video...*\n\n📝 Teks: "${text}"\n⏳ Harap tunggu 1-2 menit~`
    })

    try {
      // Step 1: POST /v2/movies — buat movie
      const createRes = await axios.post(
        `${J2V_BASE}/movies`,
        {
          resolution: "hd",
          quality: "high",
          draft: false,
          scenes: [buildScene(text)]
        },
        {
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      )

      // Project ID ada di field "project"
      const projectId = createRes.data?.project
      if (!projectId) {
        console.log("J2V CREATE RESPONSE:", JSON.stringify(createRes.data))
        throw new Error("Gagal dapat project ID dari API")
      }

      // Step 2: GET /v2/movies?project=xxx — polling sampai selesai
      let videoUrl = null
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000))

        const pollRes = await axios.get(
          `${J2V_BASE}/movies`,
          {
            headers: { "x-api-key": API_KEY },
            params: { project: projectId },
            timeout: 15000
          }
        ).catch(e => {
          console.log("J2V POLL ERROR:", e?.response?.data || e?.message)
          return null
        })

        const data = pollRes?.data
        console.log(`J2V poll [${i + 1}]:`, JSON.stringify(data)?.slice(0, 200))

        if (data?.status === "done" || data?.status === "completed") {
          videoUrl = data.movie || data.movie_url || data.url
          break
        }

        if (data?.status === "failed" || data?.status === "error") {
          throw new Error("API melaporkan video gagal dibuat: " + (data?.message || ""))
        }
      }

      if (!videoUrl) {
        return sock.sendMessage(from, {
          text: "⏳ Video belum selesai dirender. Coba lagi 1-2 menit lagi dengan perintah yang sama."
        })
      }

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: `🎬 *JSON2Video*\n📝 "${text}"`
      })

    } catch (err) {
      const status = err?.response?.status
      const errMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message
      console.log("VID2 ERROR:", status, errMsg)

      if (status === 401 || status === 403) {
        return sock.sendMessage(from, {
          text: "❌ API key tidak valid. Cek `JSON2VIDEO_API_KEY` di Railway Variables kamu."
        })
      }

      if (status === 429) {
        return sock.sendMessage(from, {
          text: "❌ Terlalu banyak request. Tunggu beberapa menit lalu coba lagi."
        })
      }

      if (status === 400) {
        return sock.sendMessage(from, {
          text: `❌ Request salah format: ${errMsg || "Bad Request"}`
        })
      }

      sock.sendMessage(from, {
        text: `❌ Gagal buat video.\nError: ${errMsg || "Unknown error"}\nStatus: ${status || "-"}`
      })
    }
  }
}
