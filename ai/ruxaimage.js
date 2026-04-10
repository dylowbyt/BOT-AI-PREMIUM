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
  "nano-banana-edit": "google/nano-banana",
  "gpt-image-1.5":    "gpt-image-1.5",
  "gpt-4o":           "gpt-4o-image"
}

/**
 * Upload buffer gambar ke catbox.moe untuk mendapatkan URL sementara
 * (diperlukan untuk fitur edit gambar)
 */
async function uploadBuffer(buffer) {
  const form = new FormData()
  form.append("reqtype", "fileupload")
  form.append("fileToUpload", buffer, {
    filename: "image.jpg",
    contentType: "image/jpeg"
  })

  const res = await axios.post("https://catbox.moe/user.php", form, {
    headers: form.getHeaders(),
    timeout: 30000
  })

  const url = (res.data || "").trim()
  if (!url.startsWith("http")) {
    throw new Error("Gagal upload gambar ke server sementara")
  }
  return url
}

/**
 * Polling status task Ruxa AI sampai selesai
 */
async function pollTask(taskId) {
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 4000))

    const res = await axios.get(
      `${BASE_URL}/tasks/query/${taskId}`,
      {
        headers: { Authorization: `Bearer ${RUXA_API_KEY}` },
        timeout: 10000
      }
    )

    const { state, resultJson } = res.data?.data || {}

    if (state === "success") {
      const parsed = JSON.parse(resultJson || "{}")
      const url = parsed?.resultUrls?.[0]
      if (!url) throw new Error("Tidak ada URL hasil dari Ruxa AI")
      return url
    }

    if (state === "fail") {
      throw new Error("Ruxa AI gagal memproses gambar")
    }
  }

  throw new Error("Timeout menunggu hasil dari Ruxa AI")
}

/**
 * Generate gambar dari teks (text-to-image)
 */
async function generateImage({ prompt, model }) {
  if (!RUXA_API_KEY) throw new Error("RUXA_API_KEY belum diset")

  const ruxaModel = MODEL_MAP[model] || model

  let input = { prompt }

  if (ruxaModel.startsWith("google/")) {
    input.aspect_ratio = "1:1"
    input.output_format = "png"
  } else if (ruxaModel === "gpt-image-1.5") {
    input.size = "1:1"
    input.quality = "medium"
  } else {
    // gpt-4o-image
    input.size = "1:1"
  }

  const res = await axios.post(
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

  if (res.data?.code !== 200) {
    throw new Error(res.data?.message || "Gagal membuat task di Ruxa AI")
  }

  const taskId = res.data?.data?.taskId
  if (!taskId) throw new Error("Tidak ada task ID dari Ruxa AI")

  return await pollTask(taskId)
}

/**
 * Edit gambar menggunakan referensi gambar (image-to-image)
 */
async function editImage({ prompt, imageBuffer, model }) {
  if (!RUXA_API_KEY) throw new Error("RUXA_API_KEY belum diset")

  const ruxaModel = MODEL_MAP[model] || model

  // Upload buffer gambar ke server sementara untuk mendapatkan URL
  const imageUrl = await uploadBuffer(imageBuffer)

  let input = { prompt }

  if (ruxaModel.startsWith("google/")) {
    input.image_input = [imageUrl]
    input.aspect_ratio = "1:1"
    input.output_format = "png"
  } else if (ruxaModel === "gpt-image-1.5") {
    input.image = imageUrl
    input.size = "1:1"
    input.quality = "medium"
  } else {
    // gpt-4o-image
    input.image = imageUrl
    input.size = "1:1"
  }

  const res = await axios.post(
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

  if (res.data?.code !== 200) {
    throw new Error(res.data?.message || "Gagal membuat task edit gambar di Ruxa AI")
  }

  const taskId = res.data?.data?.taskId
  if (!taskId) throw new Error("Tidak ada task ID dari Ruxa AI")

  return await pollTask(taskId)
}

module.exports = { generateImage, editImage }
