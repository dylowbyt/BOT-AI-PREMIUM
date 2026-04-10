/**
 * ruxaimage.js — Helper untuk generate & edit gambar via Ruxa AI
 * Dipanggil oleh plugins/imggen.js
 *
 * ENV yang dibutuhkan:
 *   RUXA_API_KEY — API Key dari ruxa.ai
 */

const axios = require("axios")
const FormData = require("form-data")

const RUXA_API_KEY = process.env.RUXA_API_KEY
const BASE_URL = "https://api.ruxa.ai/api/v1"

// Mapping nama model dari imggen.js → nama model resmi Ruxa AI
const MODEL_MAP = {
  "nano-banana":      "google/nano-banana",
  "nano-banana-2":    "google/nano-banana-2",
  "nano-banana-pro":  "google/nano-banana-pro",
  "nano-banana-edit": "google/nano-banana-edit",
  "gpt-image-1.5":    "gpt-image-1.5",
  "gpt-4o":           "gpt-4o-image"
}

/**
 * Upload buffer gambar ke catbox.moe dan kembalikan URL publik.
 * Diperlukan karena Ruxa AI hanya menerima URL, bukan base64.
 */
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

/**
 * Terjemahkan pesan/kode error Ruxa AI ke Bahasa Indonesia
 */
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
        `Kredit Ruxa AI tidak mencukupi.\n\n` +
        `💰 Butuh: *${match[1]} kredit*\n` +
        `💳 Saldo sekarang: *${match[2]} kredit*\n\n` +
        `Top up di: https://ruxa.ai/dashboard`
      )
    }
    return "Kredit Ruxa AI tidak mencukupi. Top up di https://ruxa.ai/dashboard"
  }

  if (msg.includes("未找到支持模型") || msg.includes("渠道")) {
    return "Model tidak tersedia di akun Ruxa AI kamu. Cek https://ruxa.ai/dashboard"
  }

  if (msg.includes("请求频率") || msg.includes("频率限制")) {
    return "Terlalu banyak request. Tunggu beberapa saat lalu coba lagi"
  }

  return msg
}

/**
 * Buat task di Ruxa AI dan polling sampai selesai
 */
async function createAndPoll(ruxaModel, input) {
  if (!RUXA_API_KEY) throw new Error("RUXA_API_KEY belum diset di environment")

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
    const status = err.response?.status
    if (status) throw new Error(translateError(err.response?.data?.message, status))
    throw new Error(`Koneksi ke Ruxa AI gagal: ${err.message}`)
  }

  if (res.data?.code !== 200) {
    throw new Error(translateError(res.data?.message))
  }

  const taskId = res.data?.data?.taskId
  if (!taskId) throw new Error("Tidak ada task ID dari Ruxa AI")

  // Polling tiap 4 detik, maks ~2 menit
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 4000))

    let queryRes
    try {
      queryRes = await axios.get(
        `${BASE_URL}/tasks/query/${taskId}`,
        {
          headers: { Authorization: `Bearer ${RUXA_API_KEY}` },
          timeout: 10000
        }
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
      if (!url) throw new Error("Gambar selesai tapi URL tidak ditemukan")
      return url
    }

    if (state === "fail") {
      throw new Error("Ruxa AI gagal membuat gambar. Coba prompt yang berbeda")
    }
  }

  throw new Error("Timeout (2 menit) menunggu gambar dari Ruxa AI. Coba lagi nanti")
}

/**
 * Generate gambar dari teks (text-to-image)
 */
async function generateImage({ prompt, model }) {
  const ruxaModel = MODEL_MAP[model] || model
  return createAndPoll(ruxaModel, { prompt })
}

/**
 * Edit 1 atau 2 gambar sekaligus mengikuti prompt
 * imageBuffers: Array of Buffer (1 atau 2 gambar)
 */
async function editImage({ prompt, imageBuffers, model }) {
  const ruxaModel = MODEL_MAP[model] || model

  if (!imageBuffers || imageBuffers.length === 0) {
    throw new Error("Tidak ada gambar yang dikirim")
  }

  // Upload semua gambar ke catbox.moe secara paralel
  const urls = await Promise.all(imageBuffers.map(uploadToCatbox))

  const input = { prompt, image_url: urls[0] }
  if (urls[1]) input.image_url_2 = urls[1]

  return createAndPoll(ruxaModel, input)
}

module.exports = { generateImage, editImage }
