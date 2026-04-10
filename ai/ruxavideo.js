/**
 * ruxavideo.js — Helper generate video via ruxa.ai
 * Mendukung model: veo-3, veo-3.1, sora-2
 * ruxa.ai menggunakan format OpenAI-compatible API
 */

const axios = require("axios")

const RUXA_API_KEY = process.env.RUXA_API_KEY
const RUXA_BASE_URL = process.env.RUXA_BASE_URL || "https://ruxa.ai/v1"

const MODEL_CONFIG = {
  "veo-3":   { model: "veo-3",   label: "Google Veo 3"   },
  "veo-3.1": { model: "veo-3.1", label: "Google Veo 3.1" },
  "sora-2":  { model: "sora-2",  label: "OpenAI Sora 2"  }
}

function getHeaders() {
  return {
    Authorization:  `Bearer ${RUXA_API_KEY}`,
    "Content-Type": "application/json"
  }
}

async function generateVideo({ prompt, modelKey = "veo-3", duration = 5, resolution = "1280x720", maxWaitMs = 300000 }) {
  if (!RUXA_API_KEY) throw new Error("RUXA_API_KEY belum diset di Railway")

  const config = MODEL_CONFIG[modelKey]
  if (!config) throw new Error(`Model tidak dikenal: ${modelKey}`)

  const res = await axios.post(
    `${RUXA_BASE_URL}/video/generations`,
    {
      model:      config.model,
      prompt,
      duration,
      resolution,
      n: 1
    },
    { headers: getHeaders() }
  )

  const data = res.data

  if (data.url || data.video_url) {
    return data.url || data.video_url
  }

  const taskId = data.id || data.task_id || data.taskId
  if (!taskId) {
    console.log("[RuxaVideo] Response:", JSON.stringify(data))
    throw new Error("Tidak mendapat task ID dari ruxa.ai")
  }

  const interval = 5000
  const maxTries = Math.ceil(maxWaitMs / interval)

  for (let i = 0; i < maxTries; i++) {
    await new Promise(r => setTimeout(r, interval))

    const poll = await axios.get(
      `${RUXA_BASE_URL}/video/generations/${taskId}`,
      { headers: getHeaders() }
    )

    const job = poll.data
    const status = job.status?.toLowerCase()

    if (status === "completed" || status === "succeeded" || status === "success") {
      const url = job.url || job.video_url || job.output?.url || job.data?.[0]?.url
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
