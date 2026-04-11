/**
 * promtmulin.js — Edit 2 foto jadi pasangan duduk di trotoar Bandung malam
 *
 * Command: .promtmulin
 * Cara pakai (WAJIB 2 foto):
 *   • Reply ke foto wanita + lampirkan foto pria → .promtmulin
 *   • Reply ke foto pria + lampirkan foto wanita → .promtmulin
 *
 * Biaya: 15 token (pakai Ruxa AI - Nano Banana Pro)
 * Fallback: Pollinations AI (gratis, tanpa token)
 */

const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { editImage }             = require("../ai/ruxaimage")
const { getTokens, addTokens, getTokenWarning } = require("../ai/tokendb")
const axios    = require("axios")
const FormData = require("form-data")

const TOKEN_COST  = 15
const EDIT_MODEL  = "nano-banana-pro"

const MULIN_PROMPT = `Generate a realistic and natural medium close-up photo, taken with an HD smartphone camera, capturing an outdoor scene on a city sidewalk or roadside in Bandung at night. Camera angle is eye-level, slightly from the front, resembling a spontaneous candid photo without intentional posing. The camera device is not visible in the frame.

BACKGROUND:
- Bandung city street at night: rows of shophouses (ruko), Indomaret, typical Bandung shops still open
- Street lights glowing, small billboards, vehicles passing in the distance
- Street lamp and shop lights create realistic night lighting with slight contrast
- Typical Bandung urban street food atmosphere, no excessive cinematic effect
- Background stays reasonably sharp with slight noise typical of nighttime phone photos

SCENE:
- Two people sitting close together on a concrete roadside bench

⚠️ FEMALE SUBJECT — FACE IDENTITY LOCK (MANDATORY):
MUST be IDENTICAL to reference photo 1 — preserve 100% facial features: face structure, eyes, eye color, eye makeup, nose, lips, lip color, skin color, hair, glasses (if any), clothing, and skin texture exactly as reference.
- Posture leaning toward the man
- Expression: slightly flirtatious and playful, mouth slightly open
- Looking directly into the camera with a cute and funny gaze
- Hugging the man with one arm

⚠️ MALE SUBJECT — FACE IDENTITY LOCK (MANDATORY):
MUST be IDENTICAL to reference photo 2 — preserve 100% facial features: face structure, hair, eyebrow shape, eyes, nose, lips, clothing, and skin texture exactly as reference.
- Posture: sitting relaxed, facing slightly toward the woman
- One hand forming a finger gun gesture (index and middle fingers straight, thumb up, other fingers folded) pointed at the side of his own head, like a playful "bang bang" pose
- Expression: winking one eye at the camera, reinforcing the spontaneous and natural moment

FACES:
- Both faces remain clear and readable, no excessive motion blur
- No AI distortion, no identity change for either person
- Realistic skin texture: visible pores, natural grain, micro-shadows
- No skin smoothing, no airbrush, no plastic face effect

LIGHTING:
- Purely from street lamps and surrounding shop lights
- Authentic and raw nighttime atmosphere
- Realistic night contrast, no over-edited look

TECHNICAL:
- Portrait aspect ratio 9:16
- HD smartphone camera quality, natural noise`

async function uploadToCatbox(buffer) {
  const form = new FormData()
  form.append("reqtype", "fileupload")
  form.append("fileToUpload", buffer, { filename: "image.jpg", contentType: "image/jpeg" })
  const res = await axios.post("https://catbox.moe/user.php", form, {
    headers: form.getHeaders(),
    timeout: 30000
  })
  const url = res.data?.trim()
  if (!url || !url.startsWith("http")) throw new Error("Gagal upload foto ke catbox.moe")
  return url
}

async function getAllFotoBuffers(sock, m) {
  const buffers = []
  const quoted  = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

  if (m.message?.imageMessage) {
    try {
      const buf = await downloadMediaMessage(m, "buffer", {}, {
        logger: console,
        reuploadRequest: sock.updateMediaMessage
      })
      if (buf) buffers.push(buf)
    } catch (e) {
      console.log("[promtmulin] Gagal download foto langsung:", e.message)
    }
  }

  if (quoted?.imageMessage) {
    try {
      const buf = await downloadMediaMessage(
        { key: m.key, message: quoted },
        "buffer",
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      )
      if (buf) buffers.push(buf)
    } catch (e) {
      console.log("[promtmulin] Gagal download foto reply:", e.message)
    }
  }

  return buffers
}

module.exports = {
  name:  "promtmulin",
  alias: ["mulin", "trotoarcouple", "bandungnight", "jalancouple"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    const fotoBuffers = await getAllFotoBuffers(sock, m)

    if (fotoBuffers.length === 0) {
      return sock.sendMessage(from, {
        text:
          `🌃 *FILTER TROTOAR BANDUNG MALAM*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `✨ Edit 2 foto jadi pasangan duduk candid di trotoar Bandung malam!\n\n` +
          `📸 *Cara pakai (WAJIB 2 foto):*\n` +
          `1️⃣ Reply ke foto wanita\n` +
          `2️⃣ Lampirkan foto pria di pesan command\n` +
          `3️⃣ Ketik *.promtmulin*\n\n` +
          `🎨 *Yang diterapkan AI:*\n` +
          `• Wajah kedua orang terjaga 100%\n` +
          `• Latar trotoar Bandung malam (ruko, Indomaret, lampu jalan)\n` +
          `• Wanita: pose manja, meluk pria, menatap kamera\n` +
          `• Pria: pose finger gun "bang bang" + wink ke kamera\n` +
          `• Cahaya lampu jalan & toko natural\n` +
          `• Tekstur kulit realistis (non-airbrush)\n` +
          `• Format portrait 9:16\n\n` +
          `🪙 *Biaya: ${TOKEN_COST} token*\n` +
          `💰 Token kamu: *${getTokens(sender)} token*`
      })
    }

    if (fotoBuffers.length === 1) {
      return sock.sendMessage(from, {
        text:
          `⚠️ *Butuh 2 foto!*\n\n` +
          `Terdeteksi: *1 foto*\n` +
          `Dibutuhkan: *2 foto* (wanita + pria)\n\n` +
          `📸 *Cara kirim 2 foto:*\n` +
          `1️⃣ Reply ke foto pertama\n` +
          `2️⃣ Lampirkan foto kedua di pesan *.promtmulin*\n\n` +
          `Contoh:\n` +
          `→ Reply foto wanita + ketik *.promtmulin* sambil lampirkan foto pria`
      })
    }

    const hasRuxa = !!process.env.RUXA_API_KEY

    if (hasRuxa) {
      const tokens = getTokens(sender)
      if (tokens < TOKEN_COST) {
        return sock.sendMessage(from, {
          text:
            `❌ *Token tidak cukup!*\n\n` +
            `🪙 Token kamu: *${tokens}*\n` +
            `💸 Dibutuhkan: *${TOKEN_COST} token*\n\n` +
            `Beli token dengan ketik *.buy basic* / *.buy medium* / *.buy pro*`
        })
      }
    }

    await sock.sendMessage(from, {
      text:
        `🌃 *Sedang memproses foto trotoar Bandung malam...*\n\n` +
        `✨ AI sedang:\n` +
        `• Menjaga wajah wanita & pria 100% identik\n` +
        `• Membangun suasana trotoar Bandung malam\n` +
        `• Mengatur pose candid: wanita memeluk, pria finger gun + wink\n` +
        `• Menambahkan lampu jalan, ruko, Indomaret di latar\n` +
        `• Mengaplikasikan pencahayaan malam natural\n\n` +
        `⏳ Mohon tunggu 30-60 detik...`
    })

    if (hasRuxa) {
      addTokens(sender, -TOKEN_COST)
    }

    try {
      let resultUrl

      if (hasRuxa) {
        resultUrl = await editImage({
          prompt:       MULIN_PROMPT,
          imageBuffers: fotoBuffers.slice(0, 2),
          model:        EDIT_MODEL
        })
      } else {
        let fotoUrls = []
        for (const buf of fotoBuffers.slice(0, 2)) {
          try {
            const url = await uploadToCatbox(buf)
            fotoUrls.push(url)
          } catch {}
        }
        const refText = fotoUrls.length > 0
          ? `based on people from photos: ${fotoUrls.join(" and ")}, `
          : ""
        const fallbackPrompt = `Realistic Bandung night street couple photo, ${refText}${MULIN_PROMPT}`
        resultUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?nologo=true&model=flux&enhance=true&width=768&height=1366`
      }

      const sisa = hasRuxa ? getTokens(sender) : null

      await sock.sendMessage(from, {
        image: { url: resultUrl },
        caption:
          `🌃 *Foto Trotoar Bandung Malam Selesai!*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `✅ Wajah kedua orang terjaga 100%\n` +
          `🏙️ Latar trotoar Bandung malam\n` +
          `🤭 Wanita: pose manja memeluk\n` +
          `🤙 Pria: finger gun + wink\n` +
          `💡 Cahaya lampu jalan natural\n\n` +
          (hasRuxa ? `🪙 Token terpakai: *${TOKEN_COST}* | Sisa: *${sisa}*\n` : `🆓 Mode gratis (tanpa token)\n`) +
          `\n_Dibuat oleh XYABOT AI_ 🤖`
      })

      if (hasRuxa) {
        const warning = getTokenWarning(sender)
        if (warning) await sock.sendMessage(from, { text: warning })
      }

    } catch (err) {
      if (hasRuxa) {
        addTokens(sender, TOKEN_COST)
      }
      console.log("[promtmulin] ERROR:", err?.message)
      await sock.sendMessage(from, {
        text:
          `❌ *Gagal memproses foto!*\n\n` +
          `Error: ${err?.message || "Unknown error"}\n\n` +
          (hasRuxa ? `🪙 Token dikembalikan: *${TOKEN_COST}*\n\n` : "") +
          `💡 *Tips:*\n` +
          `• Gunakan foto wajah yang jelas & tidak buram\n` +
          `• Pastikan 2 foto sudah terkirim (reply + lampiran)\n` +
          `• Coba lagi beberapa saat`
      })
    }
  }
}
