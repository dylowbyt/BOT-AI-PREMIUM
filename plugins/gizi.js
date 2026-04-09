const axios = require("axios")

module.exports = {
  name: "gizi",
  alias: ["nutrisi", "kalori", "food", "makanan"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      return sock.sendMessage(from, {
        text: "🥗 Contoh:\n.gizi nasi goreng\n.kalori ayam goreng 100 gram\n.nutrisi apel"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🥗 Mencari info gizi..." })

      const res = await axios.get(
        `https://api.edamam.com/api/nutrition-data?app_id=demo&app_key=demo&ingr=${encodeURIComponent(query)}`,
        { timeout: 10000 }
      )

      const d = res.data
      if (d.calories === 0 && !d.totalNutrients?.ENERC_KCAL) {
        const fallback = await axios.get(
          `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`,
          {
            timeout: 10000,
            headers: { "X-Api-Key": "free" }
          }
        )
        const items = fallback.data?.items
        if (!items?.length) return sock.sendMessage(from, { text: `❌ Info gizi untuk *${query}* tidak ditemukan.` })

        const item = items[0]
        return sock.sendMessage(from, {
          text: `🥗 *INFO GIZI: ${query.toUpperCase()}*
━━━━━━━━━━━━━━━
🔥 Kalori: ${item.calories} kcal
🍗 Protein: ${item.protein_g} g
🍞 Karbohidrat: ${item.carbohydrates_total_g} g
🧈 Lemak: ${item.fat_total_g} g
🪨 Serat: ${item.fiber_g} g
🍬 Gula: ${item.sugar_g} g
🧂 Sodium: ${item.sodium_mg} mg`
        })
      }

      const cal = Math.round(d.calories)
      const protein = d.totalNutrients?.PROCNT?.quantity?.toFixed(1) || 0
      const carbs = d.totalNutrients?.CHOCDF?.quantity?.toFixed(1) || 0
      const fat = d.totalNutrients?.FAT?.quantity?.toFixed(1) || 0
      const fiber = d.totalNutrients?.FIBTG?.quantity?.toFixed(1) || 0

      await sock.sendMessage(from, {
        text: `🥗 *INFO GIZI: ${query.toUpperCase()}*
━━━━━━━━━━━━━━━
🔥 Kalori: ${cal} kcal
🍗 Protein: ${protein} g
🍞 Karbohidrat: ${carbs} g
🧈 Lemak: ${fat} g
🪨 Serat: ${fiber} g`
      })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil info gizi. Coba lagi nanti." })
    }
  }
}
