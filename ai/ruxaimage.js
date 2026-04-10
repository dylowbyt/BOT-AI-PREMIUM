/**
 * ruxaimage.js — Helper generate & edit gambar via api.ruxa.ai
 * Dipakai oleh plugins/imggen.js
 *
 * Endpoint: POST https://api.ruxa.ai/client/api/tasks
 */

const axios = require("axios")

const API_KEY  = process.env.RUXA_API_KEY
const BASE_URL = "https://api.ruxa.ai"


function getHeaders() {
  return {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${API_KEY}`,
    "X-API-Key":     API_KEY
  }
}

async function submitTask(body) {
  try {
    const res = await axios.post(
      `${BASE_URL}/client/api/tasks`,
      body,
      { headers: getHeaders(), timeout: 30000 }
    )
    return res.data
  } catch (err) {
    const status = err?.response?.status
    const detail = err?.response?.data
    console.log(`[ruxaimage] submitTask error ${status}:`, JSON.stringify(detail).slice(0, 400))
    throw new Error(
      `API error ${status}: ` +
      (detail?.error?.message || detail?.message || detail?.msg || JSON.stringify(detail).slice(0, 200))
    )
  }
}

async function pollTask(taskId, maxWaitMs = 120000) {
  const interval = 4000
  const maxTries = Math.ceil(maxWaitMs / interval)

  for (let i = 0; i < maxTries; i++) {
    await new Promise(r => setTimeout(r, interval))

    try {
      const res = await axios.get(
        `${BASE_URL}/client/api/tasks/${taskId}`,
        { headers: getHeaders(), timeout: 15000 }
      )

      const data = res.data
      const status = data?.status || data?.data?.status

      console.log(`[ruxaimage] poll [${i + 1}] taskId=${taskId} status=${status}`)

      if (status === "completed" || status === "succeed" || status === "success") {
        const url =
          data?.output?.image_url  ||
          data?.output?.url        ||
          data?.data?.output?.image_url ||
          data?.data?.output?.url  ||
          data?.result?.url        ||
          data?.image_url          ||
          data?.url
        if (url) return url
      }

      if (status === "failed" || status === "error") {
        throw new Error(
          "Task gagal: " + (data?.error || data?.message || data?.data?.error || "unknown")
        )
      }

    } catch (pollErr) {
      if (pollErr.message.includes("gagal") || pollErr.message.includes("failed")) {
        throw pollErr
      }
      console.log("[ruxaimage] poll request error:", pollErr?.message)
    }
  }

  throw new Error("Timeout: gambar tidak selesai dalam " + Math.round(maxWaitMs / 1000) + " detik")
}

/**
 * Generate gambar baru dari teks prompt
 * @param {{ prompt: string, model: string }} opts
 * @returns {Promise<string>} URL gambar
 */
async function generateImage({ prompt, model }) {
  if (!API_KEY) throw new Error("RUXA_API_KEY belum diset di environment")

  const taskData = await submitTask({
    model,
    input: {
      prompt,
      output_format: "png",
      image_size:    "1:1"
    }
  })

  const taskId = taskData?.task_id || taskData?.id || taskData?.data?.task_id || taskData?.data?.id
  if (!taskId) {
    const url = taskData?.output?.image_url || taskData?.output?.url || taskData?.url
    if (url) return url
    console.log("[ruxaimage] no taskId in response:", JSON.stringify(taskData).slice(0, 300))
    throw new Error("Tidak mendapat task_id dari API: " + JSON.stringify(taskData).slice(0, 200))
  }

  return await pollTask(taskId, 120000)
}

/**
 * Edit gambar berdasarkan instruksi prompt
 * @param {{ prompt: string, imageBuffer: Buffer, model: string }} opts
 * @returns {Promise<string>} URL gambar hasil edit
 */
async function editImage({ prompt, imageBuffer, model }) {
  if (!API_KEY) throw new Error("RUXA_API_KEY belum diset di environment")

  const base64 = imageBuffer.toString("base64")

  const taskData = await submitTask({
    model,
    input: {
      prompt,
      image:         `data:image/png;base64,${base64}`,
      output_format: "png",
      image_size:    "1:1"
    }
  })

  const taskId = taskData?.task_id || taskData?.id || taskData?.data?.task_id || taskData?.data?.id
  if (!taskId) {
    const url = taskData?.output?.image_url || taskData?.output?.url || taskData?.url
    if (url) return url
    console.log("[ruxaimage] editImage no taskId:", JSON.stringify(taskData).slice(0, 300))
    throw new Error("Tidak mendapat task_id dari API: " + JSON.stringify(taskData).slice(0, 200))
  }

  return await pollTask(taskId, 120000)
}

module.exports = { generateImage, editImage }
