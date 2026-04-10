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

const MODEL_MAP = {
  "veo-3":   "veo3.1",
  "veo-3.1": "veo3.1",
  "sora-2":  "sora-2"
}

function buildInput(prompt, ruxaModel) {
  if (ruxaModel === "sora-2") {
    return { prompt, seconds: "8" }
  }
  return { prompt, seconds: "8", aspect_ratio: "16:9", enhance_prompt: true, enable_upsample: false }
}

function translateError(msg, httpStatus) {
  if (httpStatus === 404) return "Endpoint Ruxa AI tidak ditemukan (404). Periksa koneksi atau coba lagi nanti"
  if (httpStatus === 401) return "API Key Ruxa AI tidak valid atau sudah kedaluwarsa. Periksa RUXA_API_KEY"
  if (httpStatus === 429) return "Terlalu banyak request ke Ruxa AI. Tunggu beberapa saat lalu coba lagi"
  if (httpStatus === 500) return "Server Ruxa AI sedang bermasalah (500). Coba lagi beberapa menit"

  if (!msg) return "Terjadi kesalahan pada Ruxa AI"
  if (msg.includes("积分不足")) {
    const match = msg.match(/([\d.]+).*?([\d.]+)\s*积分/)
    if (match) {
      return (
        "Kredit Ruxa AI tidak mencukupi.\n\n" +
        "💰 Butuh: *" + match[1] + " kredit*\n" +
        "💳 Saldo sekarang: *" + match[2] + " kredit*\n\n" +
        "Top up di: https://ruxa.ai/dashboard"
      )
    }
    return "Kredit Ruxa AI tidak mencukupi. Top up di https://ruxa.ai/dashboard"
  }
  if (msg.includes("未找到支持模型") || msg.includes("渠道")) {
    return "Model tidak tersedia di akun Ruxa AI kamu. Cek https://ruxa.ai/dashboard"
  }
  return msg
}

async function generateVideo({ prompt, modelKey }) {
  if (!RUXA_API_KEY) throw new Error("RUXA_API_KEY belum diset di environment")

  const ruxaModel = MODEL_MAP[modelKey] || modelKey
  const input = buildInput(prompt, ruxaModel)

  let res
  try {
    res = await axios.post(
      `${BASE_URL}/tasks/create`,
      { model: ruxaModel, input },
      { headers: { Authorization: `Bearer ${RUXA_API_KEY}`, "Content-Type": "application/json" }, timeout: 30000 }
    )
  } catch (err) {
    const status = err.response?.status
    if (status) throw new Error(translateError(err.response?.data?.message, status))
    throw new Error(`Koneksi ke Ruxa AI gagal: ${err.message}`)
  }

  if (res.data?.code !== 200) {
    throw new Error(translateError(res.data?.message))
  }

  const taskId = res.data?.data?.taskId
  if (!taskId) throw new Error("Tidak ada task ID dari Ruxa AI")

  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 6000))
    let queryRes
    try {
      queryRes = await axios.get(
        `${BASE_URL}/tasks/query/${taskId}`,
        { headers: { Authorization: `Bearer ${RUXA_API_KEY}` }, timeout: 10000 }
      )
    } catch (err) {
      const status = err.response?.status
      if (status === 404) throw new Error("Task tidak ditemukan di Ruxa AI. Coba generate ulang")
      if (status === 401) throw new Error(translateError(null, 401))
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
    if (state === "fail") throw new Error("Ruxa AI gagal membuat video. Coba prompt yang berbeda")
  }

  throw new Error("Timeout (4 menit) menunggu video dari Ruxa AI. Coba lagi nanti")
}

module.exports = { generateVideo }
