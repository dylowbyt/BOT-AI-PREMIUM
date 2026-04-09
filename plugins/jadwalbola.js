const axios = require("axios")

module.exports = {
  name: "jadwalbola",
  alias: ["bola", "football", "skor", "pertandingan"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const liga = args.join(" ")?.toLowerCase()

    try {
      await sock.sendMessage(from, { text: "⚽ Mengambil jadwal pertandingan..." })

      const apiKey = "free"
      const today = new Date().toISOString().slice(0, 10)

      const ligaMap = {
        "premier league": 2021, "pl": 2021,
        "la liga": 2014, "laliga": 2014,
        "serie a": 2019, "seriea": 2019,
        "bundesliga": 2002,
        "ligue 1": 2015, "ligue1": 2015,
        "liga 1": 2037, "liga1": 2037,
        "champions league": 2001, "ucl": 2001
      }

      const leagueId = ligaMap[liga] || 2021
      const leagueName = liga || "Premier League"

      const res = await axios.get(
        `https://api.football-data.org/v4/competitions/${leagueId}/matches?status=SCHEDULED&limit=5`,
        {
          timeout: 12000,
          headers: { "X-Auth-Token": "free" }
        }
      )

      const matches = res.data?.matches
      if (!matches?.length) {
        return sock.sendMessage(from, {
          text: `⚽ Tidak ada jadwal pertandingan yang tersedia untuk *${leagueName}*.

Cek di:
🔗 https://www.bola.com/jadwal/
🔗 https://www.sofascore.com/`
        })
      }

      let msg = `⚽ *JADWAL ${leagueName.toUpperCase()}*\n━━━━━━━━━━━━━━━\n`
      matches.slice(0, 5).forEach(m => {
        const date = new Date(m.utcDate).toLocaleString("id-ID", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })
        msg += `🏟️ ${m.homeTeam?.name} vs ${m.awayTeam?.name}\n📅 ${date} WIB\n\n`
      })

      await sock.sendMessage(from, { text: msg })
    } catch {
      await sock.sendMessage(from, {
        text: `⚽ Cek jadwal bola di:
🔗 https://www.bola.com/jadwal/
🔗 https://www.sofascore.com/
🔗 https://1xscore.com/id/

Tersedia liga: premier league, la liga, serie a, bundesliga, champions league`
      })
    }
  }
}
