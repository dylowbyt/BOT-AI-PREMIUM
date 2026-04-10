/**
 * premium.js — Sistem token & pembayaran otomatis via Midtrans Snap
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

function normalizeNumber(jid) {
  if (!jid) return ""
  return jid.split("@")[0].split(":")[0].replace(/\D/g, "")
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

    const ADMINS = (process.env.ADMIN_NUMBER || "")
      .split(",")
      .map(v => v.replace(/\D/g, ""))

    const senderNumber = normalizeNumber(sender)
    const isGroup = from.endsWith("@g.us")

    // =========================
    // 🔒 SECURITY CHECK ADDTOKEN
    // =========================
    if (command === "addtoken") {

      // ❌ BLOCK GROUP TOTAL
      if (isGroup) {
        return sock.sendMessage(from, {
          text: "❌ Command ini hanya bisa digunakan di private chat."
        })
      }

      // ❌ ADMIN ONLY
      if (!ADMINS.includes(senderNumber)) {
        return sock.sendMessage(from, {
          text: "❌ Admin only."
        })
      }

      const targetNum = args[0]
      const amount    = parseInt(args[1])

      if (!targetNum || isNaN(amount) || amount <= 0) {
        return sock.sendMessage(from, {
          text: `⚠️ Format: *.addtoken 628xxx <jumlah>*`
        })
      }

      const cleanTarget = targetNum.replace(/^0/, "62")
      const userId      = cleanTarget + "@s.whatsapp.net"

      const newTotal = addTokens(userId, amount)

      return sock.sendMessage(from, {
        text:
          `✅ *TOKEN DITAMBAHKAN*\n\n` +
          `👤 User: ${cleanTarget}\n` +
          `➕ +${amount}\n` +
          `🪙 Total: ${newTotal}`
      })
    }

    // =========================
    // .tutorial
    // =========================
    if (command === "tutorial") {
      return sock.sendMessage(from, {
        text:
          `📖 *TUTORIAL NANO EDIT*\n\n` +
          `🎯 Tujuan: edit gambar pakai AI\n\n` +
          `🖼️ 1 foto:\n.nanoedit ubah jadi anime\n\n` +
          `🖼️ 2 foto:\nreply foto kedua + nanoedit prompt`
      })
    }

    // =========================
    // .premium
    // =========================
    if (command === "premium") {
      const tokens = getTokens(sender)

      return sock.sendMessage(from, {
        text:
          `💎 PREMIUM\n\n` +
          `🪙 Token: ${tokens}\n\n` +
          `basic / medium / pro`
      })
    }

    // =========================
    // .buy
    // =========================
    if (command === "buy") {
      const pkg = args[0]?.toLowerCase()

      if (!PACKAGES[pkg]) {
        return sock.sendMessage(from, { text: "❌ Paket salah" })
      }

      const selected  = PACKAGES[pkg]
      const userPhone = senderNumber

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
            `💳 BAYAR DI:\n${trx.redirect_url}\n\n` +
            `REF: ${reference}`
        })

      } catch (err) {
        return sock.sendMessage(from, {
          text: `❌ Error: ${err?.message}`
        })
      }
    }

    // =========================
    // .cekbayar
    // =========================
    if (command === "cekbayar") {
      const reference = args[0]

      const local = getByReference(reference)
      if (!local) {
        return sock.sendMessage(from, {
          text: "❌ Tidak ditemukan"
        })
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
  }
}
