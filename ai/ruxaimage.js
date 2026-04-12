/**
 * ruxaimage.js — Generate & edit gambar via Ruxa AI
 *
 * ENV:
 *   RUXA_API_KEY   — API Key utama ruxa.ai
 *   RUXA_API_KEY_2 — API Key backup ruxa.ai (opsional)
 */

const axios = require("axios")
const FormData = require("form-data")

const BASE_URL = "https://api.ruxa.ai/api/v1"

// Model mapping: nama lokal → nama model resmi di Ruxa AI
const MODEL_MAP = {
  "nano-banana":      "nano-banana",
  "nano-banana-2":    "nano-banana-2",
  "nano-banana-pro":  "nano-banana-pro",
  "nano-banana-edit": "nano-banana-edit",
  "gpt-image-1":      "gpt-image-1",
  "gpt-image-1.5":    "gpt-image-1-5",
  "gpt-image-1-5":    "gpt-image-1-5",
  "gpt-4o":           "gpt-4o-image",
  "gpt-4o-image":     "gpt-4o-image",
  "sora":             "sora-2",
  "sora-2":           "sora-2",
  "veo-3":            "veo-3",
  "veo-3.1":          "veo-3-1",
  "veo-3-1":          "veo-3-1"
}

// Biaya token per model — sesuai harga kredit Ruxa AI
// image
const TOKEN_COST_MAP = {
  "nano-banana":      3,
  "nano-banana-2":    4,
  "nano-banana-pro":  8,
  "nano-banana-edit": 3,
  "gpt-image-1":      7,
  "gpt-image-1-5":    7,
  "gpt-image-1.5":    7,
  "gpt-4o-image":     10,
  "gpt-4o":           10,
  // video
  "sora-2":           10,
  "sora":             10,
  "veo-3":            16,
  "veo-3-1":          18,
  "veo-3.1":          18
}

/**
 * Ambil biaya token untuk model tertentu.
 * Cek nama lokal dulu, lalu nama resmi Ruxa, default 10.
 */
function getModelTokenCost(model) {
  if (!model) return 10
  const key = model.toLowerCase()
  if (TOKEN_COST_MAP[key] !== undefined) return TOKEN_COST_MAP[key]
  const mapped = MODEL_MAP[key]
  if (mapped && TOKEN_COST_MAP[mapped] !== undefined) return TOKEN_COST_MAP[mapped]
  return 10
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

// Upload buffer gambar ke catbox.moe → dapat URL publik
async function uploadToCatbox(buffer) {
  const form = new FormData()
  form.append("reqtype", "fileupload")
  form.append("fileToUpload", buffer, { filename: "image.jpg", contentType: "image/jpeg" })

  const res = await axios.post("https://catbox.moe/user.php", form, {
    headers: form.getHeaders(),
    timeout: 30000
  })

  const url = res.data?.trim()
  if (!url || !url.startsWith("http")) throw new Error("Gagal upload gambar ke catbox.moe")
  return url
}

// Terjemahkan error dari Ruxa AI
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

// Buat task & polling sampai selesai
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

  // 2. Polling tiap 4 detik, maks 2 menit (30x)
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 4000))

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
      continue // skip, coba lagi di iterasi berikutnya
    }

    const { state, resultJson } = queryRes.data?.data || {}

    if (state === "success") {
      let parsed = {}
      try { parsed = JSON.parse(resultJson || "{}") } catch {}
      const url = parsed?.resultUrls?.[0]
      if (!url) throw new Error("Gambar selesai tapi URL tidak ditemukan")
      return url
    }

    if (state === "fail") {
      throw new Error("Ruxa AI gagal membuat gambar. Coba prompt yang berbeda")
    }
  }

  throw new Error("Timeout (2 menit) menunggu gambar dari Ruxa AI")
}

// Coba dengan key utama, fallback ke backup jika gagal
async function createAndPollWithFallback(ruxaModel, input) {
  const primaryKey = getApiKey(false)

  try {
    return await createAndPoll(ruxaModel, input, primaryKey)
  } catch (err) {
    // Hanya fallback ke backup jika ada & error bukan dari prompt/model
    const backupKey = process.env.RUXA_API_KEY_2
    const isKeyError = err.message.includes("tidak valid") ||
                       err.message.includes("kedaluwarsa") ||
                       err.message.includes("tidak cukup")

    if (backupKey && isKeyError) {
      console.log("[ruxaimage] Primary key gagal, coba backup key...")
      return await createAndPoll(ruxaModel, input, backupKey)
    }

    throw err
  }
}

// Generate gambar dari teks
async function generateImage({ prompt, model }) {
  const ruxaModel = MODEL_MAP[model] || model
  return createAndPollWithFallback(ruxaModel, { prompt })
}

// Edit gambar dengan prompt
async function editImage({ prompt, imageBuffers, model }) {
  const ruxaModel = MODEL_MAP[model] || model

  if (!imageBuffers || imageBuffers.length === 0) {
    throw new Error("Tidak ada gambar yang dikirim")
  }

  const urls = await Promise.all(imageBuffers.map(uploadToCatbox))

  const input = { prompt, image_url: urls[0] }
  if (urls[1]) input.image_url_2 = urls[1]

  return createAndPollWithFallback(ruxaModel, input)
}

module.exports = { generateImage, editImage, getModelTokenCost, TOKEN_COST_MAP, MODEL_MAP }
