const identity = require("./identity")

module.exports = {
  name: "setbio",
  alias: ["ubahbio", "setdeskripsi", "setnama"],

  async run(sock, m, args) {
    const from = m.key.remoteJid

    // FIX: Cek command yang dipakai dari pesan asli (bukan dari args)
    const rawText = m.message?.conversation || m.message?.extendedTextMessage?.text || ""
    const usedCmd = rawText.trim().split(" ")[0].replace(".", "").toLowerCase()

    // ===== SETNAMA — ganti nama bot =====
    if (usedCmd === "setnama" || args[0]?.toLowerCase() === "nama") {
      const nama = usedCmd === "setnama" ? args.join(" ").trim() : args.slice(1).join(" ").trim()
      if (!nama) {
        return sock.sendMessage(from, {
          text: `⚠️ *Cara pakai .setnama:*\n.setnama <nama baru>\n\nContoh: .setnama ZenBot AI\n\n📛 Nama sekarang: *${identity.nama}*`
        })
      }

      try {
        await sock.updateProfileName(nama)
        identity.nama = nama
        await sock.sendMessage(from, { text: `✅ Nama bot berhasil diubah!\n📛 Nama baru: *${nama}*` })
      } catch (err) {
        await sock.sendMessage(from, { text: `❌ Gagal ubah nama: ${err.message?.slice(0, 80)}` })
      }
      return
    }

    // ===== INFO TANPA ARGS =====
    if (!args.length) {
      return sock.sendMessage(from, {
        text: `✏️ *PENGATURAN PROFIL BOT*\n━━━━━━━━━━━━━━━\n• .setbio <teks> — Ganti bio/status bot\n• .setnama <nama> — Ganti nama bot\n\nContoh:\n.setbio Bot WA AI 100+ fitur | Ketik .menu\n.setnama ZenBot Official\n\n📝 Bio max 139 karakter`
      })
    }

    // ===== SETBIO — ganti bio bot =====
    const bio = args.join(" ")
    if (!bio || bio.length < 2) {
      return sock.sendMessage(from, { text: "❌ Tulis bio setelah .setbio\nContoh: .setbio Bot AI 100+ fitur | Ketik .menu" })
    }

    if (bio.length > 139) {
      return sock.sendMessage(from, { text: `❌ Bio terlalu panjang (${bio.length}/139 karakter). Persingkat dulu.` })
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Mengubah bio bot..." })
      await sock.updateProfileStatus(bio)
      await sock.sendMessage(from, {
        text: `✅ Bio *${identity.nama}* berhasil diperbarui!\n\n📝 Bio baru:\n_"${bio}"_`
      })
    } catch (err) {
      await sock.sendMessage(from, {
        text: `❌ Gagal ubah bio: ${err.message?.slice(0, 100)}`
      })
    }
  }
}
