/**
 * imggen.js — Plugin generate gambar AI via ruxa.ai (Premium)
 *
 * Commands:
 *   .nano <prompt>      → Nano Banana Basic    (3 token)
 *   .nano2 <prompt>     → Nano Banana 2        (4 token)
 *   .nanopro <prompt>   → Nano Banana Pro      (8 token) — bisa juga edit 1-2 foto
 *   .nanoedit <prompt>  → Nano Banana Edit     (3 token) — edit 1-2 foto (reply/lampir)
 *   .gptimg <prompt>    → GPT Image 1.5        (8 token)
 *   .gpt4o <prompt>     → GPT-4o Image         (10 token)
 *
 * Cara pakai 2 foto:
 *   1. Kirim foto pertama sebagai lampiran pesan command
 *   2. Sambil reply ke pesan yang berisi foto kedua
 *   Contoh: reply foto kucing → ketik ".nanoedit satukan dua foto ini jadi satu"
 *           sambil lampirkan foto anjing
 *
 * ENV yang dibutuhkan:
 *   RUXA_API_KEY — API Key dari ruxa.ai
 */

const { getTokens, addTokens } = require("../ai/tokendb")
const { generateImage, editImage } = require("../ai/ruxaimage")
const axios = require("axios")

const IMAGE_MODELS = {
  nano:     { model: "nano-banana",      label: "Nano Banana Basic", cost: 3,  isEdit: false, canEdit: false, emoji: "🍌" },
  nano2:    { model: "nano-banana-2",    label: "Nano Banana 2",     cost: 4,  isEdit: false, canEdit: false, emoji: "🍌" },
  nanopro:  { model: "nano-banana-pro",  label: "Nano Banana Pro",   cost: 8,  isEdit: false, canEdit: true,  emoji: "🍌" },
  nanoedit: { model: "nano-banana-edit", label: "Nano Banana Edit",  cost: 3,  isEdit: true,  canEdit: true,  emoji: "✏️" },
  gptimg:   { model: "gpt-image-1.5",   label: "GPT Image 1.5",     cost: 8,  isEdit: false, canEdit: false, emoji: "🤖" },
  gpt4o:    { model: "gpt-4o",           label: "GPT-4o Image",      cost: 10, isEdit: false, canEdit: false, emoji: "🧠" }
}

/**
 * Download semua gambar dari pesan:
 * - Foto yang dilampirkan langsung ke pesan command
 * - Foto dari pesan yang di-reply
 * Mengembalikan array buffer (0, 1, atau 2 gambar)
 */
async function downloadImages(sock, m) {
  const { downloadMediaMessage } = require("@whiskeysockets/baileys")
  const buffers = []

  // 1. Foto yang dilampirkan langsung ke pesan command
  if (m.message?.imageMessage) {
    try {
      const buf = await downloadMediaMessage(m, "buffer", {})
      if (buf) buffers.push(buf)
    } catch {}
  }

  // 2. Foto dari pesan yang di-reply
  const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
  if (quotedMsg?.imageMessage) {
    try {
      const buf = await downloadMediaMessage(
        { message: { imageMessage: quotedMsg.imageMessage } },
        "buffer",
        {}
      )
      if (buf) buffers.push(buf)
    } catch {}
  }

  return buffers // max 2 gambar
}

async function handleImgGen(sock, m, args, command) {
  const from   = m.key.remoteJid
  const sender = m.key.participant || m.key.remoteJid
  const model  = IMAGE_MODELS[command]

  if (!model) return

  // ── MODE EDIT (isEdit: true atau canEdit: true dengan ada foto) ──────────
  const doEdit = model.isEdit || model.canEdit

  if (doEdit) {
    // Cek dulu apakah ada gambar
    const imageBuffers = await downloadImages(sock, m)
    const hasImages = imageBuffers.length > 0

    // Kalau model wajib edit (isEdit) tapi tidak ada gambar → tampilkan cara pakai
    if (model.isEdit && !hasImages) {
      if (!args || args.length === 0) {
        return sock.sendMessage(from, {
          text:
            `${model.emoji} *${model.label}*\n\n` +
            `📝 Cara pakai:\n` +
            `• Edit 1 foto: Reply ke gambar → ketik *.${command} <instruksi>*\n` +
            `• Edit 2 foto: Lampirkan 1 foto + reply ke foto lain → ketik *.${command} <instruksi>*\n\n` +
            `Contoh: *.${command} satukan dua foto ini jadi satu*\n\n` +
            `🪙 Biaya: *${model.cost} token*\n` +
            `💰 Saldo kamu: *${getTokens(sender)} token*`
        })
      }
      return sock.sendMessage(from, {
        text:
          `⚠️ *Gambar tidak ditemukan!*\n\n` +
          `Cara kirim 2 foto:\n` +
          `1. Reply ke foto pertama\n` +
          `2. Lampirkan foto kedua ke pesan command\n\n` +
          `Atau cukup reply ke 1 foto lalu ketik perintahnya.`
      })
    }

    // Kalau canEdit tapi tidak ada gambar → lanjut ke text-to-image di bawah
    if (model.canEdit && !hasImages && !model.isEdit) {
      // Fall through ke text-to-image
    } else if (hasImages) {
      // ── JALANKAN EDIT ──────────────────────────────────────────────────
      if (!args || args.length === 0) {
        return sock.sendMessage(from, {
          text:
            `${model.emoji} *${model.label}*\n\n` +
            `📝 Cara pakai:\n` +
            `• Edit 1 foto: Reply ke gambar → ketik *.${command} <instruksi>*\n` +
            `• Edit 2 foto: Lampirkan 1 foto + reply ke foto lain → ketik *.${command} <instruksi>*\n\n` +
            `Contoh: *.${command} satukan dua foto ini jadi satu*\n\n` +
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
      const fotoLabel = imageBuffers.length === 2 ? "2 foto" : "foto"

      await sock.sendMessage(from, {
        text:
          `${model.emoji} *Mengedit ${fotoLabel} dengan ${model.label}...*\n\n` +
          `📝 Instruksi: _${prompt}_\n` +
          `🖼️ Jumlah foto: *${imageBuffers.length}*\n` +
          `🪙 Token terpakai: *${model.cost}*\n\n` +
          `⏳ Mohon tunggu sebentar...`
      })

      addTokens(sender, -model.cost)

      try {
        const result = await editImage({ prompt, imageBuffers, model: model.model })

        if (result.startsWith("http")) {
          await sock.sendMessage(from, {
            image: { url: result },
            caption:
              `✅ *Gambar selesai diedit!*\n\n` +
              `🤖 Model: *${model.label}*\n` +
              `📝 Instruksi: _${prompt}_\n` +
              `🖼️ Foto diproses: *${imageBuffers.length}*\n` +
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
              `🖼️ Foto diproses: *${imageBuffers.length}*\n` +
              `🪙 Sisa token: *${getTokens(sender)}*`
          })
          fs.unlinkSync(result)
        }

      } catch (err) {
        addTokens(sender, model.cost)
        console.log(`[imggen/${command}/edit] Error:`, err?.response?.data || err?.message)
        await sock.sendMessage(from, {
          text:
            `❌ *Gagal edit gambar*\n\n` +
            `Error: ${err?.message || "Unknown error"}\n\n` +
            `🪙 Token dikembalikan: *${model.cost}*`
        })
      }

      return
    }
  }

  // ── MODE TEXT-TO-IMAGE ──────────────────────────────────────────────────
  if (!args || args.length === 0) {
    return sock.sendMessage(from, {
      text:
        `${model.emoji} *${model.label}*\n\n` +
        `📝 Cara pakai: *.${command} <deskripsi gambar>*\n\n` +
        (model.canEdit
          ? `💡 Bisa juga edit foto! Lampirkan/reply foto lalu tambahkan instruksi.\n\n`
          : "") +
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
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption || ""
    ).trim()

    const command = rawText.slice(1).split(" ")[0].toLowerCase()
    await handleImgGen(sock, m, args, command)
  }
}
