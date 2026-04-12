/**
 * ruxavideo.js — Generate video via Ruxa AI
 *
 * ENV:
 *   RUXA_API_KEY   — API Key utama ruxa.ai
 *   RUXA_API_KEY_2 — API Key backup ruxa.ai (opsional)
 */

const axios = require("axios")

const BASE_URL = "https://api.ruxa.ai/api/v1"

// Model mapping: nama lokal → nama model resmi di Ruxa AI
const MODEL_MAP = {
  "veo-3":   "veo-3",
  "veo-3.1": "veo-3-1",
  "veo-3-1": "veo-3-1",
  "sora-2":  "sora-2"
}

// Ambil API key — coba utama dulu, fallback ke backup
function getApiKey(useBackup = false) {
  const key = useBackup
    ? process.env.RUXA_API_KEY_2
    : process.env.RUXA_API_KEY

  if (!key) {
    if (!useBackup) throw new Error("RUXA_API_KEY belum diset di environment")
    throw new Error("RUXA_API_KEY_2 (backup) belum diset di environment")
  }
  return key
}

function buildInput(prompt, ruxaModel) {
  if (ruxaModel === "sora-2") {
    return { prompt, seconds: "8" }
  }
  // veo3 - sesuai contoh curl dari dokumentasi
  return {
    prompt,
    seconds: "8",
    aspect_ratio: "16:9",
    enhance_prompt: true,
    enable_upsample: false
  }
}

function translateError(msg, httpStatus) {
  if (httpStatus === 401) return "API Key Ruxa AI tidak valid atau kedaluwarsa"
  if (httpStatus === 429) return "Terlalu banyak request ke Ruxa AI, tunggu sebentar"
  if (httpStatus === 500) return "Server Ruxa AI sedang bermasalah, coba lagi nanti"
  if (!msg) return "Terjadi kesalahan pada Ruxa AI"
  if (msg.includes("积分不足")) {
    const match = msg.match(/([\d.]+).*?([\d.]+)\s*积分/)
    if (match) return `Kredit Ruxa AI tidak cukup.\n💰 Butuh: ${match[1]}\n💳 Saldo: ${match[2]}\nTop up: https://ruxa.ai/dashboard`
    return "Kredit Ruxa AI tidak cukup. Top up di https://ruxa.ai/dashboard"
  }
  if (msg.includes("未找到支持模型") || msg.includes("渠道")) return "Model tidak tersedia di akun Ruxa AI"
  return msg
}

async function createAndPoll(ruxaModel, input, apiKey) {
  // 1. Buat task
  let res
  try {
    res = await axios.post(
      `${BASE_URL}/tasks/create`,
      { model: ruxaModel, input },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
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

  // 2. Polling tiap 6 detik, maks 4 menit (40x)
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 6000))

    let queryRes
    try {
      queryRes = await axios.get(
        `${BASE_URL}/tasks/query/${taskId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 10000
        }
      )
    } catch (err) {
      const status = err.response?.status
      if (status === 404) throw new Error("Task tidak ditemukan di Ruxa AI")
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

    if (state === "fail") {
      throw new Error("Ruxa AI gagal membuat video. Coba prompt yang berbeda")
    }
  }

  throw new Error("Timeout (4 menit) menunggu video dari Ruxa AI")
}

async function generateVideo({ prompt, modelKey }) {
  const ruxaModel = MODEL_MAP[modelKey] || modelKey
  const input = buildInput(prompt, ruxaModel)
  const primaryKey = getApiKey(false)

  try {
    return await createAndPoll(ruxaModel, input, primaryKey)
  } catch (err) {
    // Fallback ke backup key jika ada & error karena key/kredit
    const backupKey = process.env.RUXA_API_KEY_2
    const isKeyError = err.message.includes("tidak valid") ||
                       err.message.includes("kedaluwarsa") ||
                       err.message.includes("tidak cukup")

    if (backupKey && isKeyError) {
      console.log("[ruxavideo] Primary key gagal, coba backup key...")
      return await createAndPoll(ruxaModel, input, backupKey)
    }

    throw err
  }
}

module.exports = { generateVideo }

