/**
 * hdpro.js — AI Photo Enhancement Sony A1 Style
 * Command: .hdpro
 * 3 TOKEN - menggunakan AI Image Edit (Nano Banana Edit)
 */

require("dotenv").config()
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { editImage }            = require("../ai/ruxaimage")
const { useTokens, getTokens, addTokens, getTokenWarning } = require("../ai/tokendb")

const TOKEN_COST = 3

const HD_PROMPT = `Enhance the portrait while strictly preserving the subject's identity with accurate facial geometry. Do not change their expression or face shape. Only allow subtle feature cleanup without altering who they are. Keep the exact same background from the reference image. No replacements, no changes, no new objects, no layout shifts. The environment must look identical. The image must be recreated as if it was shot on a Sony A1, using an 85mm f1.4 lens, at f1.6, ISO 100, 1/200 shutter speed, cinematic shallow depth of field, perfect facial focus, and an editorial-neutral color profile. This Sony A1 + 85mm f1.4 setup is mandatory. The final image must clearly look like premium full-frame Sony A1 quality. Lighting must match the exact direction, angle, and mood of the reference photo. Upgrade the lighting into a cinematic, subject-focused style: soft directional light, warm highlights, cool shadows, deeper contrast, expanded dynamic range, micro-contrast boost, smooth gradations, and zero harsh shadows. Maintain neutral premium color tone, cinematic contrast curve, natural saturation, real skin texture (not plastic), and subtle film grain. No fake glow, no runway lighting, no over smoothing. Render in 4K resolution, 10-bit color, cinematic editorial style, premium clarity, portrait crop, and keep the original environmental vibe untouched. Re-render the subject with improved realism, depth, texture, and lighting while keeping identity and background fully preserved. NEGATIVE INSTRUCTIONS: No new background. No background change. No overly dramatic lighting. No face morphing. No fake glow. No flat lighting. No over-smooth skin.`

module.exports = {
  name: "hdpro",
  alias: ["hdphoto", "enhancephoto", "sonya1", "fotohd"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    const msg       = m.message
    const quoted    = msg?.extendedTextMessage?.contextInfo?.quotedMessage
    const directImg = msg?.imageMessage
    const quotedImg = quoted?.imageMessage
    const hasImg    = !!(directImg || quotedImg)

    if (!hasImg) {
      return sock.sendMessage(from, {
        text:
          `📸 *HD PRO — AI Photo Enhancement*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Upgrade foto biasa jadi kualitas *Sony A1 + 85mm f/1.4*!\n\n` +
          `✨ *Yang ditingkatkan:*\n` +
          `• Kualitas 4K, 10-bit cinematic\n` +
          `• Lighting sinematik (warm highlights, cool shadows)\n` +
          `• Skin texture natural & realistis\n` +
          `• Depth of field shallow profesional\n` +
          `• Dynamic range & micro-contrast boost\n` +
          `• Warna editorial-neutral premium\n\n` +
          `✅ *Yang TIDAK diubah:*\n` +
          `• Wajah & identitas subjek\n` +
          `• Background & lingkungan\n` +
          `• Ekspresi & bentuk wajah\n\n` +
          `*Cara pakai:*\n` +
          `• Kirim foto + caption *.hdpro*\n` +
          `• Reply foto dengan *.hdpro*\n\n` +
          `🪙 Biaya: *${TOKEN_COST} token*\n` +
          `💰 Token kamu: *${getTokens(sender)}*`
      })
    }

    const tokens = getTokens(sender)
    if (tokens < TOKEN_COST) {
      return sock.sendMessage(from, {
        text:
          `❌ *Token tidak cukup!*\n\n` +
          `🪙 Token kamu: *${tokens}*\n` +
          `💸 Dibutuhkan: *${TOKEN_COST} token*\n\n` +
          `Ketik *.premium* untuk beli token.`
      })
    }

    await sock.sendMessage(from, {
      text:
        `📸 *HD Pro sedang memproses...*\n\n` +
        `🎬 Rendering Sony A1 quality...\n` +
        `✨ Enhancing lighting & texture...\n\n` +
        `⏳ Tunggu 30-60 detik...\n` +
        `🪙 *${TOKEN_COST} token* akan dipotong`
    })

    try {
      let imageBuffer
      if (directImg) {
        imageBuffer = await downloadMediaMessage(
          m, "buffer", {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        )
      } else {
        imageBuffer = await downloadMediaMessage(
          { key: m.key, message: quoted }, "buffer", {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        )
      }

      if (!imageBuffer || imageBuffer.length < 1000) {
        throw new Error("Gagal download gambar atau gambar terlalu kecil")
      }

      const remaining = useTokens(sender, TOKEN_COST)

      const resultUrl = await editImage({
        prompt:       HD_PROMPT,
        imageBuffers: [imageBuffer],
        model:        "nano-banana-edit"
      })

      await sock.sendMessage(from, {
        image:   { url: resultUrl },
        caption:
          `📸 *HD Pro Enhancement Selesai!*\n\n` +
          `🎬 *Sony A1 + 85mm f/1.4 Style*\n` +
          `🤖 Model: *Nano Banana Edit*\n` +
          `🪙 Token terpakai: *${TOKEN_COST}* | Sisa: *${remaining}*\n\n` +
          `_Hasil terbaik dengan foto portrait wajah jelas_`
      })

      const warning = getTokenWarning(sender)
      if (warning) await sock.sendMessage(from, { text: warning })

    } catch (err) {
      addTokens(sender, TOKEN_COST)
      console.log("[hdpro] ERROR:", err.message)
      await sock.sendMessage(from, {
        text:
          `❌ *Gagal enhance foto!*\n\n` +
          `📛 ${err.message}\n\n` +
          `🪙 Token dikembalikan: *${TOKEN_COST}*\n\n` +
          `💡 Tips:\n` +
          `• Gunakan foto portrait wajah yang jelas\n` +
          `• Pastikan foto tidak terlalu gelap/blur\n` +
          `• Coba lagi beberapa saat`
      })
    }
  }
}
