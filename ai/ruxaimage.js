/**
 * ruxaimage.js — Helper generate gambar via ruxa.ai
 * Menggunakan format OpenAI-compatible API
 * Mendukung: nano-banana, nano-banana-2, nano-banana-pro,
 *            nano-banana-edit, gpt-image-1.5, gpt-4o
 */

const axios = require("axios")
const fs    = require("fs")
const path  = require("path")
const os    = require("os")

const RUXA_API_KEY = process.env.RUXA_API_KEY
const BASE_URL     = process.env.RUXA_BASE_URL || "https://ruxa.ai/api/v1/tasks/create"

function getHeaders(contentType = "application/json") {
  return {
    Authorization:  `Bearer ${RUXA_API_KEY}`,
    "Content-Type": contentType
  }
}

/**
 * Generate gambar dari text prompt
 * @param {string} prompt
 * @param {string} model   — model name di ruxa.ai
 * @param {string} size    — ukuran gambar, default "1024x1024"
 * @returns {string} URL gambar
 */
async function generateImage({ prompt, model, size = "1024x1024" }) {
  if (!RUXA_API_KEY) throw new Error("RUXA_API_KEY belum diset di Railway")

  const res = await axios.post(
    `${BASE_URL}/images/generations`,
    { model, prompt, n: 1, size },
    { headers: getHeaders() }
  )

  const url = res.data?.data?.[0]?.url || res.data?.data?.[0]?.b64_json
  if (!url) {
    console.log("[RuxaImage] Response:", JSON.stringify(res.data))
    throw new Error("Tidak mendapat URL gambar dari ruxa.ai")
  }

  if (url.startsWith("http")) return url

  const tmpPath = path.join(os.tmpdir(), `ruxa_img_${Date.now()}.png`)
  fs.writeFileSync(tmpPath, Buffer.from(url, "base64"))
  return tmpPath
}

/**
 * Edit gambar berdasarkan prompt (model edit)
 * @param {string} prompt
 * @param {Buffer|string} imageData  — buffer atau path gambar
 * @param {string} model
 * @returns {string} URL atau path gambar hasil
 */
async function editImage({ prompt, imageBuffer, model, size = "1024x1024" }) {
  if (!RUXA_API_KEY) throw new Error("RUXA_API_KEY belum diset di Railway")

  const FormData = require("form-data")
  const form     = new FormData()

  form.append("model",  model)
  form.append("prompt", prompt)
  form.append("n",      "1")
  form.append("size",   size)
  form.append("image",  imageBuffer, { filename: "image.png", contentType: "image/png" })

  const res = await axios.post(
    `${BASE_URL}/images/edits`,
    form,
    { headers: { Authorization: `Bearer ${RUXA_API_KEY}`, ...form.getHeaders() } }
  )

  const url = res.data?.data?.[0]?.url || res.data?.data?.[0]?.b64_json
  if (!url) {
    console.log("[RuxaImage Edit] Response:", JSON.stringify(res.data))
    throw new Error("Tidak mendapat URL gambar hasil edit dari ruxa.ai")
  }

  if (url.startsWith("http")) return url

  const tmpPath = path.join(os.tmpdir(), `ruxa_edit_${Date.now()}.png`)
  fs.writeFileSync(tmpPath, Buffer.from(url, "base64"))
  return tmpPath
}

module.exports = { generateImage, editImage }
