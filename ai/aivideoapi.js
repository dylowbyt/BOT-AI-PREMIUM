/**
 * aivideoapi.js — Helper generate video via aivideoapi.com
 * Mendukung model: Runway Gen3, Gen3 Turbo, Gen4
 * Docs: https://www.aivideoapi.com/dashboard
 */

const axios = require("axios")

const AIVIDEO_API_KEY = process.env.AIVIDEO_API_KEY
const BASE_URL        = "https://api.aivideoapi.com"

const MODEL_CONFIG = {
  "runway-gen3":       { model: "gen3",              label: "Runway Gen3"       },
  "runway-gen3-turbo": { model: "gen3_alpha_turbo",  label: "Runway Gen3 Turbo" },
  "runway-gen4":       { model: "gen4",              label: "Runway Gen4"       }
}

const RATIO_MAP = {
  "16:9": "1280:768",
  "9:16": "768:1280",
  "1:1":  "1024:1024",
  "4:3":  "1024:768",
  "3:4":  "768:1024"
}

function getHeaders() {
  return {
    Authorization:  `Bearer ${AIVIDEO_API_KEY}`,
    "Content-Type": "application/json"
  }
}

async function generateVideo({ prompt, modelKey = "runway-gen3", duration = 5, ratio = "16:9", maxWaitMs = 300000 }) {
  if (!AIVIDEO_API_KEY) throw new Error("AIVIDEO_API_KEY belum diset di environment")

  const config = MODEL_CONFIG[modelKey]
  if (!config) throw new Error(`Model tidak dikenal: ${modelKey}. Tersedia: ${Object.keys(MODEL_CONFIG).join(", ")}`)

  const apiRatio = RATIO_MAP[ratio] || RATIO_MAP["16:9"]

  console.log(`[AIVideoAPI] Generating: model=${config.model} ratio=${apiRatio} duration=${duration}`)

  let res
  try {
    res = await axios.post(
      `${BASE_URL}/runway/generate/text`,
      {
        text_prompt: prompt,
        model:       config.model,
        duration:    duration,
        ratio:       apiRatio,
        watermark:   false,
        interpolate: false,
        upscale:     false
      },
      {
        headers: getHeaders(),
        timeout: 30000
      }
    )
  } catch (err) {
    const status = err.response?.status
    const body   = err.response?.data

    if (status === 404) throw new Error("Endpoint aivideoapi.com tidak ditemukan (404). Pastikan AIVIDEO_API_KEY valid dan aktif.")
    if (status === 401) throw new Error("API Key aivideoapi.com tidak valid atau expired. Cek AIVIDEO_API_KEY.")
    if (status === 402) throw new Error("Kredit aivideoapi.com habis. Top up di https://aivideoapi.com/dashboard")
    if (status === 429) throw new Error("Terlalu banyak request ke aivideoapi.com. Tunggu sebentar.")

    const msg = body?.error || body?.message || err.message
    throw new Error(`aivideoapi.com error (${status || "network"}): ${msg}`)
  }

  const data = res.data
  console.log("[AIVideoAPI] Generate response:", JSON.stringify(data))

  if (data.url || data.video_url) {
    return data.url || data.video_url
  }

  const taskId = data.uuid || data.id || data.task_id
  if (!taskId) {
    console.log("[AIVideoAPI] Full response:", JSON.stringify(data))
    throw new Error("Tidak mendapat task ID dari aivideoapi.com. Response: " + JSON.stringify(data).slice(0, 300))
  }

  console.log(`[AIVideoAPI] Task ID: ${taskId} — mulai polling...`)

  const interval = 5000
  const maxTries = Math.ceil(maxWaitMs / interval)

  for (let i = 0; i < maxTries; i++) {
    await new Promise(r => setTimeout(r, interval))

    let poll
    try {
      poll = await axios.get(
        `${BASE_URL}/runway/status/${taskId}`,
        {
          headers: getHeaders(),
          timeout: 10000
        }
      )
    } catch (pollErr) {
      const s = pollErr.response?.status
      if (s === 404) throw new Error(`Task ${taskId} tidak ditemukan. Coba generate ulang.`)
      if (s === 401) throw new Error("API Key tidak valid saat polling.")
      console.log(`[AIVideoAPI] Polling error (attempt ${i + 1}):`, pollErr.message)
      continue
    }

    const job    = poll.data
    const status = (job.status || "").toLowerCase()

    console.log(`[AIVideoAPI] Poll ${i + 1}/${maxTries} — status: ${status}`)

    if (["succeeded", "completed", "success"].includes(status)) {
      const url = job.url || job.video_url || job.output?.url || job.resultUrl
      if (url) return url
      throw new Error("Video selesai tapi URL tidak ditemukan di response")
    }

    if (["failed", "error", "cancelled"].includes(status)) {
      throw new Error("Generate video gagal: " + (job.error || job.message || status))
    }
  }

  throw new Error(`Timeout ${Math.floor(maxWaitMs / 60000)} menit: video tidak selesai. Coba lagi nanti.`)
}

module.exports = { generateVideo, MODEL_CONFIG, RATIO_MAP }
