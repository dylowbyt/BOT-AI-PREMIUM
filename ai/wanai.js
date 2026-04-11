/**
 * wanai.js — Helper Swap Avatar Video via Ruxa AI
 * Menggunakan RUXA_API_KEY yang sama dengan veo3.1
 *
 * ENV yang dibutuhkan:
 *   RUXA_API_KEY — API Key dari ruxa.ai (sama dengan veo/sora)
 */

const axios    = require("axios")
const FormData = require("form-data")

const RUXA_API_KEY = process.env.RUXA_API_KEY
const BASE_URL     = "https://api.ruxa.ai/api/v1"

function getHeaders() {
  return {
    Authorization:  `Bearer ${RUXA_API_KEY}`,
    "Content-Type": "application/json"
  }
}

/**
 * Upload buffer (gambar/video) ke catbox.moe dan kembalikan URL publik
 */
async function uploadToCatbox(buffer, filename, contentType) {
  const form = new FormData()
  form.append("reqtype", "fileupload")
  form.append("fileToUpload", buffer, { filename, contentType })

  const res = await axios.post("https://catbox.moe/user.php", form, {
    headers:          form.getHeaders(),
    timeout:          60000,
    maxContentLength: Infinity,
    maxBodyLength:    Infinity
  })

  const url = res.data?.trim()
  if (!url || !url.startsWith("http")) throw new Error("Gagal upload ke catbox.moe")
  return url
}

function translateError(msg, httpStatus) {
  if (httpStatus === 401) return "RUXA_API_KEY tidak valid atau sudah kedaluwarsa"
  if (httpStatus === 429) return "Terlalu banyak request ke Ruxa AI. Tunggu sebentar lalu coba lagi"
  if (httpStatus === 404) return "Endpoint Ruxa AI tidak ditemukan (404). Coba lagi nanti"
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
    return "Model swap avatar tidak tersedia di akun Ruxa AI kamu. Cek https://ruxa.ai/dashboard"
  }
  return msg
}

/**
 * Swap avatar (wajah) pada video menggunakan Ruxa AI
 * @param {Buffer} faceBuffer   - Buffer gambar wajah (foto sumber)
 * @param {Buffer} videoBuffer  - Buffer video target
 * @param {string} faceType     - Mime type gambar (default: image/jpeg)
 * @param {string} videoType    - Mime type video (default: video/mp4)
 * @returns {string} URL video hasil swap
 */
async function swapAvatarVideo({ faceBuffer, videoBuffer, faceType = "image/jpeg", videoType = "video/mp4" }) {
  if (!RUXA_API_KEY) throw new Error("RUXA_API_KEY belum diset di environment")

  // Upload wajah & video ke catbox.moe secara paralel
  const [faceUrl, videoUrl] = await Promise.all([
    uploadToCatbox(faceBuffer, "face.jpg",   faceType),
    uploadToCatbox(videoBuffer, "video.mp4", videoType)
  ])

  // Buat task di Ruxa AI
  let res
  try {
    res = await axios.post(
      `${BASE_URL}/tasks/create`,
      {
        model: "wan-ai/video-reface",
        input: {
          source_image: faceUrl,
          target_video: videoUrl
        }
      },
      { headers: getHeaders(), timeout: 30000 }
    )
  } catch (err) {
    const status = err.response?.status
    const msg    = err.response?.data?.message || err.response?.data?.error || err.message
    if (status) throw new Error(translateError(msg, status))
    throw new Error(`Koneksi ke Ruxa AI gagal: ${err.message}`)
  }

  if (res.data?.code !== 200) {
    throw new Error(translateError(res.data?.message))
  }

  const taskId = res.data?.data?.taskId
  if (!taskId) throw new Error("Tidak ada task ID dari Ruxa AI")

  // Polling tiap 6 detik, maks 5 menit (50x)
  for (let i = 0; i < 50; i++) {
    await new Promise(r => setTimeout(r, 6000))

    let queryRes
    try {
      queryRes = await axios.get(
        `${BASE_URL}/tasks/query/${taskId}`,
        { headers: getHeaders(), timeout: 15000 }
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

    if (state === "fail") {
      throw new Error("Ruxa AI gagal swap avatar. Coba dengan foto wajah yang lebih jelas")
    }
  }

  throw new Error("Timeout (5 menit) menunggu hasil dari Ruxa AI. Coba lagi nanti")
}

module.exports = { swapAvatarVideo, uploadToCatbox }
