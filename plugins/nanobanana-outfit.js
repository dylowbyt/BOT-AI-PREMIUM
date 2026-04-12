const axios = require("axios")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { getTokens, addTokens, useTokens } = require("../ai/tokendb")

const API_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.NANOBANANA_API_KEY

const MODEL = process.env.NANOBANANA_MODEL || "gemini-2.5-flash-image-preview"
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
const TOKEN_COST = 23

function getMessageText(m) {
  return (
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.imageMessage?.caption ||
    ""
  )
}

function getQuotedMessage(m) {
  return (
    m.message?.extendedTextMessage?.contextInfo?.quotedMessage ||
    m.message?.imageMessage?.contextInfo?.quotedMessage ||
    null
  )
}

function getImageInfo(message) {
  if (!message) return null
  if (message.imageMessage) return message.imageMessage
  return null
}

async function downloadImage(sock, m, message, label) {
  const targetMsg = message === m.message
    ? m
    : { key: m.key, message }

  const buffer = await downloadMediaMessage(
    targetMsg,
    "buffer",
    {},
    {
      logger: console,
      reuploadRequest: sock.updateMediaMessage
    }
  )

  const imageInfo = getImageInfo(message)
  const mimeType = imageInfo?.mimetype || "image/jpeg"

  return {
    label,
    buffer,
    mimeType
  }
}

function buildOutfitPrompt(extraPrompt = "") {
  return `
Edit foto pertama sebagai subjek utama. Foto kedua adalah referensi outfit.

Tugas utama:
- Pertahankan wajah, identitas, ekspresi, bentuk kepala, rambut, warna kulit, postur tubuh, proporsi badan, tinggi badan, pose, arah pandang, dan gestur subjek dari foto pertama seakurat mungkin.
- Jangan mengubah wajah. Jangan mengganti orangnya. Jangan membuat wajah terlihat seperti orang lain.
- Terapkan outfit dari foto kedua ke tubuh subjek di foto pertama.
- Outfit harus mengikuti referensi foto kedua: jenis pakaian, model, cutting, warna, motif, tekstur kain, layering, aksesoris, dan gaya keseluruhan.
- Sesuaikan outfit agar terlihat natural mengikuti bentuk badan, pose, lipatan kain, pencahayaan, perspektif, dan bayangan pada foto pertama.
- Pertahankan background foto pertama kecuali memang perlu penyesuaian kecil agar hasil menyatu.
- Hasil harus realistis seperti foto asli, bukan ilustrasi, bukan kartun, bukan edit kasar.
- Jangan menambahkan orang baru, jangan mengubah gender, jangan mengubah umur, jangan mengubah bentuk tubuh.
- Jika outfit referensi memiliki aksesoris seperti jaket, tas, topi, sepatu, jam, kalung, atau kacamata, terapkan hanya jika terlihat relevan dan natural pada subjek.

Prioritas kualitas:
1. Wajah dan postur tubuh harus 100% konsisten dengan foto pertama.
2. Outfit harus mengikuti referensi foto kedua semirip mungkin.
3. Pencahayaan, bayangan, perspektif, dan tekstur harus menyatu realistis.

Prompt tambahan dari user:
${extraPrompt || "Tidak ada prompt tambahan. Fokus pada penggantian outfit sesuai referensi."}
`.trim()
}

async function callNanoBanana({ personImage, outfitImage, prompt }) {
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY / GOOGLE_API_KEY / NANOBANANA_API_KEY belum diset di environment")
  }

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: personImage.mimeType,
              data: personImage.buffer.toString("base64")
            }
          },
          {
            inlineData: {
              mimeType: outfitImage.mimeType,
              data: outfitImage.buffer.toString("base64")
            }
          }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ["IMAGE", "TEXT"]
    }
  }

  const res = await axios.post(`${API_URL}?key=${API_KEY}`, payload, {
    timeout: 120000,
    headers: {
      "Content-Type": "application/json"
    }
  })

  const parts = res.data?.candidates?.[0]?.content?.parts || []
  const imagePart = parts.find(part => part.inlineData?.data)
  const textPart = parts.find(part => part.text)?.text

  if (!imagePart?.inlineData?.data) {
    throw new Error(textPart || "API tidak mengembalikan gambar")
  }

  return {
    buffer: Buffer.from(imagePart.inlineData.data, "base64"),
    mimeType: imagePart.inlineData.mimeType || "image/png",
    note: textPart || ""
  }
}

module.exports = {
  name: "outfit",
  alias: ["editoutfit", "nanobanana", "nboutfit", "ubahoutfit", "gantioutfit"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    let tokenDeducted = false

    try {
      const text = getMessageText(m)
      const extraPrompt = args.join(" ").trim()
      const quoted = getQuotedMessage(m)

      const directImage = getImageInfo(m.message)
      const quotedImage = getImageInfo(quoted)

      if (!directImage || !quotedImage) {
        return sock.sendMessage(from, {
          text:
            `👕 *NANO BANANA OUTFIT EDIT*\n\n` +
            `Cara pakai yang benar:\n\n` +
            `1. Kirim foto orang yang mau diedit.\n` +
            `2. Reply foto orang itu dengan foto referensi outfit.\n` +
            `3. Di caption foto referensi, tulis:\n` +
            `*.outfit*\n\n` +
            `Opsional tambah arahan:\n` +
            `*.outfit buat hasil realistis, full body, pencahayaan natural*\n\n` +
            `Catatan:\n` +
            `• Foto pertama/reply = orang yang diedit\n` +
            `• Foto kedua/caption = referensi outfit\n` +
            `• Wajah dan postur akan dipertahankan semirip mungkin`
        })
      }

      if (!API_KEY) {
        return sock.sendMessage(from, {
          text:
            `❌ API key Nano Banana belum diset.\n\n` +
            `Tambahkan salah satu environment ini:\n` +
            `• GEMINI_API_KEY\n` +
            `• GOOGLE_API_KEY\n` +
            `• NANOBANANA_API_KEY`
        })
      }

      const tokens = getTokens(sender)
      if (tokens < TOKEN_COST) {
        return sock.sendMessage(from, {
          text:
            `❌ *Token kamu tidak cukup!*\n\n` +
            `🪙 Token kamu: *${tokens}*\n` +
            `💸 Dibutuhkan: *${TOKEN_COST} token*\n\n` +
            `Fitur ini termasuk *Premium*.\n` +
            `Ketik *.premium* atau *.buy basic* untuk isi token.`
        })
      }

      await sock.sendMessage(from, {
        text:
          `👕 *Memproses edit outfit...*\n\n` +
          `Foto orang: dari pesan yang direply\n` +
          `Referensi outfit: dari foto caption ini\n\n` +
          `🪙 Biaya: *${TOKEN_COST} token*\n` +
          `⏳ Tunggu sebentar, proses bisa 30-120 detik.`
      })

      useTokens(sender, TOKEN_COST)
      tokenDeducted = true

      const personImage = await downloadImage(sock, m, quoted, "person")
      const outfitImage = await downloadImage(sock, m, m.message, "outfit")
      const prompt = buildOutfitPrompt(extraPrompt)

      const result = await callNanoBanana({
        personImage,
        outfitImage,
        prompt
      })

      await sock.sendMessage(from, {
        image: result.buffer,
        caption:
          `✅ *Outfit berhasil diedit*\n\n` +
          `🪙 Token terpakai: *${TOKEN_COST}*\n` +
          `💰 Sisa token: *${getTokens(sender)}*\n\n` +
          `Prompt utama:\n` +
          `Wajah dan postur mengikuti foto pertama, outfit mengikuti referensi foto kedua.\n\n` +
          (extraPrompt ? `Prompt tambahan: ${extraPrompt}` : `Ketik *.outfit <tambahan arahan>* kalau mau hasil lebih spesifik.`)
      })

    } catch (err) {
      if (tokenDeducted) addTokens(sender, TOKEN_COST)
      console.log("NANOBANANA OUTFIT ERROR:", err?.response?.data || err?.message)
      await sock.sendMessage(from, {
        text:
          `❌ Gagal edit outfit.\n\n` +
          (tokenDeducted ? `🪙 Token *${TOKEN_COST}* sudah dikembalikan.\n\n` : "") +
          `Error: ${err?.response?.data?.error?.message || err?.message || "Tidak diketahui"}\n\n` +
          `Tips:\n` +
          `• Pastikan ada 2 foto: foto orang + foto referensi outfit\n` +
          `• Kirim foto outfit sambil reply foto orang\n` +
          `• Pastikan API key Gemini/Nano Banana aktif`
      })
    }
  }
}
