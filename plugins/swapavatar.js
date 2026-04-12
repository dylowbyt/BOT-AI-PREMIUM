/**
 * swapavatar.js — Swap avatar/wajah ke video menggunakan AI
 *
 * Cara pakai:
 *   Cara 1: Kirim FOTO wajah + reply ke VIDEO target
 *     → Kirim foto kamu, lalu reply ke video dengan caption .swapavatar
 *   Cara 2: Kirim VIDEO + reply ke FOTO wajah
 *     → Reply foto wajah, kirim/caption video dengan .swapavatar
 *
 * Biaya: 23 token per swap
 *
 * ENV yang dibutuhkan:
 *   AIVIDEO_API_KEY atau RUXA_API_KEY
 */

const { downloadMediaMessage } = require("@whiskeysockets/baileys")
const { swapAvatarVideo }      = require("../ai/wanai")
const { useTokens, getTokens, addTokens, getTokenWarning } = require("../ai/tokendb")

const TOKEN_COST = 23

module.exports = {
  name:  "swapavatar",
  alias: ["faceswap", "avatarswap"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    if (!m.message) return

    const msg        = m.message
    const quotedMsg  = msg?.extendedTextMessage?.contextInfo?.quotedMessage

    const directImg  = msg?.imageMessage
    const quotedImg  = quotedMsg?.imageMessage
    const directVid  = msg?.videoMessage
    const quotedVid  = quotedMsg?.videoMessage

    const hasImg = !!(directImg || quotedImg)
    const hasVid = !!(directVid || quotedVid)

    if (!hasImg && !hasVid) {
      return sock.sendMessage(from, {
        text:
          `🔄 *SWAP AVATAR VIDEO — .swapavatar*\n\n` +
          `Fitur ini mengganti wajah dalam video dengan wajah dari foto kamu menggunakan AI.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📋 *CARA PAKAI:*\n\n` +
          `*Cara 1:*\n` +
          `1. Reply ke video yang mau di-swap\n` +
          `2. Kirim foto wajah dengan caption *.swapavatar*\n\n` +
          `*Cara 2:*\n` +
          `1. Kirim video dengan caption *.swapavatar*\n` +
          `2. Reply ke foto wajah sumber\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💡 *TIPS:*\n` +
          `• Gunakan foto wajah yang jelas & frontal\n` +
          `• Video maksimal 30 detik\n` +
          `• Pencahayaan video yang baik = hasil lebih bagus\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🪙 Biaya: *${TOKEN_COST} token* per swap\n` +
          `💰 Token kamu: *${getTokens(sender)} token*`
      })
    }

    if (hasImg && !hasVid) {
      return sock.sendMessage(from, {
        text:
          `⚠️ Foto terdeteksi, tapi *video target tidak ada*.\n\n` +
          `Reply ke video yang mau di-swap, lalu kirim foto wajah dengan caption *.swapavatar*`
      })
    }

    if (hasVid && !hasImg) {
      return sock.sendMessage(from, {
        text:
          `⚠️ Video terdeteksi, tapi *foto wajah tidak ada*.\n\n` +
          `Kirim video dan reply ke foto wajah sumber dengan caption *.swapavatar*`
      })
    }

    const tokens = getTokens(sender)
    if (tokens < TOKEN_COST) {
      return sock.sendMessage(from, {
        text:
          `❌ *Token kamu tidak cukup!*\n\n` +
          `🪙 Token kamu: *${tokens}*\n` +
          `💸 Dibutuhkan: *${TOKEN_COST} token*\n\n` +
          `Ketik *.premium* untuk beli token.`
      })
    }

    await sock.sendMessage(from, {
      text:
        `🔄 *Memproses Swap Avatar...*\n\n` +
        `⬆️ Mengupload foto & video...\n` +
        `🤖 AI sedang memproses...\n\n` +
        `⏳ Proses biasanya 2-5 menit.\n` +
        `🪙 *${TOKEN_COST} token* akan dipotong.`
    })

    let faceBuffer  = null
    let videoBuffer = null
    let faceType    = "image/jpeg"
    let videoType   = "video/mp4"

    try {
      if (directImg) {
        faceBuffer = await downloadMediaMessage(m, "buffer", {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
        faceType   = directImg.mimetype || "image/jpeg"
      } else if (quotedImg) {
        faceBuffer = await downloadMediaMessage(
          { key: m.key, message: quotedMsg },
          "buffer", {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        )
        faceType = quotedImg.mimetype || "image/jpeg"
      }

      if (directVid) {
        videoBuffer = await downloadMediaMessage(m, "buffer", {}, { logger: console, reuploadRequest: sock.updateMediaMessage })
        videoType   = directVid.mimetype || "video/mp4"
      } else if (quotedVid) {
        videoBuffer = await downloadMediaMessage(
          { key: m.key, message: quotedMsg },
          "buffer", {},
          { logger: console, reuploadRequest: sock.updateMediaMessage }
        )
        videoType = quotedVid.mimetype || "video/mp4"
      }

    } catch (e) {
      console.log("[swapavatar] Download error:", e.message)
      return sock.sendMessage(from, {
        text: `❌ Gagal download media: ${e.message}\n\nCoba kirim ulang foto/video.`
      })
    }

    if (!faceBuffer || !videoBuffer) {
      return sock.sendMessage(from, {
        text: `❌ Gagal membaca media. Coba kirim ulang foto dan video.`
      })
    }

    const remaining = useTokens(sender, TOKEN_COST)

    try {
      const resultUrl = await swapAvatarVideo({
        faceBuffer,
        videoBuffer,
        faceType,
        videoType
      })

      await sock.sendMessage(from, {
        video:   { url: resultUrl },
        caption:
          `✅ *Swap Avatar Berhasil!*\n\n` +
          `🤖 Powered by: *AI Face Swap*\n` +
          `🪙 Token terpakai: *${TOKEN_COST}*\n` +
          `💰 Sisa token: *${remaining}*`
      })

      const warning = getTokenWarning(sender)
      if (warning) await sock.sendMessage(from, { text: warning })

    } catch (err) {
      addTokens(sender, TOKEN_COST)

      console.log("[swapavatar] ERROR:", err.message)

      await sock.sendMessage(from, {
        text:
          `❌ *Swap Avatar Gagal!*\n\n` +
          `📛 Error: ${err.message}\n\n` +
          `🪙 Token dikembalikan: *${TOKEN_COST}*\n` +
          `💰 Sisa token: *${getTokens(sender)}*\n\n` +
          `💡 Tips:\n` +
          `• Pastikan foto wajah jelas & frontal\n` +
          `• Coba video yang lebih pendek\n` +
          `• Coba lagi beberapa saat nanti`
      })
    }
  }
}
