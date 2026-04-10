/**
 * ruxavideo.js — Helper generate video via api.ruxa.ai
 * Dipakai oleh plugins/videogen.js
 *
 * Endpoint: POST https://api.ruxa.ai/client/api/tasks
 *
 * Model yang didukung:
 *   veo-3    → veo-3
 *   veo-3.1  → veo-3-1
 *   sora-2   → sora-2
 */

const axios = require("axios")

const API_KEY  = process.env.RUXA_API_KEY
const BASE_URL = "https://api.ruxa.ai"

const MODEL_MAP = {
  "veo-3.1": "veo-3-1"
}

function getHeaders() {
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${API_KEY}`,
    "X-API-Key":     API_KEY
  }
}

async function submitTask(body) {
  try {
    const res = await axios.post(
      `${BASE_URL}/client/api/tasks`,
      body,
      { headers: getHeaders(), timeout: 30000 }
    )
    return res.data
  } catch (err) {
    const status = err?.response?.status
    const detail = err?.response?.data
    console.log(`[ruxavideo] submitTask error ${status}:`, JSON.stringify(detail).slice(0, 400))
    throw new Error(
      `API error ${status}: ` +
      (detail?.error?.message || detail?.message || detail?.msg || JSON.stringify(detail).slice(0, 200))
    )
  }
}

async function pollTask(taskId, maxWaitMs = 300000) {
  const interval = 8000
  const maxTries = Math.ceil(maxWaitMs / interval)

  for (let i = 0; i < maxTries; i++) {
    await new Promise(r => setTimeout(r, interval))

    try {
      const res = await axios.get(
        `${BASE_URL}/client/api/tasks/${taskId}`,
        { headers: getHeaders(), timeout: 20000 }
      )

      const data   = res.data
      const status = data?.status || data?.data?.status

      console.log(`[ruxavideo] poll [${i + 1}/${maxTries}] taskId=${taskId} status=${status}`)

      if (status === "completed" || status === "succeed" || status === "success") {
        const url =
          data?.output?.video_url  ||
          data?.output?.url        ||
          data?.data?.output?.video_url ||
          data?.data?.output?.url  ||
          data?.result?.url        ||
          data?.video_url          ||
          data?.url
        if (url) return url
      }

      if (status === "failed" || status === "error") {
        throw new Error(
          "Task gagal: " + (data?.error || data?.message || data?.data?.error || "unknown")
        )
      }

    } catch (pollErr) {
      if (pollErr.message.includes("gagal") || pollErr.message.includes("failed")) {
        throw pollErr
      }
      console.log("[ruxavideo] poll request error:", pollErr?.message)
    }
  }

  throw new Error("Timeout: video tidak selesai dalam " + Math.round(maxWaitMs / 1000) + " detik")
}

/**
 * Generate video dari teks prompt
 * @param {{ prompt: string, modelKey: string }} opts
 * @returns {Promise<string>} URL video
 */
async function generateVideo({ prompt, modelKey }) {
  if (!API_KEY) throw new Error("RUXA_API_KEY belum diset di environment")

  const fullModel = MODEL_MAP[modelKey] || modelKey

  const taskData = await submitTask({
    model: fullModel,
    input: { prompt }
  })

  const taskId = taskData?.task_id || taskData?.id || taskData?.data?.task_id || taskData?.data?.id
  if (!taskId) {
    const url = taskData?.output?.video_url || taskData?.output?.url || taskData?.url
    if (url) return url
    console.log("[ruxavideo] no taskId in response:", JSON.stringify(taskData).slice(0, 300))
    throw new Error("Tidak mendapat task_id dari API: " + JSON.stringify(taskData).slice(0, 200))
  }

  return await pollTask(taskId, 300000)
}

module.exports = { generateVideo }
