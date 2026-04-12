/**
 * ruxaimage.js — Helper untuk generate & edit gambar via Ruxa AI / AIVideoAPI
 * Dipanggil oleh plugins/imggen.js, messybun.js, hdpro.js, promtmulin.js, dll
 *
 * ENV yang dibutuhkan (salah satu):
 *   AIVIDEO_API_KEY — API Key dari aivideoapi.com (prioritas)
 *   RUXA_API_KEY    — API Key dari ruxa.ai (fallback)
 *
 * ENV opsional:
 *   IMAGE_API_BASE_URL — Override base URL API (default: auto-detect)
 */

const axios = require("axios")
const FormData = require("form-data")

const API_KEY = process.env.AIVIDEO_API_KEY || process.env.RUXA_API_KEY
const BASE_URL = process.env.IMAGE_API_BASE_URL || (process.env.AIVIDEO_API_KEY ? "https://api.aivideoapi.com" : "https://api.ruxa.ai/api/v1")

const MODEL_MAP = {
  "nano-banana":      "google/nano-banana",
  "nano-banana-2":    "google/nano-banana-2",
  "nano-banana-pro":  "google/nano-banana-pro",
  "nano-banana-edit": "google/nano-banana-edit",
  "gpt-image-1.5":    "gpt-image-1.5",
  "gpt-4o":           "gpt-4o-image"
}

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

function translateError(msg, httpStatus) {
  if (httpStatus === 404) return "Endpoint API tidak ditemukan (404). Periksa koneksi atau API Key"
  if (httpStatus === 401) return "API Key tidak valid atau sudah kedaluwarsa. Periksa AIVIDEO_API_KEY / RUXA_API_KEY"
  if (httpStatus === 402) return "Kredit API habis. Top up di dashboard API provider"
  if (httpStatus === 429) return "Terlalu banyak request. Tunggu beberapa saat lalu coba lagi"
  if (httpStatus === 500) return "Server API sedang bermasalah (500). Coba lagi beberapa menit"

  if (!msg) return "Terjadi kesalahan pada API"

  if (msg.includes("积分不足")) {
    const match = msg.match(/([\d.]+).*?([\d.]+)\s*积分/)
    if (match) {
      return (
        `Kredit API tidak mencukupi.\n\n` +
        `💰 Butuh: *${match[1]} kredit*\n` +
        `💳 Saldo sekarang: *${match[2]} kredit*\n\n` +
        `Top up di dashboard API provider`
      )
    }
    return "Kredit API tidak mencukupi. Top up di dashboard API provider"
  }

  if (msg.includes("未找到支持模型") || msg.includes("渠道")) {
    return "Model tidak tersedia di akun kamu. Cek dashboard API provider"
  }

  if (msg.includes("请求频率") || msg.includes("频率限制")) {
    return "Terlalu banyak request. Tunggu beberapa saat lalu coba lagi"
  }

  return msg
}

function getHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  }
}

async function createAndPoll(ruxaModel, input) {
  if (!API_KEY) throw new Error("AIVIDEO_API_KEY atau RUXA_API_KEY belum diset di environment")

  const isAIVideoAPI = BASE_URL.includes("aivideoapi.com")

  let createUrl, pollUrlBase
  if (isAIVideoAPI) {
    createUrl = `${BASE_URL}/tasks/create`
    pollUrlBase = `${BASE_URL}/tasks/query`
  } else {
    createUrl = `${BASE_URL}/tasks/create`
    pollUrlBase = `${BASE_URL}/tasks/query`
  }

  let res
  try {
    res = await axios.post(
      createUrl,
      { model: ruxaModel, input },
      { headers: getHeaders(), timeout: 30000 }
    )
  } catch (err) {
    const status = err.response?.status
    const errMsg = err.response?.data?.message || err.response?.data?.error || err.message

    if (status === 404) {
      throw new Error(
        `Endpoint tidak ditemukan (404). ` +
        `Base URL: ${BASE_URL}\n` +
        `Pastikan API Key dan endpoint sudah benar.`
      )
    }
    if (status) throw new Error(translateError(errMsg, status))
    throw new Error(`Koneksi ke API gagal: ${err.message}`)
  }

  const data = res.data

  if (data?.code && data.code !== 200) {
    throw new Error(translateError(data?.message))
  }

  const taskId = data?.data?.taskId || data?.uuid || data?.id || data?.task_id
  if (!taskId) {
    if (data?.data?.resultUrls?.[0]) return data.data.resultUrls[0]
    if (data?.url || data?.image_url) return data.url || data.image_url
    throw new Error("Tidak ada task ID dari API. Response: " + JSON.stringify(data).slice(0, 300))
  }

  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 4000))

    let queryRes
    try {
      queryRes = await axios.get(
        `${pollUrlBase}/${taskId}`,
        { headers: getHeaders(), timeout: 10000 }
      )
    } catch (err) {
      const status = err.response?.status
      if (status === 404) throw new Error("Task tidak ditemukan. Coba generate ulang")
      if (status === 401) throw new Error(translateError(null, 401))
      console.log(`[ruxaimage] Polling error (attempt ${i + 1}):`, err.message)
      continue
    }

    const taskData = queryRes.data?.data || queryRes.data || {}
    const state = taskData.state || taskData.status || ""
    const stateLower = state.toLowerCase()

    if (stateLower === "success" || stateLower === "succeeded" || stateLower === "completed") {
      let parsed = {}
      try { parsed = JSON.parse(taskData.resultJson || "{}") } catch {}
      const url = parsed?.resultUrls?.[0] || taskData.url || taskData.image_url || taskData.resultUrl
      if (!url) throw new Error("Gambar selesai tapi URL tidak ditemukan")
      return url
    }

    if (stateLower === "fail" || stateLower === "failed" || stateLower === "error") {
      throw new Error("API gagal membuat gambar: " + (taskData.error || taskData.message || state))
    }
  }

  throw new Error("Timeout (2 menit) menunggu gambar dari API. Coba lagi nanti")
}

async function generateImage({ prompt, model }) {
  const ruxaModel = MODEL_MAP[model] || model
  return createAndPoll(ruxaModel, { prompt })
}

async function editImage({ prompt, imageBuffers, model }) {
  const ruxaModel = MODEL_MAP[model] || model

  if (!imageBuffers || imageBuffers.length === 0) {
    throw new Error("Tidak ada gambar yang dikirim")
  }

  const urls = await Promise.all(imageBuffers.map(uploadToCatbox))

  const input = { prompt, image_url: urls[0] }
  if (urls[1]) input.image_url_2 = urls[1]

  return createAndPoll(ruxaModel, input)
}

module.exports = { generateImage, editImage }
