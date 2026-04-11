/**
 * stop.js — Keluar dari Anonymous Chat
 * Command: .stop
 * Digunakan saat TIDAK dalam sesi anon (ketika dalam sesi, ditangani oleh index.js)
 */

const { isInSession, isInQueue, removeFromQueue } = require("../ai/anondb")

module.exports = {
  name: "stop",
  alias: ["keluar", "quit", "exitanon"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid

    // Cek antrian
    if (isInQueue(sender)) {
      removeFromQueue(sender)
      return sock.sendMessage(from, {
        text: `✅ Berhasil keluar dari antrian pencarian.\nSemua fitur bot aktif kembali!`
      })
    }

    // Tidak dalam sesi apapun
    if (!isInSession(sender)) {
      return sock.sendMessage(from, {
        text:
          `ℹ️ Kamu tidak sedang dalam anonymous chat.\n\n` +
          `Ketik *.anon* untuk mulai chat anonim.`
      })
    }

    // Kalau sampai sini, berarti ada bug — karena .stop dalam sesi seharusnya
    // sudah ditangani di index.js SEBELUM plugin ini dipanggil
    return sock.sendMessage(from, {
      text: `⚠️ Terjadi kesalahan. Coba ketik *.stop* lagi.`
    })
  }
}
