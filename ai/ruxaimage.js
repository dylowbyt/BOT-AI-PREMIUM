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

/**
 * Generate gambar baru dari teks prompt
 * @param {{ prompt: string, model: string }} opts
 * @returns {Promise<string>} URL gambar
 */
async function generateImage({ prompt, model }) {
  if (!API_KEY) throw new Error("RUXA_API_KEY belum diset di environment")

  const res = await axios.post(
    `${BASE_URL}/images/generations`,
    {
      model,
      prompt,
      n:    1,
      size: "1024x1024",
      response_format: "url"
    },
    {
      headers: { ...getHeaders(), "Content-Type": "application/json" },
      timeout: 120000
    }
  )

  const item = res.data?.data?.[0]
  if (!item) {
    throw new Error("Tidak ada data gambar dari API: " + JSON.stringify(res.data).slice(0, 200))
  }

  if (item.url)      return item.url
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`

  throw new Error("Format respon API tidak dikenali: " + JSON.stringify(item).slice(0, 200))
}

/**
 * Edit gambar berdasarkan instruksi prompt
 * @param {{ prompt: string, imageBuffer: Buffer, model: string }} opts
 * @returns {Promise<string>} URL gambar hasil edit
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

  const res = await axios.post(
    `${BASE_URL}/images/edits`,
    form,
    {
      headers: {
        ...getHeaders(),
        ...form.getHeaders()
      },
      timeout: 120000
    }
  )

  const item = res.data?.data?.[0]
  if (!item) {
    throw new Error("Tidak ada data gambar dari API: " + JSON.stringify(res.data).slice(0, 200))
  }

  if (item.url)      return item.url
  if (item.b64_json) return `data:image/png;base64,${item.b64_json}`

  throw new Error("Format respon API tidak dikenali: " + JSON.stringify(item).slice(0, 200))
}

module.exports = { generateImage, editImage }
