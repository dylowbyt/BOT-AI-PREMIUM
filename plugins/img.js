/**
 * .img <prompt>
 * Mode Cepat ⚡ — potong 1 token
 */

const { generateImage }                           = require("../ai/storynote")
const { useTokens, getTokens, getTokenWarning }   = require("../ai/tokendb")

const API_KEY    = process.env.STORYNOTE_API_KEY
const FAST_MODEL = process.env.STORYNOTE_FAST_MODEL || "fal-ai/flux-schnell"
const TOKEN_COST = 1

async function getImage(prompt) {
  if (!API_KEY) {
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true`
  }
  return generateImage({ prompt, modelId: FAST_MODEL, aspectRatio: "1:1" })
}

module.exports = {
  name: "img",
  alias: [],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const prompt = args.join(" ").trim()

    if (!prompt) {
      return sock.sendMessage(from, {
        text:
          `⚡ *MODE CEPAT — .img*\n\n` +
          `Cara pakai: *.img <prompt>*\n` +
          `Contoh: *.img kucing lucu di luar angkasa*\n\n` +
          `💰 Biaya: *1 token* per gambar\n` +
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
      text: `⚡ *Generating gambar...*\n\n📝 Prompt: ${prompt}\n\n⏳ Mohon tunggu sebentar...`
    })

    try {
      const remaining = useTokens(sender, TOKEN_COST)
      const imageUrl  = await getImage(prompt)

      await sock.sendMessage(from, {
        image:   { url: imageUrl },
        caption: `⚡ *Mode Cepat*\n📝 ${prompt}\n\n🪙 Token terpakai: ${TOKEN_COST} | Sisa: ${remaining}`
      })

      const warning = getTokenWarning(sender)
      if (warning) await sock.sendMessage(from, { text: warning })

    } catch (err) {
      console.log("IMG ERROR:", err?.message)
      await sock.sendMessage(from, { text: `❌ Gagal generate gambar\n\nError: ${err?.message}` })
    }
  }
}
