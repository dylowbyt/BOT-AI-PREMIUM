/**
 * anon.js — Anonymous Chat Plugin
 * Command: .anon | .stop
 * 
 * FREE   : Random match
 * PREMIUM: 15 token/bulan → pilih gender (cewe/cowo)
 */

const {
  getUser, setGender, getGender,
  hasPremiumAnon, activatePremiumAnon, getPremiumExpiry,
  isInSession, isInQueue,
  addToQueue, removeFromQueue,
  findMatch, createSession, endSession,
  getQueueStats
} = require("../ai/anondb")

const { getTokens, useTokens } = require("../ai/tokendb")

const PREMIUM_COST = 15

// ─── Helper: cari pasangan & notifikasi ───────────────
async function doSearch(sock, jid, lookingFor = null) {
  // Simpan preferensi
  const user = getUser(jid)
  if (!user.gender) {
    return sock.sendMessage(jid, {
      text:
        `⚠️ Kamu belum set jenis kelamin!\n\n` +
        `Ketik:\n` +
        `• *.anon cowo* — jika kamu laki-laki\n` +
        `• *.anon cewe* — jika kamu perempuan`
    })
  }

  // Jika sudah di antrian, hapus dulu
  removeFromQueue(jid)

  // Tambah ke antrian dengan preferensi
  addToQueue(jid, lookingFor)

  // Coba cari pasangan
  const result = findMatch(jid)

  if (result.matched) {
    const partnerId = result.partnerId
    createSession(jid, partnerId)

    const partnerGender = getGender(partnerId) || "?"
    const myGender      = getGender(jid) || "?"

    const genderEmoji = { cewe: "👧", cowo: "👦" }

    // Notifikasi ke diri sendiri
    await sock.sendMessage(jid, {
      text:
        `✅ *Stranger ditemukan!*\n\n` +
        `${genderEmoji[partnerGender] || "👤"} *Stranger:* ${partnerGender}\n\n` +
        `💬 Mulai ngobrol sekarang!\n` +
        `Ketik *.stop* kapan saja untuk keluar\n\n` +
        `_⚠️ Mode anonim aktif — semua AI & fitur bot dinonaktifkan_`
    })

    // Notifikasi ke partner
    await sock.sendMessage(partnerId, {
      text:
        `✅ *Stranger ditemukan!*\n\n` +
        `${genderEmoji[myGender] || "👤"} *Stranger:* ${myGender}\n\n` +
        `💬 Mulai ngobrol sekarang!\n` +
        `Ketik *.stop* kapan saja untuk keluar\n\n` +
        `_⚠️ Mode anonim aktif — semua AI & fitur bot dinonaktifkan_`
    })

  } else {
    const stats = getQueueStats()
    const filterMsg = lookingFor
      ? `\n🔍 Mencari: *${lookingFor}*`
      : ""
    await sock.sendMessage(jid, {
      text:
        `⏳ *Mencari stranger...*${filterMsg}\n\n` +
        `👥 Antrian sekarang: *${stats.total} orang*\n` +
        `_(${stats.cowo} cowo | ${stats.cewe} cewe)_\n\n` +
        `Ketik *.anon batal* untuk keluar antrian`
    })
  }
}

// ─── Saat user baru join, cek apakah ada di antrian yang waiting ───
async function notifyWaiters(sock, newJid) {
  // Jika kita baru join antrian, cek semua yang sudah menunggu
  // findMatch sudah handle ini di doSearch
}

// ═══════════════════════════════════════════════════════
module.exports = {
  name: "anon",
  alias: ["chatanon", "anonimus", "stranger"],

  async run(sock, m, args) {
    const from   = m.key.remoteJid
    const sender = m.key.participant || m.key.remoteJid
    const sub    = args[0]?.toLowerCase()

    // ── Blokir penggunaan di grup ──
    if (from.endsWith("@g.us")) {
      return sock.sendMessage(from, {
        text: `❌ Anonymous chat hanya bisa digunakan di *chat pribadi*, bukan grup!`
      })
    }

    const jid = sender

    // ════════════════════════════════════════════════════
    // .anon (tanpa argumen) — tampilkan menu / mulai
    // ════════════════════════════════════════════════════
    if (!sub) {
      const user      = getUser(jid)
      const inSession = isInSession(jid)
      const inQueue   = isInQueue(jid)
      const stats     = getQueueStats()

      if (inSession) {
        return sock.sendMessage(jid, {
          text:
            `💬 *Kamu sedang dalam sesi anonim!*\n\n` +
            `Ketik *.stop* untuk keluar dari chat.`
        })
      }

      if (inQueue) {
        return sock.sendMessage(jid, {
          text:
            `⏳ Kamu sedang dalam antrian pencarian...\n\n` +
            `Ketik *.anon batal* untuk keluar antrian.`
        })
      }

      const premiumStatus = hasPremiumAnon(jid)
        ? `✅ Premium Aktif (s/d ${getPremiumExpiry(jid)?.toLocaleDateString("id-ID")})`
        : `❌ Belum Premium`

      return sock.sendMessage(jid, {
        text:
          `👤 *ANONYMOUS CHAT*\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Chat dengan stranger secara anonim!\n` +
          `Identitasmu tidak akan diketahui.\n\n` +
          `*Jenis Kelaminmu:* ${user.gender ? (user.gender === "cewe" ? "👧 Cewe" : "👦 Cowo") : "❓ Belum diset"}\n` +
          `*Status Premium:* ${premiumStatus}\n` +
          `*Total Sesi:* ${user.totalChats || 0} chat\n\n` +
          `👥 *Online sekarang:* ${stats.total} orang menunggu\n` +
          `_(${stats.cowo} cowo | ${stats.cewe} cewe | ${stats.sessions} sesi aktif)_\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `*Cara Pakai:*\n` +
          `👦 *.anon cowo* — Aku cowo, cari random\n` +
          `👧 *.anon cewe* — Aku cewe, cari random\n\n` +
          `🔍 *Premium (${PREMIUM_COST} token/bulan):*\n` +
          `👧 *.anon carice* — Cari spesifik cewe\n` +
          `👦 *.anon carico* — Cari spesifik cowo\n` +
          `💳 *.anon premium* — Aktifkan premium filter\n\n` +
          `🚪 *.stop* — Keluar dari chat\n` +
          `❌ *.anon batal* — Batal dari antrian\n\n` +
          `_⚠️ Saat mode anon aktif, semua fitur AI & bot nonaktif_`
      })
    }

    // ════════════════════════════════════════════════════
    // SET GENDER + MULAI CARI
    // ════════════════════════════════════════════════════
    if (sub === "cowo" || sub === "cewe") {
      if (isInSession(jid)) {
        return sock.sendMessage(jid, {
          text: `💬 Kamu sudah dalam sesi anonim! Ketik *.stop* dulu untuk keluar.`
        })
      }

      setGender(jid, sub)
      await sock.sendMessage(jid, {
        text: `${sub === "cewe" ? "👧" : "👦"} Jenis kelamin disimpan: *${sub}*\n\n🔍 Mencari stranger...`
      })

      await doSearch(sock, jid, null)
      return
    }

    // ════════════════════════════════════════════════════
    // PREMIUM: CARI GENDER SPESIFIK
    // ════════════════════════════════════════════════════
    if (sub === "carice" || sub === "cariko" || sub === "caricewe" || sub === "caricowo") {
      if (isInSession(jid)) {
        return sock.sendMessage(jid, {
          text: `💬 Kamu sudah dalam sesi anonim! Ketik *.stop* dulu untuk keluar.`
        })
      }

      const target = (sub === "carice" || sub === "caricewe") ? "cewe" : "cowo"

      if (!hasPremiumAnon(jid)) {
        return sock.sendMessage(jid, {
          text:
            `🔒 *Fitur Premium!*\n\n` +
            `Cari gender spesifik membutuhkan *Premium Anon*\n\n` +
            `💳 Harga: *${PREMIUM_COST} token / bulan*\n` +
            `💰 Token kamu: *${getTokens(jid)}*\n\n` +
            `Ketik *.anon premium* untuk aktifkan`
        })
      }

      const user = getUser(jid)
      if (!user.gender) {
        return sock.sendMessage(jid, {
          text:
            `⚠️ Set jenis kelaminmu dulu!\n\n` +
            `• *.anon cowo* — jika kamu laki-laki\n` +
            `• *.anon cewe* — jika kamu perempuan`
        })
      }

      await sock.sendMessage(jid, {
        text: `🔍 Mencari stranger *${target}*...\n💳 Premium filter aktif`
      })

      await doSearch(sock, jid, target)
      return
    }

    // ════════════════════════════════════════════════════
    // PREMIUM: AKTIFKAN
    // ════════════════════════════════════════════════════
    if (sub === "premium") {
      if (hasPremiumAnon(jid)) {
        const exp = getPremiumExpiry(jid)
        return sock.sendMessage(jid, {
          text:
            `✅ *Premium Anon sudah aktif!*\n\n` +
            `📅 Berlaku hingga: *${exp?.toLocaleDateString("id-ID")}*\n\n` +
            `Gunakan *.anon carice* / *.anon cariko* untuk cari gender spesifik.`
        })
      }

      const tokens = getTokens(jid)
      if (tokens < PREMIUM_COST) {
        return sock.sendMessage(jid, {
          text:
            `❌ *Token tidak cukup!*\n\n` +
            `🪙 Token kamu: *${tokens}*\n` +
            `💸 Dibutuhkan: *${PREMIUM_COST} token*\n\n` +
            `Ketik *.premium* untuk beli token.`
        })
      }

      // Konfirmasi
      return sock.sendMessage(jid, {
        text:
          `💳 *AKTIFKAN PREMIUM ANON?*\n\n` +
          `✨ Fitur: Cari gender spesifik (cewe/cowo)\n` +
          `📅 Durasi: *30 hari*\n` +
          `🪙 Harga: *${PREMIUM_COST} token*\n` +
          `💰 Token kamu: *${tokens}*\n\n` +
          `Ketik *.anon bayar* untuk konfirmasi`
      })
    }

    // ════════════════════════════════════════════════════
    // KONFIRMASI BAYAR PREMIUM
    // ════════════════════════════════════════════════════
    if (sub === "bayar") {
      if (hasPremiumAnon(jid)) {
        return sock.sendMessage(jid, {
          text: `✅ Premium Anon sudah aktif! Tidak perlu bayar lagi.`
        })
      }

      const remaining = useTokens(jid, PREMIUM_COST)
      if (remaining === false) {
        return sock.sendMessage(jid, {
          text: `❌ Token tidak cukup! Ketik *.premium* untuk beli token.`
        })
      }

      const expiry = activatePremiumAnon(jid)
      return sock.sendMessage(jid, {
        text:
          `🎉 *Premium Anon Aktif!*\n\n` +
          `✅ Berlaku hingga: *${expiry.toLocaleDateString("id-ID")}*\n` +
          `🪙 Token terpakai: *${PREMIUM_COST}* | Sisa: *${remaining}*\n\n` +
          `Sekarang kamu bisa:\n` +
          `👧 *.anon carice* — Cari stranger cewe\n` +
          `👦 *.anon cariko* — Cari stranger cowo`
      })
    }

    // ════════════════════════════════════════════════════
    // BATAL ANTRIAN
    // ════════════════════════════════════════════════════
    if (sub === "batal") {
      if (!isInQueue(jid)) {
        return sock.sendMessage(jid, {
          text: `❌ Kamu tidak sedang dalam antrian.`
        })
      }
      removeFromQueue(jid)
      return sock.sendMessage(jid, {
        text: `✅ Berhasil keluar dari antrian pencarian.`
      })
    }

    // ════════════════════════════════════════════════════
    // STATUS
    // ════════════════════════════════════════════════════
    if (sub === "status") {
      const stats = getQueueStats()
      return sock.sendMessage(jid, {
        text:
          `📊 *STATUS ANON CHAT*\n\n` +
          `👥 Menunggu: *${stats.total} orang*\n` +
          `👧 Cewe: *${stats.cewe}*\n` +
          `👦 Cowo: *${stats.cowo}*\n` +
          `💬 Sesi aktif: *${stats.sessions}*`
      })
    }

    // Default
    return sock.sendMessage(jid, {
      text: `⚠️ Perintah tidak dikenal. Ketik *.anon* untuk melihat panduan.`
    })
  }
}
