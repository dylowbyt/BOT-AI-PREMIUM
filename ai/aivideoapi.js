/**
 * aivideoapi.js — Helper generate video via aivideoapi.com
 * Mendukung model: Runway Gen3, Gen3 Turbo
 * Docs: https://www.aivideoapi.com/dashboard
 */

const axios = require("axios")

const AIVIDEO_API_KEY = process.env.AIVIDEO_API_KEY
const BASE_URL = "https://api.aivideoapi.com"

const MODEL_CONFIG = {
  "runway-gen3":       { model: "gen3",       label: "Runway Gen3"       },
  "runway-gen3-turbo": { model: "gen3_turbo", label: "Runway Gen3 Turbo" }
}

function getHeaders() {
  return {
    Authorization:  `Bearer ${AIVIDEO_API_KEY}`,
    "Content-Type": "application/json"
  }
}

async function generateVideo({ prompt, modelKey = "runway-gen3", duration = 5, ratio = "1280:768", maxWaitMs = 300000 }) {
  if (!AIVIDEO_API_KEY) throw new Error("AIVIDEO_API_KEY belum diset di Railway")

  const config = MODEL_CONFIG[modelKey]
  if (!config) throw new Error(`Model tidak dikenal: ${modelKey}`)

  const res = await axios.post(
    `${BASE_URL}/runway/generate/text`,
    {
      text_prompt: prompt,
      model:       config.model,
      duration,
      ratio,
      watermark:   false,
      interpolate: false,
      upscale:     false
    },
    { headers: getHeaders() }
  )

  const data = res.data
  console.log("[AIVideoAPI] Generate response:", JSON.stringify(data))

  if (data.url || data.video_url) {
    return data.url || data.video_url
  }

  const taskId = data.uuid || data.id || data.task_id
  if (!taskId) {
    console.log("[AIVideoAPI] Full response:", JSON.stringify(data))
    throw new Error("Tidak mendapat task ID dari aivideoapi.com")
  }

  const interval = 5000
  const maxTries = Math.ceil(maxWaitMs / interval)

  for (let i = 0; i < maxTries; i++) {
    await new Promise(r => setTimeout(r, interval))

    const poll = await axios.get(
      `${BASE_URL}/runway/status/${taskId}`,
      { headers: getHeaders() }
    )

    const job    = poll.data
    const status = (job.status || "").toLowerCase()

    if (status === "succeeded" || status === "completed" || status === "success") {
      const url = job.url || job.video_url || job.output?.url
      if (url) return url
      throw new Error("Video selesai tapi URL tidak ditemukan")
    }

    if (status === "failed" || status === "error") {
      throw new Error("Generate video gagal: " + (job.error || job.message || "unknown"))
    }
  }

  throw new Error("Timeout: video tidak selesai dalam waktu yang ditentukan")
}

module.exports = { generateVideo, MODEL_CONFIG }
