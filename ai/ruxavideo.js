/**
 * ruxavideo.js — Helper generate video via api.ruxa.ai
 * Dipakai oleh plugins/videogen.js
 *
 * Model yang didukung:
 *   veo-3    → Google Veo 3
 *   veo-3.1  → Google Veo 3.1
 *   sora-2   → OpenAI Sora 2
 */

const axios = require("axios")

const API_KEY  = process.env.RUXA_API_KEY
const BASE_URL = process.env.RUXA_BASE_URL || "https://api.ruxa.ai/v1"

function getHeaders() {
  return {
    Authorization:  `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  }
}

/**
 * Generate video dari teks prompt
 * @param {{ prompt: string, modelKey: string }} opts
 * @returns {Promise<string>} URL video
 */
async function generateVideo({ prompt, modelKey }) {
  if (!API_KEY) throw new Error("RUXA_API_KEY belum diset di environment")

  const headers = getHeaders()

  let res
  try {
    res = await axios.post(
      `${BASE_URL}/video/generations`,
      { model: modelKey, prompt },
      { headers, timeout: 60000 }
    )
  } catch (err) {
    const detail = err?.response?.data
    const status = err?.response?.status
    console.log(`[ruxavideo] generateVideo error ${status}:`, JSON.stringify(detail).slice(0, 400))
    throw new Error(
      `API error ${status}: ` +
      (detail?.error?.message || detail?.message || JSON.stringify(detail).slice(0, 200))
    )
  }

  const data = res.data

  if (data?.data?.[0]?.url)  return data.data[0].url
  if (data?.url)             return data.url
  if (data?.video_url)       return data.video_url

  const taskId = data?.task_id || data?.id || data?.data?.[0]?.task_id
  if (!taskId) {
    console.log("[ruxavideo] unknown response:", JSON.stringify(data).slice(0, 400))
    throw new Error(
      "Tidak mendapat URL video atau task_id: " + JSON.stringify(data).slice(0, 200)
    )
  }

  return await pollVideoTask(taskId, headers)
}

/**
 * Polling status task video sampai selesai
 */
async function pollVideoTask(taskId, headers, maxWaitMs = 300000) {
  const interval = 8000
  const maxTries = Math.ceil(maxWaitMs / interval)

  for (let i = 0; i < maxTries; i++) {
    await new Promise(r => setTimeout(r, interval))

    let result
    try {
      const poll = await axios.get(
        `${BASE_URL}/video/generations/${taskId}`,
        { headers, timeout: 20000 }
      )
      result = poll.data
    } catch (pollErr) {
      console.log("[ruxavideo] poll error:", pollErr?.message)
      continue
    }

    if (result?.data?.[0]?.url) return result.data[0].url
    if (result?.url)            return result.url
    if (result?.video_url)      return result.video_url

    const status = result?.status || result?.data?.[0]?.status
    console.log(`[ruxavideo] poll [${i + 1}/${maxTries}] status:`, status)

    if (status === "failed" || status === "error") {
      throw new Error(
        "Generate video gagal: " +
        (result?.error || result?.message || "unknown error")
      )
    }
  }

  throw new Error(
    "Timeout: video tidak selesai dalam " + Math.round(maxWaitMs / 1000) + " detik"
  )
}

module.exports = { generateVideo }
