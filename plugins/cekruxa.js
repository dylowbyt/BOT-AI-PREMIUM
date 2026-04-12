/**
 * cekruxa.js — Diagnostic: test model IDs langsung ke Ruxa API
 *
 * Commands:
 *   .cekruxa         → auto-test semua model & cek saldo kredit
 *   .testmodel <id>  → test apakah model ID tertentu bisa digunakan
 *   .ruxastatus      → cek saldo kredit Ruxa AI
 */

const axios = require("axios")
const { checkRuxaBalance, parseCreditNumbers } = require("../ai/ruxaimage")

const CANDIDATES = [
  "nano-banana",
  "nano-banana-2",
  "nano-banana-pro",
  "nano-banana-edit",
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
      timeout: 15000,
      validateStatus: () => true
    }
  )
  return res.data
}

module.exports = {
  name:  "cekruxa",
  alias: ["testmodel", "ruxastatus"],

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

    // ── .ruxastatus → cek saldo saja ──────────────────────────────
    if (command === "ruxastatus") {
      await sock.sendMessage(from, {
        text: `🔍 *Mengecek saldo akun Ruxa AI...*`
      })

      const balance = await checkRuxaBalance(apiKey)
      let msg = `🤖 *STATUS AKUN RUXA AI*\n━━━━━━━━━━━━━━━━━━━━\n\n`

      if (balance !== null) {
        msg += `💰 *Saldo Kredit:* ${balance}\n\n`
        if (balance < 3) {
          msg +=
            `⚠️ *KREDIT TIDAK CUKUP!*\n` +
            `Model termurah (nano-banana) butuh *3 kredit*.\n` +
            `Saldo kamu hanya *${balance} kredit*.\n\n`
        } else {
          msg += `✅ Saldo mencukupi untuk generate gambar.\n\n`
        }
      } else {
        msg += `💰 *Saldo:* Tidak bisa dicek via API (coba cek manual di dashboard)\n\n`
      }

      msg +=
        `🔑 API Key: ...${apiKey.slice(-6)}\n` +
        `🔑 Backup Key: ${process.env.RUXA_API_KEY_2 ? "✅ Ada" : "❌ Tidak ada"}\n\n` +
        `🔗 Top up kredit: https://ruxa.ai/dashboard\n` +
        `📝 Test semua model: *.cekruxa*`

      return sock.sendMessage(from, { text: msg })
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

        const msgLower = message.toLowerCase()
        if (msgLower.includes("积分不足") || msgLower.includes("insufficient") || msgLower.includes("credit")) {
          const { butuh, saldo } = parseCreditNumbers(message)
          return sock.sendMessage(from, {
            text:
              `💳 *Model ADA tapi kredit tidak cukup!*\n\n` +
              `🤖 Model: *${modelId}* — model ini valid\n` +
              `💰 Dibutuhkan: *${butuh !== null ? butuh : "?"} kredit*\n` +
              `💳 Saldo kamu: *${saldo !== null ? saldo : "?"} kredit*\n\n` +
              `🔗 Top up: https://ruxa.ai/dashboard\n\n` +
              `📝 _Pesan asli Ruxa: ${message}_`
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

    // ── .cekruxa → cek saldo + auto-test semua model ──────────
    await sock.sendMessage(from, {
      text:
        `🔍 *Mengecek Ruxa AI...*\n` +
        `Cek saldo & test ${CANDIDATES.length} model. Mohon tunggu ~30 detik.`
    })

    const balance = await checkRuxaBalance(apiKey)

    let balanceInfo = ""
    if (balance !== null) {
      balanceInfo = `💰 *Saldo Kredit Ruxa:* ${balance}\n\n`
      if (balance < 3) {
        balanceInfo +=
          `⚠️ *KREDIT TIDAK CUKUP!*\n` +
          `Model termurah butuh *3 kredit*, saldo kamu *${balance}*.\n` +
          `🔗 Top up dulu: https://ruxa.ai/dashboard\n\n`
      }
    }

    const working    = []
    const notFound   = []
    const creditFail = []
    const otherFail  = []

    for (const modelId of CANDIDATES) {
      const result  = await testModel(apiKey, modelId)
      const code    = result?.code
      const message = result?.message || ""
      const msgLower = message.toLowerCase()
      const taskId  = result?.data?.taskId

      if (taskId) {
        working.push({ id: modelId })
      } else if (
        msgLower.includes("积分不足") ||
        msgLower.includes("insufficient") ||
        msgLower.includes("credit")
      ) {
        const { butuh: bCredit, saldo: sSaldo } = parseCreditNumbers(message)
        creditFail.push({ id: modelId, butuh: bCredit !== null ? bCredit : "?", saldo: sSaldo !== null ? sSaldo : "?", raw: message })
      } else if (
        msgLower.includes("未找到") ||
        msgLower.includes("渠道") ||
        msgLower.includes("not found") ||
        msgLower.includes("not support") ||
        code === 404
      ) {
        notFound.push({ id: modelId })
      } else {
        otherFail.push({ id: modelId, code, msg: message.slice(0, 60) })
      }
    }

    let report = `🤖 *HASIL CEK MODEL RUXA AI*\n━━━━━━━━━━━━━━━━━━━━\n\n`
    report += balanceInfo

    if (working.length > 0) {
      report += `✅ *MODEL VALID (task berhasil dibuat):*\n`
      working.forEach(m => { report += `• \`${m.id}\`\n` })
      report += `\n`
    } else {
      report += `❌ Tidak ada model yang berhasil buat task.\n\n`
    }

    if (creditFail.length > 0) {
      report += `💳 *MODEL ADA tapi kredit kurang (${creditFail.length}):*\n`
      creditFail.forEach(m => {
        report += `• \`${m.id}\` — butuh ${m.butuh} kredit (saldo: ${m.saldo})\n`
        report += `  📝 _Pesan Ruxa: ${m.raw}_\n`
      })
      report += `\n📌 Model-model ini VALID, tinggal top up kredit!\n🔗 https://ruxa.ai/dashboard\n\n`
    }

    if (otherFail.length > 0) {
      report += `⚠️ *ERROR LAIN (perlu investigasi):*\n`
      otherFail.forEach(m => {
        report += `• \`${m.id}\` — ${m.msg}\n`
      })
      report += `\n`
    }

    if (notFound.length > 0) {
      report += `🚫 *Model tidak dikenali (${notFound.length}):*\n`
      notFound.forEach(m => { report += `• \`${m.id}\`\n` })
    }

    report += `\n━━━━━━━━━━━━━━━━━━━━\n`
    report += `💡 Test model lain: *.testmodel <id>*\n`
    report += `📊 Cek saldo: *.ruxastatus*`

    return sock.sendMessage(from, { text: report })
  }
}
