/**
 * paymentchecker.js — Cek status pembayaran Midtrans otomatis setiap 30 detik
 *
 * Tambahkan di index.js kamu (di dalam startBot, setelah connection === "open"):
 *   const { startPaymentChecker } = require("./ai/paymentchecker")
 *   startPaymentChecker(sock)
 *
 * ENV yang dibutuhkan:
 *   MIDTRANS_SERVER_KEY  — Server key dari dashboard Midtrans
 *   MIDTRANS_SANDBOX     — "true" untuk sandbox/testing, "false" untuk live
 */

const axios = require("axios")
const { getPendingPayments, updateStatus } = require("./paymentdb")
const { addTokens } = require("./tokendb")

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY
const IS_SANDBOX          = process.env.MIDTRANS_SANDBOX === "true"
const STATUS_BASE_URL     = IS_SANDBOX
  ? "https://api.sandbox.midtrans.com/v2"
  : "https://api.midtrans.com/v2"

const CHECK_INTERVAL_MS = 30_000

function midtransAuthHeader() {
  const encoded = Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64")
  return `Basic ${encoded}`
}

async function checkTransaction(reference) {
  const res = await axios.get(`${STATUS_BASE_URL}/${reference}/status`, {
    headers: {
      Authorization: midtransAuthHeader()
    }
  })
  return res.data
}

function startPaymentChecker(sock) {
  if (!MIDTRANS_SERVER_KEY) {
    console.log("[PaymentChecker] MIDTRANS_SERVER_KEY tidak diset, auto-check dinonaktifkan.")
    return
  }

  const mode = IS_SANDBOX ? "SANDBOX" : "PRODUCTION"
  console.log(`[PaymentChecker] Auto-check pembayaran Midtrans (${mode}) aktif setiap 30 detik.`)

  setInterval(async () => {
    const pending = getPendingPayments()
    if (pending.length === 0) return

    for (const payment of pending) {
      try {
        const trx = await checkTransaction(payment.reference)
        if (!trx) continue

        const settlementStatuses = ["settlement", "capture"]

        if (settlementStatuses.includes(trx.transaction_status)) {
          updateStatus(payment.reference, "PAID")
          const newTotal = addTokens(payment.userId, payment.tokens)

          await sock.sendMessage(payment.userId, {
            text:
              `✅ *Pembayaran Diterima!*\n\n` +
              `Ref: \`${payment.reference}\`\n` +
              `💳 Metode: ${trx.payment_type || "-"}\n` +
              `➕ Token ditambahkan: *${payment.tokens}*\n` +
              `🪙 Total token kamu: *${newTotal}*\n\n` +
              `Selamat generate gambar! 🎉\n` +
              `Ketik *.img <prompt>* untuk mulai.`
          }).catch(e => console.log("[PaymentChecker] Gagal kirim notif:", e.message))

          console.log(`[PaymentChecker] ✅ PAID: ${payment.reference} → ${payment.userId} +${payment.tokens} token`)

        } else if (["expire", "cancel", "deny"].includes(trx.transaction_status)) {
          updateStatus(payment.reference, "EXPIRED")

          await sock.sendMessage(payment.userId, {
            text:
              `❌ *Pembayaran Kadaluarsa/Dibatalkan!*\n\n` +
              `Ref: \`${payment.reference}\`\n` +
              `Status: ${trx.transaction_status}\n\n` +
              `Silakan buat transaksi baru dengan\n` +
              `ketik *.buy basic* / *.buy medium* / *.buy pro*`
          }).catch(() => {})

          console.log(`[PaymentChecker] ❌ ${trx.transaction_status}: ${payment.reference}`)
        }

      } catch (err) {
        if (err?.response?.status === 404) {
          console.log(`[PaymentChecker] Transaksi belum ada di Midtrans: ${payment.reference}`)
        } else {
          console.log("[PaymentChecker] Gagal cek:", payment.reference, err?.message)
        }
      }
    }
  }, CHECK_INTERVAL_MS)
}

module.exports = { startPaymentChecker }
