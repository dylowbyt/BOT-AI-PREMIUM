/**
 * storynote.js — Helper StorynoteAI (FIXED)
 * Auto-buat project lalu generate gambar + debug 403
 */

const axios = require("axios")

const API_KEY  = process.env.STORYNOTE_API_KEY
const BASE_URL = process.env.STORYNOTE_BASE_URL || "https://api.storynote.ai/v1"

function getHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    Origin: "https://app.storynote.ai",
    Referer: "https://app.storynote.ai/"
  }
}

async function getProjectId() {
  const res = await axios.post(
    `${BASE_URL}/projects`,
    { name: "WA Bot Image Gen" },
    { headers: getHeaders() }
  )

  const projectId =
    res.data?.project?._id ||
    res.data?.id ||
    res.data?.projectId ||
    res.data?.data?.id

  if (!projectId) {
    console.log("RESP:", res.data)
    throw new Error("Gagal mendapat projectId")
  }

  return projectId
}

async function generateImage({
  prompt,
  modelId = "default",
  aspectRatio = "1:1",
  maxWaitMs = 90000
}) {
  if (!API_KEY) {
    throw new Error("STORYNOTE_API_KEY belum diset")
  }

  const projectId = await getProjectId()
  const headers   = getHeaders()

  let createRes

  try {
    createRes = await axios.post(
      `${BASE_URL}/projects/${projectId}/image`,
      {
        directPrompt: prompt,
        modelId,
        aspectRatio,
        numImages: 1
      },
      {
        headers,
        validateStatus: () => true // penting untuk debug
      }
    )
  } catch (err) {
    console.log("REQUEST ERROR:", err.message)
    throw err
  }

  // 🔍 DEBUG RESPONSE
  if (createRes.status !== 200 && createRes.status !== 201) {
    console.log("❌ STATUS:", createRes.status)
    console.log("❌ RESPONSE:", JSON.stringify(createRes.data, null, 2))
    throw new Error(`Storynote error ${createRes.status}`)
  }

  const jobId =
    createRes.data?.jobId ||
    createRes.data?.jobIds?.[0]

  if (!jobId) {
    console.log("RESP:", createRes.data)
    throw new Error("Tidak mendapat jobId")
  }

  const interval = 3000
  const maxTries = Math.ceil(maxWaitMs / interval)

  for (let i = 0; i < maxTries; i++) {
    await new Promise(r => setTimeout(r, interval))

    const poll = await axios.get(
      `${BASE_URL}/jobs/${jobId}`,
      { headers }
    )

    const job = poll.data

    if (job.status === "completed" && job.imageUrl) {
      return job.imageUrl
    }

    if (job.status === "failed") {
      throw new Error("Generate gagal: " + (job.error || "unknown"))
    }
  }

  throw new Error("Timeout: gambar tidak selesai")
}

module.exports = { generateImage }
