/**
 * premium.js — Sistem token & pembayaran otomatis via Midtrans Snap
 *
 * Commands:
 *   .premium              → lihat saldo & daftar paket
 *   .buy basic/medium/pro → buat transaksi Midtrans otomatis
 *   .cekbayar <ref>       → cek status bayar manual
 *   .addtoken <no> <jml>  → admin: tambah token manual
 *   .tutorial             → panduan penggunaan nano edit
 */

const axios  = require("axios")
const { getTokens, addTokens }                              = require("../ai/tokendb")
const { addPendingPayment, getByReference, updateStatus }   = require("../ai/paymentdb")

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY
const IS_SANDBOX          = process.env.MIDTRANS_SANDBOX === "true"
const SNAP_BASE_URL       = IS_SANDBOX
  ? "https://app.sandbox.midtrans.com/snap/v1"
  : "https://app.midtrans.com/snap/v1"

/**
 * 🔥 ADMIN FIX (ONLY THIS CHANGED)
 */
const ADMIN_NUMBER = "083966344919"

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

function normalizeNumber(num) {
  if (!num) return ""
  return num.toString().replace(/[^0-9]/g, "").replace(/^62/, "0")
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
  alias: ["buy", "token", "topup", "addtoken", "cekbayar", "tutorial"],

  async run(sock, m, args) {
    const from    = m.key.remoteJid
    const sender  = m.key.participant || m.key.remoteJid

    const rawText = (
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text || ""
    ).trim()

    const command = rawText.slice(1).split(" ")[0].toLowerCase()

    // ─── .tutorial ──────────────────────────────────────────────
    if (command === "tutorial") {
      return sock.sendMessage(from, {
        text:
          `📖 *TUTORIAL NANO BANANA EDIT*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🎯 *TUJUAN*\n` +
          `Fitur ini digunakan untuk *mengedit foto dengan AI* sesuai instruksi yang kamu kirim.\n\n` +

          `━━━━━━━━━━━━━━━━━━━━\n` +
          `⚙️ *CARANYA*\n\n` +

          `🖼️ *1. Edit 1 Foto*\n` +
          `Kirim 1 foto + caption:\n` +
          `👉 *.nanoedit <instruksi>*\n\n` +
          `Contoh:\n` +
          `👉 .nanoedit ubah jadi anime\n\n` +

          `━━━━━━━━━━━━━━━━━━━━\n` +

          `🖼️ *2. Edit 2 Foto (Gabung / Referensi)*\n` +
          `• Kirim foto 1 dengan caption:\n` +
          `👉 *.nanoedit <instruksi>*\n` +
          `• Lalu *reply* ke pesan yang ada foto ke-2\n\n` +

          `Contoh:\n` +
          `👉 Kirim foto kamu\n` +
          `👉 Reply ke foto lain + caption:\n` +
          `👉 .nanoedit gabungkan jadi satu gambar\n\n` +

          `━━━━━━━━━━━━━━━━━━━━\n` +
          `💡 *TIPS*\n` +
          `• Gunakan instruksi yang jelas\n` +
          `• Bisa ubah style, background, objek, dll\n` +
          `• Semakin detail, hasil makin bagus\n\n` +

          `🚀 Selamat mencoba!`
      })
    }

    // ─── .premium ──────────────────────────────────────────────
    if (command === "premium") {
      const tokens = getTokens(sender)
      return sock.sendMessage(from, {
        text:
          `💎 *PREMIUM AI GENERATOR*\n\n` +
          `🪙 Token kamu: *${tokens} token*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📦 *PILIH PAKET:*\n\n` +
          `1️⃣  *Basic*  — 20 token → ${formatRupiah(10000)}\n` +
          `2️⃣  *Medium* — 50 token → ${formatRupiah(25000)}\n` +
          `3️⃣  *Pro*    — 100 token → ${formatRupiah(50000)}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `📝 Ketik: *.buy basic* / *.buy medium* / *.buy pro*`
      })
    }

    // ─── .buy ──────────────────────────────────────────
    if (command === "buy") {
      const pkg = args[0]?.toLowerCase()

      if (!PACKAGES[pkg]) {
        return sock.sendMessage(from, {
          text:
            `❌ *Paket tidak valid!*\n\n` +
            `• *.buy basic*\n• *.buy medium*\n• *.buy pro*`
        })
      }

      const selected  = PACKAGES[pkg]
      const userPhone = sender.replace("@s.whatsapp.net", "")

      try {
        const reference = makeRef(pkg)

        const trx = await createMidtransTransaction({
          reference,
          pkg,
          userPhone
        })

        addPendingPayment({
          reference,
          userId: sender,
          tokens: selected.tokens,
          amount: selected.price,
          expiredAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        })

        return sock.sendMessage(from, {
          text:
            `💳 LINK BAYAR:\n${trx.redirect_url}\n\nREF: ${reference}`
        })

      } catch (err) {
        return sock.sendMessage(from, {
          text: `❌ Error: ${err?.message}`
        })
      }
    }

    // ─── .cekbayar ──────────────────────────────────────
    if (command === "cekbayar") {
      const reference = args[0]

      const local = getByReference(reference)
      if (!local) {
        return sock.sendMessage(from, { text: "❌ Tidak ditemukan" })
      }

      try {
        const trx = await fetchMidtransStatus(reference)

        if (["settlement", "capture"].includes(trx?.transaction_status)) {
          updateStatus(reference, "PAID")
          const newTotal = addTokens(local.userId, local.tokens)

          return sock.sendMessage(from, {
            text:
              `✅ BERHASIL\n\n` +
              `+${local.tokens} token\n` +
              `Total: ${newTotal}`
          })
        }

        return sock.sendMessage(from, {
          text: `Status: ${trx?.transaction_status}`
        })

      } catch (err) {
        return sock.sendMessage(from, {
          text: "❌ Error cek"
        })
      }
    }

    // ─── .addtoken (ADMIN FIX ONLY) ─────────────────────
    if (command === "addtoken") {

      const senderNum = normalizeNumber(sender)
      const adminNum   = normalizeNumber(ADMIN_NUMBER)
      const isAdmin    = senderNum === adminNum

      if (!isAdmin) {
        return sock.sendMessage(from, {
          text: "❌ Admin only."
        })
      }

      const targetNum = args[0]
      const amount    = parseInt(args[1])

      if (!targetNum || isNaN(amount)) {
        return sock.sendMessage(from, {
          text: `⚠️ Format: *.addtoken 628xxx <jumlah>*`
        })
      }

      const userId = targetNum.replace(/^0/, "62") + "@s.whatsapp.net"
      const newTotal = addTokens(userId, amount)

      return sock.sendMessage(from, {
        text:
          `✅ TOKEN DITAMBAHKAN\n\n` +
          `👤 User: ${targetNum}\n` +
          `➕ +${amount}\n` +
          `🪙 Total: ${newTotal}`
      })
    }
  }
}
