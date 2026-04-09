const axios = require("axios")

module.exports = {
  name: "aivideo",
  alias: ["videoai"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    const prompt = args.join(" ")
    if (!prompt) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.aivideo kucing terbang di luar angkasa"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🎬 Membuat video AI... tunggu sebentar" })

      const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN
      if (!REPLICATE_TOKEN) {
        return sock.sendMessage(from, {
          text: "❌ REPLICATE_API_TOKEN belum diset di environment"
        })
      }

      const prediction = await axios.post(
        "https://api.replicate.com/v1/predictions",
        {
          version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
          input: {
            prompt,
            num_frames: 24,
            fps: 8,
            guidance_scale: 7.5,
            num_inference_steps: 50
          }
        },
        {
          headers: {
            Authorization: `Token ${REPLICATE_TOKEN}`,
            "Content-Type": "application/json"
          },
          timeout: 30000
        }
      )

      const predId = prediction.data?.id
      if (!predId) throw new Error("Tidak ada ID prediksi")

      let videoUrl = null
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 4000))

        const check = await axios.get(
          `https://api.replicate.com/v1/predictions/${predId}`,
          {
            headers: { Authorization: `Token ${REPLICATE_TOKEN}` },
            timeout: 10000
          }
        )

        if (check.data?.status === "succeeded") {
          const output = check.data?.output
          videoUrl = Array.isArray(output) ? output[0] : output
          break
        }

        if (check.data?.status === "failed" || check.data?.status === "canceled") {
          throw new Error("Video gagal dibuat")
        }
      }

      if (!videoUrl) throw new Error("Timeout")

      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: `🎥 AI Video:\n${prompt}`
      })

    } catch (err) {
      console.log("AIVIDEO ERROR:", err?.message)
      sock.sendMessage(from, { text: "❌ Gagal membuat video AI" })
    }
  }
}
