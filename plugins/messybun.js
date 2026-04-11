/**
 * messybun.js — AI Ganti Rambut Jadi Gaya Trending (Messy Bun, dll)
 * Command: .messybun
 * 4 TOKEN - menggunakan Ruxa AI (nano-banana-edit)
 */

require("dotenv").config()
const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { editImage }            = require("../ai/ruxaimage")
const { useTokens, getTokens, addTokens, getTokenWarning } = require("../ai/tokendb")

const TOKEN_COST = 4

// ─── Pilihan gaya rambut trending ───────────────────
const STYLES = {
  "messybun": {
    label: "Messy Bun 🌀",
    prompt: "Change this person's hairstyle to a messy bun updo, loosely gathered with soft wispy strands falling around the face, very natural and casual look. Keep the face, skin, expression, clothing, and background exactly the same. Only change the hair."
  },
  "wolfcut": {
    label: "Wolf Cut 🐺",
    prompt: "Change this person's hairstyle to a wolf cut with curtain bangs, layered shaggy texture, modern edgy look. Keep the face, skin, expression, clothing, and background exactly the same. Only change the hair."
  },
  "bobcut": {
    label: "Bob Cut ✂️",
    prompt: "Change this person's hairstyle to a sleek chin-length bob cut, straight and polished. Keep the face, skin, expression, clothing, and background exactly the same. Only change the hair."
  },
  "curly": {
    label: "Keriting Afro 🌿",
    prompt: "Change this person's hairstyle to big natural curly afro hair, voluminous and bouncy. Keep the face, skin, expression, clothing, and background exactly the same. Only change the hair."
  },
  "buzzcut": {
    label: "Buzz Cut 🪒",
    prompt: "Change this person's hairstyle to a very short military buzz cut, almost shaved. Keep the face, skin, expression, clothing, and background exactly the same. Only change the hair."
  },
  "panjang": {
    label: "Rambut Panjang Lurus 💇",
    prompt: "Change this person's hairstyle to long straight silky hair flowing down to the shoulders or below. Keep the face, skin, expression, clothing, and background exactly the same. Only change the hair."
  },
  "kepang": {
    label: "Kepang Dua 🎀",
    prompt: "Change this person's hairstyle to two cute braided pigtails on each side. Keep the face, skin, expression, clothing, and background exactly the same. Only change the hair."
  },
  "undercut": {
    label: "Undercut Modern 💈",
    prompt: "Change this person's hairstyle to a modern undercut with the sides shaved short and longer styled hair on top swept to one side. Keep the face, skin, expression, clothing, and background exactly the same. Only change the hair."
  }
}

const STYLE_LIST = Object.entries(STYLES)
  .map(([k, v]) => `• *.messybun ${k}* — ${v.label}`)
  .join("\n")

module.exports = {
  name: "messybun",
  alias: ["trendhair", "gantiram", "hairai", "hairstyle"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    const msg       = m.message
    const quoted    = msg?.extendedTextMessage?.contextInfo?.quotedMessage
    const directImg = msg?.imageMessage
    const quotedImg = quoted?.imageMessage
    const hasImg    = !!(directImg || quotedImg)
    const styleKey  = args[0]?.toLowerCase() || "messybun"

    // ─── MENU ─────────────────────────────────────────
    if (!hasImg) {
      return sock.sendMessage(from, {
        text:
          `💇 *AI HAIRSTYLE CHANGER — TRENDING*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Viral di TikTok! Ganti rambut siapa aja jadi gaya trending.\n` +
          `Cocok buat foto tokoh publik, teman, atau diri sendiri!\n\n` +
          `*Cara pakai:*\n` +
          `Kirim foto + caption: *.messybun [gaya]*\n\n` +
          `*Gaya tersedia:*\n` +
          `${STYLE_LIST}\n\n` +
          `*Default (tanpa gaya):* Messy Bun 🌀\n\n` +
          `🪙 Biaya: *${TOKEN_COST} token* per foto\n` +
          `💰 Token kamu: *${getTokens(sender)}*\n\n` +
          `_Contoh: kirim foto orang + *.messybun wolfcut*_`
      })
    }

    // ─── VALIDASI STYLE ───────────────────────────────
    const style = STYLES[styleKey] || STYLES["messybun"]
    const tokens = getTokens(sender)

    if (tokens < TOKEN_COST) {
      return sock.sendMessage(from, {
        text:
          `❌ *Token tidak cukup!*\n\n` +
          `🪙 Token kamu: *${tokens}*\n` +
          `💸 Dibutuhkan: *${TOKEN_COST} token*\n\n` +
          `Ketik *.premium* untuk beli token.`
      })
    }

    await sock.sendMessage(from, {
      text:
        `💇 *AI Hairstyle sedang bekerja...*\n\n` +
        `✂️ Gaya: *${style.label}*\n` +
        `🖼️ Mengedit foto...\n\n` +
        `⏳ Tunggu 30-60 detik...\n` +
        `🪙 *${TOKEN_COST} token* akan dipotong`
    })

    try {
      // ─── Download gambar ──────────────────────────
      let imageBuffer
      if (directImg) {
        imageBuffer = await downloadMediaMessage(
          m, "buffer", {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        )
      } else {
        imageBuffer = await downloadMediaMessage(
          { key: m.key, message: quoted }, "buffer", {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        )
      }

      // ─── Edit via Ruxa AI ─────────────────────────
      const remaining = useTokens(sender, TOKEN_COST)

      const resultUrl = await editImage({
        prompt:       style.prompt,
        imageBuffers: [imageBuffer],
        model:        "nano-banana-edit"
      })

      // ─── Kirim hasil ──────────────────────────────
      await sock.sendMessage(from, {
        image:   { url: resultUrl },
        caption:
          `💇 *Hairstyle Berhasil Diubah!*\n\n` +
          `✂️ Gaya: *${style.label}*\n` +
          `🤖 Model: *Nano Banana Edit (Ruxa AI)*\n` +
          `🪙 Token terpakai: *${TOKEN_COST}* | Sisa: *${remaining}*\n\n` +
          `_Coba gaya lain: .messybun wolfcut / bobcut / curly / dll_`
      })

      const warning = getTokenWarning(sender)
      if (warning) await sock.sendMessage(from, { text: warning })

    } catch (err) {
      addTokens(sender, TOKEN_COST)
      console.log("[messybun] ERROR:", err.message)
      await sock.sendMessage(from, {
        text:
          `❌ *Gagal ubah gaya rambut!*\n\n` +
          `📛 ${err.message}\n\n` +
          `🪙 Token dikembalikan: *${TOKEN_COST}*\n\n` +
          `💡 Tips:\n` +
          `• Pastikan foto wajah jelas & tidak blur\n` +
          `• Foto portrait (wajah menghadap ke depan) lebih baik\n` +
          `• Coba lagi beberapa saat`
      })
    }
  }
}
