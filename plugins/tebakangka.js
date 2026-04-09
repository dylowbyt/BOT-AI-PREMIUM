const games = new Map()

module.exports = {
  name: "tebak",
  alias: ["tebakangka", "guessnum", "tebakkata"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const sender = m.key.participant || from
    const sub = args[0]?.toLowerCase()
    const gameKey = `${from}_${sender}`

    if (sub === "mulai" || sub === "start") {
      const min = 1, max = 100
      const answer = Math.floor(Math.random() * (max - min + 1)) + min
      const tries = parseInt(args[1]) || 7
      games.set(gameKey, { answer, tries, maxTries: tries, min, max })

      return sock.sendMessage(from, {
        text: `🎯 *TEBAK ANGKA*
━━━━━━━━━━━━━━━
Aku sudah memilih angka antara ${min}-${max}
Kamu punya *${tries} kesempatan* menebak!

Ketik: .tebak <angka>
Contoh: .tebak 50

.tebak menyerah → lihat jawabannya`
      })
    }

    if (sub === "menyerah") {
      const game = games.get(gameKey)
      if (!game) return sock.sendMessage(from, { text: "❌ Tidak ada game aktif. Mulai dengan .tebak mulai" })
      games.delete(gameKey)
      return sock.sendMessage(from, { text: `😅 Game berakhir! Jawabannya adalah *${game.answer}*. Coba lagi dengan .tebak mulai` })
    }

    const guess = parseInt(args[0])

    if (!isNaN(guess)) {
      const game = games.get(gameKey)
      if (!game) return sock.sendMessage(from, { text: "❌ Mulai dulu dengan .tebak mulai" })

      game.tries--

      if (guess === game.answer) {
        const used = game.maxTries - game.tries
        games.delete(gameKey)
        return sock.sendMessage(from, {
          text: `🎉 *BENAR!* Jawabannya memang *${guess}*!\nKamu butuh *${used} tebakan*. ${used <= 3 ? "Keren banget! 🏆" : used <= 5 ? "Bagus! 👍" : "Lumayan! 😊"}`
        })
      }

      if (game.tries === 0) {
        games.delete(gameKey)
        return sock.sendMessage(from, { text: `❌ Sayang! Kesempatan habis. Jawabannya *${game.answer}*. Main lagi? .tebak mulai` })
      }

      const hint = guess < game.answer ? "📈 Terlalu kecil! Angkanya lebih besar." : "📉 Terlalu besar! Angkanya lebih kecil."
      return sock.sendMessage(from, {
        text: `${hint}\nSisa kesempatan: ${game.tries}/${game.maxTries}`
      })
    }

    await sock.sendMessage(from, {
      text: `🎯 *TEBAK ANGKA*\n\n.tebak mulai — mulai game baru\n.tebak <angka> — tebak angka\n.tebak menyerah — lihat jawaban`
    })
  }
}
