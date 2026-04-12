/**
 * broadcast.js — Broadcast ke semua user (ADMIN ONLY)
 *
 * Commands:
 *   .bc <pesan>       → broadcast teks
 *   .bcfoto           → broadcast foto (kirim/reply foto + caption opsional)
 *   .bcvideo          → broadcast video (kirim/reply video + caption opsional)
 *   .bctotal          → lihat total user terdaftar
 */

const { getAllUsers, getUserCount } = require("../ai/userdb")
const { isAdmin } = require("../ai/ownerHelper")
const { downloadMediaMessage } = require("@whiskeysockets/baileys")

const DELAY_MS = 1000

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

function getHeader() {
  return `📢 *NOTIFIKASI BOT*\n━━━━━━━━━━━━━━━━━━━━\n\n`
}

function getFooter() {
  return `\n\n━━━━━━━━━━━━━━━━━━━━\n_Pesan ini dikirim oleh admin._`
}

module.exports = {
  name:  "broadcast",
  alias: ["broadcast", "bc", "bcfoto", "bcvideo", "bctotal"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const rawText = (
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption || ""
    ).trim()
    const command = rawText.slice(1).split(" ")[0].toLowerCase()

    if (!isAdmin(sender)) {
      return sock.sendMessage(from, { text: "❌ Perintah ini hanya untuk admin." }, { quoted: m })
    }

    const users = getAllUsers()

    // .bctotal
    if (command === "bctotal") {
      return sock.sendMessage(from, {
        text:
          `📊 *Statistik User Bot*\n\n` +
          `👥 Total user terdaftar: *${getUserCount()} orang*\n\n` +
          `📢 *.bc <pesan>* — broadcast teks\n` +
          `🖼️ *.bcfoto* — broadcast foto\n` +
          `🎬 *.bcvideo* — broadcast video`
      }, { quoted: m })
    }

    // .bc / .broadcast (teks)
    if (command === "bc" || command === "broadcast") {
      const pesan = args.join(" ").trim()

      if (!pesan) {
        return sock.sendMessage(from, {
          text:
            `📢 *Broadcast Teks*\n\n` +
            `Format: *.bc <pesan kamu>*\n\n` +
            `Contoh:\n*.bc Halo semua! Bot sudah update fitur baru 🎉*\n\n` +
            `📊 Total user: *${getUserCount()}*`
        }, { quoted: m })
      }

      if (users.length === 0) {
        return sock.sendMessage(from, { text: `⚠️ Belum ada user terdaftar.` }, { quoted: m })
      }

      await sock.sendMessage(from, {
        text:
          `📤 *Broadcast teks dimulai...*\n` +
          `📨 Kirim ke: *${users.length} user*\n` +
          `⏳ Estimasi: ~${Math.ceil(users.length * DELAY_MS / 1000)} detik`
      }, { quoted: m })

      let sukses = 0, gagal = 0
      for (const userId of users) {
        try {
          await sock.sendMessage(userId, { text: getHeader() + pesan + getFooter() })
          sukses++
        } catch { gagal++ }
        await sleep(DELAY_MS)
      }

      return sock.sendMessage(from, {
        text:
          `✅ *Broadcast selesai!*\n\n` +
          `📨 Total: *${users.length}* | ✅ Berhasil: *${sukses}* | ❌ Gagal: *${gagal}*`
      }, { quoted: m })
    }

    // .bcfoto (foto + caption opsional)
    if (command === "bcfoto") {
      const directImage = m.message?.imageMessage
      const quotedImage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
      const hasImage    = !!(directImage || quotedImage)

      if (!hasImage) {
        return sock.sendMessage(from, {
          text:
            `🖼️ *Broadcast Foto*\n\n` +
            `Cara pakai:\n` +
            `• Kirim foto + ketik *.bcfoto <teks opsional>*\n` +
            `• Atau reply foto lalu ketik *.bcfoto <teks opsional>*\n\n` +
            `📊 Total user: *${getUserCount()}*`
        }, { quoted: m })
      }

      const caption = args.join(" ").trim()
      let imgBuffer
      try {
        const targetMsg = quotedImage
          ? { key: m.key, message: m.message?.extendedTextMessage?.contextInfo?.quotedMessage }
          : m
        imgBuffer = await downloadMediaMessage(targetMsg, "buffer", {})
      } catch (e) {
        return sock.sendMessage(from, { text: `❌ Gagal ambil foto: ${e.message}` }, { quoted: m })
      }

      if (users.length === 0) return sock.sendMessage(from, { text: `⚠️ Belum ada user terdaftar.` }, { quoted: m })

      await sock.sendMessage(from, {
        text:
          `📤 *Broadcast foto dimulai...*\n` +
          `📨 Kirim ke: *${users.length} user*\n` +
          `⏳ Estimasi: ~${Math.ceil(users.length * DELAY_MS / 1000)} detik`
      }, { quoted: m })

      let sukses = 0, gagal = 0
      for (const userId of users) {
        try {
          await sock.sendMessage(userId, {
            image:   imgBuffer,
            caption: getHeader() + (caption || "Informasi terbaru dari admin.") + getFooter()
          })
          sukses++
        } catch { gagal++ }
        await sleep(DELAY_MS)
      }

      return sock.sendMessage(from, {
        text:
          `✅ *Broadcast foto selesai!*\n\n` +
          `📨 Total: *${users.length}* | ✅ Berhasil: *${sukses}* | ❌ Gagal: *${gagal}*`
      }, { quoted: m })
    }

    // .bcvideo (video + caption opsional)
    if (command === "bcvideo") {
      const directVideo = m.message?.videoMessage
      const quotedVideo = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage
      const hasVideo    = !!(directVideo || quotedVideo)

      if (!hasVideo) {
        return sock.sendMessage(from, {
          text:
            `🎬 *Broadcast Video*\n\n` +
            `Cara pakai:\n` +
            `• Kirim video + ketik *.bcvideo <teks opsional>*\n` +
            `• Atau reply video lalu ketik *.bcvideo <teks opsional>*\n\n` +
            `📊 Total user: *${getUserCount()}*`
        }, { quoted: m })
      }

      const caption = args.join(" ").trim()
      let videoBuffer
      try {
        const targetMsg = quotedVideo
          ? { key: m.key, message: m.message?.extendedTextMessage?.contextInfo?.quotedMessage }
          : m
        videoBuffer = await downloadMediaMessage(targetMsg, "buffer", {})
      } catch (e) {
        return sock.sendMessage(from, { text: `❌ Gagal ambil video: ${e.message}` }, { quoted: m })
      }

      if (users.length === 0) return sock.sendMessage(from, { text: `⚠️ Belum ada user terdaftar.` }, { quoted: m })

      await sock.sendMessage(from, {
        text:
          `📤 *Broadcast video dimulai...*\n` +
          `📨 Kirim ke: *${users.length} user*\n` +
          `⏳ Estimasi: ~${Math.ceil(users.length * DELAY_MS / 1000)} detik`
      }, { quoted: m })

      let sukses = 0, gagal = 0
      for (const userId of users) {
        try {
          await sock.sendMessage(userId, {
            video:   videoBuffer,
            caption: getHeader() + (caption || "Informasi terbaru dari admin.") + getFooter()
          })
          sukses++
        } catch { gagal++ }
        await sleep(DELAY_MS)
      }

      return sock.sendMessage(from, {
        text:
          `✅ *Broadcast video selesai!*\n\n` +
          `📨 Total: *${users.length}* | ✅ Berhasil: *${sukses}* | ❌ Gagal: *${gagal}*`
      }, { quoted: m })
    }
  }
}
