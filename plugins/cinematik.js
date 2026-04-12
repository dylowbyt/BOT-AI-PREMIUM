const axios = require("axios")
const FormData = require("form-data")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { getTokens, addTokens, useTokens } = require("../ai/tokendb")

const RUXA_API_KEY = process.env.RUXA_API_KEY || process.env.STORYNOTE_API_KEY
const BASE_URL = process.env.RUXA_BASE_URL || "https://api.ruxa.ai/api/v1"
const DEFAULT_MODEL = process.env.RUXA_CINEMATIC_MODEL || "veo3.1"
const TOKEN_COST = 23

const MODEL_MAP = {
  veo3: "veo3",
  veo31: "veo3.1",
  "veo3.1": "veo3.1",
  sora: "sora-2",
  sora2: "sora-2",
  "sora-2": "sora-2"
}

function getText(m) {
  return (
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.imageMessage?.caption ||
    m.message?.videoMessage?.caption ||
    ""
  ).trim()
}

function getArgsText(text) {
  return text.replace(/^\.(cinematik|cinematic|cinema|film|videocinematic|cinematicvid)\s*/i, "").trim()
}

function getQuotedMessage(m) {
  return (
    m.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
    m.message?.imageMessage?.contextInfo?.quotedMessage ||
    m.message?.videoMessage?.contextInfo?.quotedMessage ||
    null
  )
}

function getImageMessage(message) {
  return message?.imageMessage || null
}

function pickModel(rawPrompt) {
  const match = rawPrompt.match(/(?:--model\s+|model\s*=\s*)(veo3\.1|veo31|veo3|sora2|sora-2|sora)/i)
  const modelName = match?.[1]?.toLowerCase()
  const cleanedPrompt = rawPrompt
    .replace(/(?:--model\s+|model\s*=\s*)(veo3\.1|veo31|veo3|sora2|sora-2|sora)/ig, "")
    .trim()

  return {
    model: MODEL_MAP[modelName] || DEFAULT_MODEL,
    prompt: cleanedPrompt
  }
}

async function downloadImage(sock, m, message) {
  const targetMsg = message === m.message ? m : { key: m.key, message }
  const buffer = await downloadMediaMessage(
    targetMsg,
    "buffer",
    {},
    {
      logger: console,
      reuploadRequest: sock.updateMediaMessage
    }
  )

  const mimetype = getImageMessage(message)?.mimetype || "image/jpeg"
  return { buffer, mimetype }
}

async function uploadTmpFile(buffer, mimetype, filename) {
  const form = new FormData()
  form.append("file", buffer, { filename, contentType: mimetype })

  const res = await axios.post("https://tmpfiles.org/api/v1/upload", form, {
    headers: form.getHeaders(),
    timeout: 60000,
    maxBodyLength: Infinity,
    maxContentLength: Infinity
  })

  const rawUrl = res.data?.data?.url
  if (!rawUrl) throw new Error("Upload gambar gagal")
  return rawUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/")
}

function buildCinematicPrompt(userPrompt, hasImageReference) {
  const basePrompt = userPrompt || "seorang karakter berjalan pelan di suasana dramatis dengan pencahayaan sinematik"

  return `
Create a professional cinematic video with premium film quality.

Main scene:
${basePrompt}

Cinematic direction:
- Professional cinematic look, realistic film production quality.
- Smooth camera movement, stable motion, no shaky or jittery camera.
- Use elegant camera motion such as slow dolly in, smooth tracking shot, gentle orbit, cinematic pan, subtle crane movement, or slow push-in.
- Crystal clear 4K visual quality, sharp details, clean textures, high dynamic range, premium color grading.
- Natural realistic lighting with soft highlights, controlled shadows, cinematic depth, and atmospheric mood.
- Smooth subject movement, natural physics, stable anatomy, no flicker, no warped body, no distorted face.
- Keep the scene visually clean, expensive, polished, and professional.
- Use shallow depth of field when appropriate, realistic lens behavior, natural motion blur, and cinematic composition.
- Avoid low resolution, blur, noise, overexposure, glitch, artifacts, unstable frames, duplicated limbs, extra fingers, or distorted faces.
- Output should feel like a high-end commercial film, music video, movie trailer, or luxury brand cinematic shot.

${hasImageReference ? `Image reference rules:
- Use the uploaded image as the visual reference or main subject.
- Preserve the identity, face, outfit, object shape, colors, and important visual details from the image.
- Animate it with smooth cinematic camera movement while keeping the subject consistent.` : ""}

Technical style:
- 4K ultra clear
- cinematic lighting
- smooth camera motion
- realistic detail
- premium film color grading
- stable composition
- high clarity
`.trim()
}

function translateError(err) {
  const status = err.response?.status
  const msg = err.response?.data?.message || err.response?.data?.error || err.message

  if (status === 401) return "API key Ruxa tidak valid. Periksa RUXA_API_KEY."
  if (status === 404) return "Endpoint/model tidak ditemukan. Coba model veo31, veo3, atau sora."
  if (status === 429) return "Terlalu banyak request. Tunggu sebentar lalu coba lagi."
  if (typeof msg === "string" && msg.includes("积分不足")) return "Kredit Ruxa AI tidak cukup. Top up dulu di dashboard Ruxa."

  return typeof msg === "string" ? msg : JSON.stringify(msg).slice(0, 300)
}

async function createTask({ model, prompt, imageUrl }) {
  const headers = {
    Authorization: `Bearer ${RUXA_API_KEY}`,
    "Content-Type": "application/json"
  }

  const input = {
    prompt,
    seconds: "8",
    duration: 8,
    aspect_ratio: "16:9",
    enhance_prompt: true,
    enable_upsample: true,
    quality: "4k",
    resolution: "4k",
    camera_motion: "smooth cinematic professional camera movement",
    style: "professional cinematic 4k realistic film"
  }

  if (imageUrl) {
    input.image_url = imageUrl
    input.first_frame_image = imageUrl
    input.first_frame_url = imageUrl
    input.reference_image_url = imageUrl
    input.init_image = imageUrl
    input.subject_image_url = imageUrl
  }

  const res = await axios.post(
    `${BASE_URL}/tasks/create`,
    { model, input },
    { headers, timeout: 45000 }
  )

  if (res.data?.code && res.data.code !== 200) {
    throw new Error(res.data?.message || "Gagal membuat task cinematic video")
  }

  const taskId = res.data?.data?.taskId || res.data?.task_id || res.data?.id
  if (!taskId) throw new Error("Tidak ada task ID dari Ruxa AI")
  return taskId
}

async function waitForVideo(taskId) {
  const headers = { Authorization: `Bearer ${RUXA_API_KEY}` }

  for (let i = 0; i < 50; i++) {
    await new Promise(resolve => setTimeout(resolve, 6000))

    const res = await axios.get(`${BASE_URL}/tasks/query/${taskId}`, {
      headers,
      timeout: 15000
    })

    const data = res.data?.data || res.data || {}
    const state = data.state || data.status

    if (state === "success" || state === "completed" || state === "succeeded") {
      let parsed = {}
      try { parsed = JSON.parse(data.resultJson || data.result_json || "{}") } catch {}

      const url =
        parsed?.resultUrls?.[0] ||
        parsed?.result_urls?.[0] ||
        parsed?.video_url ||
        parsed?.url ||
        data?.url ||
        data?.video_url ||
        data?.result_url

      if (!url) throw new Error("Video selesai tapi URL hasil tidak ditemukan")
      return url
    }

    if (state === "fail" || state === "failed" || state === "error") {
      throw new Error(data.error || data.message || "Ruxa AI gagal membuat video cinematic")
    }
  }

  throw new Error("Timeout menunggu video selesai. Coba lagi nanti.")
}

module.exports = {
  name: "cinematik",
  alias: ["cinematic", "cinema", "film", "videocinematic", "cinematicvid"],

  async run(sock, m) {
    const from = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    let tokenDeducted = false

    try {
      const text = getText(m)
      const rawPrompt = getArgsText(text)
      const { model, prompt: userPrompt } = pickModel(rawPrompt)
      const quoted = getQuotedMessage(m)

      const directImage = getImageMessage(m.message)
      const quotedImage = getImageMessage(quoted)
      const imageMessage = directImage ? m.message : quotedImage ? quoted : null

      if (!userPrompt && !imageMessage) {
        return sock.sendMessage(from, {
          text:
            `🎥 *CINEMATIC VIDEO AI 4K*\n\n` +
            `Buat video cinematic profesional dengan gerakan kamera smooth dan hasil jernih.\n\n` +
            `Cara pakai teks:\n` +
            `*.cinematik <deskripsi video>*\n\n` +
            `Cara pakai dengan foto:\n` +
            `Reply foto dengan:\n` +
            `*.cinematik <arah gerakan / suasana>*\n\n` +
            `Pilih model opsional:\n` +
            `*.cinematik --model veo31 <prompt>*\n` +
            `*.cinematik --model veo3 <prompt>*\n` +
            `*.cinematik --model sora <prompt>*\n\n` +
            `Contoh:\n` +
            `*.cinematik --model veo31 mobil sport melaju malam hari, smooth tracking shot, cinematic, jernih 4k*`
        })
      }

      if (!RUXA_API_KEY) {
        return sock.sendMessage(from, {
          text: "❌ RUXA_API_KEY belum diset di environment."
        })
      }

      const tokens = getTokens(sender)
      if (tokens < TOKEN_COST) {
        return sock.sendMessage(from, {
          text:
            `❌ *Token kamu tidak cukup!*\n\n` +
            `🪙 Token kamu: *${tokens}*\n` +
            `💸 Dibutuhkan: *${TOKEN_COST} token*\n\n` +
            `Fitur ini termasuk *Premium*.\n` +
            `Ketik *.premium* atau *.buy basic* untuk isi token.`
        })
      }

      await sock.sendMessage(from, {
        text:
          `🎥 *Membuat video cinematic profesional...*\n\n` +
          `🤖 Model: *${model}*\n` +
          `🎬 Style: cinematic professional 4K\n` +
          `📷 Kamera: smooth motion\n` +
          `🖼️ Referensi foto: ${imageMessage ? "ada" : "tidak ada"}\n\n` +
          `🪙 Biaya: *${TOKEN_COST} token*\n` +
          `⏳ Proses bisa 1-5 menit, tunggu ya.`
      })

      useTokens(sender, TOKEN_COST)
      tokenDeducted = true

      let imageUrl = null
      if (imageMessage) {
        const image = await downloadImage(sock, m, imageMessage)
        imageUrl = await uploadTmpFile(image.buffer, image.mimetype, "cinematic-reference.jpg")
      }

      const finalPrompt = buildCinematicPrompt(userPrompt, !!imageUrl)
      const taskId = await createTask({ model, prompt: finalPrompt, imageUrl })
      const videoUrl = await waitForVideo(taskId)

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption:
          `✅ *Video Cinematic Siap!*\n\n` +
          `🤖 Model: *${model}*\n` +
          `🎬 Style: cinematic profesional\n` +
          `📷 Kamera: smooth\n` +
          `✨ Quality: jernih 4K look\n` +
          `🪙 Token terpakai: *${TOKEN_COST}*\n` +
          `💰 Sisa token: *${getTokens(sender)}*\n` +
          `📝 Prompt: ${userPrompt || "Cinematic animation from image reference"}`
      })

    } catch (err) {
      if (tokenDeducted) addTokens(sender, TOKEN_COST)
      console.log("CINEMATIK ERROR:", err?.response?.data || err?.message)
      await sock.sendMessage(from, {
        text:
          `❌ Gagal membuat video cinematic.\n\n` +
          (tokenDeducted ? `🪙 Token *${TOKEN_COST}* sudah dikembalikan.\n\n` : "") +
          `Error: ${translateError(err)}\n\n` +
          `Tips:\n` +
          `• Coba model lain: --model veo31 / veo3 / sora\n` +
          `• Buat prompt lebih jelas: subjek, lokasi, suasana, gerakan kamera\n` +
          `• Jika pakai foto, reply foto dengan command .cinematik`
      })
    }
  }
}
