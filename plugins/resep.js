const axios = require("axios")

module.exports = {
  name: "resep",
  alias: ["recipe", "masakapa", "masak"],

  async run(sock, m, args) {
    const from = m.key.remoteJid
    const query = args.join(" ")

    if (!query) {
      return sock.sendMessage(from, {
        text: "🍳 Contoh:\n.resep nasi goreng\n.resep ayam bakar\n.resep soto"
      })
    }

    try {
      await sock.sendMessage(from, { text: "🍳 Mencari resep..." })

      const res = await axios.get(
        `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`,
        { timeout: 10000 }
      )

      const meals = res.data?.meals
      if (!meals?.length) {
        const res2 = await axios.get(
          `https://api.siputzx.my.id/api/resep?query=${encodeURIComponent(query)}`,
          { timeout: 10000 }
        )
        const data = res2.data?.data?.[0]
        if (!data) return sock.sendMessage(from, { text: `❌ Resep *${query}* tidak ditemukan.` })

        const msg = `🍳 *${data.title || query.toUpperCase()}*\n━━━━━━━━━━━━━━━\n\n📝 *Bahan-bahan:*\n${data.ingredients || "N/A"}\n\n👨‍🍳 *Cara Memasak:*\n${data.steps || "N/A"}`
        return sock.sendMessage(from, { text: msg.slice(0, 4096) })
      }

      const meal = meals[0]
      const ingredients = []
      for (let i = 1; i <= 20; i++) {
        const ing = meal[`strIngredient${i}`]
        const measure = meal[`strMeasure${i}`]
        if (ing && ing.trim()) ingredients.push(`• ${measure?.trim()} ${ing}`)
      }

      const msg = `🍳 *${meal.strMeal}*
━━━━━━━━━━━━━━━
🏷️ Kategori: ${meal.strCategory || "N/A"}
🌍 Asal: ${meal.strArea || "N/A"}

🛒 *Bahan-bahan:*
${ingredients.join("\n")}

👨‍🍳 *Cara Memasak:*
${(meal.strInstructions || "").slice(0, 1500)}...

🌐 Resep lengkap: ${meal.strSource || "N/A"}`

      await sock.sendMessage(from, { text: msg.slice(0, 4096) })
    } catch {
      await sock.sendMessage(from, { text: "❌ Gagal mengambil resep. Coba lagi nanti." })
    }
  }
}
