const axios = require("axios")

module.exports = {
  name: "sinonim",
  alias: ["antonim", "kata lain", "thesaurus", "padankata"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const tipe = args[0]?.toLowerCase()
    const kata = args.slice(1).join(" ") || args[0]

    if (!kata) {
      return sock.sendMessage(from, {
        text: `📚 *SINONIM & ANTONIM*

Format:
.sinonim <kata>         → cari sinonim
.antonim <kata>         → cari antonim
.sinonim antonim <kata> → cari keduanya

Contoh:
.sinonim cepat
.antonim baik
.sinonim antonim besar`
      })
    }

    const searchWord = (tipe === "sinonim" || tipe === "antonim") ? args.slice(1).join(" ") : kata

    if (!searchWord) return sock.sendMessage(from, { text: "⚠️ Masukkan kata setelah perintah." })

    try {
      await sock.sendMessage(from, { text: "📚 Mencari..." })

      const res = await axios.get(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(searchWord)}`,
        { timeout: 10000 }
      )

      if (res.data && Array.isArray(res.data)) {
        const meanings = res.data[0]?.meanings || []
        const synonyms = [...new Set(meanings.flatMap(m => m.synonyms || []))].slice(0, 10)
        const antonyms = [...new Set(meanings.flatMap(m => m.antonyms || []))].slice(0, 10)

        let msg = `📚 *KATA: ${searchWord.toUpperCase()}*\n━━━━━━━━━━━━━━━\n`
        if (tipe !== "antonim") {
          msg += synonyms.length ? `✅ Sinonim:\n${synonyms.map(s => `• ${s}`).join("\n")}\n\n` : "❌ Tidak ada sinonim.\n"
        }
        if (tipe !== "sinonim") {
          msg += antonyms.length ? `🔄 Antonim:\n${antonyms.map(a => `• ${a}`).join("\n")}` : "❌ Tidak ada antonim."
        }

        return sock.sendMessage(from, { text: msg })
      }
    } catch {}

    try {
      const res2 = await axios.get(
        `https://api.siputzx.my.id/api/info/sinonim?kata=${encodeURIComponent(searchWord)}`,
        { timeout: 10000 }
      )
      const d = res2.data
      if (!d?.data) return sock.sendMessage(from, { text: `❌ Kata *${searchWord}* tidak ditemukan.` })

      let msg = `📚 *KATA: ${searchWord.toUpperCase()}*\n━━━━━━━━━━━━━━━\n`
      if (d.data.sinonim?.length) msg += `✅ Sinonim:\n${d.data.sinonim.map(s => `• ${s}`).join("\n")}\n\n`
      if (d.data.antonim?.length) msg += `🔄 Antonim:\n${d.data.antonim.map(a => `• ${a}`).join("\n")}`

      await sock.sendMessage(from, { text: msg })
    } catch {
      await sock.sendMessage(from, { text: `❌ Tidak ditemukan sinonim/antonim untuk *${searchWord}*.` })
    }
  }
}
