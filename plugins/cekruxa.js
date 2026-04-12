/**
 * cekruxa.js — Diagnostic: test model IDs langsung ke Ruxa API
 *
 * Commands:
 *   .cekruxa         → auto-test semua kemungkinan nama model nano/gpt
 *   .testmodel <id>  → test apakah model ID tertentu bisa digunakan
 */

const axios = require("axios")

// Daftar model yang ingin kita cari nama yang benar
const CANDIDATES = [
  // Nano Banana Basic — kemungkinan nama API
  "nano-banana",
  "nano-banana-basic",
  "nano-banana-1",
  "nano-banana-v1",
  "banana",
  "nano",
  "nanoBanana",
  "nano_banana",
  // Nano Banana 2
  "nano-banana-2",
  "nano-banana-2-v2",
  // GPT Image
  "gpt-image-1",
  "gpt-image-1-5",
  "gpt-image-1.5",
  "gpt-4o-image",
  "gpt-4o",
]

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

    // ── .cekruxa → auto-test semua kandidat nama model ──────────
    await sock.sendMessage(from, {
      text:
        `🔍 *Auto-testing ${CANDIDATES.length} model name candidates...*\n` +
        `Mohon tunggu, ini mungkin butuh ~30 detik.`
    })

    const working   = []
    const notFound  = []
    const otherFail = []

    for (const modelId of CANDIDATES) {
      try {
        const result  = await testModel(apiKey, modelId)
        const code    = result?.code
        const message = (result?.message || "").toLowerCase()
        const taskId  = result?.data?.taskId

        if (taskId) {
          // Task berhasil dibuat → model ID ini valid!
          working.push({ id: modelId, taskId })
        } else if (
          message.includes("未找到") ||
          message.includes("渠道") ||
          message.includes("not found") ||
          message.includes("not support") ||
          code === 404
        ) {
          notFound.push({ id: modelId, msg: result?.message })
        } else {
          otherFail.push({ id: modelId, code, msg: result?.message })
        }
      } catch (err) {
        const rawMsg = (err.response?.data?.message || err.message || "").toLowerCase()
        if (
          rawMsg.includes("未找到") ||
          rawMsg.includes("渠道") ||
          rawMsg.includes("not found") ||
          rawMsg.includes("not support")
        ) {
          notFound.push({ id: modelId, msg: err.response?.data?.message || err.message })
        } else {
          otherFail.push({ id: modelId, msg: err.response?.data?.message || err.message })
        }
      }
    }

    let report = `🤖 *HASIL CEK MODEL RUXA AI*\n━━━━━━━━━━━━━━━━━━━━\n\n`

    if (working.length > 0) {
      report += `✅ *MODEL VALID (task berhasil dibuat):*\n`
      working.forEach(m => { report += `• \`${m.id}\`\n` })
      report += `\n`
    } else {
      report += `❌ Tidak ada model yang berhasil buat task.\n\n`
    }

    if (otherFail.length > 0) {
      report += `⚠️ *MODEL ADA tapi gagal (perlu investigasi):*\n`
      otherFail.forEach(m => {
        const shortMsg = (m.msg || "").slice(0, 60)
        report += `• \`${m.id}\` — ${shortMsg}\n`
      })
      report += `\n`
    }

    if (notFound.length > 0) {
      report += `🚫 *Model tidak dikenali (${notFound.length}):*\n`
      notFound.forEach(m => { report += `• \`${m.id}\`` + `\n` })
    }

    report += `\n━━━━━━━━━━━━━━━━━━━━\n💡 Test model lain: *.testmodel <id>*`

    return sock.sendMessage(from, { text: report })
  }
}
