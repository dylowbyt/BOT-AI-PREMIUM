/**
 * dreamvideo.js — AI Generate Video Sinematik dari Deskripsi Mimpi
 * Command: .dreamvideo
 * Biaya token dinamis sesuai model Ruxa AI:
 *   veo-3   → 16 token
 *   veo-3.1 → 18 token
 *   sora-2  → 10 token
 */

require("dotenv").config()
const OpenAI = require("openai")
const { generateVideo } = require("../ai/ruxavideo")
const { useTokens, getTokens, addTokens, getTokenWarning } = require("../ai/tokendb")
const { getModelTokenCost } = require("../ai/ruxaimage")

const openai     = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const VIDEO_MODEL = "veo-3"
const TOKEN_COST  = getModelTokenCost(VIDEO_MODEL)

module.exports = {
  name: "dreamvideo",
  alias: ["mimpi2video", "dreamgen"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const mimpi  = args.join(" ").trim()

    if (!mimpi) {
      return sock.sendMessage(from, {
        text:
          `🌙 *DREAM VIDEO AI*\n\n` +
          `Ceritakan mimpimu, AI akan mengubahnya menjadi video sinematik yang memukau!\n\n` +
          `Cara pakai:\n` +
          `*.dreamvideo <ceritakan mimpimu>*\n\n` +
          `Contoh:\n` +
          `• *.dreamvideo aku terbang di atas awan merah matahari terbenam laut biru*\n` +
          `• *.dreamvideo berlari di hutan ajaib penuh cahaya bintang dan makhluk bercahaya*\n\n` +
          `AI akan:\n` +
          `✨ Ubah deskripsi mimpimu jadi prompt sinematik\n` +
          `🎬 Generate video dengan kualitas veo3.1\n\n` +
          `🪙 Biaya: *${TOKEN_COST} token*\n` +
          `💰 Token kamu: *${getTokens(sender)}*\n\n` +
          `⏳ Proses: 2-5 menit`
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
        `🌙 *Dream Video AI Processing...*\n\n` +
        `✨ Menganalisis mimpimu...\n` +
        `🎬 Menyusun prompt sinematik...\n\n` +
        `⏳ Proses 2-5 menit. Jangan tutup chat!\n` +
        `🪙 *${TOKEN_COST} token* akan dipotong`
    })

    try {
      // Step 1: Enhace dream description jadi prompt sinematik
      const enhanceAi = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Kamu adalah sutradara film dan prompt engineer ahli.
Ubah deskripsi mimpi menjadi prompt video sinematik yang kuat dan visual dalam Bahasa Inggris.
Format: cinematic, dreamlike, [visual elements], [lighting], [camera movement], [atmosphere], 8K, ultra detailed.
Maksimal 200 kata. Hanya output prompt-nya saja, tanpa penjelasan.`
          },
          { role: "user", content: `Ubah mimpi ini jadi prompt sinematik: ${mimpi}` }
        ],
        max_tokens: 300
      })

      const cinematicPrompt = enhanceAi.choices[0].message.content.trim()
      console.log("[dreamvideo] Cinematic prompt:", cinematicPrompt)

      // Step 2: Generate video
      const remaining = useTokens(sender, TOKEN_COST)

      await sock.sendMessage(from, {
        text:
          `🎬 *Generating dream video...*\n\n` +
          `📝 Prompt: _${cinematicPrompt.slice(0, 100)}..._\n\n` +
          `⏳ Mohon tunggu 2-5 menit...`
      })

      const videoUrl = await generateVideo({
        prompt:   cinematicPrompt,
        modelKey: "veo-3"
      })

      await sock.sendMessage(from, {
        video:   { url: videoUrl },
        caption:
          `🌙 *Dream Video Berhasil!*\n\n` +
          `💭 Mimpi: _${mimpi.slice(0, 80)}${mimpi.length > 80 ? "..." : ""}_\n` +
          `🎬 Model: *Ruxa AI veo3.1*\n` +
          `🪙 Token terpakai: *${TOKEN_COST}* | Sisa: *${remaining}*`
      })

      const warning = getTokenWarning(sender)
      if (warning) await sock.sendMessage(from, { text: warning })

    } catch (err) {
      addTokens(sender, TOKEN_COST)
      console.log("[dreamvideo] ERROR:", err.message)
      await sock.sendMessage(from, {
        text:
          `❌ *Gagal generate dream video!*\n\n` +
          `📛 Error: ${err.message}\n\n` +
          `🪙 Token dikembalikan: *${TOKEN_COST}*\n` +
          `💰 Sisa token: *${getTokens(sender)}*\n\n` +
          `💡 Coba deskripsikan mimpi dengan lebih detail`
      })
    }
  }
}
