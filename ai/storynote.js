/**
 * storynote.js — Helper Ruxa AI (OpenAI-compatible API)
 * Generate gambar dan video via api.ruxa.ai
 */

const axios = require("axios")

const API_KEY  = process.env.STORYNOTE_API_KEY || process.env.RUXA_API_KEY
const BASE_URL = process.env.STORYNOTE_BASE_URL || process.env.RUXA_BASE_URL || "https://api.ruxa.ai/v1"

function getHeaders() {
  return {
    Authorization:  `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  }
}

function aspectToSize(aspectRatio) {
  const map = {
    "1:1":  "1024x1024",
    "16:9": "1792x1024",
    "9:16": "1024x1792",
    "4:3":  "1024x768",
    "3:4":  "768x1024"
  }
  return map[aspectRatio] || "1024x1024"
}

async function generateImage({ prompt, modelId, aspectRatio = "1:1", maxWaitMs = 90000 }) {
  if (!API_KEY) {
    throw new Error("RUXA_API_KEY / STORYNOTE_API_KEY belum diset")
  }

  const headers = getHeaders()
  const size = aspectToSize(aspectRatio)

  const res = await axios.post(
    `${BASE_URL}/images/generations`,
    {
      model: modelId || "dall-e-3",
      prompt,
      n: 1,
      size
    },
    { headers, timeout: maxWaitMs }
  )

  const data = res.data?.data?.[0]
  if (!data) {
    throw new Error("Tidak mendapat data gambar dari API: " + JSON.stringify(res.data).slice(0, 200))
  }

  if (data.url) return data.url
  if (data.b64_json) return `data:image/png;base64,${data.b64_json}`

  throw new Error("Tidak mendapat URL gambar dari API")
}

async function generateVideo({ prompt, modelId, maxWaitMs = 180000 }) {
  if (!API_KEY) {
    throw new Error("RUXA_API_KEY / STORYNOTE_API_KEY belum diset")
  }

  const headers = getHeaders()

  const requestBody = {
    model: modelId || "sora",
    prompt
  }

  const res = await axios.post(
    `${BASE_URL}/video/generations`,
    requestBody,
    { headers, timeout: 60000 }
  )

  if (res.data?.data?.[0]?.url) {
    return res.data.data[0].url
  }

  if (res.data?.url) {
    return res.data.url
  }

  const taskId = res.data?.task_id || res.data?.id || res.data?.data?.[0]?.task_id
  if (!taskId) {
    if (typeof res.data === "string" && res.data.startsWith("http")) {
      return res.data
    }
    throw new Error("Tidak mendapat video URL atau task ID dari API: " + JSON.stringify(res.data).slice(0, 200))
  }

  const interval = 5000
  const maxTries = Math.ceil(maxWaitMs / interval)

  for (let i = 0; i < maxTries; i++) {
    await new Promise(r => setTimeout(r, interval))

    try {
      const poll = await axios.get(
        `${BASE_URL}/video/generations/${taskId}`,
        { headers, timeout: 15000 }
      )

      const result = poll.data
      if (result?.data?.[0]?.url) return result.data[0].url
      if (result?.url) return result.url
      if (result?.video_url) return result.video_url

      if (result?.status === "failed" || result?.status === "error") {
        throw new Error("Generate video gagal: " + (result.error || result.message || "unknown"))
      }
    } catch (pollErr) {
      if (pollErr.message.includes("gagal")) throw pollErr
    }
  }

  throw new Error("Timeout: video tidak selesai dalam " + Math.round(maxWaitMs / 1000) + " detik")
}

module.exports = { generateImage, generateVideo }
