const timers = new Map()

module.exports = {
  name: "pomodoro",
  alias: ["fokus", "timer", "belajar"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sub = args[0]?.toLowerCase()

    if (sub === "stop") {
      if (timers.has(from)) {
        clearTimeout(timers.get(from))
        timers.delete(from)
        return sock.sendMessage(from, { text: "⏹️ Timer Pomodoro dihentikan." })
      }
      return sock.sendMessage(from, { text: "❌ Tidak ada timer aktif." })
    }

    const minutes = parseInt(args[0]) || 25
    const label = args.slice(1).join(" ") || "Sesi Fokus"

    if (minutes < 1 || minutes > 180) {
      return sock.sendMessage(from, { text: "⚠️ Durasi harus 1-180 menit." })
    }

    if (timers.has(from)) {
      return sock.sendMessage(from, {
        text: "⚠️ Kamu sudah punya timer aktif! Ketik *.pomodoro stop* untuk menghentikannya dulu."
      })
    }

    await sock.sendMessage(from, {
      text: `⏱️ *POMODORO TIMER*
━━━━━━━━━━━━━━━
🎯 Sesi: ${label}
⏰ Durasi: ${minutes} menit
🚀 Timer dimulai!

Ketik *.pomodoro stop* untuk menghentikan.`
    })

    const timeout = setTimeout(async () => {
      timers.delete(from)
      try {
        await sock.sendMessage(from, {
          text: `🔔 *WAKTU HABIS!*
━━━━━━━━━━━━━━━
✅ Sesi *${label}* selesai! (${minutes} menit)

Kamu hebat! 💪 Istirahat sebentar ya.
Ketik *.pomodoro 5 Istirahat* untuk set timer istirahat.`
        })
      } catch {}
    }, minutes * 60 * 1000)

    timers.set(from, timeout)
  }
}
