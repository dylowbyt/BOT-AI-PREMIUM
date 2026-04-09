/**
 * .img-pro <prompt>
 * Mode Kualitas 👑 — potong 3 token
 */

const { generateImage }                           = require("../ai/storynote")
const { useTokens, getTokens, getTokenWarning }   = require("../ai/tokendb")

const API_KEY    = process.env.STORYNOTE_API_KEY
const PRO_MODEL  = process.env.STORYNOTE_PRO_MODEL || "fal-ai/flux-pro"
const TOKEN_COST = 3

async function getImage(prompt) {
  if (!API_KEY) {
    const enhanced = `${prompt}, ultra detailed, 8k, professional photography, masterpiece`
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(enhanced)}?nologo=true&model=flux&enhance=true&width=1024&height=1024`
  }
  return generateImage({ prompt, modelId: PRO_MODEL, aspectRatio: "1:1", maxWaitMs: 120000 })
}

module.exports = {
  name:  "img-pro",
  alias: ["imgpro"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const prompt = args.join(" ").trim()

    if (!prompt) {
      return sock.sendMessage(from, {
        text:
          `👑 *MODE KUALITAS — .img-pro*\n\n` +
          `Cara pakai: *.img-pro <prompt>*\n` +
          `Contoh: *.img-pro potret wajah realistis sinematik*\n\n` +
          `💰 Biaya: *3 token* per gambar\n` +
          `🪙 Token kamu: *${getTokens(sender)} token*\n\n` +
          `⏳ Proses ~30-60 detik`
      })
    }

    const tokens = getTokens(sender)
    if (tokens < TOKEN_COST) {
      return sock.sendMessage(from, {
        text:
          `❌ *Token kamu tidak cukup!*\n\n` +
          `🪙 Token kamu: *${tokens}*\n` +
          `💰 Dibutuhkan: *${TOKEN_COST} token*\n\n` +
          `Ketik *.premium* untuk beli token.`
      })
    }

    await sock.sendMessage(from, {
      text:
        `👑 *Generating gambar Pro Quality...*\n\n` +
        `📝 Prompt: ${prompt}\n\n` +
        `⏳ Mohon tunggu 30-60 detik...`
    })

    try {
      const remaining = useTokens(sender, TOKEN_COST)
      const imageUrl  = await getImage(prompt)

      await sock.sendMessage(from, {
        image:   { url: imageUrl },
        caption: `👑 *Mode Kualitas Tinggi*\n📝 ${prompt}\n\n🪙 Token terpakai: ${TOKEN_COST} | Sisa: ${remaining}`
      })

      const warning = getTokenWarning(sender)
      if (warning) await sock.sendMessage(from, { text: warning })

    } catch (err) {
      console.log("IMGPRO ERROR:", err?.message)
      await sock.sendMessage(from, { text: `❌ Gagal generate gambar Pro\n\nError: ${err?.message}` })
    }
  }
}
