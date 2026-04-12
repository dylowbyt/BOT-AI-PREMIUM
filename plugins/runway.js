/**
 * runway.js — Plugin generate video Runway AI (Premium) [FIX + CUSTOM RATIO]
 */

const { getTokens, addTokens, useTokens } = require("../ai/tokendb")
const { generateVideo }        = require("../ai/aivideoapi")

const RUNWAY_MODELS = {
  runway:       { key: "runway-gen3",       label: "Runway Gen3",       cost: 12, emoji: "🎞️" },
  runwayturbo:  { key: "runway-gen3-turbo", label: "Runway Gen3 Turbo", cost: 8,  emoji: "⚡" }
}

async function handleRunway(sock, m, args, command) {
  const from   = m.key.remoteJid
  const sender = m.key.participant || m.key.remoteJid
  const model  = RUNWAY_MODELS[command]

  if (!args || args.length === 0) {
    return sock.sendMessage(from, {
      text:
        `${model.emoji} *${model.label}*\n\n` +
        `📝 Format:\n` +
        `*.${command === "runwayturbo" ? "runway-turbo" : command} <prompt> | <ratio>*\n\n` +
        `Contoh:\n` +
        `*.${command === "runwayturbo" ? "runway-turbo" : command} cinematic city night | 9:16*\n\n` +
        `📐 Ratio tersedia:\n` +
        `• 16:9 (landscape)\n` +
        `• 9:16 (portrait)\n` +
        `• 1:1 (square)\n` +
        `• 4:3\n` +
        `• 3:4\n\n` +
        `🪙 Biaya: *${model.cost} token*`
    })
  }

  // 🔥 PARSE PROMPT + RATIO
  let text = args.join(" ").trim()

  let prompt = text
  let aspect_ratio = "16:9"

  if (text.includes("|")) {
    const parts = text.split("|")
    prompt = parts[0].trim()
    aspect_ratio = parts[1].trim()
  }

  // VALIDASI PROMPT
  if (prompt.length < 10) {
    return sock.sendMessage(from, {
      text: `⚠️ Prompt terlalu pendek! Minimal 10 karakter.`
    })
  }

  // VALIDASI RATIO
  const validRatios = ["16:9", "9:16", "1:1", "4:3", "3:4"]

  if (!validRatios.includes(aspect_ratio)) {
    return sock.sendMessage(from, {
      text:
        `❌ Aspect ratio tidak valid!\n\n` +
        `Gunakan:\n` +
        `• 16:9\n• 9:16\n• 1:1\n• 4:3\n• 3:4`
    })
  }

  const tokens = getTokens(sender)
  if (tokens < model.cost) {
    return sock.sendMessage(from, {
      text:
        `❌ *Token tidak cukup!*\n\n` +
        `🪙 Token kamu: *${tokens}*\n` +
        `💸 Dibutuhkan: *${model.cost} token*`
    })
  }

  await sock.sendMessage(from, {
    text:
      `${model.emoji} *Generating video (${model.label})...*\n\n` +
      `📝 Prompt: _${prompt}_\n` +
      `📐 Ratio: *${aspect_ratio}*\n` +
      `🪙 Token: *${model.cost}*\n\n` +
      `⏳ Tunggu 1-3 menit...`
  })

  // POTONG TOKEN
  useTokens(sender, model.cost)

  try {
    const videoUrl = await generateVideo({
      prompt:    prompt,
      modelKey:  model.key,
      duration:  5,
      ratio:     aspect_ratio
    })

    if (!videoUrl) throw new Error("Video URL kosong dari API")

    await sock.sendMessage(from, {
      video: { url: videoUrl },
      caption:
        `✅ *Video berhasil dibuat!*\n\n` +
        `🤖 Model: *${model.label}*\n` +
        `📐 Ratio: *${aspect_ratio}*\n` +
        `🪙 Sisa token: *${getTokens(sender)}*`
    })

  } catch (err) {
    addTokens(sender, model.cost)

    const apiError =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message

    console.log(`[runway/${command}] ERROR:`, err?.response?.data || err)

    await sock.sendMessage(from, {
      text:
        `❌ *Gagal generate video*\n\n` +
        `📛 Error:\n${apiError}\n\n` +
        `🪙 Token dikembalikan: *${model.cost}*`
    })
  }
}

module.exports = {
  name:  "runway",
  alias: ["runway", "runway-turbo"],

  async run(sock, m, args) {
    const rawText = (
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""
    ).trim()

    const cmd = rawText.slice(1).split(" ")[0].toLowerCase()

    const commandMap = {
      "runway":       "runway",
      "runway-turbo": "runwayturbo"
    }

    const command = commandMap[cmd]
    if (!command) return

    await handleRunway(sock, m, args, command)
  }
}
