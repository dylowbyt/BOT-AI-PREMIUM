const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const OpenAI = require("openai")

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

module.exports = {
  name: "imgai",
  alias: ["imageaifree", "analisis"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    try {
      const quoted =
        m.message?.extendedTextMessage?.contextInfo?.quotedMessage

      const hasImage =
        m.message?.imageMessage ||
        quoted?.imageMessage

      const prompt = args.join(" ") || ""

      if (!hasImage && prompt) {
        await sock.sendMessage(from, { text: "🎨 Membuat gambar AI..." })
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
        return sock.sendMessage(from, {
          image: { url },
          caption: `🎨 AI Image: ${prompt}`
        })
      }

      if (!hasImage) {
        return sock.sendMessage(from, {
          text: "⚠️ Cara pakai:\n• Reply foto + .imgai → analisis gambar\n• .imgai <prompt> → generate gambar AI"
        })
      }

      await sock.sendMessage(from, { text: "🔍 Menganalisis gambar..." })

      const targetMsg = quoted
        ? { key: m.key, message: quoted }
        : m

      const buffer = await downloadMediaMessage(
        targetMsg,
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      )

      const base64 = buffer.toString("base64")
      const mime = m.message?.imageMessage?.mimetype || quoted?.imageMessage?.mimetype || "image/jpeg"

      const userContent = []
      if (prompt) {
        userContent.push({ type: "text", text: prompt })
      } else {
        userContent.push({ type: "text", text: "Analisis dan deskripsikan gambar ini secara detail dalam bahasa Indonesia" })
      }
      userContent.push({
        type: "image_url",
        image_url: { url: `data:${mime};base64,${base64}` }
      })

      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Kamu adalah AI analisis gambar. Deskripsikan dengan detail dalam bahasa Indonesia." },
          { role: "user", content: userContent }
        ]
      })

      const reply = res.choices[0].message.content
      await sock.sendMessage(from, { text: `🔍 *Analisis Gambar:*\n\n${reply}` })

    } catch (err) {
      console.log("IMGAI ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal analisis gambar" })
    }
  }
}
