/**
 * ruxavideo.js — Helper untuk generate video via Ruxa AI
 * Dipanggil oleh plugins/videogen.js
 *
 * ENV yang dibutuhkan:
 *   RUXA_API_KEY — API Key dari ruxa.ai
 */

const axios = require("axios")

const RUXA_API_KEY = process.env.RUXA_API_KEY
const BASE_URL = "https://api.ruxa.ai/api/v1"

// Mapping nama model dari videogen.js → nama model resmi Ruxa AI
const MODEL_MAP = {
  "veo-3":   "veo3",
  "veo-3.1": "veo3.1",
  "sora-2":  "sora-2"
}

/**
 * Generate video dari teks (text-to-video)
 */
async function generateVideo({ prompt, modelKey }) {
  if (!RUXA_API_KEY) throw new Error("RUXA_API_KEY belum diset")

  const ruxaModel = MODEL_MAP[modelKey] || modelKey

  const res = await axios.post(
    `${BASE_URL}/tasks/create`,
    {
      model: ruxaModel,
      input: {
        prompt,
        seconds: "8",
        aspect_ratio: "16:9",
        enhance_prompt: true,
        enable_upsample: false
      }
    },
    {
      headers: {
        Authorization: `Bearer ${RUXA_API_KEY}`,
        "Content-Type": "application/json"
      },
      timeout: 30000
    }
  )

  if (res.data?.code !== 200) {
    throw new Error(res.data?.message || "Gagal membuat task video di Ruxa AI")
  }

  const taskId = res.data?.data?.taskId
  if (!taskId) throw new Error("Tidak ada task ID dari Ruxa AI")

  // Video membutuhkan waktu lebih lama, polling tiap 6 detik (maks ~4 menit)
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 6000))

    const queryRes = await axios.get(
      `${BASE_URL}/tasks/query/${taskId}`,
      {
        headers: { Authorization: `Bearer ${RUXA_API_KEY}` },
        timeout: 10000
      }
    )

    const { state, resultJson } = queryRes.data?.data || {}

    if (state === "success") {
      const parsed = JSON.parse(resultJson || "{}")
      const url = parsed?.resultUrls?.[0]
      if (!url) throw new Error("Tidak ada URL video dari Ruxa AI")
      return url
    }

    if (state === "fail") {
      throw new Error("Ruxa AI gagal membuat video")
    }
  }

  throw new Error("Timeout menunggu hasil video dari Ruxa AI")
}

module.exports = { generateVideo }
