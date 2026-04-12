/**
 * broadcast.js — Notifikasi/broadcast ke semua user (ADMIN ONLY)
 *
 * Commands:
 *   .broadcast <pesan>          → kirim teks ke semua user
 *   .bc <pesan>                 → alias broadcast
 *   .bcfoto (dengan kirim foto) → kirim foto + caption ke semua user
 *   .bctotal                    → lihat total user terdaftar
 *
 * Hanya nomor admin 083866344919 yang bisa pakai command ini.
 */

const { getAllUsers, getUserCount } = require("../ai/userdb")

const ADMIN_NUMBER = process.env.ADMIN_NUMBER || "6283866344919"

function isAdmin(sender) {
  const num = sender.replace(/@s\.whatsapp\.net$/, "").replace(/:\d+$/, "")
  return num === ADMIN_NUMBER
}

const DELAY_MS = 1000

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

module.exports = {
  name:  "broadcast",
  alias: ["broadcast", "bc", "bcfoto", "bctotal"],

  async run(sock, m, args) {
    const from    = m.key.remoteJid
    const sender  = m.key.participant || m.key.remoteJid
    const rawText = (
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption || ""
    ).trim()
    const command = rawText.slice(1).split(" ")[0].toLowerCase()

    if (!isAdmin(sender)) {
      return sock.sendMessage(from, {
        text: "❌ Perintah ini hanya untuk admin."
      }, { quoted: m })
    }

    // ─── .bctotal ─────────────────────────────────────────────────
    if (command === "bctotal") {
      const total = getUserCount()
      return sock.sendMessage(from, {
        text:
          `📊 *Statistik User Bot*\n\n` +
          `👥 Total user terdaftar: *${total} orang*\n\n` +
          `💡 Gunakan *.broadcast <pesan>* untuk kirim notifikasi ke semua user.`
      }, { quoted: m })
    }

    // ─── .broadcast / .bc (teks) ──────────────────────────────────
    if (command === "broadcast" || command === "bc") {
      const pesan = args.join(" ").trim()

      if (!pesan) {
        return sock.sendMessage(from, {
          text:
            `📢 *Broadcast Teks*\n\n` +
            `Format: *.broadcast <pesan kamu>*\n\n` +
            `Contoh:\n` +
            `*.broadcast Halo semua! Bot sudah update fitur baru ya 🎉*\n\n` +
            `📊 Total user: *${getUserCount()}*`
        }, { quoted: m })
      }

      const users = getAllUsers()
      if (users.length === 0) {
        return sock.sendMessage(from, {
          text: `⚠️ Belum ada user terdaftar.\nUser akan terdaftar otomatis saat pertama kali chat dengan bot.`
        }, { quoted: m })
      }

      await sock.sendMessage(from, {
        text:
          `📤 *Broadcast dimulai...*\n\n` +
          `📨 Kirim ke: *${users.length} user*\n` +
          `⏳ Estimasi: ~${Math.ceil(users.length * DELAY_MS / 1000)} detik\n\n` +
          `Jangan tutup bot selama proses berlangsung!`
      }, { quoted: m })

      let sukses = 0
      let gagal  = 0

      for (const userId of users) {
        try {
          await sock.sendMessage(userId, {
            text:
              `📢 *NOTIFIKASI BOT*\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${pesan}\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n` +
              `_Pesan ini dikirim oleh admin._`
          })
          sukses++
        } catch {
          gagal++
        }
        await sleep(DELAY_MS)
      }

      return sock.sendMessage(from, {
        text:
          `✅ *Broadcast selesai!*\n\n` +
          `📨 Total dikirim: *${users.length}*\n` +
          `✅ Berhasil: *${sukses}*\n` +
          `❌ Gagal: *${gagal}*`
      }, { quoted: m })
    }

    // ─── .bcfoto (foto + caption) ─────────────────────────────────
    if (command === "bcfoto") {
      const directImage = m.message?.imageMessage
      const quotedImage = m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

      const hasImage = !!(directImage || quotedImage)

      if (!hasImage) {
        return sock.sendMessage(from, {
          text:
            `🖼️ *Broadcast Foto*\n\n` +
            `Kirim foto dengan caption:\n` +
            `*.bcfoto <pesan opsional>*\n\n` +
            `Atau reply ke foto dengan caption:\n` +
            `*.bcfoto Promo hari ini!*\n\n` +
            `📊 Total user: *${getUserCount()}*`
        }, { quoted: m })
      }

      const caption = args.join(" ").trim()
      const users   = getAllUsers()

      if (users.length === 0) {
        return sock.sendMessage(from, {
          text: `⚠️ Belum ada user terdaftar.`
        }, { quoted: m })
      }

      const { downloadMediaMessage } = require("@whiskeysockets/baileys")

      let imgBuffer
      try {
        const targetMsg = quotedImage
          ? { key: m.key, message: m.message?.extendedTextMessage?.contextInfo?.quotedMessage }
          : m
        imgBuffer = await downloadMediaMessage(targetMsg, "buffer", {})
      } catch (e) {
        return sock.sendMessage(from, {
          text: `❌ Gagal ambil gambar: ${e.message}`
        }, { quoted: m })
      }

      await sock.sendMessage(from, {
        text:
          `📤 *Broadcast Foto dimulai...*\n\n` +
          `📨 Kirim ke: *${users.length} user*\n` +
          `⏳ Estimasi: ~${Math.ceil(users.length * DELAY_MS / 1000)} detik`
      }, { quoted: m })

      let sukses = 0
      let gagal  = 0

      for (const userId of users) {
        try {
          await sock.sendMessage(userId, {
            image:   imgBuffer,
            caption:
              `📢 *NOTIFIKASI BOT*\n` +
              `━━━━━━━━━━━━━━━━━━━━\n\n` +
              `${caption || "Informasi terbaru dari admin."}\n\n` +
              `━━━━━━━━━━━━━━━━━━━━\n` +
              `_Pesan ini dikirim oleh admin._`
          })
          sukses++
        } catch {
          gagal++
        }
        await sleep(DELAY_MS)
      }

      return sock.sendMessage(from, {
        text:
          `✅ *Broadcast Foto selesai!*\n\n` +
          `📨 Total dikirim: *${users.length}*\n` +
          `✅ Berhasil: *${sukses}*\n` +
          `❌ Gagal: *${gagal}*`
      }, { quoted: m })
    }
  }
}
