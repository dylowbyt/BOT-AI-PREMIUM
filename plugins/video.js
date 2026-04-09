const axios = require("axios")

// ===== FIX: Buat sistem limit sendiri tanpa bergantung file eksternal =====
const videoLimits = {}
const DAILY_LIMIT = 3

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getVideoLimit(user) {
  const today = getToday()
  if (!videoLimits[user] || videoLimits[user].date !== today) {
    videoLimits[user] = { date: today, count: 0 }
  }
  return DAILY_LIMIT - videoLimits[user].count
}

function useVideoLimit(user) {
  const today = getToday()
  if (!videoLimits[user] || videoLimits[user].date !== today) {
    videoLimits[user] = { date: today, count: 0 }
  }
  if (videoLimits[user].count >= DAILY_LIMIT) return false
  videoLimits[user].count++
  return true
}

module.exports = {
  name: "video",
  alias: ["vid", "genvideo"],

  async run(sock, m) {
    const from = m.key.remoteJid
    const user = m.key.participant || m.key.remoteJid

    // ===== FIX: Ambil teks dengan null check =====
    let text =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""

    text = text.trim()

    // ===== LIMIT CHECK =====
    if (!useVideoLimit(user)) {
      return sock.sendMessage(from, {
        text: `⚠️ Limit video habis! (${DAILY_LIMIT}x/hari)\nSisa: ${getVideoLimit(user)}\nReset besok`
      })
    }

    // ===== AMBIL PROMPT — strip nama command dulu =====
    let prompt = text
      .replace(/^\.(video|vid|genvideo)\s*/i, "")
      .trim()

    // ===== DETECT MODE =====
    let mode = "normal"

    if (/\bcepat\b/i.test(prompt)) {
      mode = "fast"
      prompt = prompt.replace(/\bcepat\b/gi, "").trim()
    }
    if (/\bhd\b/i.test(prompt)) {
      mode = "hd"
      prompt = prompt.replace(/\bhd\b/gi, "").trim()
    }

    if (!prompt) {
      return sock.sendMessage(from, {
        text: `⚠️ Contoh:\n.video kucing lucu\n.video cepat kota malam\n.video hd pemandangan alam\n\n_Limit: ${DAILY_LIMIT}x per hari_`
      })
    }

    // Pastikan REPLICATE_API_TOKEN tersedia
    const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN
    if (!REPLICATE_TOKEN) {
      return sock.sendMessage(from, {
        text: "❌ REPLICATE_API_TOKEN belum diset di environment"
      })
    }

    try {
      let info = "⏳ Proses 10–30 detik"
      if (mode === "hd") info = "⏳ Proses 30–60 detik (HD)"
      if (mode === "fast") info = "⏳ Proses cepat (low quality)"

      await sock.sendMessage(from, {
        text: `🎬 Membuat video...\n${info}\nPrompt: _${prompt}_`
      })

      // ===== FIX: Gunakan model Replicate yang valid =====
      // Model: zeroscope_v2_xl (text-to-video populer)
      const prediction = await axios.post(
        "https://api.replicate.com/v1/predictions",
        {
          version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
          input: {
            prompt,
            num_frames: mode === "fast" ? 16 : mode === "hd" ? 40 : 24,
            fps: 8,
            guidance_scale: mode === "hd" ? 12.5 : 7.5,
            num_inference_steps: mode === "fast" ? 20 : 50
          }
        },
        {
          headers: {
            Authorization: `Token ${REPLICATE_TOKEN}`,
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      )

      const predId = prediction.data?.id
      if (!predId) throw new Error("Tidak ada ID prediksi dari Replicate")

      // ===== POLLING =====
      let videoUrl = null

      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 4000))

        const check = await axios.get(
          `https://api.replicate.com/v1/predictions/${predId}`,
          {
            headers: { Authorization: `Token ${REPLICATE_TOKEN}` },
            timeout: 10000
          }
        )

        const status = check.data?.status

        if (status === "succeeded") {
          const output = check.data?.output
          videoUrl = Array.isArray(output) ? output[0] : output
          break
        }

        if (status === "failed" || status === "canceled") {
          throw new Error("Video gagal dibuat di Replicate")
        }
      }

      if (!videoUrl) throw new Error("Timeout — video tidak selesai dalam 2 menit")

      let caption = "🎬 Video selesai!"
      if (mode === "fast") caption = "⚡ Video cepat (low quality)"
      if (mode === "hd") caption = "🔥 Video HD"

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: `${caption}\n\n_${prompt}_\n\nSisa limit: ${getVideoLimit(user)}x`
      })

    } catch (err) {
      console.log("VIDEO ERROR:", err?.message)

      // Kembalikan limit jika error
      if (videoLimits[user]) videoLimits[user].count = Math.max(0, videoLimits[user].count - 1)

      await sock.sendMessage(from, {
        text: "❌ Gagal membuat video\nCoba lagi nanti"
      })
    }
  }
}
