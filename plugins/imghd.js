/**
 * .img-hd <prompt>
 * Mode Seimbang ⚖️ — potong 2 token
 */

const { generateImage }                           = require("../ai/storynote")
const { useTokens, getTokens, getTokenWarning }   = require("../ai/tokendb")

const API_KEY         = process.env.STORYNOTE_API_KEY
const BALANCED_MODEL  = process.env.STORYNOTE_BALANCED_MODEL || "fal-ai/flux-2"
const TOKEN_COST      = 2

async function getImage(prompt) {
  if (!API_KEY) {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&model=flux&enhance=true`
  }
  return generateImage({ prompt, modelId: BALANCED_MODEL, aspectRatio: "16:9", maxWaitMs: 90000 })
}

module.exports = {
  name:  "img-hd",
  alias: ["imghd"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const prompt = args.join(" ").trim()

    if (!prompt) {
      return sock.sendMessage(from, {
        text:
          `⚖️ *MODE SEIMBANG — .img-hd*\n\n` +
          `Cara pakai: *.img-hd <prompt>*\n` +
          `Contoh: *.img-hd pemandangan gunung saat sunset*\n\n` +
          `💰 Biaya: *2 token* per gambar\n` +
          `🪙 Token kamu: *${getTokens(sender)} token*`
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
      text: `⚖️ *Generating gambar HD...*\n\n📝 Prompt: ${prompt}\n\n⏳ Mohon tunggu sebentar...`
    })

    try {
      const remaining = useTokens(sender, TOKEN_COST)
      const imageUrl  = await getImage(prompt)

      await sock.sendMessage(from, {
        image:   { url: imageUrl },
        caption: `⚖️ *Mode Seimbang*\n📝 ${prompt}\n\n🪙 Token terpakai: ${TOKEN_COST} | Sisa: ${remaining}`
      })

      const warning = getTokenWarning(sender)
      if (warning) await sock.sendMessage(from, { text: warning })

    } catch (err) {
      console.log("IMGHD ERROR:", err?.message)
      await sock.sendMessage(from, { text: `❌ Gagal generate gambar HD\n\nError: ${err?.message}` })
    }
  }
}
