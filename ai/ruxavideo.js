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
// Cek model yang aktif di akun kamu: https://ruxa.ai/dashboard
const MODEL_MAP = {
  "veo-3":   "veo3",
  "veo-3.1": "veo3.1",
  "sora-2":  "sora-2"
}

// Input params per model (sesuai docs Ruxa AI)
function buildInput(prompt, ruxaModel) {
  const base = { prompt, aspect_ratio: "16:9" }

  if (ruxaModel === "veo3" || ruxaModel === "veo3.1") {
    return { ...base, seconds: "8", enhance_prompt: true, enable_upsample: false }
  }

  if (ruxaModel === "sora-2") {
    return { ...base, seconds: "8" }
  }

  return base
}

/**
 * Generate video dari teks (text-to-video)
 */
async function generateVideo({ prompt, modelKey }) {
  if (!RUXA_API_KEY) throw new Error("RUXA_API_KEY belum diset di environment")

  const ruxaModel = MODEL_MAP[modelKey] || modelKey
  const input = buildInput(prompt, ruxaModel)

  let res
  try {
    res = await axios.post(
      `${BASE_URL}/tasks/create`,
      { model: ruxaModel, input },
      {
        headers: {
          Authorization: `Bearer ${RUXA_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    )
  } catch (err) {
    throw new Error(`Koneksi ke Ruxa AI gagal: ${err.message}`)
  }

  if (res.data?.code !== 200) {
    const msg = res.data?.message || ""

    // Terjemahkan error Ruxa AI ke Bahasa Indonesia
    if (msg.includes("未找到支持模型") || msg.includes("渠道")) {
      throw new Error(
        `Model *${ruxaModel}* tidak tersedia di akun Ruxa AI kamu.\n\n` +
        `💡 Solusi:\n` +
        `• Cek akses model di: https://ruxa.ai/dashboard\n` +
        `• Coba gunakan *.sora2* (lebih murah, 10 token)\n` +
        `• Atau upgrade plan Ruxa AI kamu`
      )
    }

    if (msg.includes("积分不足") || msg.includes("credit")) {
      throw new Error("Kredit Ruxa AI tidak mencukupi. Top up di https://ruxa.ai/dashboard")
    }

    throw new Error(msg || "Gagal membuat task video di Ruxa AI")
  }

  const taskId = res.data?.data?.taskId
  if (!taskId) throw new Error("Tidak ada task ID dari Ruxa AI")

  // Video membutuhkan waktu lebih lama, polling tiap 6 detik (maks ~4 menit)
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 6000))

    let queryRes
    try {
      queryRes = await axios.get(
        `${BASE_URL}/tasks/query/${taskId}`,
        {
          headers: { Authorization: `Bearer ${RUXA_API_KEY}` },
          timeout: 10000
        }
      )
    } catch {
      continue
    }

    const { state, resultJson } = queryRes.data?.data || {}

    if (state === "success") {
      let parsed = {}
      try { parsed = JSON.parse(resultJson || "{}") } catch {}
      const url = parsed?.resultUrls?.[0]
      if (!url) throw new Error("Video selesai tapi URL tidak ditemukan")
      return url
    }

    if (state === "fail") {
      throw new Error("Ruxa AI gagal membuat video. Coba prompt yang berbeda atau model lain")
    }
  }

  throw new Error("Timeout (4 menit) menunggu video dari Ruxa AI. Coba lagi nanti")
}

module.exports = { generateVideo }
