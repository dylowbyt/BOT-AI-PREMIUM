/**
 * ruxaimage.js — Generate & edit gambar via Ruxa AI
 *
 * ENV:
 *   RUXA_API_KEY   — API Key utama ruxa.ai
 *   RUXA_API_KEY_2 — API Key backup ruxa.ai (opsional)
 */

const axios = require("axios")
const FormData = require("form-data")

const BASE_URL = "https://api.ruxa.ai/api/v1"

// Model mapping: nama lokal → nama model resmi di Ruxa AI
const MODEL_MAP = {
  "nano-banana":      "nano-banana",
  "nano-banana-2":    "nano-banana-2",
  "nano-banana-pro":  "nano-banana-pro",
  "nano-banana-edit": "nano-banana-edit",
  "gpt-image-1":      "gpt-image-1",
  "gpt-image-1.5":    "gpt-image-1-5",
  "gpt-image-1-5":    "gpt-image-1-5",
  "gpt-4o":           "gpt-4o-image",
  "gpt-4o-image":     "gpt-4o-image",
  "sora":             "sora-2",
  "sora-2":           "sora-2",
  "veo-3":            "veo-3",
  "veo-3.1":          "veo-3-1",
  "veo-3-1":          "veo-3-1"
}

// Biaya token per model — sesuai harga kredit Ruxa AI
const TOKEN_COST_MAP = {
  "nano-banana":      3,
  "nano-banana-2":    4,
  "nano-banana-pro":  8,
  "nano-banana-edit": 3,
  "gpt-image-1":      7,
  "gpt-image-1-5":    7,
  "gpt-image-1.5":    7,
  "gpt-4o-image":     10,
  "gpt-4o":           10,
  // video
  "sora-2":           10,
  "sora":             10,
  "veo-3":            16,
  "veo-3-1":          18,
  "veo-3.1":          18
}

function getModelTokenCost(model) {
  if (!model) return 10
  const key = model.toLowerCase()
  if (TOKEN_COST_MAP[key] !== undefined) return TOKEN_COST_MAP[key]
  const mapped = MODEL_MAP[key]
  if (mapped && TOKEN_COST_MAP[mapped] !== undefined) return TOKEN_COST_MAP[mapped]
  return 10
}

function getApiKey(useBackup = false) {
  const key = useBackup
    ? process.env.RUXA_API_KEY_2
    : process.env.RUXA_API_KEY

  if (!key) {
    if (!useBackup) throw new Error("RUXA_API_KEY belum diset di environment")
    throw new Error("RUXA_API_KEY_2 (backup) belum diset di environment")
  }
  return key
}

// Upload buffer gambar ke catbox.moe → dapat URL publik
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

function isInsufficientCredits(msg) {
  if (!msg) return false
  const m = msg.toLowerCase()
  return m.includes("积分不足") || m.includes("insufficient") || m.includes("credit")
}

// Parse angka kredit dari pesan error Ruxa AI
// Contoh pesan: "积分不足，需要3.00积分，当前余额2.00" atau
//               "积分不足,need 3 credits,current balance 2"
function parseCreditNumbers(msg) {
  let butuh = null
  let saldo = null

  // Coba match: "需要X" atau "need X" atau "consume X" (angka yang dibutuhkan)
  const butuhMatch =
    msg.match(/需要\s*([\d.]+)/) ||
    msg.match(/消耗\s*([\d.]+)/) ||
    msg.match(/need[s]?\s*([\d.]+)/i) ||
    msg.match(/require[s]?\s*([\d.]+)/i) ||
    msg.match(/cost[s]?\s*([\d.]+)/i)

  // Coba match: "当前X" atau "余额X" atau "balance X" atau "current X" (saldo)
  const saldoMatch =
    msg.match(/当前[余额]?\s*([\d.]+)/) ||
    msg.match(/余额\s*([\d.]+)/) ||
    msg.match(/balance[:\s]*([\d.]+)/i) ||
    msg.match(/current[:\s]*([\d.]+)/i) ||
    msg.match(/have[:\s]*([\d.]+)/i)

  if (butuhMatch) butuh = parseFloat(butuhMatch[1])
  if (saldoMatch) saldo = parseFloat(saldoMatch[1])

  // Fallback: ambil semua angka dan coba urutan mana yang masuk akal
  if (butuh === null || saldo === null) {
    const allNums = (msg.match(/[\d.]+/g) || []).map(parseFloat)
    // Filter angka yang wajar (kredit antara 0-9999)
    const validNums = allNums.filter(n => n >= 0 && n < 9999)
    if (validNums.length >= 2 && butuh === null && saldo === null) {
      // Biasanya urutan: saldo lebih kecil, butuh lebih besar
      const sorted = [...validNums].sort((a, b) => a - b)
      saldo = sorted[0]
      butuh = sorted[sorted.length - 1]
    } else if (validNums.length === 1) {
      if (butuh === null) butuh = validNums[0]
    }
  }

  return { butuh, saldo }
}

// Terjemahkan error dari Ruxa AI
function translateError(msg, httpStatus) {
  if (httpStatus === 401) return "API Key Ruxa AI tidak valid atau kedaluwarsa"
  if (httpStatus === 429) return "Terlalu banyak request ke Ruxa AI, tunggu sebentar"
  if (httpStatus === 500) return "Server Ruxa AI sedang bermasalah, coba lagi nanti"
  if (!msg) return "Terjadi kesalahan pada Ruxa AI"

  if (msg.includes("积分不足")) {
    const { butuh, saldo } = parseCreditNumbers(msg)

    let result = `Kredit Ruxa AI tidak cukup.\n`
    if (butuh !== null) result += `💰 Dibutuhkan: *${butuh} kredit*\n`
    if (saldo !== null) result += `💳 Saldo kamu: *${saldo} kredit*\n`
    result += `\n🔗 Top up: https://ruxa.ai/dashboard`
    result += `\n\n📝 _Pesan asli Ruxa: ${msg}_`
    return result
  }

  if (msg.includes("未找到支持模型") || msg.includes("渠道")) {
    return (
      `Model tidak tersedia / tidak aktif di akun Ruxa AI.\n` +
      `📝 Pesan asli Ruxa: _${msg}_\n\n` +
      `💡 Gunakan *.cekruxa* untuk lihat daftar model yang benar di akun kamu.`
    )
  }

  return msg
}

// Cek saldo kredit Ruxa AI
async function checkRuxaBalance(apiKey) {
  try {
    const res = await axios.get(
      "https://api.ruxa.ai/api/v1/user/balance",
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
        validateStatus: () => true
      }
    )
    const balance = res.data?.data?.balance ?? res.data?.balance ?? null
    if (balance !== null) return balance
  } catch {}

  try {
    const res = await axios.get(
      "https://api.ruxa.ai/v1/user/info",
      {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
        validateStatus: () => true
      }
    )
    const balance = res.data?.data?.balance ?? res.data?.data?.credit ?? null
    if (balance !== null) return balance
  } catch {}

  return null
}

// Buat task & polling sampai selesai
async function createAndPoll(ruxaModel, input, apiKey) {
  let res
  try {
    res = await axios.post(
      `${BASE_URL}/tasks/create`,
      { model: ruxaModel, input },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 30000,
        validateStatus: () => true
      }
    )
  } catch (err) {
    throw new Error(`Koneksi ke Ruxa AI gagal: ${err.message}`)
  }

  if (res.status === 401) throw new Error(translateError(null, 401))
  if (res.status === 429) throw new Error(translateError(null, 429))
  if (res.status === 500) throw new Error(translateError(null, 500))

  if (res.data?.code !== 200) {
    const rawMsg = res.data?.message || JSON.stringify(res.data)
    console.log(`[ruxaimage] Task creation gagal. Model: ${ruxaModel}, Code: ${res.data?.code}, Msg: ${rawMsg}`)

    if (isInsufficientCredits(rawMsg)) {
      const err = new Error(translateError(rawMsg))
      err.isInsufficientCredits = true
      throw err
    }

    throw new Error(translateError(rawMsg, res.status))
  }

  const taskId = res.data?.data?.taskId
  if (!taskId) throw new Error("Tidak ada task ID dari Ruxa AI")

  // Polling tiap 4 detik, maks 2 menit (30x)
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 4000))

    let queryRes
    try {
      queryRes = await axios.get(
        `${BASE_URL}/tasks/query/${taskId}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 10000,
          validateStatus: () => true
        }
      )
    } catch {
      continue
    }

    if (queryRes.status === 404) throw new Error("Task tidak ditemukan di Ruxa AI")
    if (queryRes.status === 401) throw new Error(translateError(null, 401))

    const taskData = queryRes.data?.data || {}
    const { state, resultJson } = taskData
    const failReason = taskData.failReason || taskData.errorMsg || taskData.error || taskData.message

    if (state === "success") {
      let parsed = {}
      try { parsed = JSON.parse(resultJson || "{}") } catch {}
      const url = parsed?.resultUrls?.[0]
      if (!url) throw new Error("Gambar selesai tapi URL tidak ditemukan")
      return url
    }

    if (state === "fail") {
      if (failReason && isInsufficientCredits(failReason)) {
        const err = new Error(translateError(failReason))
        err.isInsufficientCredits = true
        throw err
      }
      const reason = failReason ? translateError(failReason) : "Coba prompt yang berbeda atau ganti model"
      console.log(`[ruxaimage] Task gagal. Model: ${ruxaModel}, Alasan: ${failReason || "(tidak ada)"}`)
      throw new Error(`Ruxa AI gagal membuat gambar. ${reason}`)
    }
  }

  throw new Error("Timeout (2 menit) menunggu gambar dari Ruxa AI")
}

// Coba dengan key utama, fallback ke backup jika gagal
async function createAndPollWithFallback(ruxaModel, input) {
  const primaryKey = getApiKey(false)

  try {
    return await createAndPoll(ruxaModel, input, primaryKey)
  } catch (err) {
    const backupKey = process.env.RUXA_API_KEY_2
    const shouldTryBackup =
      backupKey &&
      (err.message.includes("tidak valid") ||
       err.message.includes("kedaluwarsa") ||
       err.isInsufficientCredits)

    if (shouldTryBackup) {
      console.log("[ruxaimage] Primary key gagal, coba backup key...")
      return await createAndPoll(ruxaModel, input, backupKey)
    }

    throw err
  }
}

// Generate gambar dari teks
async function generateImage({ prompt, model }) {
  const ruxaModel = MODEL_MAP[model] || model
  return createAndPollWithFallback(ruxaModel, { prompt })
}

// Edit gambar dengan prompt
async function editImage({ prompt, imageBuffers, model }) {
  const ruxaModel = MODEL_MAP[model] || model

  if (!imageBuffers || imageBuffers.length === 0) {
    throw new Error("Tidak ada gambar yang dikirim")
  }

  const urls = await Promise.all(imageBuffers.map(uploadToCatbox))

  const input = { prompt, image_url: urls[0] }
  if (urls[1]) input.image_url_2 = urls[1]

  return createAndPollWithFallback(ruxaModel, input)
}

module.exports = {
  generateImage,
  editImage,
  getModelTokenCost,
  TOKEN_COST_MAP,
  MODEL_MAP,
  checkRuxaBalance,
  isInsufficientCredits,
  parseCreditNumbers
}
