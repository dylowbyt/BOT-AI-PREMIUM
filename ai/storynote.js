/**
 * storynote.js — Helper StorynoteAI
 * Auto-buat project jika belum ada, lalu generate gambar.
 */

const axios = require("axios")
const fs    = require("fs")
const path  = require("path")

const API_KEY      = process.env.STORYNOTE_API_KEY
const CACHE_PATH   = path.resolve(__dirname, "../data/storynote_project.json")
const BASE_URL     = process.env.STORYNOTE_BASE_URL || "https://api.storynote.ai/v1"

function getHeaders() {
  return {
    Authorization:  `Bearer ${API_KEY}`,
    "Content-Type": "application/json"
  }
}

function loadCachedProjectId() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")).projectId || null
    }
  } catch {}
  return null
}

function saveProjectId(projectId) {
  fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true })
  fs.writeFileSync(CACHE_PATH, JSON.stringify({ projectId }))
}

async function getProjectId() {
  const cached = loadCachedProjectId()
  if (cached) return cached

  const res = await axios.post(
    `${BASE_URL}/projects`,
    { name: "WA Bot Image Gen" },
    { headers: getHeaders() }
  )

  const projectId = res.data?.project?._id || res.data?.id || res.data?.projectId || res.data?.data?.id
  if (!projectId) throw new Error("Gagal mendapat projectId dari StorynoteAI")

  saveProjectId(projectId)
  return projectId
}

async function generateImage({ prompt, modelId, aspectRatio = "1:1", maxWaitMs = 90000 }) {
  if (!API_KEY) {
    throw new Error("STORYNOTE_API_KEY belum diset")
  }

  const projectId = await getProjectId()
  const headers   = getHeaders()

  const createRes = await axios.post(
    `${BASE_URL}/projects/${projectId}/image`,
    { directPrompt: prompt, modelId, aspectRatio, numImages: 1 },
    { headers }
  )

  const jobId = createRes.data.jobId || createRes.data.jobIds?.[0]
  if (!jobId) throw new Error("Tidak mendapat jobId dari StorynoteAI")

  const interval  = 3000
  const maxTries  = Math.ceil(maxWaitMs / interval)

  for (let i = 0; i < maxTries; i++) {
    await new Promise(r => setTimeout(r, interval))
    const poll = await axios.get(`${BASE_URL}/jobs/${jobId}`, { headers })
    const job  = poll.data
    if (job.status === "completed" && job.imageUrl) return job.imageUrl
    if (job.status === "failed") throw new Error("Generate gagal: " + (job.error || "unknown"))
  }

  throw new Error("Timeout: gambar tidak selesai")
}

module.exports = { generateImage }
