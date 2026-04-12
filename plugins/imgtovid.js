const axios = require("axios")
const FormData = require("form-data")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { getTokens, addTokens, useTokens } = require("../ai/tokendb")

const RUXA_API_KEY = process.env.RUXA_API_KEY || process.env.STORYNOTE_API_KEY
const BASE_URL = process.env.RUXA_BASE_URL || "https://api.ruxa.ai/api/v1"
const DEFAULT_MODEL = process.env.RUXA_IMGTOVID_MODEL || "veo3.1"
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

function getCommand(text) {
  return text.startsWith(".") ? text.slice(1).split(/\s+/)[0].toLowerCase() : "imgtovid"
}

function getArgsText(text) {
  return text.replace(/^\.(imgtovid|img2vidai|motionvid|fototovideo|image2video)\s*/i, "").trim()
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

function getVideoMessage(message) {
  return message?.videoMessage || null
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

async function downloadMedia(sock, m, message, type) {
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

  const image = getImageMessage(message)
  const video = getVideoMessage(message)
  const mimetype = image?.mimetype || video?.mimetype || (type === "video" ? "video/mp4" : "image/jpeg")

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
  if (!rawUrl) throw new Error("Upload file gagal")
  return rawUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/")
}

function buildPrompt(userPrompt) {
  const base = `
Create a high quality motion-transfer image-to-video generation.

Main requirements:
- Use the uploaded image as the main subject and first-frame identity reference.
- Keep the subject's face, identity, hairstyle, outfit, body proportions, posture, and overall appearance consistent with the target image.
- Do not replace the subject with a different person.
- Maintain stable anatomy, natural lighting, realistic perspective, and smooth motion.
- Avoid face distortion, extra fingers, warped body parts, flickering, duplicated people, or identity drift.
- Output should look like a realistic cinematic video, not a cartoon, unless the user explicitly asks for another style.
`.trim()

  const motion = `

Motion reference rules:
- The uploaded video is the motion reference and must be followed.
- Extract the body movement, pose changes, gestures, timing, rhythm, action flow, camera motion, and overall movement pattern from the reference video.
- Apply that motion to the subject from the target image.
- The final video must make the person/photo subject move following the reference video.
- Do not copy the person, face, outfit, background, or identity from the reference video.
- Only transfer the motion and action pattern.
- Keep the target photo subject's face, identity, clothing, body proportions, and appearance consistent while performing the reference movement.
- If the reference video contains dancing, walking, hand gestures, posing, turning, jumping, or camera movement, transfer those movements naturally to the target photo subject.
`.trim()

  const user = userPrompt || "Animate the subject naturally with subtle realistic motion, smooth camera movement, and cinematic lighting."

  return `${base}\n\n${motion}\n\nUser direction:\n${user}`
}

function translateError(err) {
  const status = err.response?.status
  const msg = err.response?.data?.message || err.response?.data?.error || err.message

  if (status === 401) return "API key Ruxa tidak valid. Periksa RUXA_API_KEY."
  if (status === 404) return "Endpoint/model tidak ditemukan. Coba model veo31 atau sora."
  if (status === 429) return "Terlalu banyak request. Tunggu sebentar lalu coba lagi."
  if (typeof msg === "string" && msg.includes("积分不足")) return "Kredit Ruxa AI tidak cukup. Top up dulu di dashboard Ruxa."

  return typeof msg === "string" ? msg : JSON.stringify(msg).slice(0, 300)
}

async function createTask({ model, prompt, imageUrl, motionVideoUrl }) {
  const headers = {
    Authorization: `Bearer ${RUXA_API_KEY}`,
    "Content-Type": "application/json"
  }

  const input = {
    prompt,
    image_url: imageUrl,
    first_frame_image: imageUrl,
    first_frame_url: imageUrl,
    reference_image_url: imageUrl,
    init_image: imageUrl,
    subject_image_url: imageUrl,
    character_image_url: imageUrl,
    seconds: "8",
    duration: 8,
    aspect_ratio: "9:16",
    enhance_prompt: true,
    enable_upsample: false
  }

  if (motionVideoUrl) {
    input.video_url = motionVideoUrl
    input.reference_video_url = motionVideoUrl
    input.motion_reference_video_url = motionVideoUrl
    input.motion_video_url = motionVideoUrl
    input.driving_video_url = motionVideoUrl
    input.pose_video_url = motionVideoUrl
    input.action_reference_video_url = motionVideoUrl
  }

  const res = await axios.post(
    `${BASE_URL}/tasks/create`,
    { model, input },
    { headers, timeout: 45000 }
  )

  if (res.data?.code && res.data.code !== 200) {
    throw new Error(res.data?.message || "Gagal membuat task video")
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
      throw new Error(data.error || data.message || "Ruxa AI gagal membuat video")
    }
  }

  throw new Error("Timeout menunggu video selesai. Coba lagi nanti.")
}

module.exports = {
  name: "imgtovid",
  alias: ["img2vidai", "motionvid", "fototovideo", "image2video"],

  async run(sock, m) {
    const from = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    let tokenDeducted = false

    try {
      const text = getText(m)
      const command = getCommand(text)
      const rawPrompt = getArgsText(text)
      const { model, prompt: userPrompt } = pickModel(rawPrompt)
      const quoted = getQuotedMessage(m)

      const directImage = getImageMessage(m.message)
      const quotedImage = getImageMessage(quoted)
      const directVideo = getVideoMessage(m.message)
      const quotedVideo = getVideoMessage(quoted)

      let imageMessage = null
      let motionVideoMessage = null

      if (directImage) imageMessage = m.message
      if (quotedImage) imageMessage = quoted

      if (directVideo) motionVideoMessage = m.message
      if (quotedVideo) motionVideoMessage = quoted

      if (!imageMessage || !motionVideoMessage) {
        return sock.sendMessage(from, {
          text:
            `🎬 *IMG TO VIDEO AI*\n\n` +
            `Mode ini khusus: *foto mengikuti gerakan dari video referensi*.\n\n` +
            `Cara pakai:\n` +
            `1. Kirim foto target/orang.\n` +
            `2. Reply foto itu dengan video referensi gerakan.\n` +
            `3. Caption video: *.imgtovid <prompt>*\n\n` +
            `Atau kebalikannya:\n` +
            `1. Kirim video referensi gerakan.\n` +
            `2. Reply video itu dengan foto target.\n` +
            `3. Caption foto: *.imgtovid <prompt>*\n\n` +
            `Pilih model opsional:\n` +
            `• *.imgtovid --model veo31 <prompt>*\n` +
            `• *.imgtovid --model veo3 <prompt>*\n` +
            `• *.imgtovid --model sora <prompt>*\n\n` +
            `Contoh:\n` +
            `*.imgtovid --model veo31 orang ini berjalan mengikuti gerakan video referensi, cinematic, realistic*`
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
          `🎬 *Membuat video AI...*\n\n` +
          `🤖 Model: *${model}*\n` +
          `🖼️ Target image: siap\n` +
          `🎞️ Video referensi gerakan: siap\n\n` +
          `🪙 Biaya: *${TOKEN_COST} token*\n` +
          `⏳ Proses bisa 1-5 menit, tunggu ya.`
      })

      useTokens(sender, TOKEN_COST)
      tokenDeducted = true

      const targetImage = await downloadMedia(sock, m, imageMessage, "image")
      const imageUrl = await uploadTmpFile(targetImage.buffer, targetImage.mimetype, "target-image.jpg")

      let motionVideoUrl = null
      if (motionVideoMessage) {
        const motionVideo = await downloadMedia(sock, m, motionVideoMessage, "video")
        motionVideoUrl = await uploadTmpFile(motionVideo.buffer, motionVideo.mimetype, "motion-reference.mp4")
      }

      const finalPrompt = buildPrompt(userPrompt)
      const taskId = await createTask({ model, prompt: finalPrompt, imageUrl, motionVideoUrl })
      const videoUrl = await waitForVideo(taskId)

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption:
          `✅ *Video siap!*\n\n` +
          `🤖 Model: *${model}*\n` +
          `🎞️ Foto mengikuti gerakan dari video referensi\n` +
          `🪙 Token terpakai: *${TOKEN_COST}*\n` +
          `💰 Sisa token: *${getTokens(sender)}*\n` +
          `📝 Prompt: ${userPrompt || "Animasi natural dari foto target"}`
      })

    } catch (err) {
      if (tokenDeducted) addTokens(sender, TOKEN_COST)
      console.log("IMGTOVID ERROR:", err?.response?.data || err?.message)
      await sock.sendMessage(from, {
        text:
          `❌ Gagal membuat image-to-video.\n\n` +
          (tokenDeducted ? `🪙 Token *${TOKEN_COST}* sudah dikembalikan.\n\n` : "") +
          `Error: ${translateError(err)}\n\n` +
          `Tips:\n` +
          `• Coba model lain: --model veo31 / veo3 / sora\n` +
          `• Kirim video referensi sambil reply foto target\n` +
          `• Kalau hasil tidak mengikuti gerakan, berarti model/API yang dipakai belum support motion reference video`
      })
    }
  }
}
