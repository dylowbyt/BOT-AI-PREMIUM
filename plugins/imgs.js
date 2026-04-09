const OpenAI = require("openai")

const openai = new OpenAI({
  apiKey: process.env.nosensor // 🔥 pakai variable kamu
})

module.exports = {
  name: "imgs",
  alias: ["imgsdfree", "generate"],

  async run(sock, m) {
    const from = m.key.remoteJid

    let text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text

    const prompt = text.replace(/^\.imgs|\.imgsd|\.generate/, "").trim()

    if (!prompt) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.imgs kucing lucu pakai topi"
      })
    }

    try {
      await sock.sendMessage(from, {
        text: "🎨 Sedang membuat gambar... (±5-15 detik)"
      })

      const res = await openai.images.generate({
        model: "gpt-image-1",
        prompt: prompt,
        size: "1024x1024"
      })

      const base64 = res.data[0].b64_json
      const buffer = Buffer.from(base64, "base64")

      await sock.sendMessage(from, {
        image: buffer,
        caption: `✨ Hasil gambar:\n${prompt}`
      })

    } catch (err) {
      console.log("IMGS ERROR:", err)

      await sock.sendMessage(from, {
        text: "❌ Gagal generate gambar (cek API key / saldo)"
      })
    }
  }
}
