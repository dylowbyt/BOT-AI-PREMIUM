/**
 * imggen.js — Plugin generate gambar AI via ruxa.ai (Premium)
 *
 * Commands:
 *   .nano <prompt>      → Nano Banana Basic    (3 token)
 *   .nano2 <prompt>     → Nano Banana 2        (4 token)
 *   .nanopro <prompt>   → Nano Banana Pro      (8 token)
 *   .nanoedit <prompt>  → Nano Banana Edit     (3 token) — reply ke gambar
 *   .gptimg <prompt>    → GPT Image 1.5        (8 token)
 *   .gpt4o <prompt>     → GPT-4o Image         (10 token)
 *
 * ENV yang dibutuhkan:
 *   RUXA_API_KEY — API Key dari ruxa.ai
 */

const { getTokens, addTokens } = require("../ai/tokendb")
const { generateImage, editImage } = require("../ai/ruxaimage")
const axios = require("axios")

const IMAGE_MODELS = {
  nano:     { model: "nano-banana",      label: "Nano Banana Basic", cost: 3,  isEdit: false, emoji: "🍌" },
  nano2:    { model: "nano-banana-2",    label: "Nano Banana 2",     cost: 4,  isEdit: false, emoji: "🍌" },
  nanopro:  { model: "nano-banana-pro",  label: "Nano Banana Pro",   cost: 8,  isEdit: false, emoji: "🍌" },
  nanoedit: { model: "nano-banana-edit", label: "Nano Banana Edit",  cost: 3,  isEdit: true,  emoji: "✏️" },
  gptimg:   { model: "gpt-image-1.5",   label: "GPT Image 1.5",     cost: 8,  isEdit: false, emoji: "🤖" },
  gpt4o:    { model: "gpt-4o",           label: "GPT-4o Image",      cost: 10, isEdit: false, emoji: "🧠" }
}

async function downloadImage(sock, m) {
  try {
    const msg  = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
    if (!msg) return null

    const imgMsg = msg?.imageMessage
    if (!imgMsg) return null

    const { downloadMediaMessage } = require("@whiskeysockets/baileys")
    const buffer = await downloadMediaMessage({ message: { imageMessage: imgMsg } }, "buffer", {})
    return buffer
  } catch {
    return null
  }
}

async function handleImgGen(sock, m, args, command) {
  const from   = m.key.remoteJid
  const sender = m.key.participant || m.key.remoteJid
  const model  = IMAGE_MODELS[command]

  if (!model) return

  if (model.isEdit) {
    if (!args || args.length === 0) {
      return sock.sendMessage(from, {
        text:
          `${model.emoji} *${model.label}*\n\n` +
          `📝 Cara pakai:\n` +
          `1. Reply (balas) ke gambar yang ingin diedit\n` +
          `2. Ketik: *.nanoedit <instruksi edit>*\n\n` +
          `Contoh: *.nanoedit ubah background jadi pantai*\n\n` +
          `🪙 Biaya: *${model.cost} token*\n` +
          `💰 Saldo kamu: *${getTokens(sender)} token*`
      })
    }

    const tokens = getTokens(sender)
    if (tokens < model.cost) {
      return sock.sendMessage(from, {
        text:
          `❌ *Token tidak cukup!*\n\n` +
          `🪙 Token kamu: *${tokens}*\n` +
          `💸 Dibutuhkan: *${model.cost} token*\n\n` +
          `Beli token: *.buy basic* / *.buy medium* / *.buy pro*`
      })
    }

    const imageBuffer = await downloadImage(sock, m)
    if (!imageBuffer) {
      return sock.sendMessage(from, {
        text:
          `⚠️ *Gambar tidak ditemukan!*\n\n` +
          `Silakan reply (balas) ke gambar yang ingin diedit, lalu ketik:\n` +
          `*.nanoedit <instruksi edit>*`
      })
    }

    const prompt = args.join(" ")
    await sock.sendMessage(from, {
      text:
        `${model.emoji} *Mengedit gambar dengan ${model.label}...*\n\n` +
        `📝 Instruksi: _${prompt}_\n` +
        `🪙 Token terpakai: *${model.cost}*\n\n` +
        `⏳ Mohon tunggu sebentar...`
    })

    addTokens(sender, -model.cost)

    try {
      const result = await editImage({ prompt, imageBuffer, model: model.model })

      if (result.startsWith("http")) {
        await sock.sendMessage(from, {
          image: { url: result },
          caption:
            `✅ *Gambar selesai diedit!*\n\n` +
            `🤖 Model: *${model.label}*\n` +
            `📝 Instruksi: _${prompt}_\n` +
            `🪙 Sisa token: *${getTokens(sender)}*`
        })
      } else {
        const fs = require("fs")
        await sock.sendMessage(from, {
          image: fs.readFileSync(result),
          caption:
            `✅ *Gambar selesai diedit!*\n\n` +
            `🤖 Model: *${model.label}*\n` +
            `📝 Instruksi: _${prompt}_\n` +
            `🪙 Sisa token: *${getTokens(sender)}*`
        })
        fs.unlinkSync(result)
      }

    } catch (err) {
      addTokens(sender, model.cost)
      console.log(`[imggen/nanoedit] Error:`, err?.response?.data || err?.message)
      await sock.sendMessage(from, {
        text:
          `❌ *Gagal edit gambar*\n\n` +
          `Error: ${err?.message || "Unknown error"}\n\n` +
          `🪙 Token dikembalikan: *${model.cost}*`
      })
    }

    return
  }

  if (!args || args.length === 0) {
    return sock.sendMessage(from, {
      text:
        `${model.emoji} *${model.label}*\n\n` +
        `📝 Cara pakai: *.${command} <deskripsi gambar>*\n\n` +
        `Contoh:\n` +
        `*.${command} a beautiful sunset over the ocean, photorealistic*\n\n` +
        `🪙 Biaya: *${model.cost} token*\n` +
        `💰 Saldo kamu: *${getTokens(sender)} token*`
    })
  }

  const tokens = getTokens(sender)
  if (tokens < model.cost) {
    return sock.sendMessage(from, {
      text:
        `❌ *Token tidak cukup!*\n\n` +
        `🪙 Token kamu: *${tokens}*\n` +
        `💸 Dibutuhkan: *${model.cost} token*\n\n` +
        `Beli token: *.buy basic* / *.buy medium* / *.buy pro*`
    })
  }

  const prompt = args.join(" ")

  await sock.sendMessage(from, {
    text:
      `${model.emoji} *Generating gambar dengan ${model.label}...*\n\n` +
      `📝 Prompt: _${prompt}_\n` +
      `🪙 Token terpakai: *${model.cost}*\n\n` +
      `⏳ Mohon tunggu sebentar...`
  })

  addTokens(sender, -model.cost)

  try {
    const result = await generateImage({ prompt, model: model.model })

    if (result.startsWith("http")) {
      await sock.sendMessage(from, {
        image: { url: result },
        caption:
          `✅ *Gambar siap!*\n\n` +
          `🤖 Model: *${model.label}*\n` +
          `📝 Prompt: _${prompt}_\n` +
          `🪙 Sisa token: *${getTokens(sender)}*`
      })
    } else {
      const fs = require("fs")
      await sock.sendMessage(from, {
        image: fs.readFileSync(result),
        caption:
          `✅ *Gambar siap!*\n\n` +
          `🤖 Model: *${model.label}*\n` +
          `📝 Prompt: _${prompt}_\n` +
          `🪙 Sisa token: *${getTokens(sender)}*`
      })
      fs.unlinkSync(result)
    }

  } catch (err) {
    addTokens(sender, model.cost)
    console.log(`[imggen/${command}] Error:`, err?.response?.data || err?.message)
    await sock.sendMessage(from, {
      text:
        `❌ *Gagal generate gambar*\n\n` +
        `Error: ${err?.message || "Unknown error"}\n\n` +
        `🪙 Token dikembalikan: *${model.cost}*`
    })
  }
}

module.exports = {
  name:  "imggen",
  alias: ["nano", "nano2", "nanopro", "nanoedit", "gptimg", "gpt4o"],

  async run(sock, m, args) {
    const rawText = (
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""
    ).trim()

    const command = rawText.slice(1).split(" ")[0].toLowerCase()
    await handleImgGen(sock, m, args, command)
  }
}
