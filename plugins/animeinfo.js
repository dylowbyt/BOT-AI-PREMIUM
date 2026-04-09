const axios = require("axios")

module.exports = {
  name: "anime",
  alias: ["cariAnime", "infoAnime", "jadwalanime"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      return sock.sendMessage(from, {
        text: "🎌 Contoh:\n.anime Naruto\n.anime One Piece\n.anime Attack on Titan"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🎌 Mencari info anime..." })

      const res = await axios.get(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=1&sfw=true`,
        { timeout: 12000 }
      )

      const anime = res.data?.data?.[0]
      if (!anime) return sock.sendMessage(from, { text: `❌ Anime *${query}* tidak ditemukan.` })

      const genres = anime.genres?.map(g => g.name).join(", ") || "N/A"
      const studios = anime.studios?.map(s => s.name).join(", ") || "N/A"
      const score = anime.score ? `⭐ ${anime.score}/10 (${anime.scored_by?.toLocaleString()} votes)` : "Belum dinilai"

      await sock.sendMessage(from, {
        text: `🎌 *${anime.title}*
━━━━━━━━━━━━━━━
🇯🇵 Judul JP: ${anime.title_japanese || "N/A"}
📺 Tipe: ${anime.type || "N/A"}
📊 Status: ${anime.status || "N/A"}
🗓️ Rilis: ${anime.aired?.string || "N/A"}
📺 Episode: ${anime.episodes || "N/A"} ep
⏱️ Durasi: ${anime.duration || "N/A"}
${score}
🎭 Genre: ${genres}
🏭 Studio: ${studios}

📝 Sinopsis:
${(anime.synopsis || "Tidak ada sinopsis.").slice(0, 400)}...

🔗 MyAnimeList: https://myanimelist.net/anime/${anime.mal_id}`
      })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil info anime. Coba lagi nanti." })
    }
  }
}
