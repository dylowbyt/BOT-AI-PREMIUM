const axios = require("axios")

module.exports = {
  name: "filmbioskop",
  alias: ["bioskop", "jadwalbioskop", "nowplaying", "film"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    try {
      await sock.sendMessage(from, { text: "🎬 Mencari info film..." })

      if (query) {
        const res = await axios.get(
          `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=id-ID&api_key=4e44d9029b1270a757cddc766a1bcb63`,
          { timeout: 12000 }
        )
        const movies = res.data?.results?.slice(0, 5)
        if (!movies?.length) return sock.sendMessage(from, { text: `❌ Film *${query}* tidak ditemukan.` })

        let msg = `🎬 *HASIL PENCARIAN: ${query.toUpperCase()}*\n━━━━━━━━━━━━━━━\n`
        for (const movie of movies) {
          const year = movie.release_date?.slice(0, 4) || "N/A"
          const rating = movie.vote_average?.toFixed(1) || "N/A"
          msg += `🎥 *${movie.title}* (${year})\n⭐ Rating: ${rating}/10 | 🗳️ Votes: ${movie.vote_count}\n📝 ${(movie.overview || "Tidak ada deskripsi.").slice(0, 100)}...\n\n`
        }
        return sock.sendMessage(from, { text: msg.slice(0, 4096) })
      }

      const res = await axios.get(
        `https://api.themoviedb.org/3/movie/now_playing?language=id-ID&region=ID&api_key=4e44d9029b1270a757cddc766a1bcb63`,
        { timeout: 12000 }
      )
      const movies = res.data?.results?.slice(0, 8)
      if (!movies?.length) return sock.sendMessage(from, { text: "❌ Tidak ada data film saat ini." })

      let msg = `🎬 *FILM BIOSKOP SEKARANG*\n━━━━━━━━━━━━━━━\n`
      movies.forEach((movie, i) => {
        const rating = movie.vote_average?.toFixed(1) || "N/A"
        msg += `${i + 1}. *${movie.title}*\n   ⭐ ${rating}/10 | 📅 ${movie.release_date}\n`
      })
      msg += `\nCari detail: .filmbioskop <judul film>`

      await sock.sendMessage(from, { text: msg })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil data film. Coba lagi nanti." })
    }
  }
}
