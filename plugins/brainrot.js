/**
 * brainrot.js — AI Generator Konten Brain Rot Indonesia
 * Command: .brainrot
 * Teks → 7 TOKEN
 * Video (dari foto/video) → 23 TOKEN (Ruxa AI)
 */

require("dotenv").config()
const OpenAI = require("openai")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { generateVideo }         = require("../ai/ruxavideo")
const { useTokens, getTokens, addTokens, getTokenWarning } = require("../ai/tokendb")

const openai          = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const TOKEN_TEXT      = 7
const TOKEN_VIDEO     = 23

module.exports = {
  name: "brainrot",
  alias: ["brainfood", "absurd", "gila"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    const msg       = m.message
    const quoted    = msg?.extendedTextMessage?.contextInfo?.quotedMessage
    const directImg = msg?.imageMessage
    const quotedImg = quoted?.imageMessage
    const directVid = msg?.videoMessage
    const quotedVid = quoted?.videoMessage
    const hasImg    = !!(directImg || quotedImg)
    const hasVid    = !!(directVid || quotedVid)
    const hasMedia  = hasImg || hasVid
    const input     = args.join(" ").trim()

    const tokenCost = hasMedia ? TOKEN_VIDEO : TOKEN_TEXT

    if (!input && !hasMedia) {
      return sock.sendMessage(from, {
        text:
          `🧠 *BRAIN ROT AI*\n\n` +
          `Generate konten absurd, random, dan brain rot level dewa!\n\n` +
          `*Mode:*\n` +
          `📝 *.brainrot <topik>* — Generate teks brain rot (${TOKEN_TEXT} token)\n` +
          `🎬 Kirim foto/video + *.brainrot <topik>* — Generate video brain rot (${TOKEN_VIDEO} token)\n\n` +
          `Contoh:\n` +
          `• *.brainrot kucing makan bakso di bulan*\n` +
          `• Kirim foto + *.brainrot ubah jadi konten viral*\n\n` +
          `💰 Token kamu: *${getTokens(sender)}*`
      })
    }

    const tokens = getTokens(sender)
    if (tokens < tokenCost) {
      return sock.sendMessage(from, {
        text:
          `❌ *Token tidak cukup!*\n\n` +
          `🪙 Token kamu: *${tokens}*\n` +
          `💸 Dibutuhkan: *${tokenCost} token* (mode ${hasMedia ? "video" : "teks"})\n\n` +
          `Ketik *.premium* untuk beli token.`
      })
    }

    // ═══════════════════════════════════════
    // MODE VIDEO (23 token) - ada foto/video
    // ═══════════════════════════════════════
    if (hasMedia) {
      await sock.sendMessage(from, {
        text:
          `🧠 *Brain Rot VIDEO Mode...*\n\n` +
          `🎬 Generating video absurd...\n` +
          `⏳ Proses 2-5 menit\n` +
          `🪙 *${TOKEN_VIDEO} token* akan dipotong`
      })

      try {
        // Buat prompt brain rot video
        const promptAi = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Kamu adalah kreator konten brain rot paling absurd di Indonesia.
Buat prompt video yang SANGAT random, absurd, dan brain rot.
Campurkan elemen Indonesia dengan hal-hal tidak masuk akal.
Output hanya prompt dalam bahasa Inggris yang cocok untuk video AI. Maks 150 kata.`
            },
            { role: "user", content: `Buat prompt video brain rot tentang: ${input || "sesuatu yang absurd"}` }
          ],
          max_tokens: 200
        })

        const videoPrompt = promptAi.choices[0].message.content.trim()
        const remaining   = useTokens(sender, TOKEN_VIDEO)

        const videoUrl = await generateVideo({ prompt: videoPrompt, modelKey: "veo-3" })

        await sock.sendMessage(from, {
          video:   { url: videoUrl },
          caption:
            `🧠 *BRAIN ROT VIDEO SIAP!*\n\n` +
            `🎬 Model: *Ruxa AI veo3.1*\n` +
            `🪙 Token terpakai: *${TOKEN_VIDEO}* | Sisa: *${remaining}*\n\n` +
            `_Selamat menikmati konten absurd! 🤪_`
        })

        const warning = getTokenWarning(sender)
        if (warning) await sock.sendMessage(from, { text: warning })

      } catch (err) {
        addTokens(sender, TOKEN_VIDEO)
        console.log("[brainrot/video] ERROR:", err.message)
        await sock.sendMessage(from, {
          text: `❌ Gagal generate brain rot video: ${err.message}\n\n🪙 Token dikembalikan: *${TOKEN_VIDEO}*`
        })
      }

      return
    }

    // ═══════════════════════════════════════
    // MODE TEKS (7 token)
    // ═══════════════════════════════════════
    await sock.sendMessage(from, {
      text:
        `🧠 *Brain Rot Mode Activated...*\n\n` +
        `🤪 AI sedang menggila...\n` +
        `⏳ Tunggu sebentar...\n` +
        `🪙 *${TOKEN_TEXT} token* akan dipotong`
    })

    try {
      const remaining = useTokens(sender, TOKEN_TEXT)

      const ai = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Kamu adalah konten kreator brain rot paling gila di Indonesia.
Buat konten yang SANGAT absurd, random, tidak masuk akal, tapi somehow lucu dan relatable.
Campurkan: bahasa gaul Indonesia, istilah random, referensi budaya pop, logika terbalik.
Format bebas: bisa narasi, dialog, puisi absurd, teori konspirasi gila, atau campuran semuanya.
Tambahkan sound effect text seperti *brrt* *skibidi* *sigma* dll.
SANGAT lebay, SANGAT brain rot, SANGAT absurd. Level: dewa.`
          },
          { role: "user", content: `Buat konten brain rot tentang: ${input}` }
        ],
        max_tokens: 800
      })

      const result = ai.choices[0].message.content

      await sock.sendMessage(from, {
        text:
          `🧠💀 *BRAIN ROT CONTENT*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `${result}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🪙 Token terpakai: *${TOKEN_TEXT}* | Sisa: *${remaining}*\n` +
          `_⚠️ Konten ini 100% brain rot. Gunakan dengan bijak._ 🤪`
      })

      const warning = getTokenWarning(sender)
      if (warning) await sock.sendMessage(from, { text: warning })

    } catch (err) {
      addTokens(sender, TOKEN_TEXT)
      console.log("[brainrot/text] ERROR:", err.message)
      await sock.sendMessage(from, {
        text: `❌ Gagal generate brain rot: ${err.message}\n\n🪙 Token dikembalikan: *${TOKEN_TEXT}*`
      })
    }
  }
}
