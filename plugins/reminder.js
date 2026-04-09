const reminders = new Map()

module.exports = {
  name: "reminder",
  alias: ["ingatkan", "remind", "pengingat"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sub = args[0]?.toLowerCase()

    if (sub === "list") {
      const userReminders = [...reminders.entries()].filter(([k]) => k.startsWith(from))
      if (!userReminders.length) return sock.sendMessage(from, { text: "📭 Tidak ada reminder aktif." })
      let msg = "📋 *REMINDER AKTIF:*\n"
      userReminders.forEach(([k, v], i) => {
        msg += `${i + 1}. ${v.label} (${v.minutes} menit lagi)\n`
      })
      return sock.sendMessage(from, { text: msg })
    }

    if (sub === "hapus") {
      const userReminders = [...reminders.keys()].filter(k => k.startsWith(from))
      userReminders.forEach(k => {
        clearTimeout(reminders.get(k).timer)
        reminders.delete(k)
      })
      return sock.sendMessage(from, { text: "🗑️ Semua reminder dihapus." })
    }

    const minutes = parseInt(args[0])
    const label = args.slice(1).join(" ") || "Pengingat"

    if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
      return sock.sendMessage(from, {
        text: `⏰ *REMINDER*\n\nFormat: .reminder <menit> <pesan>\n\nContoh:\n.reminder 30 Minum obat\n.reminder 60 Meeting dengan klien\n.reminder 10 Cek email\n\nLainnya:\n.reminder list — lihat reminder aktif\n.reminder hapus — hapus semua reminder`
      })
    }

    const key = `${from}_${Date.now()}`
    const timer = setTimeout(async () => {
      reminders.delete(key)
      try {
        await sock.sendMessage(from, {
          text: `⏰ *REMINDER!*\n━━━━━━━━━━━\n🔔 ${label}\n\nSudah ${minutes} menit berlalu!`
        })
      } catch {}
    }, minutes * 60 * 1000)

    reminders.set(key, { label, minutes, timer })

    await sock.sendMessage(from, {
      text: `⏰ *REMINDER DISET*
━━━━━━━━━━━━━━━
📝 Pesan: ${label}
⏱️ Waktu: ${minutes} menit lagi

Kamu akan diingatkan!`
    })
  }
}
