/**
 * videogen.js — Plugin generate video AI (Premium)
 *
 * Commands:
 *   .veo3 <prompt>   → Generate video dengan Google Veo 3 (16 token)
 *   .veo31 <prompt>  → Generate video dengan Google Veo 3.1 (18 token)
 *   .sora2 <prompt>  → Generate video dengan OpenAI Sora 2 (10 token)
 *
 * ENV yang dibutuhkan:
 *   RUXA_API_KEY  — API Key dari ruxa.ai
 */

const { getTokens, addTokens } = require("../ai/tokendb")
const { generateVideo }        = require("../ai/ruxavideo")

const VIDEO_MODELS = {
  veo3:  { key: "veo-3",   label: "Google Veo 3",   cost: 16, emoji: "🎬" },
  veo31: { key: "veo-3.1", label: "Google Veo 3.1", cost: 18, emoji: "🎥" },
  sora2: { key: "sora-2",  label: "OpenAI Sora 2",  cost: 10, emoji: "🌀" }
}

async function handleVideoGen(sock, m, args, command) {
  const from   = m.key.remoteJid
  const sender = m.key.participant || m.key.remoteJid
  const model  = VIDEO_MODELS[command]

  if (!args || args.length === 0) {
    return sock.sendMessage(from, {
      text:
        `${model.emoji} *${model.label}*\n\n` +
        `📝 Cara pakai: *.${command} <deskripsi video>*\n\n` +
        `Contoh:\n` +
        `*.${command} a cat walking in slow motion on a rainy street*\n\n` +
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
      `${model.emoji} *Generating video dengan ${model.label}...*\n\n` +
      `📝 Prompt: _${prompt}_\n` +
      `🪙 Token terpakai: *${model.cost}*\n\n` +
      `⏳ Mohon tunggu, proses ini bisa memakan waktu 1-5 menit...`
  })

  addTokens(sender, -model.cost)

  try {
    const videoUrl = await generateVideo({
      prompt,
      modelKey: model.key
    })

    await sock.sendMessage(from, {
      video: { url: videoUrl },
      caption:
        `✅ *Video siap!*\n\n` +
        `🤖 Model: *${model.label}*\n` +
        `📝 Prompt: _${prompt}_\n` +
        `🪙 Sisa token: *${getTokens(sender)}*`
    })

  } catch (err) {
    addTokens(sender, model.cost)

    console.log(`[videogen/${command}] Error:`, err?.response?.data || err?.message)

    await sock.sendMessage(from, {
      text:
        `❌ *Gagal generate video*\n\n` +
        `Error: ${err?.message || "Unknown error"}\n\n` +
        `🪙 Token dikembalikan: *${model.cost}*`
    })
  }
}

module.exports = {
  name:  "videogen",
  alias: ["veo3", "veo31", "sora2"],

  async run(sock, m, args) {
    const rawText = (
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""
    ).trim()

    const command = rawText.slice(1).split(" ")[0].toLowerCase()
    await handleVideoGen(sock, m, args, command)
  }
}
