/**
 * ruxaimage.js — Helper generate & edit gambar via api.ruxa.ai
 * Dipakai oleh plugins/imggen.js
 */

const axios    = require("axios")
const FormData = require("form-data")

const API_KEY  = process.env.RUXA_API_KEY
const BASE_URL = process.env.RUXA_BASE_URL || "https://api.ruxa.ai/v1"

function getHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${API_KEY}`,
    ...extra
  }
}

function extractImageUrl(data) {
  const item = data?.data?.[0]
  if (!item) return null
  if (item.url)      return item.url
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`
  return null
}

/**
 * Generate gambar baru dari teks prompt
 * @param {{ prompt: string, model: string }} opts
 * @returns {Promise<string>} URL atau data:URI gambar
 */
async function generateImage({ prompt, model }) {
  if (!API_KEY) throw new Error("RUXA_API_KEY belum diset di environment")

  let res
  try {
    res = await axios.post(
      `${BASE_URL}/images/generations`,
      { model, prompt, n: 1, size: "1024x1024" },
      {
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        timeout: 120000
      }
    )
  } catch (err) {
    const detail = err?.response?.data
    const status = err?.response?.status
    console.log(`[ruxaimage] generateImage error ${status}:`, JSON.stringify(detail).slice(0, 400))
    throw new Error(
      `API error ${status}: ` +
      (detail?.error?.message || detail?.message || JSON.stringify(detail).slice(0, 200))
    )
  }

  const url = extractImageUrl(res.data)
  if (!url) {
    console.log("[ruxaimage] generateImage unknown response:", JSON.stringify(res.data).slice(0, 400))
    throw new Error("Format respon tidak dikenali: " + JSON.stringify(res.data).slice(0, 200))
  }

  return url
}

/**
 * Edit gambar berdasarkan instruksi prompt
 * @param {{ prompt: string, imageBuffer: Buffer, model: string }} opts
 * @returns {Promise<string>} URL atau data:URI gambar hasil edit
 */
async function editImage({ prompt, imageBuffer, model }) {
  if (!API_KEY) throw new Error("RUXA_API_KEY belum diset di environment")

  const form = new FormData()
  form.append("model",  model)
  form.append("prompt", prompt)
  form.append("n",      "1")
  form.append("size",   "1024x1024")
  form.append("image",  imageBuffer, {
    filename:    "image.png",
    contentType: "image/png"
  })

  let res
  try {
    res = await axios.post(
      `${BASE_URL}/images/edits`,
      form,
      {
        headers: { ...getHeaders(), ...form.getHeaders() },
        timeout: 120000
      }
    )
  } catch (err) {
    const detail = err?.response?.data
    const status = err?.response?.status
    console.log(`[ruxaimage] editImage error ${status}:`, JSON.stringify(detail).slice(0, 400))
    throw new Error(
      `API error ${status}: ` +
      (detail?.error?.message || detail?.message || JSON.stringify(detail).slice(0, 200))
    )
  }

  const url = extractImageUrl(res.data)
  if (!url) {
    console.log("[ruxaimage] editImage unknown response:", JSON.stringify(res.data).slice(0, 400))
    throw new Error("Format respon tidak dikenali: " + JSON.stringify(res.data).slice(0, 200))
  }

  return url
}

module.exports = { generateImage, editImage }
