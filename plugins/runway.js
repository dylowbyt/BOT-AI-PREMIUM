/**
 * runway.js — Plugin generate video Runway AI (Premium)
 *
 * Commands:
 *   .runway <prompt>      → Generate video Runway Gen3 (12 token)
 *   .runway-turbo <prompt> → Generate video Runway Gen3 Turbo (8 token)
 *
 * ENV yang dibutuhkan:
 *   AIVIDEO_API_KEY  — API Key dari aivideoapi.com/dashboard
 */

const { getTokens, addTokens } = require("../ai/tokendb")
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
        `📝 Cara pakai: *.${command === "runwayturbo" ? "runway-turbo" : command} <deskripsi video>*\n\n` +
        `Contoh:\n` +
        `*.${command === "runwayturbo" ? "runway-turbo" : command} cinematic drone shot over mountain valley at sunrise*\n\n` +
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
      `⏳ Mohon tunggu, proses ini bisa memakan waktu 1-3 menit...`
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

    console.log(`[runway/${command}] Error:`, err?.response?.data || err?.message)

    await sock.sendMessage(from, {
      text:
        `❌ *Gagal generate video*\n\n` +
        `Error: ${err?.message || "Unknown error"}\n\n` +
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
