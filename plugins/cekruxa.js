/**
 * cekruxa.js — Diagnostic: cek model list & status akun Ruxa AI
 *
 * Commands:
 *   .cekruxa         → lihat semua model yang tersedia di akun Ruxa AI
 *   .testmodel <id>  → test apakah model ID tertentu bisa digunakan
 */

const axios = require("axios")

async function fetchModelList(apiKey) {
  const res = await axios.get("https://api.ruxa.ai/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "x-platform":  "ruxa"
    },
    timeout: 15000
  })
  return res.data
}

async function testModel(apiKey, modelId) {
  const res = await axios.post(
    "https://api.ruxa.ai/api/v1/tasks/create",
    {
      model: modelId,
      input: { prompt: "a red apple" }
    },
    {
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 15000
    }
  )
  return res.data
}

module.exports = {
  name:  "cekruxa",
  alias: ["testmodel"],

  async run(sock, m, args) {
    const from    = m.key.remoteJid
    const sender  = m.key.participant || m.key.remoteJid
    const rawText = (
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""
    ).trim()
    const command = rawText.slice(1).split(" ")[0].toLowerCase()

    const apiKey = process.env.RUXA_API_KEY
    if (!apiKey) {
      return sock.sendMessage(from, {
        text: "❌ RUXA_API_KEY belum diset di environment."
      })
    }

    // ── .testmodel <id> ──────────────────────────────────────────
    if (command === "testmodel") {
      const modelId = args[0]
      if (!modelId) {
        return sock.sendMessage(from, {
          text:
            `⚠️ Format: *.testmodel <model-id>*\n` +
            `Contoh: *.testmodel nano-banana*`
        })
      }

      await sock.sendMessage(from, {
        text: `🔍 Testing model *${modelId}*...`
      })

      try {
        const result = await testModel(apiKey, modelId)
        const code    = result?.code
        const message = result?.message || JSON.stringify(result)
        const taskId  = result?.data?.taskId

        if (taskId) {
          return sock.sendMessage(from, {
            text:
              `✅ *Model ditemukan & task berhasil dibuat!*\n\n` +
              `🤖 Model: *${modelId}*\n` +
              `📋 Task ID: \`${taskId}\`\n` +
              `✅ Model ini valid dan bisa digunakan.`
          })
        }

        return sock.sendMessage(from, {
          text:
            `❌ *Model gagal / tidak ditemukan*\n\n` +
            `🤖 Model: *${modelId}*\n` +
            `📊 Code: ${code}\n` +
            `📝 Pesan raw Ruxa:\n${message}`
        })

      } catch (err) {
        const rawMsg = err.response?.data?.message || err.response?.data || err.message
        const status = err.response?.status || "-"
        return sock.sendMessage(from, {
          text:
            `❌ *Error saat test model*\n\n` +
            `🤖 Model: *${modelId}*\n` +
            `📊 HTTP Status: ${status}\n` +
            `📝 Pesan raw Ruxa:\n${typeof rawMsg === "object" ? JSON.stringify(rawMsg) : rawMsg}`
        })
      }
    }

    // ── .cekruxa → list semua model tersedia ─────────────────────
    await sock.sendMessage(from, {
      text: "🔍 Mengambil daftar model dari Ruxa AI..."
    })

    try {
      const data = await fetchModelList(apiKey)

      const models = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : []

      if (models.length === 0) {
        return sock.sendMessage(from, {
          text:
            `⚠️ *Tidak ada model ditemukan*\n\n` +
            `Response raw:\n${JSON.stringify(data, null, 2).slice(0, 500)}`
        })
      }

      const imageModels = models.filter(m => {
        const id = (m.id || m.name || "").toLowerCase()
        return !id.includes("veo") && !id.includes("sora") && !id.includes("runway") && !id.includes("kling")
      })
      const videoModels = models.filter(m => {
        const id = (m.id || m.name || "").toLowerCase()
        return id.includes("veo") || id.includes("sora") || id.includes("runway") || id.includes("kling")
      })
      const otherModels = models.filter(m => {
        const id = (m.id || m.name || "").toLowerCase()
        return !imageModels.includes(m) && !videoModels.includes(m)
      })

      const fmtModels = (arr) =>
        arr.map(m => `• \`${m.id || m.name}\`` + (m.displayName || m.label ? ` — ${m.displayName || m.label}` : "")).join("\n")

      let msg = `🤖 *DAFTAR MODEL RUXA AI*\n` +
                `━━━━━━━━━━━━━━━━━━━━\n` +
                `Total: *${models.length} model*\n\n`

      if (imageModels.length > 0) {
        msg += `🖼️ *IMAGE MODELS (${imageModels.length}):*\n${fmtModels(imageModels)}\n\n`
      }
      if (videoModels.length > 0) {
        msg += `🎬 *VIDEO MODELS (${videoModels.length}):*\n${fmtModels(videoModels)}\n\n`
      }
      if (otherModels.length > 0) {
        msg += `📦 *MODEL LAIN (${otherModels.length}):*\n${fmtModels(otherModels)}\n\n`
      }

      msg += `━━━━━━━━━━━━━━━━━━━━\n` +
             `💡 Cek model ID spesifik: *.testmodel <id>*`

      return sock.sendMessage(from, { text: msg })

    } catch (err) {
      const rawMsg = err.response?.data || err.message
      const status = err.response?.status || "-"
      return sock.sendMessage(from, {
        text:
          `❌ *Gagal ambil model list*\n\n` +
          `📊 HTTP Status: ${status}\n` +
          `📝 Pesan:\n${typeof rawMsg === "object" ? JSON.stringify(rawMsg) : rawMsg}`
      })
    }
  }
}
