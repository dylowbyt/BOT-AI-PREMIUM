/**
 * premium.js — Sistem token & pembayaran otomatis via Midtrans Snap
 *
 * Commands:
 *   .premium              → lihat saldo & daftar paket
 *   .buy basic/medium/pro → buat transaksi Midtrans otomatis
 *   .cekbayar <ref>       → cek status bayar manual
 *   .addtoken <no> <jml>  → admin: tambah token manual
 *
 * ENV yang dibutuhkan:
 *   MIDTRANS_SERVER_KEY   — Server key dari dashboard Midtrans
 *   MIDTRANS_SANDBOX      — "true" untuk sandbox/testing, "false" untuk live
 *   ADMIN_NUMBER          — Nomor WA admin (format: 628xxx)
 *   PAYMENT_INFO          — (opsional) Pesan manual jika Midtrans belum diset
 */

const axios  = require("axios")
const { getTokens, addTokens }                              = require("../ai/tokendb")
const { addPendingPayment, getByReference, updateStatus }   = require("../ai/paymentdb")

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY
const IS_SANDBOX          = process.env.MIDTRANS_SANDBOX === "true"
const SNAP_BASE_URL       = IS_SANDBOX
  ? "https://app.sandbox.midtrans.com/snap/v1"
  : "https://app.midtrans.com/snap/v1"

const ADMIN_NUMBER = process.env.ADMIN_NUMBER || "6281234567890"

const PACKAGES = {
  basic:  { tokens: 20,  price: 10000, label: "Basic"  },
  medium: { tokens: 50,  price: 25000, label: "Medium" },
  pro:    { tokens: 100, price: 50000, label: "Pro"    }
}

function formatRupiah(n) {
  return "Rp" + n.toLocaleString("id-ID")
}

function makeRef(pkg) {
  return `TKN-${pkg.toUpperCase()}-${Date.now()}`
}

function midtransAuthHeader() {
  const encoded = Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64")
  return `Basic ${encoded}`
}

async function createMidtransTransaction({ reference, pkg, userPhone }) {
  const selected = PACKAGES[pkg]

  const payload = {
    transaction_details: {
      order_id:     reference,
      gross_amount: selected.price
    },
    customer_details: {
      first_name: userPhone,
      phone:      userPhone
    },
    item_details: [
      {
        id:       pkg,
        name:     `Token Premium ${selected.label}`,
        price:    selected.price,
        quantity: 1
      }
    ]
  }

  const res = await axios.post(
    `${SNAP_BASE_URL}/transactions`,
    payload,
    {
      headers: {
        Authorization:  midtransAuthHeader(),
        "Content-Type": "application/json"
      }
    }
  )

  return res.data
}

async function fetchMidtransStatus(reference) {
  const BASE = IS_SANDBOX
    ? "https://api.sandbox.midtrans.com/v2"
    : "https://api.midtrans.com/v2"

  const res = await axios.get(`${BASE}/${reference}/status`, {
    headers: {
      Authorization: midtransAuthHeader()
    }
  })
  return res.data
}

module.exports = {
  name:  "premium",
  alias: ["buy", "token", "topup", "addtoken", "cekbayar"],

  async run(sock, m, args) {
    const from    = m.key.remoteJid
    const sender  = m.key.participant || m.key.remoteJid
    const rawText = (
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""
    ).trim()
    const command = rawText.slice(1).split(" ")[0].toLowerCase()

    // ─── .premium ──────────────────────────────────────────────
    if (command === "premium") {
      const tokens = getTokens(sender)
      return sock.sendMessage(from, {
        text:
          `💎 *PREMIUM IMAGE GENERATOR*\n\n` +
          `🪙 Token kamu: *${tokens} token*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📦 *PILIH PAKET:*\n\n` +
          `1️⃣  *Basic*  — 20 gambar → ${formatRupiah(10000)}\n` +
          `2️⃣  *Medium* — 50 gambar → ${formatRupiah(25000)}\n` +
          `3️⃣  *Pro*    — 100 gambar → ${formatRupiah(50000)}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `✨ *Bonus semua paket:*\n` +
          `⚡ .img (1 token) · ⚖️ .img-hd (2 token) · 👑 .img-pro (3 token)\n\n` +
          `📝 Ketik: *.buy basic* / *.buy medium* / *.buy pro*`
      })
    }

    // ─── .buy <paket> ──────────────────────────────────────────
    if (command === "buy") {
      const pkg = args[0]?.toLowerCase()

      if (!pkg || !PACKAGES[pkg]) {
        return sock.sendMessage(from, {
          text:
            `❌ *Paket tidak valid!*\n\n` +
            `• *.buy basic*  → 20 token / ${formatRupiah(10000)}\n` +
            `• *.buy medium* → 50 token / ${formatRupiah(25000)}\n` +
            `• *.buy pro*    → 100 token / ${formatRupiah(50000)}`
        })
      }

      const selected  = PACKAGES[pkg]
      const userPhone = sender.replace("@s.whatsapp.net", "")

      if (!MIDTRANS_SERVER_KEY) {
        return sock.sendMessage(from, {
          text:
            `💎 *Paket ${selected.label}*\n\n` +
            `🪙 Token: *${selected.tokens}*\n` +
            `💰 Harga: *${formatRupiah(selected.price)}*\n\n` +
            `${process.env.PAYMENT_INFO || "Hubungi admin untuk pembayaran."}\n\n` +
            `📞 Admin: wa.me/${ADMIN_NUMBER}`
        })
      }

      await sock.sendMessage(from, { text: "⏳ Membuat link pembayaran Midtrans..." })

      try {
        const reference = makeRef(pkg)
        const trx       = await createMidtransTransaction({ reference, pkg, userPhone })
        const payUrl    = trx.redirect_url
        const expiredAt = new Date(Date.now() + 2 * 60 * 60 * 1000)
          .toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })

        addPendingPayment({
          reference,
          userId:    sender,
          tokens:    selected.tokens,
          amount:    selected.price,
          expiredAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        })

        return sock.sendMessage(from, {
          text:
            `💎 *PEMBAYARAN PAKET ${selected.label.toUpperCase()}*\n\n` +
            `🪙 Token: *${selected.tokens} token*\n` +
            `💰 Jumlah: *${formatRupiah(selected.price)}*\n` +
            `🔖 Referensi: \`${reference}\`\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `💳 *Cara Bayar:*\n\n` +
            `🔗 Klik link berikut untuk bayar:\n${payUrl}\n\n` +
            `📱 Tersedia: QRIS, Transfer Bank, GoPay, OVO, Dana, dll\n\n` +
            `⏰ Berlaku sampai: ${expiredAt} WIB\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `✅ Token otomatis masuk setelah bayar!\n` +
            `📲 Cek manual: *.cekbayar ${reference}*`
        })

      } catch (err) {
        console.log("[premium] Midtrans error:", err?.response?.data || err?.message)
        return sock.sendMessage(from, {
          text:
            `❌ Gagal membuat link pembayaran.\n\n` +
            `Coba lagi atau hubungi admin:\n` +
            `wa.me/${ADMIN_NUMBER}\n\n` +
            `Error: ${err?.response?.data?.error_messages?.[0] || err?.message}`
        })
      }
    }

    // ─── .cekbayar <ref> ──────────────────────────────────────
    if (command === "cekbayar") {
      const reference = args[0]
      if (!reference) {
        return sock.sendMessage(from, {
          text: `⚠️ Format: *.cekbayar <referensi>*\nContoh: *.cekbayar TKN-BASIC-1234567890*`
        })
      }

      const local = getByReference(reference)
      if (!local) {
        return sock.sendMessage(from, { text: `❌ Referensi *${reference}* tidak ditemukan.` })
      }

      if (local.status === "PAID") {
        return sock.sendMessage(from, {
          text: `✅ Pembayaran *${reference}* sudah dikonfirmasi!\n🪙 Token: *${getTokens(sender)}*`
        })
      }

      try {
        await sock.sendMessage(from, { text: "🔍 Mengecek status pembayaran Midtrans..." })
        const trx = await fetchMidtransStatus(reference)

        const settlementStatuses = ["settlement", "capture"]

        if (settlementStatuses.includes(trx?.transaction_status)) {
          updateStatus(reference, "PAID")
          const newTotal = addTokens(local.userId, local.tokens)
          return sock.sendMessage(from, {
            text:
              `✅ *Pembayaran Diterima!*\n\n` +
              `➕ Token ditambahkan: *${local.tokens}*\n` +
              `🪙 Total token: *${newTotal}*\n\n` +
              `Ketik *.img <prompt>* untuk mulai generate!`
          })
        }

        const statusLabel = {
          pending: "⏳ Menunggu pembayaran",
          expire:  "❌ Kadaluarsa",
          cancel:  "❌ Dibatalkan",
          deny:    "❌ Ditolak"
        }[trx?.transaction_status] || trx?.transaction_status

        return sock.sendMessage(from, {
          text:
            `📋 *Status Pembayaran*\n\n` +
            `🔖 Ref: \`${reference}\`\n` +
            `💰 Jumlah: *${formatRupiah(local.amount)}*\n` +
            `📊 Status: *${statusLabel}*\n\n` +
            `Bot akan otomatis menambah token saat pembayaran masuk.`
        })

      } catch (err) {
        return sock.sendMessage(from, {
          text: `❌ Gagal cek status: ${err?.message}`
        })
      }
    }

    // ─── .addtoken <nomor> <jumlah> (admin only) ───────────────
    if (command === "addtoken") {
      const adminId = ADMIN_NUMBER + "@s.whatsapp.net"
      if (sender !== adminId) {
        return sock.sendMessage(from, { text: "❌ Perintah ini hanya untuk admin." })
      }

      const targetNum = args[0]
      const amount    = parseInt(args[1])

      if (!targetNum || isNaN(amount) || amount <= 0) {
        return sock.sendMessage(from, {
          text: `⚠️ Format: *.addtoken 628xxx <jumlah>*`
        })
      }

      const userId   = targetNum.replace(/^0/, "62") + "@s.whatsapp.net"
      const newTotal = addTokens(userId, amount)

      await sock.sendMessage(from, {
        text:
          `✅ *Token ditambahkan!*\n\n` +
          `👤 User: ${targetNum}\n` +
          `➕ Ditambah: ${amount} token\n` +
          `🪙 Total: ${newTotal} token`
      })

      await sock.sendMessage(userId, {
        text:
          `🎉 *Token kamu telah diisi!*\n\n` +
          `➕ Ditambahkan: *${amount} token*\n` +
          `🪙 Total token: *${newTotal}*\n\n` +
          `Ketik *.img <prompt>* untuk mulai! 🖼️`
      }).catch(() => {})
    }
  }
}
