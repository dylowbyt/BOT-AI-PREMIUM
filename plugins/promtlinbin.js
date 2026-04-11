/**
 * promtlinbin.js — Edit 2 foto jadi pasangan nongkrong di café
 *
 * Command: .promtlinbin
 * Cara pakai (WAJIB 2 foto):
 *   • Reply ke foto wanita + lampirkan foto pria → .promtlinbin
 *   • Reply ke foto pria + lampirkan foto wanita → .promtlinbin
 *
 * Biaya: 15 token (pakai Ruxa AI - Nano Banana Pro)
 * Fallback: Pollinations AI (gratis, tanpa token)
 *
 * ENV yang dibutuhkan:
 *   RUXA_API_KEY — untuk edit foto referensi via Ruxa AI
 */

const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { editImage }             = require("../ai/ruxaimage")
const { getTokens, addTokens, getTokenWarning } = require("../ai/tokendb")
const axios    = require("axios")
const FormData = require("form-data")

const TOKEN_COST  = 15
const EDIT_MODEL  = "nano-banana-pro"

const LINBIN_PROMPT = `Generate a realistic and natural medium close-up photo, taken with an HD smartphone camera, capturing an indoor-semi-outdoor scene at a cozy modern café at night. Camera angle is eye-level, slightly from the front, resembling a candid café hangout photo. The camera device is not visible in the frame.

BACKGROUND:
- Bandung-style urban minimalist café interior
- Warm yellow lighting from hanging lamps and wall lights
- Natural-textured wooden table, industrial-style chairs
- Small plant decorations, coffee shelf, glass window with city light reflections
- On the table: iced coffee, hot latte, and small pastry

⚠️ FACE IDENTITY LOCK (MANDATORY):
The female subject MUST be IDENTICAL to reference photo 1 — preserve 100% facial identity without any alteration, including: skull shape, cheekbone structure, jaw, forehead, face proportions, eye distance, eye shape, nose, lips, eyebrows, smile lines, chin shape, skin color, hair, glasses (if any), and base expression.
❗ DO NOT alter face shape, proportions, or facial character.

The male subject MUST be IDENTICAL to reference photo 2 — preserve 100% face structure, eyebrows, eyes, nose, lips, jaw, head proportions, hair, and clothing.

SKIN TEXTURE (surface only, NOT shape):
- Fine visible pores, natural skin texture, slight skin grain
- Natural micro-shadows, no skin smoothing, no blur, no airbrush
- No plastic face effect — faces must remain original and identical to reference

POSES:
- Woman leaning casually toward the man, one hand on table or holding a drink
- Man sitting relaxed, one hand on table or holding coffee cup, calm and cool expression
- Faces remain sharp, clearly focused, no AI distortion, no identity change

LIGHTING:
- Natural café lighting creates realistic highlights and shadows
- Warm indoor atmosphere, soft bokeh background

TECHNICAL:
- Portrait aspect ratio 9:16
- Ultra-realistic, cinematic quality, professional photography`

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
      console.log("[promtlinbin] Gagal download foto langsung:", e.message)
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
      console.log("[promtlinbin] Gagal download foto reply:", e.message)
    }
  }

  return buffers
}

module.exports = {
  name:  "promtlinbin",
  alias: ["linbin", "cafephoto", "couplefilter", "cafejompo"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    const fotoBuffers = await getAllFotoBuffers(sock, m)

    if (fotoBuffers.length === 0) {
      return sock.sendMessage(from, {
        text:
          `☕ *FILTER CAFÉ COUPLE*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `✨ Edit 2 foto jadi pasangan nongkrong di café malam hari!\n\n` +
          `📸 *Cara pakai (WAJIB 2 foto):*\n` +
          `1️⃣ Reply ke foto wanita\n` +
          `2️⃣ Lampirkan foto pria di pesan command\n` +
          `3️⃣ Ketik *.promtlinbin*\n\n` +
          `🎨 *Yang diterapkan AI:*\n` +
          `• Wajah kedua orang terjaga 100%\n` +
          `• Latar café urban Bandung malam hari\n` +
          `• Pose candid santai nongkrong\n` +
          `• Pencahayaan warm kuning natural\n` +
          `• Meja dengan kopi & pastry\n` +
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
          `2️⃣ Lampirkan foto kedua di pesan *.promtlinbin*\n\n` +
          `Contoh:\n` +
          `→ Reply foto wanita + ketik *.promtlinbin* sambil lampirkan foto pria`
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
        `☕ *Sedang memproses foto café couple...*\n\n` +
        `✨ AI sedang:\n` +
        `• Menjaga wajah wanita & pria 100% identik\n` +
        `• Membangun latar café urban Bandung malam\n` +
        `• Mengatur pose candid nongkrong natural\n` +
        `• Menambahkan kopi, latte, pastry di meja\n` +
        `• Mengaplikasikan pencahayaan warm café\n\n` +
        `⏳ Mohon tunggu 30-60 detik...`
    })

    if (hasRuxa) {
      addTokens(sender, -TOKEN_COST)
    }

    try {
      let resultUrl

      if (hasRuxa) {
        resultUrl = await editImage({
          prompt:       LINBIN_PROMPT,
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
        const fallbackPrompt = `Realistic café couple photo, ${refText}${LINBIN_PROMPT}`
        resultUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?nologo=true&model=flux&enhance=true&width=768&height=1366`
      }

      const sisa = hasRuxa ? getTokens(sender) : null

      await sock.sendMessage(from, {
        image: { url: resultUrl },
        caption:
          `☕ *Foto Café Couple Selesai!*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `✅ Wajah kedua orang terjaga 100%\n` +
          `🌃 Latar café urban Bandung malam\n` +
          `🪑 Pose candid nongkrong natural\n` +
          `☕ Kopi + pastry di meja\n` +
          `💡 Pencahayaan warm café\n\n` +
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
      console.log("[promtlinbin] ERROR:", err?.message)
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
