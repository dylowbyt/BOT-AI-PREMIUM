/**
 * imgai.js — Generate gambar via Ruxa AI dengan model pilihan
 * Command: .imgai <model> <prompt>
 *          .imgai list         → lihat semua model & harga token
 *          .imgai <prompt>     → pakai model default (nano-banana)
 *
 * Biaya token sesuai harga kredit Ruxa AI:
 *   nano-banana      → 3 token
 *   nano-banana-2    → 4 token
 *   nano-banana-pro  → 8 token
 *   gpt-image-1      → 7 token
 *   gpt-image-1.5    → 7 token
 *   gpt-4o-image     → 10 token
 */

const { generateImage, getModelTokenCost } = require("../ai/ruxaimage")
const { useTokens, getTokens, addTokens, getTokenWarning } = require("../ai/tokendb")

// Model yang tersedia untuk generate image (bukan video)
const IMAGE_MODELS = [
  { key: "nano-banana",      label: "Nano Banana",      cost: 3  },
  { key: "nano-banana-2",    label: "Nano Banana 2",    cost: 4  },
  { key: "nano-banana-pro",  label: "Nano Banana Pro",  cost: 8  },
  { key: "gpt-image-1",      label: "GPT Image 1",      cost: 7  },
  { key: "gpt-image-1.5",    label: "GPT Image 1.5",    cost: 7  },
  { key: "gpt-4o-image",     label: "GPT-4o Image",     cost: 10 }
]

const DEFAULT_MODEL = "nano-banana"

function buildModelList() {
  const rows = IMAGE_MODELS.map(m =>
    `• *${m.key}* — ${m.label} (${m.cost} token)`
  ).join("\n")
  return rows
}

module.exports = {
  name: "imgai",
  alias: ["generateai", "genimage", "buatimg"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    // .imgai list → tampilkan semua model & harga
    if (args[0]?.toLowerCase() === "list" || args[0]?.toLowerCase() === "models") {
      return sock.sendMessage(from, {
        text:
          `🎨 *MODEL TERSEDIA — .imgai*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          buildModelList() +
          `\n\n` +
          `*Cara pakai:*\n` +
          `• \`.imgai <prompt>\` → model default (nano-banana, 3 token)\n` +
          `• \`.imgai nano-banana-pro sunset di bali\`\n` +
          `• \`.imgai gpt-4o-image anime girl kawaii\`\n\n` +
          `🪙 Token kamu: *${getTokens(sender)}*`
      })
    }

    // Tentukan model & prompt
    let model = DEFAULT_MODEL
    let promptParts = args

    // Cek apakah args[0] adalah nama model yang dikenal
    const knownModelKeys = IMAGE_MODELS.map(m => m.key)
    const firstArg = (args[0] || "").toLowerCase()

    if (knownModelKeys.includes(firstArg)) {
      model = firstArg
      promptParts = args.slice(1)
    }

    const prompt = promptParts.join(" ").trim()

    // Tampilkan menu jika tidak ada prompt
    if (!prompt) {
      return sock.sendMessage(from, {
        text:
          `🎨 *IMGAI — Generate Gambar Ruxa AI*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `*Cara pakai:*\n` +
          `• \`.imgai <prompt>\` → model default (3 token)\n` +
          `• \`.imgai <model> <prompt>\` → model pilihan\n` +
          `• \`.imgai list\` → lihat semua model & harga\n\n` +
          `*Contoh:*\n` +
          `• \`.imgai kucing lucu pakai topi\`\n` +
          `• \`.imgai nano-banana-pro sunset di pantai bali\`\n` +
          `• \`.imgai gpt-4o-image anime girl kawaii\`\n\n` +
          `🎯 *Model default:* nano-banana (3 token)\n` +
          `🪙 *Token kamu:* ${getTokens(sender)}\n\n` +
          `Ketik *.imgai list* untuk lihat semua model`
      })
    }

    // Ambil biaya token yang benar untuk model ini
    const TOKEN_COST = getModelTokenCost(model)

    // Cek saldo token
    const tokens = getTokens(sender)
    if (tokens < TOKEN_COST) {
      const modelInfo = IMAGE_MODELS.find(m => m.key === model)
      return sock.sendMessage(from, {
        text:
          `❌ *Token tidak cukup!*\n\n` +
          `🎨 Model: *${modelInfo?.label || model}*\n` +
          `💸 Dibutuhkan: *${TOKEN_COST} token*\n` +
          `🪙 Token kamu: *${tokens}*\n\n` +
          `Ketik *.premium* untuk beli token.\n` +
          `Atau ketik *.imgai list* untuk lihat model yang lebih murah.`
      })
    }

    // Notifikasi proses
    const modelInfo = IMAGE_MODELS.find(m => m.key === model)
    await sock.sendMessage(from, {
      text:
        `🎨 *Generating gambar...*\n\n` +
        `🤖 Model: *${modelInfo?.label || model}*\n` +
        `📝 Prompt: ${prompt}\n` +
        `🪙 Biaya: *${TOKEN_COST} token*\n\n` +
        `⏳ Mohon tunggu...`
    })

    try {
      // Potong token SEBELUM generate (dikembalikan jika gagal)
      const remaining = useTokens(sender, TOKEN_COST)

      const imageUrl = await generateImage({ prompt, model })

      await sock.sendMessage(from, {
        image: { url: imageUrl },
        caption:
          `🎨 *Hasil Generate Gambar AI*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🤖 Model: *${modelInfo?.label || model}*\n` +
          `📝 ${prompt}\n\n` +
          `🪙 Token terpakai: *${TOKEN_COST}* | Sisa: *${remaining}*`
      })

      const warning = getTokenWarning(sender)
      if (warning) await sock.sendMessage(from, { text: warning })

    } catch (err) {
      // Kembalikan token jika gagal
      addTokens(sender, TOKEN_COST)
      console.log("[imgai] ERROR:", err.message)

      await sock.sendMessage(from, {
        text:
          `❌ *Gagal generate gambar!*\n\n` +
          `📛 ${err.message}\n\n` +
          `🪙 Token dikembalikan: *${TOKEN_COST}*\n\n` +
          `💡 Tips:\n` +
          `• Coba prompt yang lebih sederhana\n` +
          `• Ganti model lain: *.imgai list*\n` +
          `• Coba beberapa saat lagi`
      })
    }
  }
}
