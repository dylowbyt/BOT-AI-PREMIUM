const axios = require("axios")

module.exports = {
  name: "kbbi",
  alias: ["arti", "kamus", "definisi"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const kata = args.join(" ")

    if (!kata) {
      return sock.sendMessage(from, {
        text: "⚠️ Contoh:\n.kbbi merdeka\n.arti cinta\n.kamus ikhlas"
      })
    }

    try {
      await sock.sendMessage(from, { text: "📖 Mencari definisi..." })

      const res = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(kata)}`,
        { timeout: 10000 }
      )

      if (res.data && res.data.length > 0) {
        const entry = res.data[0]
        const meanings = entry.meanings?.slice(0, 3) || []
        let msg = `📖 *KAMUS — ${kata.toUpperCase()}*\n━━━━━━━━━━━━━━━\n`
        meanings.forEach((m, i) => {
          msg += `\n${i + 1}. 📝 *${m.partOfSpeech}*\n`
          m.definitions?.slice(0, 2).forEach(d => {
            msg += `   • ${d.definition}\n`
            if (d.example) msg += `   💬 Contoh: "${d.example}"\n`
          })
        })
        return sock.sendMessage(from, { text: msg })
      }
    } catch {}

    try {
      const res2 = await axios.get(
        `https://api.siputzx.my.id/api/info/kbbi?kata=${encodeURIComponent(kata)}`,
        { timeout: 10000 }
      )
      const data = res2.data

      if (!data?.data) {
        return sock.sendMessage(from, { text: `❌ Kata *${kata}* tidak ditemukan di kamus.` })
      }

      let msg = `📖 *KBBI — ${kata.toUpperCase()}*\n━━━━━━━━━━━━━━━\n`
      if (typeof data.data === "string") {
        msg += data.data
      } else if (Array.isArray(data.data)) {
        data.data.slice(0, 5).forEach((d, i) => {
          msg += `${i + 1}. ${d.makna || d.arti || JSON.stringify(d)}\n`
        })
      }

      await sock.sendMessage(from, { text: msg })
    } catch {
      await sock.sendMessage(from, { text: `❌ Kata *${kata}* tidak ditemukan.` })
    }
  }
}
