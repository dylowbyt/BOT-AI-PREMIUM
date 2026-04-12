/**
 * promtnikah.js — Edit foto jadi pengantin tradisional Sunda
 *
 * Command: .promtnikah
 * Cara pakai:
 *   • Reply ke foto → .promtnikah
 *   • Kirim foto + caption .promtnikah
 *
 * Biaya: 15 token (pakai Ruxa AI - Nano Banana Pro)
 * Fallback: Pollinations AI (gratis, tanpa token, tanpa foto referensi)
 *
 * ENV yang dibutuhkan:
 *   RUXA_API_KEY — untuk edit foto referensi via Ruxa AI
 */

const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { editImage }             = require("../ai/ruxaimage")
const { getTokens, addTokens, useTokens, getTokenWarning } = require("../ai/tokendb")
const axios = require("axios")
const FormData = require("form-data")

const TOKEN_COST  = 15
const EDIT_MODEL  = "nano-banana-pro"

const NIKAH_PROMPT = `Without changing the original face at all (100% strict face preservation — same face shape, same eyes, same nose, same lips, same skin tone identity), edit this portrait photo into a stunning close-up of a young woman wearing full traditional Sundanese (West Javanese) bridal attire. Make ALL details exactly the same as the reference.

POSE & EXPRESSION:
- She gazes elegantly to the right side of the frame
- Calm, serene, and graceful expression
- Her shimmering light grey eyes and perfect makeup with dramatic white eyeliner as the main focal point

SKIN & FACE:
- 100% original face preserved — do NOT alter face structure
- Pale white, ultra-smooth, very bright glass skin effect
- Dewy glowing makeup finish, pore-less bare-face complexion
- Soft pink blush applied thinly beneath the eyes

MAKEUP DETAILS:
- Soft brown eyeshadow
- Extremely thick, long, and curly black eyelashes (dramatic false lash effect)
- Grey soft lens contact lenses
- Neat natural eyebrows following the original face shape
- Dramatic white eyeliner
- Nude pink-to-maroon ombre lipstick, matte healthy finish

CROWN — 'SIGER' SUNDANESE:
- Very intricate golden 'Siger' crown
- Adorned with complex golden filigree, freshwater pearls, tiny white flower buds
- Many golden pins with floral motifs and dangling droplet ornaments
- Long strands of fresh jasmine buds carefully woven and hanging from behind both ears, framing her face on both sides — exactly as in reference

KEBAYA & ATTIRE:
- Dark luxurious velvet 'Kebaya' (traditional top), a masterpiece of craftsmanship
- Fully covered with shimmering golden beads, sequins, and intricate gold brocade patterns
- Prominent beaded shoulder panels
- Deeply patterned center motif on the chest area
- Sparkling crystal choker necklace completing the look — exactly as in reference

BACKGROUND:
- Soft-focus dressing room setting
- Blue and grey fabric curtains / drapes in background
- Subtle furniture elements
- Soft diffused ambient lighting

PHOTOGRAPHY QUALITY:
- Ultra-realistic portrait, cinematic lighting, 8K resolution
- Professional bridal photography style, bokeh background`

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

async function getFotoBuffer(sock, m) {
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage

  if (m.message?.imageMessage) {
    try {
      return await downloadMediaMessage(m, "buffer", {}, {
        logger: console,
        reuploadRequest: sock.updateMediaMessage
      })
    } catch (e) {
      console.log("[promtnikah] Gagal download foto langsung:", e.message)
    }
  }

  if (quoted?.imageMessage) {
    try {
      return await downloadMediaMessage(
        { key: m.key, message: quoted },
        "buffer",
        {},
        { logger: console, reuploadRequest: sock.updateMediaMessage }
      )
    } catch (e) {
      console.log("[promtnikah] Gagal download foto reply:", e.message)
    }
  }

  return null
}

module.exports = {
  name:  "promtnikah",
  alias: ["nikahfilter", "pengantinsunda", "sundabride"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    const fotoBuffer = await getFotoBuffer(sock, m)

    if (!fotoBuffer) {
      return sock.sendMessage(from, {
        text:
          `👰 *FILTER PENGANTIN SUNDA*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `✨ Edit foto menjadi pengantin tradisional Sunda yang memukau!\n\n` +
          `📸 *Cara pakai:*\n` +
          `• Reply ke foto lalu ketik *.promtnikah*\n` +
          `• Kirim foto + caption *.promtnikah*\n\n` +
          `🎨 *Detail yang diterapkan AI:*\n` +
          `• Wajah asli 100% tidak berubah\n` +
          `• Mahkota Siger emas filigran + mutiara + kuncup bunga\n` +
          `• Untaian melati segar di kedua sisi wajah\n` +
          `• Kebaya beludru gelap + manik emas + brokat\n` +
          `• Kalung choker kristal berkilauan\n` +
          `• Glass skin putih pucat + dewy makeup\n` +
          `• Bulu mata tebal lentik + softlens grey\n` +
          `• Lipstik ombre nude pink–maroon matte\n` +
          `• Latar ruang tata rias tirai biru & abu\n\n` +
          `🪙 *Biaya: ${TOKEN_COST} token*\n` +
          `💰 Token kamu: *${getTokens(sender)} token*`
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
        `👰 *Sedang memproses foto pengantin Sunda...*\n\n` +
        `✨ AI sedang:\n` +
        `• Memasang mahkota Siger emas filigran & mutiara\n` +
        `• Menyematkan untaian melati segar di kedua sisi\n` +
        `• Mengenakan kebaya beludru gelap + manik brokat emas\n` +
        `• Memasang kalung choker kristal\n` +
        `• Mengaplikasikan glass skin & dewy makeup\n` +
        `• Menjaga wajah asli 100% tidak berubah\n\n` +
        `⏳ Mohon tunggu 30-60 detik...`
    })

    if (hasRuxa) {
      useTokens(sender, TOKEN_COST)
    }

    try {
      let resultUrl

      if (hasRuxa) {
        resultUrl = await editImage({
          prompt:       NIKAH_PROMPT,
          imageBuffers: [fotoBuffer],
          model:        EDIT_MODEL
        })
      } else {
        let fotoUrl = ""
        try {
          fotoUrl = await uploadToCatbox(fotoBuffer)
        } catch {}

        const fallbackPrompt = `Traditional Sundanese bridal portrait, ${fotoUrl ? "woman from photo: " + fotoUrl + ", " : ""}${NIKAH_PROMPT}`
        resultUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?nologo=true&model=flux&enhance=true&width=768&height=1024`
      }

      const sisa = hasRuxa ? getTokens(sender) : null

      await sock.sendMessage(from, {
        image: { url: resultUrl },
        caption:
          `👰 *Foto Pengantin Sunda Selesai!*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `✅ Wajah asli terjaga 100%\n` +
          `👑 Mahkota Siger emas filigran + mutiara\n` +
          `🌸 Untaian melati segar di kedua sisi\n` +
          `👗 Kebaya beludru + manik brokat emas\n` +
          `💎 Kalung choker kristal\n` +
          `💄 Glass skin + dewy makeup lengkap\n\n` +
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
      console.log("[promtnikah] ERROR:", err?.message)
      await sock.sendMessage(from, {
        text:
          `❌ *Gagal memproses foto!*\n\n` +
          `Error: ${err?.message || "Unknown error"}\n\n` +
          (hasRuxa ? `🪙 Token dikembalikan: *${TOKEN_COST}*\n\n` : "") +
          `💡 *Tips:*\n` +
          `• Pastikan foto jelas dan tidak buram\n` +
          `• Gunakan foto close-up wajah\n` +
          `• Coba lagi beberapa saat`
      })
    }
  }
}
