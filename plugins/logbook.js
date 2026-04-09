const fs = require("fs")
const path = require("path")

const logFile = path.join(__dirname, "..", "session", "expense.json")

function load() {
  try { if (fs.existsSync(logFile)) return JSON.parse(fs.readFileSync(logFile, "utf8")) } catch {}
  return {}
}
function save(data) { try { fs.writeFileSync(logFile, JSON.stringify(data, null, 2)) } catch {} }

module.exports = {
  name: "catat_pengeluaran",
  alias: ["uang", "pengeluaran", "keuangan", "dompet"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || from
    const sub = args[0]?.toLowerCase()
    const data = load()
    if (!data[sender]) data[sender] = []

    if (!sub) {
      return sock.sendMessage(from, {
        text: `💰 *PENCATAT KEUANGAN*

Perintah:
.uang <jumlah> <keterangan>     → Catat pengeluaran
.uang +<jumlah> <keterangan>    → Catat pemasukan
.uang list                      → Lihat daftar
.uang total                     → Lihat total
.uang hapus                     → Hapus semua data

Contoh:
.uang 50000 makan siang
.uang +5000000 gaji`
      })
    }

    if (sub === "list") {
      if (!data[sender].length) return sock.sendMessage(from, { text: "📭 Belum ada catatan keuangan." })
      let msg = "💰 *CATATAN KEUANGAN:*\n━━━━━━━━━━━━━━━\n"
      let income = 0, expense = 0
      data[sender].slice(-15).forEach((e, i) => {
        const isIncome = e.amount > 0
        const icon = isIncome ? "📥" : "📤"
        const amountStr = Math.abs(e.amount).toLocaleString("id-ID")
        msg += `${icon} ${e.note}: ${isIncome ? "+" : "-"}Rp${amountStr}\n`
        if (isIncome) income += e.amount; else expense += Math.abs(e.amount)
      })
      msg += `\n━━━━━━━━━━━━━━━\n📥 Total Masuk: Rp${income.toLocaleString("id-ID")}\n📤 Total Keluar: Rp${expense.toLocaleString("id-ID")}\n💳 Saldo: Rp${(income - expense).toLocaleString("id-ID")}`
      return sock.sendMessage(from, { text: msg })
    }

    if (sub === "total") {
      const income = data[sender].filter(e => e.amount > 0).reduce((a, e) => a + e.amount, 0)
      const expense = data[sender].filter(e => e.amount < 0).reduce((a, e) => a + Math.abs(e.amount), 0)
      return sock.sendMessage(from, {
        text: `💰 *RINGKASAN KEUANGAN*\n━━━━━━━━━━━━\n📥 Total Masuk: Rp${income.toLocaleString("id-ID")}\n📤 Total Keluar: Rp${expense.toLocaleString("id-ID")}\n💳 Saldo: Rp${(income - expense).toLocaleString("id-ID")}`
      })
    }

    if (sub === "hapus") {
      data[sender] = []
      save(data)
      return sock.sendMessage(from, { text: "🗑️ Semua catatan keuangan dihapus." })
    }

    const isIncome = sub.startsWith("+")
    const amountStr = sub.replace("+", "")
    const amount = parseFloat(amountStr.replace(/[.,]/g, ""))
    const note = args.slice(1).join(" ") || "Tidak ada keterangan"

    if (isNaN(amount) || amount <= 0) {
      return sock.sendMessage(from, { text: "❌ Jumlah tidak valid. Contoh: .uang 50000 makan" })
    }

    const finalAmount = isIncome ? amount : -amount
    data[sender].push({ amount: finalAmount, note, time: new Date().toISOString() })
    save(data)

    const icon = isIncome ? "📥" : "📤"
    await sock.sendMessage(from, {
      text: `${icon} *Dicatat!*\n${isIncome ? "Pemasukan" : "Pengeluaran"}: Rp${amount.toLocaleString("id-ID")}\nKeterangan: ${note}`
    })
  }
}
